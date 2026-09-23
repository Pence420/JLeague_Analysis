import snapshot from "@/data/jleague/2025.json";
import { leagueDatasetSchema } from "./fixture-schema";

// Kept under the historical export name so the API fallback remains stable.
// The value is no longer synthetic: it is the checked-in official 2025 snapshot.
export const sampleLeagueDataset = leagueDatasetSchema.parse(snapshot);
