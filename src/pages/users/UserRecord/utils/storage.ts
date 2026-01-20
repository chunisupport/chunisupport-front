import type { ComboLamp, FilterState } from "../types/types";
import type { ScoreRank } from "./scoreRank";

export interface SavedFilter {
	id: string;
	name: string;
	filter: FilterState;
	savedAt: number;
}

export interface TrackingCondition {
	filterId: string;
	filterName: string;
	scoreRankMin?: ScoreRank;
	lamps?: (ComboLamp | null)[];
	savedAt: number;
}

const SAVED_FILTERS_KEY = "chunisup_saved_filters";
const TRACKING_CONDITION_KEY = "chunisup_tracking_condition";

export function loadSavedFilters(): SavedFilter[] {
	try {
		const raw = localStorage.getItem(SAVED_FILTERS_KEY);
		if (!raw) return [];
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

export function saveNewFilter(name: string, filter: FilterState): string {
	const filters = loadSavedFilters();
	const id = Date.now().toString();
	filters.push({ id, name, filter, savedAt: Date.now() });
	localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
	return id;
}

export function deleteFilter(id: string) {
	const filters = loadSavedFilters().filter((f) => f.id !== id);
	localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
}

export function loadTrackingCondition(): TrackingCondition | null {
	try {
		const raw = localStorage.getItem(TRACKING_CONDITION_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function saveTrackingCondition(condition: TrackingCondition) {
	localStorage.setItem(TRACKING_CONDITION_KEY, JSON.stringify(condition));
}

export function clearTrackingCondition() {
	localStorage.removeItem(TRACKING_CONDITION_KEY);
}
