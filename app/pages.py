"""Page des résultats : routes de chaque joueur colorées selon la vitesse."""
import datetime as dt
import json
import math
from pathlib import Path
from zoneinfo import ZoneInfo

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402
import streamlit as st  # noqa: E402
from matplotlib.collections import LineCollection  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402

from app import storage  # noqa: E402
from app.i18n import LANGS, t  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TZ = ZoneInfo("Europe/Zurich")
# même échelle de couleurs que dans le jeu (inspirée de windy)
SPEED_CMAP = LinearSegmentedColormap.from_list("windy", ["#6271b7", "#39a0c8", "#4cbf7f", "#e1c54a", "#e08a3c", "#d33d3d", "#a93f8b"])


@st.cache_data(show_spinner=False)
def lake_polygon():
    g = json.loads((ROOT / "game" / "leman_geo.json").read_text(encoding="utf-8"))
    s = g["scale"]
    pts = [p[:2] for p in g["north"]] + [p[:2] for p in reversed(g["south"][1:-1])]
    return [(x * s, y * s) for x, y in pts], [(x * s, y * s) for x, y in g["course"]]


def since_ts(period):
    now = dt.datetime.now(TZ)
    if period == "day":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = (now - dt.timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        return 0
    return int(start.timestamp())


def _draw_lake(ax):
    poly, course = lake_polygon()
    ax.fill(*zip(*poly), color="#d7e8f0", zorder=0)
    ax.plot(*zip(*(poly + poly[:1])), color="#8fb0c2", lw=0.8, zorder=1)
    ax.plot(*zip(*course), color="#1f3a68", lw=0.8, ls=(0, (3, 3)), alpha=0.6, zorder=1)
    ax.set_aspect("equal")
    ax.axis("off")


def _route(ax, track, norm, lw=2.2):
    if len(track) < 2:
        return
    pts = [(q[0], q[1]) for q in track]
    segs = [[pts[i - 1], pts[i]] for i in range(1, len(pts))]
    lc = LineCollection(segs, cmap=SPEED_CMAP, norm=norm, linewidths=lw, capstyle="round", zorder=3)
    lc.set_array([track[i][2] for i in range(1, len(track))])
    ax.add_collection(lc)
    return lc


def _label(r):
    """Tentative datée : « TJL – Aether Alumni – 10/10/2026 18h36 »."""
    when = dt.datetime.fromtimestamp(r["ts"], TZ).strftime("%d/%m/%Y %Hh%M")
    return " – ".join(x for x in (r["name"], r["team"], when) if x)


def _set_lang():
    new = st.session_state.get("lang_ctrl") or st.session_state["lang"]
    st.session_state["lang"] = new
    st.query_params["lang"] = new


def results_page():
    # le jeu a ses propres boutons de langue ; ici, un sélecteur pour la page des résultats
    head, right = st.columns([5, 1])
    st.session_state["lang_ctrl"] = st.session_state.get("lang", "fr")   # la clé du widget disparaît quand on quitte la page
    right.segmented_control(t("lang"), list(LANGS), format_func=LANGS.get, key="lang_ctrl", on_change=_set_lang, label_visibility="collapsed")
    head.title(t("res_title"))
    st.caption(t("res_intro"))
    c1, c2, c3, c4 = st.columns([1, 1, 1, 1])
    mode = c1.segmented_control(t("mode"), ["beginner", "expert"], format_func=t, default="beginner", key="res_mode") or "beginner"
    sort = c2.segmented_control(t("sort"), ["score", "co2", "time"], format_func=lambda k: t("sort_" + k), default="score", key="res_sort") or "score"
    period = c3.segmented_control(t("period"), ["day", "week", "all"], format_func=t, default="all", key="res_period") or "all"
    n = c4.slider(t("players_n"), 1, 20, 8, key="res_n")
    runs = storage.ranked_runs(mode, since_ts(period), sort=sort, limit=n, with_track=True)
    if not runs:
        st.info(t("no_runs"))
        return
    speeds = [q[2] for r in runs for q in r["track"]] or [0, 1]
    norm = matplotlib.colors.Normalize(vmin=min(speeds), vmax=max(max(speeds), min(speeds) + 0.1))
    fig, ax = plt.subplots(figsize=(11, 5.2), dpi=110)
    _draw_lake(ax)
    lc = None
    for r in runs:
        lc = _route(ax, r["track"], norm, lw=1.8) or lc
    if lc is not None:
        cb = fig.colorbar(lc, ax=ax, fraction=0.025, pad=0.01)
        cb.set_label(t("speed_kn"))
    ax.set_title(t("all_routes"), fontsize=11, loc="left")
    st.pyplot(fig, clear_figure=True)
    cols = 4
    rows = math.ceil(len(runs) / cols)
    fig, axes = plt.subplots(rows, cols, figsize=(12, 2.6 * rows), dpi=100, squeeze=False)
    for i, ax in enumerate(axes.flat):
        if i >= len(runs):
            ax.axis("off")
            continue
        r = runs[i]
        _draw_lake(ax)
        _route(ax, r["track"], norm)
        ax.set_title(f"{i + 1}. {_label(r)}\n{r['score']:.3f} t·s · {r['co2_kg']:.0f} kg · {r['total_s']:.3f} s", fontsize=8, loc="left")
    fig.tight_layout()
    st.pyplot(fig, clear_figure=True)
    df = pd.DataFrame([{
        t("col_rank"): i + 1, t("col_attempt"): _label(r), t("col_score"): r["score"], t("col_total"): r["total_s"],
        t("col_time"): r["time_s"], t("col_pen"): r["pen_s"], t("col_co2"): r["co2_kg"], t("col_saved"): r["saved_kg"],
        t("col_coll"): r["collisions"],
    } for i, r in enumerate(runs)])
    st.dataframe(df, hide_index=True, width="stretch", column_config={t("col_total"): st.column_config.NumberColumn(format="%.3f"),
                                                                     t("col_score"): st.column_config.NumberColumn(format="%.3f")})
