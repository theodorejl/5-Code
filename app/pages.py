"""Pages secondaires : résultats (routes colorées), suivi des prompts, administration."""
import datetime as dt
import hmac
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
from app.i18n import PURGE_WORD, lang, t  # noqa: E402

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
    ax.plot(*zip(*course), color="#7c6cf0", lw=0.8, ls=(0, (3, 3)), alpha=0.6, zorder=1)
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


def results_page():
    st.title(t("res_title"))
    st.caption(t("res_intro"))
    c1, c2, c3 = st.columns([1, 1, 1])
    mode = c1.segmented_control(t("mode"), ["beginner", "expert"], format_func=t, default="beginner", key="res_mode") or "beginner"
    period = c2.segmented_control(t("period"), ["day", "week", "all"], format_func=t, default="all", key="res_period") or "all"
    n = c3.slider(t("players_n"), 1, 20, 8, key="res_n")
    runs = storage.best_runs(mode, since_ts(period), limit=n, with_track=True)
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
        team = f" · {r['team']}" if r["team"] else ""
        ax.set_title(f"{i + 1}. {r['name']}{team}\n{r['total_s']:.3f} s", fontsize=9, loc="left")
    fig.tight_layout()
    st.pyplot(fig, clear_figure=True)
    df = pd.DataFrame([{
        t("col_rank"): i + 1, t("col_name"): r["name"], t("col_team"): r["team"] or t("none"), t("col_total"): r["total_s"],
        t("col_time"): r["time_s"], t("col_pen"): r["pen_s"], t("col_co2"): r["co2_kg"], t("col_saved"): r["saved_kg"],
        t("col_coll"): r["collisions"], t("col_date"): dt.datetime.fromtimestamp(r["ts"], TZ).strftime("%Y-%m-%d %H:%M"),
    } for i, r in enumerate(runs)])
    st.dataframe(df, hide_index=True, width="stretch", column_config={t("col_total"): st.column_config.NumberColumn(format="%.3f")})


def journal_page():
    st.title(t("jr_title"))
    pdf = ROOT / "docs" / "schema_fonctionnel.pdf"
    if pdf.exists():
        st.download_button(t("jr_pdf"), pdf.read_bytes(), file_name="schema_fonctionnel_aether.pdf", mime="application/pdf")
    else:
        st.info(t("jr_nopdf"))
    st.markdown((ROOT / "JOURNAL.md").read_text(encoding="utf-8"))


def _admin_password():
    try:
        return st.secrets.get("admin_password")
    except Exception:  # pas de fichier secrets.toml
        return None


def _secs(x):
    return f"{x:.3f}" if x is not None else "—"


def _flash(msg):
    st.session_state["ad_msg"] = msg
    st.rerun()


def admin_page():
    st.title(t("ad_title"))
    if st.session_state.get("ad_msg"):
        st.success(st.session_state.pop("ad_msg"))
    secret = _admin_password()
    if not secret:
        st.warning(t("ad_nosecret"))
        return
    if not st.session_state.get("admin_ok"):
        with st.form("admin_login"):
            pwd = st.text_input(t("ad_pwd"), type="password")
            if st.form_submit_button(t("ad_login")):
                if hmac.compare_digest(pwd.encode(), str(secret).encode()):
                    st.session_state["admin_ok"] = True
                    st.rerun()
                st.error(t("ad_bad"))
        return
    if st.button(t("ad_logout")):
        st.session_state["admin_ok"] = False
        st.rerun()
    st.caption(t("ad_storage"))
    runs, players, teams = storage.all_runs(), storage.players(), storage.teams()
    m1, m2, m3 = st.columns(3)
    m1.metric(t("ad_runs"), len(runs))
    m2.metric(t("ad_players"), len(players))
    m3.metric(t("ad_teams"), len(teams))
    tab_p, tab_t, tab_r, tab_d = st.tabs([t("ad_players"), t("ad_teams"), t("ad_runs"), t("ad_danger")])
    fmt_ts = lambda ts: dt.datetime.fromtimestamp(ts, TZ).strftime("%Y-%m-%d %H:%M") if ts else ""
    with tab_p:
        st.dataframe(pd.DataFrame([{t("col_name"): p["name"], t("col_team"): p["team"] or t("none"), t("col_runs"): p["runs"],
                                    t("col_best_b"): _secs(p["best_beginner"]), t("col_best_e"): _secs(p["best_expert"]), t("col_date"): fmt_ts(p["last_ts"])} for p in players]),
                     hide_index=True, width="stretch")
        if players:
            labels = [f"{p['name']} · {p['team'] or t('none')}" for p in players]
            i = st.selectbox(t("ad_pick_player"), range(len(players)), format_func=lambda k: labels[k], key="ad_player")
            p = players[i]
            c1, c2 = st.columns(2)
            new_name = c1.text_input(t("ad_new_name"), value=p["name"], max_chars=16, key=f"ad_nn_{i}")
            new_team = c2.text_input(t("ad_new_team"), value=p["team"], max_chars=20, key=f"ad_nt_{i}")
            if st.button(t("ad_rename"), key="ad_rename_btn"):
                _flash(t("ad_done", n=storage.rename_player(p["name"], p["team"], new_name, new_team)))
            ok = st.checkbox(t("ad_confirm"), key=f"ad_conf_p_{i}")
            if st.button(t("ad_delete_hist"), disabled=not ok, type="primary", key="ad_del_player"):
                _flash(t("ad_deleted", n=storage.delete_player(p["name"], p["team"])))
    with tab_t:
        st.dataframe(pd.DataFrame([{t("col_team"): x["team"], t("col_players"): x["players"], t("col_runs"): x["runs"], t("col_date"): fmt_ts(x["last_ts"])} for x in teams]),
                     hide_index=True, width="stretch")
        if teams:
            j = st.selectbox(t("ad_pick_team"), range(len(teams)), format_func=lambda k: teams[k]["team"], key="ad_team")
            team = teams[j]["team"]
            new = st.text_input(t("ad_new_team"), value=team, max_chars=20, key=f"ad_tn_{j}")
            c1, c2 = st.columns(2)
            if c1.button(t("ad_rename_team"), key="ad_rename_team_btn"):
                _flash(t("ad_done", n=storage.rename_team(team, new)))
            if c2.button(t("ad_detach"), key="ad_detach_btn"):
                _flash(t("ad_done", n=storage.rename_team(team, "")))
            ok = st.checkbox(t("ad_confirm"), key=f"ad_conf_t_{j}")
            if st.button(t("ad_delete_team"), disabled=not ok, type="primary", key="ad_del_team"):
                _flash(t("ad_deleted", n=storage.delete_team_runs(team)))
    with tab_r:
        st.dataframe(pd.DataFrame([{"id": r["id"], t("col_mode"): t(r["mode"]), t("col_name"): r["name"], t("col_team"): r["team"] or t("none"),
                                    t("col_total"): r["total_s"], t("col_coll"): r["collisions"], t("col_date"): fmt_ts(r["ts"])} for r in runs]),
                     hide_index=True, width="stretch")
        ids = st.multiselect(t("ad_pick_runs"), [r["id"] for r in runs],
                             format_func=lambda i: next(f"{r['name']} · {t(r['mode'])} · {r['total_s']:.3f} s · {fmt_ts(r['ts'])}" for r in runs if r["id"] == i), key="ad_runs_sel")
        if st.button(t("ad_delete_runs"), disabled=not ids, type="primary", key="ad_del_runs"):
            _flash(t("ad_deleted", n=storage.delete_runs(ids)))
    with tab_d:
        word = PURGE_WORD[lang()]
        c1, c2 = st.columns(2)
        with c1:
            st.subheader(t("ad_purge_mode"))
            mode = st.segmented_control(t("mode"), ["beginner", "expert"], format_func=t, default="beginner", key="ad_purge_mode") or "beginner"
            typed = st.text_input(t("ad_type"), key="ad_type_mode")
            if st.button(t("ad_purge"), disabled=typed != word, type="primary", key="ad_purge_mode_btn"):
                _flash(t("ad_deleted", n=storage.purge(mode)))
        with c2:
            st.subheader(t("ad_purge_all"))
            typed2 = st.text_input(t("ad_type"), key="ad_type_all")
            if st.button(t("ad_purge"), disabled=typed2 != word, type="primary", key="ad_purge_all_btn"):
                _flash(t("ad_deleted", n=storage.purge()))
