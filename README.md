# 🍺 BeerLog

Journal de dégustation de bières, partagé entre amis, auto-hébergé sur Proxmox et accessible via Tailscale.

- Liste commune des bières goûtées, recherche instantanée (sans accents) → « déjà goûtée ? »
- Scan du code-barres (caméra) ou recherche par nom → infos récupérées sur **Open Food Facts**
- Saisie manuelle si la bière est inconnue, photo prise au téléphone
- Une note commune par bière (½ étoile) + commentaire, traçabilité « ajoutée / modifiée par »
- PWA installable sur l'écran d'accueil

## Stack

SvelteKit 3 (Svelte 5, adapter-node) · SQLite (better-sqlite3 + Drizzle ORM) · Tailwind CSS 4 · `barcode-detector` (ZXing WASM, servi localement) · Tailscale Serve (HTTPS + identité).

## Architecture

```
Téléphone / PC (Tailscale)
        │  HTTPS https://beerlog.<tailnet>.ts.net
        ▼
LXC Debian (Proxmox)
  tailscale serve :443 ──► node build (127.0.0.1:3000) ──► /var/lib/beerlog/{beerlog.db, photos/}
    ajoute Tailscale-User-Login / Tailscale-User-Name
```

L'authentification est déléguée à Tailscale : l'appli lit les en-têtes `Tailscale-User-*`
injectés par `tailscale serve`. Elle n'écoute que sur `127.0.0.1`, donc impossible de les forger.
Sans ces en-têtes, réponse 403.

## Installation sur Proxmox

Prérequis côté Tailscale (console d'admin) : **MagicDNS** et **HTTPS Certificates** activés.
Optionnel : une [clé d'auth](https://login.tailscale.com/admin/settings/keys) pour éviter l'étape de connexion manuelle.

Sur l'hôte Proxmox, en root, depuis une copie de ce dépôt :

```bash
./deploy/proxmox-install.sh
```

Options utiles : `--ctid 120`, `--storage local-zfs`, `--bridge vmbr1`, `--ts-authkey tskey-auth-…`
(`--help` pour la liste). Le script :

1. télécharge le template Debian 13 (ou 12) si besoin,
2. crée un LXC non privilégié (1 cœur, 1 Go RAM, 4 Go disque) avec `/dev/net/tun`,
3. installe Node.js 24 (NodeSource) et Tailscale (dépôts officiels),
4. compile l'appli, la place dans `/opt/beerlog`, crée le service systemd `beerlog`,
5. connecte le conteneur au tailnet et lance `tailscale serve` en HTTPS.

### Mise à jour

```bash
git pull && ./deploy/proxmox-install.sh --update <CTID>
```

Les données (`/var/lib/beerlog`) sont conservées ; les migrations de base s'appliquent au démarrage.
En cas d'échec au démarrage, l'ancienne version reste dans `/opt/beerlog.old`.

### Partager avec des amis

Dans la console Tailscale : *Machines* → `beerlog` → **Share…** et envoyez l'invitation.
Chaque ami a besoin d'un compte Tailscale. Leur nom apparaît dans « ajoutée par ».

> À vérifier au premier partage : que `tailscale serve` transmet bien les en-têtes d'identité
> pour les utilisateurs invités (sinon ils obtiendront un 403).

### Sauvegarde

Tout est dans `/var/lib/beerlog` : une sauvegarde `vzdump` du conteneur suffit.

## Développement

```bash
npm install
DEV_USER=moi@example.com npm run dev
```

`DEV_USER` remplace l'identité Tailscale en local. Après modification de
`src/lib/server/db/schema.ts` : `npm run db:generate` pour créer la migration.

| Variable | Défaut | Rôle |
|---|---|---|
| `DATA_DIR` | `./data` | Base SQLite et photos |
| `MIGRATIONS_DIR` | `./drizzle` | Migrations Drizzle |
| `DEV_USER` | — | Identité de secours (dev uniquement) |
| `ORIGIN` | — | URL publique (`https://beerlog.<tailnet>.ts.net`), requise par adapter-node |
| `BODY_SIZE_LIMIT` | `512K` | Mettre `8M` pour les photos |
