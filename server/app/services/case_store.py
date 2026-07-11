import base64
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import get_settings
from app.models.schemas import ChildDescriptor

_DB_PATH: Path | None = None


def _db() -> Path:
    return get_settings().cases_dir / "cases.db"


def init_db(cases_dir: Path) -> None:
    cases_dir.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(cases_dir / "cases.db")
    con.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            case_id              TEXT PRIMARY KEY,
            name                 TEXT,
            age                  INTEGER,
            gender               TEXT,
            city                 TEXT,
            height_cm            REAL,
            weight_kg            REAL,
            distinguishing_marks TEXT,
            last_seen_location   TEXT,
            last_seen_date       TEXT,
            clothing_description TEXT,
            photo_path           TEXT,
            created_at           TEXT
        )
    """)
    # Migrate existing DBs that pre-date the city column
    try:
        con.execute("ALTER TABLE cases ADD COLUMN city TEXT")
        con.commit()
    except Exception:
        pass
    con.commit()
    con.close()


def save_case(case_id: str, descriptor: ChildDescriptor, photo_base64: str) -> str:
    """
    Persist a case to disk:
      - Writes photo to cases/<case_id>/photo.jpg
      - Inserts (or replaces) a row in cases.db
    Returns the relative photo path.
    """
    settings = get_settings()
    case_dir = settings.cases_dir / case_id
    case_dir.mkdir(parents=True, exist_ok=True)

    photo_path = ""
    if photo_base64:
        photo_bytes = base64.b64decode(photo_base64)
        photo_file = case_dir / "photo.jpg"
        photo_file.write_bytes(photo_bytes)
        photo_path = f"cases/{case_id}/photo.jpg"

    con = sqlite3.connect(settings.cases_dir / "cases.db")
    con.execute(
        """
        INSERT OR REPLACE INTO cases
            (case_id, name, age, gender, city, height_cm, weight_kg,
             distinguishing_marks, last_seen_location, last_seen_date,
             clothing_description, photo_path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            case_id,
            descriptor.name,
            descriptor.age,
            getattr(descriptor, "gender", None),
            getattr(descriptor, "city", None),
            descriptor.height_cm,
            descriptor.weight_kg,
            descriptor.distinguishing_marks,
            descriptor.last_seen_location,
            descriptor.last_seen_date,
            descriptor.clothing_description,
            photo_path,
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    con.commit()
    con.close()
    return photo_path


def get_case(case_id: str) -> dict | None:
    con = sqlite3.connect(_db())
    con.row_factory = sqlite3.Row
    row = con.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,)).fetchone()
    con.close()
    return dict(row) if row else None


def search_cases(query: str) -> list[dict]:
    pattern = f"%{query}%"
    con = sqlite3.connect(_db())
    con.row_factory = sqlite3.Row
    rows = con.execute(
        """
        SELECT * FROM cases
        WHERE  name                 LIKE ?
            OR last_seen_location   LIKE ?
            OR distinguishing_marks LIKE ?
            OR clothing_description LIKE ?
        ORDER BY created_at DESC
        LIMIT 100
        """,
        (pattern, pattern, pattern, pattern),
    ).fetchall()
    con.close()
    return [dict(r) for r in rows]

def get_all_cases() -> list[dict]:
    con = sqlite3.connect(_db())
    con.row_factory = sqlite3.Row
    rows = con.execute("SELECT * FROM cases ORDER BY created_at DESC").fetchall()
    con.close()
    return [dict(r) for r in rows]
