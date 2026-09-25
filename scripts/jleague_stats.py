"""Parse reviewed J STATS pages and join rows to J-Scout player seasons.

This module deliberately contains no network code. Fetching is an explicit,
offline importer concern and is additionally protected by the source-usage
gate in ``metric-catalog.json``.
"""

from __future__ import annotations

import html
import re
import unicodedata
from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Literal


ValueKind = Literal["count", "percentage", "decimal", "derived"]


@dataclass(frozen=True)
class MetricDefinition:
    key: str
    unit: str
    value_kind: ValueKind
    source_url: str


@dataclass(frozen=True)
class OfficialMetricRow:
    player_id: str | None
    player_name_ja: str
    club_name_ja: str
    rank: int
    value: float
    listing_status: Literal["listed"] = "listed"


@dataclass(frozen=True)
class MetricJoinResult:
    values: dict[str, dict[str, float | int | str | None]]
    matched: list[str]
    ambiguous: list[str]
    unmatched: list[str]


def _normalize(value: str) -> str:
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", html.unescape(value))).casefold()


def _number(value: str) -> float:
    normalized = unicodedata.normalize("NFKC", html.unescape(value))
    normalized = normalized.replace(",", "").replace("%", "").replace("％", "")
    normalized = re.sub(r"(?:km|分|回|本|点)\s*$", "", normalized, flags=re.IGNORECASE)
    match = re.search(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)", normalized)
    if not match:
        raise ValueError(f"Metric value is not numeric: {value!r}")
    return float(match.group(0))


class _RankingParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.metric_marker: str | None = None
        self.updated_at = ""
        self.in_updated = False
        self.in_ranking = False
        self.table_depth = 0
        self.current_player_id: str | None = None
        self.current_cells: list[str] | None = None
        self.current_cell: list[str] | None = None
        self.rows: list[tuple[str, list[str]]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if attributes.get("data-jstats-metric"):
            self.metric_marker = attributes["data-jstats-metric"]
        if "data-updated-at" in attributes:
            self.in_updated = True
        if tag == "table" and "data-jstats-ranking" in attributes:
            self.in_ranking = True
            self.table_depth = 1
            return
        if self.in_ranking and tag == "table":
            self.table_depth += 1
        if self.in_ranking and tag == "tr":
            self.current_player_id = attributes.get("data-player-id")
            self.current_cells = []
        if self.current_cells is not None and tag in {"td", "th"}:
            self.current_cell = []

    def handle_endtag(self, tag: str) -> None:
        if self.in_updated and tag in {"p", "time", "span", "div"}:
            self.in_updated = False
        if self.current_cell is not None and tag in {"td", "th"}:
            assert self.current_cells is not None
            self.current_cells.append(" ".join("".join(self.current_cell).split()))
            self.current_cell = None
        if self.in_ranking and tag == "tr" and self.current_cells is not None:
            if self.current_player_id and len(self.current_cells) >= 4:
                self.rows.append((self.current_player_id, self.current_cells))
            self.current_cells = None
            self.current_player_id = None
        if self.in_ranking and tag == "table":
            self.table_depth -= 1
            if self.table_depth == 0:
                self.in_ranking = False

    def handle_data(self, data: str) -> None:
        if self.in_updated:
            self.updated_at += data
        if self.current_cell is not None:
            self.current_cell.append(data)


def parse_metric_page(html_body: str, definition: MetricDefinition) -> list[OfficialMetricRow]:
    """Return explicitly listed rows from one reviewed metric page.

    A missing row is intentionally not created here: the join stage assigns
    ``not_listed`` to every unmatched player season.
    """

    parser = _RankingParser()
    parser.feed(html_body)

    if parser.metric_marker != definition.key:
        raise ValueError(
            f"Expected metric marker {definition.key!r}, found {parser.metric_marker!r}"
        )
    if not parser.updated_at.strip() or "更新" not in parser.updated_at:
        raise ValueError("Official metric page is missing its updated-at label")
    if not parser.rows:
        raise ValueError("Official metric page has no result row")

    rows: list[OfficialMetricRow] = []
    for player_id, cells in parser.rows:
        try:
            rank = int(_number(cells[0]))
            value = _number(cells[-1])
        except ValueError as error:
            raise ValueError(f"Invalid result row for player {player_id}: {cells!r}") from error
        rows.append(
            OfficialMetricRow(
                player_id=player_id,
                player_name_ja=cells[1],
                club_name_ja=cells[2],
                rank=rank,
                value=value,
            )
        )
    return rows


def join_metric_rows(
    players: list[dict], rows: list[OfficialMetricRow], metric_key: str
) -> MetricJoinResult:
    """Attach rows to club-season records without unsafe identity guessing."""

    del metric_key  # The key labels the caller's payload; identity logic is metric-independent.
    values: dict[str, dict[str, float | int | str | None]] = {
        player["id"]: {
            "value": None,
            "listingStatus": "not_listed",
            "sourceRank": None,
        }
        for player in players
    }
    by_official_id: dict[str, list[dict]] = {}
    by_name: dict[str, list[dict]] = {}
    for player in players:
        by_official_id.setdefault(str(player.get("officialPlayerId", "")), []).append(player)
        by_name.setdefault(_normalize(str(player.get("nameJa", ""))), []).append(player)

    matched: list[str] = []
    ambiguous: list[str] = []
    unmatched: list[str] = []

    for row in rows:
        candidates: list[dict]
        if row.player_id:
            identity_candidates = by_official_id.get(str(row.player_id), [])
            candidates = [
                player
                for player in identity_candidates
                if _normalize(str(player.get("teamNameJa", ""))) == _normalize(row.club_name_ja)
            ]
            if not candidates:
                unmatched.append(f"{row.player_id}:{row.player_name_ja}:{row.club_name_ja}")
                continue
        else:
            name_candidates = by_name.get(_normalize(row.player_name_ja), [])
            club_candidates = [
                player
                for player in name_candidates
                if _normalize(str(player.get("teamNameJa", ""))) == _normalize(row.club_name_ja)
            ]
            candidates = club_candidates or name_candidates

        if len(candidates) != 1:
            if len(candidates) > 1 and row.player_name_ja not in ambiguous:
                ambiguous.append(row.player_name_ja)
            else:
                unmatched.append(f"{row.player_id or '-'}:{row.player_name_ja}:{row.club_name_ja}")
            continue

        player_id = str(candidates[0]["id"])
        values[player_id] = {
            "value": row.value,
            "listingStatus": row.listing_status,
            "sourceRank": row.rank,
        }
        matched.append(player_id)

    return MetricJoinResult(
        values=values,
        matched=matched,
        ambiguous=ambiguous,
        unmatched=unmatched,
    )
