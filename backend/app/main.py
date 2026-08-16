from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db import Base, SessionLocal, engine
from app.migrate import run_migrations
from app.routers import auth as auth_router
from app.routers import dashboard as dashboard_router
from app.routers import events as events_router
from app.routers import family as family_router
from app.routers import vehicles as vehicles_router
from app.seed import seed_admin


@asynccontextmanager
async def lifespan(_: FastAPI):
    db_url = settings.database_url
    if db_url.startswith("sqlite"):
        db_path = db_url.split("sqlite:///", 1)[-1]
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    Path(settings.uploads_dir).mkdir(parents=True, exist_ok=True)

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        # Il seed precede il backfill: su un DB nuovo l'admin è il primo utente
        # e diventa il proprietario di eventuali veicoli senza owner.
        seed_admin(db)
        run_migrations(db)

    yield


app = FastAPI(title="Veicoli", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"ok": True}


app.include_router(auth_router.router, prefix="/api")
app.include_router(family_router.router, prefix="/api")
app.include_router(vehicles_router.router, prefix="/api")
for r in events_router.routers:
    app.include_router(r, prefix="/api")
app.include_router(dashboard_router.router, prefix="/api")

Path(settings.uploads_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")
