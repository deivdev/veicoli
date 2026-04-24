# Veicoli

Webapp self-hosted per gestire manutenzione e scadenze dei tuoi veicoli:
assicurazione, revisione, tagliando, bollo, gomme (cambi e rotazioni) e
letture del contachilometri. Alert visivi sulle scadenze, storico completo,
multi-utente condiviso.

## Stack

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy + SQLite
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Deploy**: Docker Compose (target Synology NAS)

## Quick start (locale)

```bash
cp .env.example .env
# Modifica almeno:
#   JWT_SECRET      → openssl rand -hex 32
#   ADMIN_EMAIL     → la tua email
#   ADMIN_PASSWORD  → password (min 8 caratteri)

docker compose up --build
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/api/health

Al primo avvio il backend crea automaticamente l'utente admin con le
credenziali in `.env`. Accedi dal browser e inizia ad aggiungere veicoli.

## Deploy su Synology

**Requisiti:** DSM 7.2+ con Container Manager (o Portainer) installato.

1. Sul NAS crea la cartella `/volume1/docker/veicoli/`.
2. Copia tutto il contenuto di questo repo nella cartella (via File Station o scp).
3. Crea `.env` partendo da `.env.example`. Imposta `PUBLIC_API_URL` in base a come
   accederai:
   - Solo LAN: `http://IP-DEL-NAS:3000`
   - Reverse proxy DSM con dominio: `https://veicoli.tuo-dominio.it`
4. Container Manager → **Progetto** → **Crea** → punta a `docker-compose.yml`
   nella cartella.
5. Avvia il progetto. Le prime build richiedono qualche minuto.
6. (Opzionale ma consigliato) DSM → Pannello di controllo → Portale di login →
   Reverse proxy avanzato:
   - Sorgente: `veicoli.tuo-dominio.it:443`
   - Destinazione: `localhost:3000`
   - Così hai HTTPS gratuito via certificato DSM.

I dati persistono in:
- `./data/db/veicoli.db` — database SQLite
- `./data/uploads/` — foto veicoli

**Backup:** basta copiare la cartella `./data/`.

## Sviluppo locale (senza Docker)

```bash
# Backend
cd backend
python -m venv .venv
.venv/bin/pip install -e .
.venv/bin/uvicorn app.main:app --reload

# Frontend (in un altro terminale)
cd frontend
npm install
npm run dev
```

Il frontend in dev si aspetta `INTERNAL_API_URL=http://localhost:8000` (default se non settato è `http://backend:8000`, che funziona solo nel compose).

## Test

```bash
cd backend
.venv/bin/pytest
```

## Architettura

- Il frontend Next.js fa da proxy al backend tramite route handler
  (`/api/proxy/*` e `/api/photo/*`), leggendo il JWT da cookie httpOnly.
  Non esponi il backend direttamente verso l'esterno: solo il frontend è
  pubblicato.
- SQLite con `PRAGMA journal_mode=WAL` per reggere accessi concorrenti sul NAS.
- Schema DB creato automaticamente all'avvio (`Base.metadata.create_all`).
  Se un domani serviranno migrazioni complesse, la struttura è già pronta per
  Alembic.

## Funzionalità fuori dalla V1 (possibili iterazioni)

- Notifiche email / push per scadenze
- Grafici costi per veicolo / anno
- Tracciamento rifornimenti e consumi
- Import/export CSV
