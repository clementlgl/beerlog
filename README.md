# 🍺 BeerLog

Journal de dégustation de bières, partagé entre amis, auto-hébergé sur Proxmox.

- Liste commune des bières goûtées, recherche instantanée (sans accents) → « déjà goûtée ? »
- Scan du code-barres (caméra) ou recherche par nom → infos récupérées sur **Open Food Facts**
- 10 styles fixes (Blanche → Stout), une note sur 10 et un commentaire pour chacun des deux dégustateurs (moyenne affichée, prénoms réglables), une photo
- Page de statistiques (répartition par style, top 5, notes par style)
- PWA installable sur l'écran d'accueil

## Stack

SvelteKit 3 (Svelte 5, adapter-node) · SQLite (better-sqlite3 + Drizzle ORM) · Tailwind CSS 4 · `barcode-detector` (ZXing WASM, servi localement).

## Architecture

```
Téléphone / PC
        │  HTTPS https://beerlog.<domaine>
        ▼
Reverse proxy (ex. Caddy, sur un autre LXC)
        │  HTTP 192.168.1.20:3000
        ▼
LXC Debian « beerlog » : node build (0.0.0.0:3000) ──► /var/lib/beerlog/{beerlog.db, photos/}
```

> **Pas d'authentification dans l'appli.** Toute personne qui atteint le port peut lire et
> modifier la liste. Le contrôle d'accès se fait en amont : réseau (Tailscale, VPN, LAN) ou
> reverse proxy. N'exposez pas le port directement sur Internet.

Le scan par caméra exige une page servie en **HTTPS** (ou `localhost`) : faites porter le TLS
par le reverse proxy.

## Installation sur Proxmox

Script au format [community-scripts](https://community-scripts.org/), dans
[clementlgl/proxmox-scripts](https://github.com/clementlgl/proxmox-scripts). Sur le nœud Proxmox :

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/clementlgl/proxmox-scripts/main/ct/beerlog.sh)"
```

- LXC Debian 13 non privilégié, 1 vCPU / 1 Go RAM / 4 Go disque par défaut.
- Code : `/opt/beerlog` (checkout git de ce dépôt). Données : `/var/lib/beerlog`
  (`beerlog.db`, `photos/`, `backups/`). Réglages : `/etc/beerlog.env`.
- Service systemd `beerlog`, sur `0.0.0.0:3000`.
- Mise à jour : commande `update` dans le conteneur (sauvegarde de la base, rebuild, migrations au
  démarrage, retour à la version précédente si l'appli ne redémarre pas).

Derrière un reverse proxy HTTPS, mettre dans `/etc/beerlog.env` l'URL exacte tapée dans le
navigateur, puis `systemctl restart beerlog` :

```bash
ORIGIN=https://beerlog.example.com
```

Sinon les formulaires sont refusés (« Cross-site POST form submissions are forbidden »).
Exemple Caddy :

```caddy
beerlog.example.com {
	reverse_proxy 192.168.1.20:3000
}
```

Sauvegarde : tout est dans `/var/lib/beerlog`, une sauvegarde `vzdump` du conteneur suffit.

## Développement

```bash
npm install
npm run dev
```

Après modification de `src/lib/server/db/schema.ts` : `npm run db:generate` pour créer la migration.

| Variable | Défaut | Rôle |
|---|---|---|
| `HOST` | `0.0.0.0` | Adresse d'écoute (adapter-node) |
| `PORT` | `3000` | Port d'écoute |
| `ORIGIN` | — | URL publique, requise en production pour les formulaires |
| `DATA_DIR` | `./data` | Base SQLite et photos |
| `MIGRATIONS_DIR` | `./drizzle` | Migrations Drizzle |
| `BODY_SIZE_LIMIT` | `512K` | Mettre `8M` pour les photos |
