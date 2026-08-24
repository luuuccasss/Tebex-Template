# Tebex Store — FiveM

Landing page one-file pour vendre des ressources FiveM via l'API headless Tebex.
Full vanilla JS / HTML / CSS, aucun build, serveur Node ultra léger avec gzip.

## Contexte

Ce projet est rendu **public** parce qu'il a été développé pour un client qui **n'a jamais payé la prestation**.
Le site n'ayant pas été protégé côté livraison, il a malheureusement récupéré le code source sans régler.
Plutôt que le laisser dormir, autant qu'il serve à la communauté — sers-toi, fork, adapte.


## Stack
- Node.js (serveur HTTP natif, 0 dépendance)
- Vanilla JS (ES modules)
- API Tebex Headless

## Structure
```
.
├── server.js              # serveur statique + gzip
├── index.html
└── assets/
    ├── css/style.css
    └── js/
        ├── config.js      # branding, Tebex, liens
        ├── tebex-api.js   # wrapper API headless
        └── main.js        # render + logique UI
```

## Config
Copie `.env.example` en `.env` et remplis :

```env
TEBEX_WEBSTORE_IDENT=xxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEBEX_STORE_DOMAIN=tastore.tebex.store
SERVER_PORT=8080
```

Le serveur injecte ces valeurs dans `config.js` à la volée.
Pour le reste (branding, liens, catégories), édite directement `assets/js/config.js`.

Récupère ton `webstoreIdent` sur [creator.tebex.io](https://creator.tebex.io) → Integrations → Headless API.

Sans config valide, le site tourne en mode démo (données mock).

## Run
```bash
node server.js
```
Sert sur `http://localhost:8080` (override via `SERVER_PORT`).

## Personnalisation
- Textes/liens : `config.js`
- Catégories custom : `config.categories` (mapping label → tebexId)
- Style : `assets/css/style.css`

## Contact
Discord : [https://discord.gg/yETGQk9YMQ](https://discord.gg/yETGQk9YMQ)

## Licence
MIT
