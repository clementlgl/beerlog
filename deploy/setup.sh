#!/usr/bin/env bash
# BeerLog — setup inside the LXC (Debian 12/13). Called by proxmox-install.sh, idempotent.
#   setup.sh install|update /path/to/beerlog-src.tar.gz
set -euo pipefail

MODE="${1:?install|update}"
SRC="${2:?source tarball}"
TS_HOSTNAME="${TS_HOSTNAME:-beerlog}"
TS_AUTHKEY="${TS_AUTHKEY:-}"

APP_DIR=/opt/beerlog
DATA_DIR=/var/lib/beerlog
ENV_FILE=/etc/beerlog.env
APP_USER=beerlog
PORT=3000
NODE_MAJOR=24

msg() { printf '\e[1;36m  ->\e[0m %s\n' "$*"; }
export DEBIAN_FRONTEND=noninteractive
. /etc/os-release
CODENAME="$VERSION_CODENAME"

if [[ "$MODE" == install ]]; then
	msg "Base packages"
	apt-get update -qq
	apt-get install -y -qq ca-certificates curl gnupg jq build-essential python3 >/dev/null

	msg "Node.js $NODE_MAJOR (NodeSource repository)"
	install -d -m 0755 /etc/apt/keyrings
	curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key |
		gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
	echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
		>/etc/apt/sources.list.d/nodesource.list

	msg "Tailscale (official repository)"
	curl -fsSL "https://pkgs.tailscale.com/stable/debian/${CODENAME}.noarmor.gpg" \
		-o /usr/share/keyrings/tailscale-archive-keyring.gpg
	curl -fsSL "https://pkgs.tailscale.com/stable/debian/${CODENAME}.tailscale-keyring.list" \
		-o /etc/apt/sources.list.d/tailscale.list

	apt-get update -qq
	apt-get install -y -qq nodejs tailscale >/dev/null
	systemctl enable --now tailscaled

	id "$APP_USER" >/dev/null 2>&1 || useradd --system --home "$DATA_DIR" --shell /usr/sbin/nologin "$APP_USER"
	install -d -o "$APP_USER" -g "$APP_USER" -m 0750 "$DATA_DIR"
fi

msg "Unpacking sources"
BUILD_DIR="$(mktemp -d)"
tar -xzf "$SRC" -C "$BUILD_DIR"

msg "Building (npm ci && npm run build)"
cd "$BUILD_DIR"
npm ci --no-audit --no-fund --loglevel=error
npm run build
npm prune --omit=dev --no-audit --no-fund --loglevel=error

msg "Installing to $APP_DIR"
systemctl stop beerlog 2>/dev/null || true
rm -rf "$APP_DIR.new"
install -d "$APP_DIR.new"
cp -a build drizzle node_modules package.json "$APP_DIR.new/"
rm -rf "$APP_DIR.old"
[[ -d "$APP_DIR" ]] && mv "$APP_DIR" "$APP_DIR.old"
mv "$APP_DIR.new" "$APP_DIR"
chown -R root:root "$APP_DIR"
cd / && rm -rf "$BUILD_DIR" "$SRC"

if [[ "$MODE" == install ]]; then
	msg "Joining the tailnet as '$TS_HOSTNAME'"
	if [[ -n "$TS_AUTHKEY" ]]; then
		tailscale up --authkey="$TS_AUTHKEY" --hostname="$TS_HOSTNAME"
	else
		echo "    Open the URL below to authorise this container in your tailnet:"
		tailscale up --hostname="$TS_HOSTNAME"
	fi
	TS_DNS="$(tailscale status --json | jq -r '.Self.DNSName' | sed 's/\.$//')"

	cat >"$ENV_FILE" <<ENV
# BeerLog configuration
HOST=127.0.0.1
PORT=$PORT
ORIGIN=https://$TS_DNS
DATA_DIR=$DATA_DIR
MIGRATIONS_DIR=$APP_DIR/drizzle
BODY_SIZE_LIMIT=8M
NODE_ENV=production
ENV
	chmod 0644 "$ENV_FILE"
fi

msg "systemd service"
cat >/etc/systemd/system/beerlog.service <<UNIT
[Unit]
Description=BeerLog
After=network-online.target tailscaled.service
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/node $APP_DIR/build
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=$DATA_DIR

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now beerlog
systemctl restart beerlog

if [[ "$MODE" == install ]]; then
	msg "Publishing over HTTPS with 'tailscale serve' (identity headers + TLS cert)"
	tailscale serve --bg --https=443 "http://127.0.0.1:$PORT"
fi

sleep 2
if systemctl is-active --quiet beerlog; then
	msg "BeerLog is running: $(grep ^ORIGIN "$ENV_FILE" | cut -d= -f2)"
	rm -rf "$APP_DIR.old"
else
	journalctl -u beerlog -n 30 --no-pager
	echo "BeerLog failed to start; previous version kept in $APP_DIR.old" >&2
	exit 1
fi
