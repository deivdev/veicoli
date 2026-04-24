import os
import tempfile

import pytest

_TMPDIR = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_TMPDIR}/test.db"
os.environ["UPLOADS_DIR"] = _TMPDIR
os.environ["JWT_SECRET"] = "test-secret"
os.environ["REGISTRATION_ENABLED"] = "true"


@pytest.fixture()
def client():
    # Fresh DB per test by recreating schema
    from app.db import Base, engine
    from fastapi.testclient import TestClient

    from app.main import app

    Base.metadata.drop_all(bind=engine)

    with TestClient(app) as c:
        yield c
