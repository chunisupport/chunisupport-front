import type { ComboLamp, FilterState } from "../types/types";

/** 保存されたフィルター情報 */
export interface SavedFilter {
	id: string;
	name: string;
	filter: FilterState;
	savedAt: number;
}

/** 追跡中のフィルター情報 */
export interface TrackingCondition {
	filterId: string;
	filterName: string;
	scoreMin?: number;
	lamps?: (ComboLamp | null)[];
	savedAt: number;
}

const SAVED_FILTERS_KEY = "chunisup_saved_filters";
const TRACKING_CONDITION_KEY = "chunisup_tracking_condition";

/** 保存されたフィルター一覧をlocalStrageから取得 */
export function loadSavedFilters(): SavedFilter[] {
	try {
		const raw = localStorage.getItem(SAVED_FILTERS_KEY);
		if (!raw) return [];
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

/** 新しいフィルターを保存 */
export function saveNewFilter(name: string, filter: FilterState): string {
	const filters = loadSavedFilters();
	const id = Date.now().toString();
	filters.push({ id, name, filter, savedAt: Date.now() });
	localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
	return id;
}

/** フィルターを削除 */
export function deleteFilter(id: string) {
	// 指定ID以外のフィルターを保存し直すことで削除を実現
	const filters = loadSavedFilters().filter((f) => f.id !== id);
	localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
}

/** 追跡中のフィルター情報をlocalStorageから取得 */
export function loadTrackingCondition(): TrackingCondition | null {
	try {
		const raw = localStorage.getItem(TRACKING_CONDITION_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

/** 追跡中のフィルター情報を保存 */
export function saveTrackingCondition(condition: TrackingCondition) {
	localStorage.setItem(TRACKING_CONDITION_KEY, JSON.stringify(condition));
}

/** 追跡中のフィルター情報を削除 */
export function clearTrackingCondition() {
	localStorage.removeItem(TRACKING_CONDITION_KEY);
}
