"""Migrazioni schema in-place per DB creati prima di famiglie/ownership.

Il progetto usa `Base.metadata.create_all`, che crea le tabelle mancanti ma non
aggiunge colonne a tabelle già esistenti. Qui aggiungiamo le colonne nuove e
riempiamo `vehicles.owner_id` per i dati già in produzione.
"""
from sqlalchemy import text
from sqlalchemy.orm import Session


def _columns(db: Session, table: str) -> set[str]:
    rows = db.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}


def _add_column(db: Session, table: str, column: str, ddl: str) -> bool:
    if column in _columns(db, table):
        return False
    # SQLite non accetta una FK in ADD COLUMN con vincoli non costanti: la
    # relazione resta dichiarata a livello ORM, sufficiente per le query.
    db.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
    db.commit()
    return True


def run_migrations(db: Session) -> None:
    """Aggiunge le colonne mancanti e assegna i veicoli orfani.

    Va eseguita prima di qualsiasi query ORM: i modelli dichiarano già le
    colonne nuove, quindi su un DB preesistente una query anticipata fallisce
    con "no such column".
    """
    _add_column(db, "users", "family_id", "INTEGER")
    _add_column(db, "vehicles", "owner_id", "INTEGER")

    orphans = db.execute(
        text("SELECT COUNT(*) FROM vehicles WHERE owner_id IS NULL")
    ).scalar_one()
    if not orphans:
        return

    first_user_id = db.execute(text("SELECT MIN(id) FROM users")).scalar()
    if first_user_id is None:
        # Nessun utente ancora: i veicoli orfani restano tali e vengono
        # assegnati al prossimo avvio, quando l'admin esiste.
        return

    db.execute(
        text("UPDATE vehicles SET owner_id = :uid WHERE owner_id IS NULL"),
        {"uid": first_user_id},
    )
    db.commit()

    # Non condizionato all'ADD COLUMN appena fatto: il backfill può avvenire a
    # un avvio successivo, e chi eredita i veicoli deve poter invitare.
    _ensure_family_for_user(db, first_user_id)


def _ensure_family_for_user(db: Session, user_id: int) -> None:
    """Crea una famiglia per il proprietario dei dati migrati, così può invitare."""
    current = db.execute(
        text("SELECT family_id FROM users WHERE id = :uid"), {"uid": user_id}
    ).scalar()
    if current is not None:
        return

    db.execute(text("INSERT INTO families (name, created_at) VALUES (:n, :ts)"),
               {"n": "Famiglia", "ts": _utcnow_iso()})
    family_id = db.execute(text("SELECT last_insert_rowid()")).scalar_one()
    db.execute(
        text("UPDATE users SET family_id = :fid WHERE id = :uid"),
        {"fid": family_id, "uid": user_id},
    )
    db.commit()


def _utcnow_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()
