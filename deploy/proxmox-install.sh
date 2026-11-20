#!/usr/bin/env bash
# BeerLog — Proxmox VE installer.
# Run as root on the Proxmox host, from a checkout of this repository:
#   ./deploy/proxmox-install.sh                 # create a new LXC and install
#   ./deploy/proxmox-install.sh --update 120    # push the current code to existing CT 120
# Options (env vars or flags): see usage().
set -euo pipefail

CTID="${CTID:-}"
CT_HOSTNAME="${CT_HOSTNAME:-beerlog}"
STORAGE="${STORAGE:-local-lvm}"
TEMPLATE_STORAGE="${TEMPLATE_STORAGE:-local}"
DISK_GB="${DISK_GB:-4}"
MEMORY_MB="${MEMORY_MB:-1024}"
CORES="${CORES:-1}"
BRIDGE="${BRIDGE:-vmbr0}"
TS_AUTHKEY="${TS_AUTHKEY:-}"
UPDATE=0

usage() {
	cat <<USAGE
Usage: $0 [options]
  --ctid N            Container ID (default: next free ID)
  --hostname NAME     Container + Tailscale hostname (default: beerlog)
  --storage NAME      Rootfs storage (default: local-lvm)
  --template-storage  Storage holding CT templates (default: local)
  --disk GB           Rootfs size (default: 4)
  --memory MB         RAM (default: 1024, needed for the build step)
  --cores N           CPU cores (default: 1)
  --bridge NAME       Network bridge (default: vmbr0)
  --ts-authkey KEY    Tailscale auth key (otherwise a login URL is printed)
  --update CTID       Update the app in an existing container
USAGE
	exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--ctid) CTID="$2"; shift 2 ;;
		--hostname) CT_HOSTNAME="$2"; shift 2 ;;
		--storage) STORAGE="$2"; shift 2 ;;
		--template-storage) TEMPLATE_STORAGE="$2"; shift 2 ;;
		--disk) DISK_GB="$2"; shift 2 ;;
		--memory) MEMORY_MB="$2"; shift 2 ;;
		--cores) CORES="$2"; shift 2 ;;
		--bridge) BRIDGE="$2"; shift 2 ;;
		--ts-authkey) TS_AUTHKEY="$2"; shift 2 ;;
		--update) UPDATE=1; CTID="$2"; shift 2 ;;
		-h|--help) usage ;;
		*) echo "Unknown option: $1" >&2; usage 1 ;;
	esac
done

msg() { printf '\e[1;33m==>\e[0m %s\n' "$*"; }
die() { printf '\e[1;31mError:\e[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run as root on the Proxmox host"
command -v pct >/dev/null || die "pct not found: this must run on a Proxmox VE host"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[[ -f "$REPO_DIR/package.json" && -f "$REPO_DIR/deploy/setup.sh" ]] || die "cannot find the BeerLog sources in $REPO_DIR"

# --- Package the sources -----------------------------------------------------
TARBALL="$(mktemp --suffix=.tar.gz)"
trap 'rm -f "$TARBALL"' EXIT
msg "Packaging sources from $REPO_DIR"
tar -C "$REPO_DIR" -czf "$TARBALL" \
	--exclude=./node_modules --exclude=./build --exclude=./.svelte-kit \
	--exclude=./data --exclude=./.git --exclude='./.env' .

push_and_setup() {
	local mode="$1"
	msg "Copying sources into CT $CTID"
	pct push "$CTID" "$TARBALL" /root/beerlog-src.tar.gz
	pct push "$CTID" "$REPO_DIR/deploy/setup.sh" /root/beerlog-setup.sh --perms 0755
	msg "Running setup inside CT $CTID ($mode)"
	pct exec "$CTID" -- env TS_AUTHKEY="$TS_AUTHKEY" TS_HOSTNAME="$CT_HOSTNAME" \
		bash /root/beerlog-setup.sh "$mode" /root/beerlog-src.tar.gz
}

# --- Update mode ---------------------------------------------------------------
if [[ $UPDATE -eq 1 ]]; then
	pct status "$CTID" >/dev/null 2>&1 || die "container $CTID does not exist"
	[[ "$(pct status "$CTID")" == *running* ]] || pct start "$CTID"
	push_and_setup update
	msg "Update done."
	exit 0
fi

# --- Template -----------------------------------------------------------------
msg "Looking for a Debian template"
pveam update >/dev/null
TEMPLATE="$(pveam available --section system | awk '{print $2}' | grep -E '^debian-13-standard' | sort -V | tail -1)"
[[ -n "$TEMPLATE" ]] || TEMPLATE="$(pveam available --section system | awk '{print $2}' | grep -E '^debian-12-standard' | sort -V | tail -1)"
[[ -n "$TEMPLATE" ]] || die "no Debian standard template available"
if ! pveam list "$TEMPLATE_STORAGE" | grep -q "$TEMPLATE"; then
	msg "Downloading $TEMPLATE"
	pveam download "$TEMPLATE_STORAGE" "$TEMPLATE"
fi

# --- Container ----------------------------------------------------------------
[[ -n "$CTID" ]] || CTID="$(pvesh get /cluster/nextid)"
pct status "$CTID" >/dev/null 2>&1 && die "container $CTID already exists (use --update $CTID)"

msg "Creating unprivileged CT $CTID ($CT_HOSTNAME)"
pct create "$CTID" "$TEMPLATE_STORAGE:vztmpl/$TEMPLATE" \
	--hostname "$CT_HOSTNAME" \
	--unprivileged 1 \
	--features nesting=1 \
	--cores "$CORES" \
	--memory "$MEMORY_MB" \
	--swap 512 \
	--rootfs "$STORAGE:$DISK_GB" \
	--net0 "name=eth0,bridge=$BRIDGE,ip=dhcp" \
	--onboot 1 \
	--timezone host \
	--description "BeerLog — journal de dégustation (Tailscale)"

# Tailscale needs /dev/net/tun inside the container.
CONF="/etc/pve/lxc/$CTID.conf"
cat >>"$CONF" <<LXC
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net/tun dev/net/tun none bind,create=file
LXC

msg "Starting CT $CTID"
pct start "$CTID"
for _ in $(seq 1 30); do
	pct exec "$CTID" -- getent hosts deb.debian.org >/dev/null 2>&1 && break
	sleep 2
done

push_and_setup install

msg "Done. Container: $CTID"
pct exec "$CTID" -- bash -c 'cat /etc/beerlog.env | grep ^ORIGIN' || true
