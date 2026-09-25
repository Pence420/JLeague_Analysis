#!/usr/bin/env python3
"""Build the immutable J1 2025 snapshot from official J.LEAGUE Data Site pages.

The application never scrapes at runtime. Run this script deliberately when the
checked-in snapshot needs to be rebuilt, then review the JSON diff and sources.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from datetime import date, datetime
from pathlib import Path


BASE_URL = "https://data.j-league.or.jp"
STANDINGS_URL = (
    f"{BASE_URL}/SFRT01/?competitionId=651&competitionSectionId=38"
    "&search=search&yearId=2025"
)
DIRECTORY_URL = f"{BASE_URL}/SFIX03/search"
SNAPSHOT_DATE = "2025-12-06"

ENGLISH_NAMES = {
    "kashima": ("Kashima Antlers", "KAS"),
    "kashiwa": ("Kashiwa Reysol", "KSW"),
    "kyoto": ("Kyoto Sanga F.C.", "KYO"),
    "hiroshima": ("Sanfrecce Hiroshima", "HIR"),
    "kobe": ("Vissel Kobe", "KOB"),
    "machida": ("FC Machida Zelvia", "MCH"),
    "urawa": ("Urawa Red Diamonds", "URW"),
    "kawasakif": ("Kawasaki Frontale", "KAW"),
    "gosaka": ("Gamba Osaka", "GOS"),
    "cosaka": ("Cerezo Osaka", "COS"),
    "ftokyo": ("FC Tokyo", "FCT"),
    "fukuoka": ("Avispa Fukuoka", "AVI"),
    "okayama": ("Fagiano Okayama", "FAG"),
    "shimizu": ("Shimizu S-Pulse", "SHI"),
    "yokohamafm": ("Yokohama F. Marinos", "YFM"),
    "nagoya": ("Nagoya Grampus", "NGY"),
    "tokyov": ("Tokyo Verdy", "TKV"),
    "yokohamafc": ("Yokohama FC", "YFC"),
    "shonan": ("Shonan Bellmare", "SHO"),
    "niigata": ("Albirex Niigata", "ALB"),
}

POSITION_LABELS = {
    "GK": "Goalkeeper",
    "DF": "Defender",
    "MF": "Midfielder",
    "FW": "Forward",
}

# Players registered after the frozen all-player directory snapshot can be
# resolved from their official J.LEAGUE player profile.
KNOWN_IDENTITIES = {
    "入江羚介": {
        "sourcePlayerId": "1651943",
        "name": "IRIE Ryosuke",
        "nameJa": "入江 羚介",
        "lastClubJa": "神戸",
        "position": "DF",
        "birthDate": "2004/11/05",
        "heightCm": 183,
        "weightKg": 76,
    }
}


def load_metric_catalog(path: Path) -> dict:
    catalog = json.loads(path.read_text(encoding="utf-8"))
    if "usageStatus" not in catalog:
        raise ValueError(f"Metric catalog has no usageStatus: {path}")
    return catalog


def require_official_stats_approval(path: Path) -> dict:
    """Fail closed before any official advanced-stat page is requested."""

    catalog = load_metric_catalog(path)
    if catalog["usageStatus"] != "approved":
        raise PermissionError(
            "Official advanced statistics cannot be imported while catalog "
            f"usageStatus is {catalog['usageStatus']!r}"
        )
    return catalog


def write_import_audit(
    path: Path,
    *,
    include_official_stats: bool,
    usage_status: str,
    metric_results: list[dict],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                "createdAt": datetime.now().astimezone().isoformat(timespec="seconds"),
                "officialStatsAction": "requested" if include_official_stats else "skipped",
                "usageStatus": usage_status,
                "metricResults": metric_results,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    return " ".join(html.unescape(value).replace("\u3000", " ").split())


def normalize_name(value: str) -> str:
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", clean(value))).casefold()


def fetch(url: str, path: Path) -> str:
    if path.exists():
        return path.read_text(encoding="utf-8")
    request = urllib.request.Request(url, headers={"User-Agent": "J-Scout snapshot importer/1.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        body = response.read().decode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")
    time.sleep(0.35)
    return body


def data_value(row: str, css_class: str) -> int:
    match = re.search(
        rf'class="{re.escape(css_class)}"[^>]*data-sort-value="([+-]?\d+)"', row
    )
    if not match:
        raise ValueError(f"Missing {css_class} in standings row")
    return int(match.group(1))


def parse_standings(body: str) -> list[dict]:
    table = re.search(r'<table[^>]+id="search_result".*?</table>', body, re.S)
    if not table:
        raise ValueError("Official standings table not found")
    teams: list[dict] = []
    for row in re.findall(r"<tr\b.*?</tr>", table.group(0), re.S):
        team_id = re.search(r"teamId=(\d+)", row)
        profile = re.search(r"jleague\.jp/club/([^/]+)/profile", row)
        japanese_name = re.search(r'class="wd02".*?<a[^>]*>(.*?)</a>', row, re.S)
        if not (team_id and profile and japanese_name):
            continue
        profile_slug = profile.group(1)
        if profile_slug not in ENGLISH_NAMES:
            raise ValueError(f"No canonical English name for {profile_slug}")
        name, short_name = ENGLISH_NAMES[profile_slug]
        wins = data_value(row, "wd05")
        draws = data_value(row, "wd08")
        losses = data_value(row, "wd09")
        teams.append(
            {
                "id": profile_slug,
                "sourceTeamId": int(team_id.group(1)),
                "name": name,
                "nameJa": clean(japanese_name.group(1)),
                "shortName": short_name,
                "rank": data_value(row, "wd01"),
                "played": data_value(row, "wd04"),
                "wins": wins,
                "draws": draws,
                "losses": losses,
                "points": data_value(row, "wd03"),
                "goalsFor": data_value(row, "wd12"),
                "goalsAgainst": data_value(row, "wd13"),
                "goalDifference": data_value(row, "wd14"),
                "expectedGoals": None,
                "expectedGoalsAgainst": None,
                "possessionPct": None,
                "defensiveActionsPer90": None,
                "consistency": None,
                "coverage": 100,
            }
        )
    teams.sort(key=lambda team: team["rank"])
    if len(teams) != 20:
        raise ValueError(f"Expected 20 J1 clubs, found {len(teams)}")
    return teams


def parse_player_directory(body: str) -> dict[str, list[dict]]:
    directory: dict[str, list[dict]] = {}
    row_pattern = re.compile(
        r'<tr>\s*<td class="bl-non">.*?player_id=(\d+)">(.*?)</a>\s*</td>'
        r"\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*<td>(.*?)</td>"
        r"\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*</tr>",
        re.S,
    )
    for match in row_pattern.finditer(body):
        player_id, name_ja, name, last_club, position, birth_date, size = (
            clean(value) for value in match.groups()
        )
        height, _, weight = size.partition("/")
        entry = {
            "sourcePlayerId": player_id,
            "name": name,
            "nameJa": name_ja,
            "lastClubJa": last_club,
            "position": position,
            "birthDate": birth_date,
            "heightCm": int(height) if height.isdigit() else None,
            "weightKg": int(weight) if weight.isdigit() else None,
        }
        aliases = {normalize_name(name_ja)}
        base_name = re.sub(r"（.*?）", "", name_ja)
        aliases.add(normalize_name(base_name))
        for alternative in re.findall(r"（(.*?)）", name_ja):
            aliases.add(normalize_name(alternative))
        for alias in aliases:
            directory.setdefault(alias, []).append(entry)
    if len(directory) < 5_000:
        raise ValueError(f"Player directory parse looks incomplete: {len(directory)} names")
    return directory


def appearance_url(team: dict) -> str:
    params = {
        "competition_frame_id": "1",
        "competition_frame_id_ex": "1",
        "competition_id": "651",
        "competition_id_ex": "651",
        "competition_year": "2025",
        "competition_year_ex": "2025",
        "dataSize": "1",
        "pageStartNo": "0",
        "selectedCompetitionName": "Ｊ１リーグ",
        "selectedCompetitionYear": "2025年",
        "selectedTeamName": team["nameJa"],
        "team_id": str(team["sourceTeamId"]),
        "team_id_ex": str(team["sourceTeamId"]),
    }
    return f"{BASE_URL}/SFPR01/search?{urllib.parse.urlencode(params)}"


def parse_appearances(body: str) -> list[dict]:
    result: list[dict] = []
    for row in re.findall(r"<tr>.*?</tr>", body, re.S):
        cells = re.findall(
            r'<th[^>]*data-sort-value="([+-]?\d+)"[^>]*>(.*?)</th>', row, re.S
        )
        name_match = re.search(r'<th[^>]*name-c[^>]*>(.*?)</th>', row, re.S)
        if not name_match or len(cells) < 4:
            continue
        numeric = [int(value) for value, _ in cells]
        result.append(
            {
                "jerseyNumber": numeric[0],
                "nameJa": clean(name_match.group(1)),
                "appearances": numeric[1],
                "minutes": numeric[2],
                "goals": numeric[3],
            }
        )
    if len(result) < 20:
        raise ValueError(f"Appearance page parse looks incomplete: {len(result)} players")
    return result


def resolve_identity(name_ja: str, directory: dict[str, list[dict]]) -> dict | None:
    known = KNOWN_IDENTITIES.get(normalize_name(name_ja))
    if known:
        return known
    matches = directory.get(normalize_name(name_ja), [])
    if len(matches) == 1:
        return matches[0]
    if matches:
        current = [item for item in matches if item["position"] in POSITION_LABELS]
        return current[0] if current else matches[0]
    return None


def age_on_snapshot(birth_date: str) -> int:
    born = date.fromisoformat(birth_date.replace("/", "-"))
    snapshot = date.fromisoformat(SNAPSHOT_DATE)
    return snapshot.year - born.year - ((snapshot.month, snapshot.day) < (born.month, born.day))


def derived_scores(player: dict, max_minutes: int) -> dict:
    minutes_share = min(1, player["minutes"] / max_minutes)
    appearance_share = min(1, player["appearances"] / 38)
    goal_signal = min(1, player["goals"] / 12)
    performance = round((minutes_share * 0.5 + appearance_share * 0.25 + goal_signal * 0.25) * 100)
    availability = round(minutes_share * 100)
    opportunity = round((1 - minutes_share) * 70 + (30 if player["age"] <= 23 else 0))
    potential = round(max(0, min(100, 100 - max(0, player["age"] - 18) * 4)))
    return {
        "performance": performance,
        "potential": potential,
        "opportunity": opportunity,
        "availability": availability,
    }


def build_snapshot(cache_dir: Path) -> dict:
    standings = fetch(STANDINGS_URL, cache_dir / "standings.html")
    directory_body = fetch(DIRECTORY_URL, cache_dir / "player-directory.html")
    teams = parse_standings(standings)
    directory = parse_player_directory(directory_body)
    players: list[dict] = []
    unmatched: list[str] = []
    for team in teams:
        body = fetch(appearance_url(team), cache_dir / f"appearances-{team['id']}.html")
        for appearance in parse_appearances(body):
            identity = resolve_identity(appearance["nameJa"], directory)
            if identity is None:
                unmatched.append(f"{team['name']}: {appearance['nameJa']}")
                identity = {
                    "sourcePlayerId": f"unmatched-{team['id']}-{appearance['jerseyNumber']}",
                    "name": appearance["nameJa"],
                    "position": "MF",
                    "birthDate": "2000/01/01",
                    "heightCm": None,
                    "weightKg": None,
                }
            player = {
                # One player can have official records for two clubs after a
                # mid-season transfer. Scope the season record id by club.
                "id": f"{identity['sourcePlayerId']}-{team['id']}",
                "officialPlayerId": identity["sourcePlayerId"],
                "name": identity["name"],
                "nameJa": appearance["nameJa"],
                "teamId": team["id"],
                "position": identity["position"] if identity["position"] in POSITION_LABELS else "MF",
                "role": POSITION_LABELS.get(identity["position"], "Midfielder"),
                "birthDate": identity["birthDate"],
                "age": age_on_snapshot(identity["birthDate"]),
                "heightCm": identity["heightCm"],
                "weightKg": identity["weightKg"],
                **appearance,
                "coverage": 100 if not str(identity["sourcePlayerId"]).startswith("unmatched-") else 70,
            }
            player.update(derived_scores(player, team["played"] * 90))
            players.append(player)
    # Official appearance pages can retain an obsolete shirt number after a
    # mid-season registration change. Keep the record with the most minutes.
    deduplicated: dict[str, dict] = {}
    for player in players:
        current = deduplicated.get(player["id"])
        if current is None or (player["minutes"], player["appearances"]) > (
            current["minutes"], current["appearances"]
        ):
            deduplicated[player["id"]] = player
    players = list(deduplicated.values())
    if len(players) < 500:
        raise ValueError(f"Expected a full league roster, found only {len(players)} players")
    return {
        "competition": "J1",
        "season": 2025,
        "snapshotDate": SNAPSHOT_DATE,
        "methodologyVersion": "jleague-official-2025.1",
        "sample": False,
        "provenance": {
            "publisher": "J.LEAGUE",
            "source": "J.LEAGUE Data Site",
            "retrievedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
            "standingsUrl": STANDINGS_URL,
            "playerDirectoryUrl": DIRECTORY_URL,
            "appearanceRecordPattern": f"{BASE_URL}/SFPR01/search",
            "notes": [
                "Club standings and player appearance totals are official published records.",
                "Performance, potential, opportunity and availability are J-Scout derived scores.",
                "The snapshot is fixed to the final 2025 matchday and is not live data.",
            ],
            "unmatchedIdentities": unmatched,
        },
        "teams": teams,
        "players": players,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir", type=Path, default=Path("/private/tmp/jleague-2025"))
    parser.add_argument("--output", type=Path, default=Path("data/jleague/2025.json"))
    parser.add_argument(
        "--metric-catalog",
        type=Path,
        default=Path("data/jleague/metric-catalog.json"),
    )
    parser.add_argument(
        "--audit-output",
        type=Path,
        default=Path("/private/tmp/jleague-2025-import-audit.json"),
    )
    parser.add_argument("--include-official-stats", action="store_true")
    args = parser.parse_args()

    catalog = load_metric_catalog(args.metric_catalog)
    if args.include_official_stats:
        require_official_stats_approval(args.metric_catalog)

    snapshot = build_snapshot(args.cache_dir)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    write_import_audit(
        args.audit_output,
        include_official_stats=args.include_official_stats,
        usage_status=catalog["usageStatus"],
        metric_results=[],
    )
    print(
        f"Wrote {len(snapshot['teams'])} clubs and {len(snapshot['players'])} players "
        f"to {args.output}"
    )


if __name__ == "__main__":
    main()
