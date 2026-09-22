from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Club, ClubSeason, Competition, DataSource, MethodologyVersion, Player, PlayerSeason


TEAM_ROWS = [
    ("harbor-kobe", "Harbor Kobe", "HKB", 72, 41, 19, 39.2, 20.8, 57.8, 14.2, 84, 96),
    ("setouchi-violet", "Setouchi Violet", "STV", 68, 38, 21, 36.1, 23.4, 55.6, 15.8, 80, 94),
    ("machida-orbit", "Machida Orbit", "MCO", 63, 34, 22, 33.4, 24.1, 52.1, 18.4, 82, 92),
    ("osaka-forge", "Osaka Forge", "OSF", 59, 32, 25, 31.2, 25.9, 54.2, 16.1, 74, 90),
    ("cerezo-north", "Cerezo North", "CRN", 55, 30, 26, 29.4, 27.2, 51.8, 17.2, 67, 87),
    ("ibaraki-antlers", "Ibaraki Antlers", "IBA", 52, 29, 28, 28.2, 28.5, 48.8, 20.1, 63, 85),
    ("tokyo-verde", "Tokyo Verde", "TVE", 49, 25, 24, 27.3, 23.8, 43.9, 22.3, 78, 91),
    ("urawa-scarlet", "Urawa Scarlet", "URS", 48, 27, 28, 28.9, 26.1, 50.4, 19.3, 59, 83),
    ("yokohama-tide", "Yokohama Tide", "YKT", 45, 25, 29, 26.8, 29.2, 53.1, 15.1, 57, 82),
    ("kashiwa-sun", "Kashiwa Sun", "KSW", 44, 24, 30, 25.4, 31.4, 45.8, 21.1, 55, 79),
    ("shonan-coast", "Shonan Coast", "SHC", 39, 21, 34, 22.3, 35.7, 44.1, 23.2, 46, 77),
    ("niigata-alpine", "Niigata Alpine", "NGA", 36, 20, 36, None, 36.8, 49.1, 18.1, 43, 68),
]

ROLES = [
    ("GK", "Sweeper keeper"), ("GK", "Sweeper keeper"),
    ("CB", "Ball-playing CB"), ("CB", "Ball-playing CB"), ("CB", "Ball-playing CB"), ("CB", "Ball-playing CB"),
    ("FB/WB", "Overlapping full-back"), ("FB/WB", "Overlapping full-back"), ("FB/WB", "Overlapping full-back"), ("FB/WB", "Overlapping full-back"),
    ("DM", "Ball winner"), ("DM", "Ball winner"), ("DM", "Ball winner"),
    ("CM", "Progressor"), ("CM", "Progressor"), ("CM", "Progressor"),
    ("AM", "Creator"), ("AM", "Creator"),
    ("W", "Pressing winger"), ("W", "Pressing winger"), ("W", "Pressing winger"), ("W", "Pressing winger"),
    ("ST", "Link forward"), ("ST", "Link forward"),
]
GIVEN_NAMES = ["Ren", "Sora", "Haru", "Kaito", "Riku", "Yuto", "Minato", "Itsuki", "Akira", "Daichi", "Reo", "Takumi", "Hinata", "Rin", "Koki", "Nao", "Kei", "Arata", "Jin", "Ryota", "Toma", "Shun", "Aoi", "Sena"]
FAMILY_NAMES = ["Amano", "Mizuno", "Kanda", "Sakai", "Endo", "Narita", "Mori", "Ishida", "Fujita", "Ono", "Kubo", "Hase", "Arai", "Sato", "Ueda", "Kono", "Nakai", "Hara", "Sudo", "Tsuji", "Maki", "Ando", "Kishi", "Noda"]


def seed_sample_data(db: Session) -> None:
    if db.scalar(select(Competition.id).limit(1)) is not None:
        return
    competition = Competition(code="J1", name="J1 sample competition", country_code="JP")
    db.add(competition)
    db.flush()
    clubs: list[Club] = []
    for row in TEAM_ROWS:
        slug, name, short_name, points, goals_for, goals_against, xg, xga, possession, actions, consistency, coverage = row
        club = Club(slug=slug, name=name, short_name=short_name)
        db.add(club)
        db.flush()
        clubs.append(club)
        db.add(ClubSeason(competition_id=competition.id, club_id=club.id, season=2025, played=24, points=points, goals_for=goals_for, goals_against=goals_against, expected_goals=xg, expected_goals_against=xga, possession_pct=possession, defensive_actions_per90=actions, consistency=consistency, coverage=coverage, snapshot_date=date(2025, 7, 20)))
    for index, (given_name, family_name) in enumerate(zip(GIVEN_NAMES, FAMILY_NAMES, strict=True)):
        position, role = ROLES[index]
        player = Player(source_player_id=f"sample-player-{index + 1}", name=f"{given_name} {family_name}", club_id=clubs[index % len(clubs)].id, birth_year=2025 - (19 + index % 10))
        db.add(player)
        db.flush()
        db.add(PlayerSeason(player_id=player.id, competition_id=competition.id, season=2025, position=position, role=role, minutes=520 if index == 22 else 940 + ((index * 137) % 1250), performance=None if index == 23 else 62 + ((index * 11) % 33), potential=58 + ((index * 13) % 39), opportunity=60 + ((index * 17) % 35), availability=70 + ((index * 7) % 29), coverage=57 if index == 22 else 74 + ((index * 5) % 25)))
    db.add(MethodologyVersion(version="sample-0.1.0", description="Transparent sample scoring for local product development."))
    db.add_all([
        DataSource(name="Synthetic fixture", status="enabled", coverage=100, notes="Deterministic local development data."),
        DataSource(name="Licensed J1 data", status="not_connected", coverage=0, notes="Requires a licensed provider and provenance review."),
        DataSource(name="Event coordinates", status="disabled", coverage=0, notes="Spatial claims stay disabled until coordinates are available."),
        DataSource(name="Market values", status="unavailable", coverage=0, notes="Opportunity score is used instead of financial value."),
    ])
    db.commit()
