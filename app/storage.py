"""Stockage des courses (SQLite).

Remplace l'ancien fichier leaderboard.json : une base SQLite permet les classements par période,
garde le tracé de chaque course et sert la page d'administration. Les écritures passent par un verrou
pour rester sûres quand plusieurs joueurs terminent en même temps.

Sur Streamlit Community Cloud, le disque est remis à zéro à chaque redéploiement : pour un historique
permanent, il faudra brancher une base externe (voir JOURNAL.md).
"""
import json
import math
import re
import sqlite3
import threading
import time
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "aether_scores.db"
MODES = ("beginner", "expert")
# temps de course plausibles (s) : en dessous, la course est refusée (vitesse impossible pour la barge)
TIME_RANGE = {"beginner": (35, 1800), "expert": (105, 1800)}
_LOCK = threading.Lock()
_CTRL = re.compile(r"[\x00-\x1f\x7f]")
SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  name TEXT NOT NULL,
  team TEXT NOT NULL DEFAULT '',
  time_s REAL NOT NULL,
  pen_s REAL NOT NULL DEFAULT 0,
  total_s REAL NOT NULL,
  co2_kg REAL,
  saved_kg REAL,
  collisions INTEGER,
  ts INTEGER NOT NULL,
  track TEXT
);
CREATE INDEX IF NOT EXISTS runs_mode_total ON runs(mode, total_s);
CREATE INDEX IF NOT EXISTS runs_ts ON runs(ts);
"""


def _conn():
    c = sqlite3.connect(DB_PATH, timeout=10)
    c.row_factory = sqlite3.Row
    return c


def init():
    with _LOCK, _conn() as c:
        c.executescript(SCHEMA)


def clean_text(value, max_len):
    """Texte libre choisi par le joueur : on retire les caractères de contrôle et on limite la longueur."""
    return " ".join(_CTRL.sub("", str(value or "")).split())[:max_len]


def _num(value, lo, hi):
    x = float(value)
    if not math.isfinite(x):
        raise ValueError("nombre invalide")
    return min(hi, max(lo, x))


def add_run(entry):
    """Valide une course envoyée par le navigateur et l'enregistre. Renvoie True si elle a été ajoutée."""
    if not isinstance(entry, dict) or entry.get("mode") not in MODES:
        return False
    name = clean_text(entry.get("name"), 16)
    if not name:
        return False
    try:
        time_s = float(entry["time"])
        lo, hi = TIME_RANGE[entry["mode"]]
        if not lo <= time_s <= hi:
            return False
        pen_s = _num(entry.get("pen", 0), 0, 600)
        track = []
        for q in (entry.get("track") or [])[:4000]:
            if isinstance(q, (list, tuple)) and len(q) >= 3:
                track.append([round(_num(q[0], -1e5, 1e5), 1), round(_num(q[1], -1e5, 1e5), 1), round(_num(q[2], -20, 60), 2)])
        row = (
            clean_text(entry.get("id"), 40) or f"run-{time.time_ns()}",
            entry["mode"], name, clean_text(entry.get("team"), 20),
            round(time_s, 3), round(pen_s, 3), round(time_s + pen_s, 3),
            round(_num(entry.get("co2", 0), 0, 1e6), 1), round(_num(entry.get("saved", 0), 0, 1e6), 1),
            int(_num(entry.get("coll", 0), 0, 999)), int(time.time()), json.dumps(track, separators=(",", ":")),
        )
    except (KeyError, TypeError, ValueError):
        return False
    with _LOCK, _conn() as c:
        cur = c.execute("INSERT OR IGNORE INTO runs VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", row)
        return cur.rowcount == 1


def list_runs(limit=6000):
    """Résumé des courses (sans tracé) pour les classements du jeu."""
    with _conn() as c:
        rows = c.execute("SELECT id, mode, name, team, total_s, ts FROM runs ORDER BY ts DESC LIMIT ?", (limit,)).fetchall()
    return [{"id": r["id"], "mode": r["mode"], "name": r["name"], "team": r["team"], "total": r["total_s"], "ts": r["ts"]} for r in rows]


def best_runs(mode, since_ts=0, limit=None, with_track=False):
    """Meilleure course de chaque joueur (pseudo + équipe), triée par temps."""
    cols = "id, mode, name, team, time_s, pen_s, total_s, co2_kg, saved_kg, collisions, ts" + (", track" if with_track else "")
    with _conn() as c:
        rows = c.execute(f"SELECT {cols} FROM runs WHERE mode = ? AND ts >= ? ORDER BY total_s", (mode, since_ts)).fetchall()
    seen, out = set(), []
    for r in rows:
        key = (r["name"].lower(), r["team"].lower())
        if key in seen:
            continue
        seen.add(key)
        d = dict(r)
        if with_track:
            d["track"] = json.loads(d["track"] or "[]")
        out.append(d)
        if limit and len(out) >= limit:
            break
    return out


def ghosts():
    """Tracés des 3 meilleurs joueurs historiques de chaque mode (traces sur l'eau dans le jeu)."""
    return {m: [{"name": r["name"], "total": r["total_s"], "track": r["track"]} for r in best_runs(m, limit=3, with_track=True)] for m in MODES}


# ------------------------------------------------------------------
#  Administration
# ------------------------------------------------------------------
def players():
    with _conn() as c:
        rows = c.execute(
            "SELECT name, team, COUNT(*) AS runs, MIN(CASE WHEN mode='beginner' THEN total_s END) AS best_beginner, "
            "MIN(CASE WHEN mode='expert' THEN total_s END) AS best_expert, MAX(ts) AS last_ts "
            "FROM runs GROUP BY lower(name), lower(team) ORDER BY lower(team), lower(name)").fetchall()
    return [dict(r) for r in rows]


def teams():
    with _conn() as c:
        rows = c.execute(
            "SELECT team, COUNT(DISTINCT lower(name)) AS players, COUNT(*) AS runs, MAX(ts) AS last_ts "
            "FROM runs WHERE team != '' GROUP BY lower(team) ORDER BY lower(team)").fetchall()
    return [dict(r) for r in rows]


def all_runs():
    with _conn() as c:
        rows = c.execute("SELECT id, mode, name, team, time_s, pen_s, total_s, collisions, ts FROM runs ORDER BY ts DESC").fetchall()
    return [dict(r) for r in rows]


def _write(sql, params):
    with _LOCK, _conn() as c:
        return c.execute(sql, params).rowcount


def rename_player(name, team, new_name, new_team):
    new_name, new_team = clean_text(new_name, 16), clean_text(new_team, 20)
    if not new_name:
        return 0
    return _write("UPDATE runs SET name = ?, team = ? WHERE lower(name) = lower(?) AND lower(team) = lower(?)", (new_name, new_team, name, team))


def delete_player(name, team):
    return _write("DELETE FROM runs WHERE lower(name) = lower(?) AND lower(team) = lower(?)", (name, team))


def rename_team(team, new_team):
    return _write("UPDATE runs SET team = ? WHERE lower(team) = lower(?)", (clean_text(new_team, 20), team))


def delete_team_runs(team):
    return _write("DELETE FROM runs WHERE lower(team) = lower(?)", (team,))


def delete_runs(ids):
    with _LOCK, _conn() as c:
        return sum(c.execute("DELETE FROM runs WHERE id = ?", (i,)).rowcount for i in ids)


def purge(mode=None):
    if mode in MODES:
        return _write("DELETE FROM runs WHERE mode = ?", (mode,))
    return _write("DELETE FROM runs", ())
