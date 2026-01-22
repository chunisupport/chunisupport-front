import type { Component, Setter } from "solid-js";
import { createEffect, createSignal } from "solid-js";
import type { MasterDataDTO } from "../../../../../types/api";
import { CHUNITHM_VERSIONS } from "../../../../../utils/versionConverter";
import { LAMP_OPTIONS } from "../../types/filterDefaults";
import type { Difficulty, FilterState } from "../../types/types";
import { parseNumberInput, toggleArray } from "../../utils/filterDialog";
import { SCORE_RANK_VALUES } from "../../utils/scoreRank";
import ConstRangeSection from "./sections/ConstRangeSection";
import DifficultySection from "./sections/DifficultySection";
import GenreSection from "./sections/GenreSection";
import LampSection from "./sections/LampSection";
import ScoreSection from "./sections/ScoreSection";
import VersionSection from "./sections/VersionSection";

type FilterSelectionPanelProps = {
	open: boolean;
	filters: FilterState;
	setFilters: Setter<FilterState>;
	masterData?: MasterDataDTO;
	defaultFilter: FilterState;
	resetKey: number;
};

/** 数値を入力欄用の文字列に変換するユーティリティ関数 */
const toInputValue = (value?: number | null) =>
	value === undefined || value === null ? "" : String(value);

const FilterSelectionPanel: Component<FilterSelectionPanelProps> = (props) => {
	// 入力値の状態管理
	const [scoreRankMin, setScoreRankMin] = createSignal("0点");
	const [scoreRankMax, setScoreRankMax] = createSignal("MAX");
	const [constLevelMin, setConstLevelMin] = createSignal("1");
	const [constLevelMax, setConstLevelMax] = createSignal("15+");
	const [constMinInput, setConstMinInput] = createSignal(
		toInputValue(props.filters.constMin),
	);
	const [constMaxInput, setConstMaxInput] = createSignal(
		toInputValue(props.filters.constMax),
	);
	const [scoreMinInput, setScoreMinInput] = createSignal(
		toInputValue(props.filters.scoreMin),
	);
	const [scoreMaxInput, setScoreMaxInput] = createSignal(
		toInputValue(props.filters.scoreMax),
	);

	const toConstLevel = (value: number) => {
		const normalized = Math.max(1, Math.min(value, 15.9));
		if (normalized <= 6.9) {
			return String(Math.floor(normalized));
		}
		const base = Math.floor(normalized);
		const decimal = normalized - base;
		if (decimal >= 0.5) {
			return `${base}+`;
		}
		return String(base);
	};

	const toConstValue = (level: string, type: "min" | "max") => {
		const isPlus = level.endsWith("+");
		const base = Number.parseInt(level.replace("+", ""), 10);
		if (base <= 6) {
			return type === "min" ? base : Number((base + 0.9).toFixed(1));
		}
		if (isPlus) {
			return type === "min"
				? Number((base + 0.5).toFixed(1))
				: Number((base + 0.9).toFixed(1));
		}
		return type === "min" ? base : Number((base + 0.4).toFixed(1));
	};

	// フィルターダイアログが開かれた時にフィルター状態を同期
	createEffect(() => {
		if (!props.open) return;
		setConstMinInput(toInputValue(props.filters.constMin));
		setConstMaxInput(toInputValue(props.filters.constMax));
		setScoreMinInput(toInputValue(props.filters.scoreMin));
		setScoreMaxInput(toInputValue(props.filters.scoreMax));
		setConstLevelMin(toConstLevel(props.filters.constMin));
		setConstLevelMax(toConstLevel(props.filters.constMax));
	});

	/** スコアランク変更時の処理(ランクからスコアへの変換と適応) */
	const handleScoreRankChange = (type: "min" | "max", value: string) => {
		if (type === "min") {
			setScoreRankMin(value);
			props.setFilters((prev) => ({
				...prev,
				scoreMin: SCORE_RANK_VALUES[value as keyof typeof SCORE_RANK_VALUES],
			}));
		} else {
			setScoreRankMax(value);
			props.setFilters((prev) => ({
				...prev,
				scoreMax: SCORE_RANK_VALUES[value as keyof typeof SCORE_RANK_VALUES],
			}));
		}
	};

	const difficulties = () =>
		props.masterData?.difficulties?.map((d) => d.name as Difficulty) ?? [];
	const genres = () => props.masterData?.genres?.map((g) => g.name) ?? [];

	return (
		<div class="space-y-4 overflow-y-auto flex-1 min-h-0">
			<DifficultySection
				difficulties={difficulties()}
				selected={props.filters.difficulties}
				onToggle={(diff) =>
					props.setFilters((prev) => ({
						...prev,
						difficulties: toggleArray(prev.difficulties, diff),
					}))
				}
			/>
			<ConstRangeSection
				constFilterMode={props.filters.constFilterMode}
				minValue={constMinInput()}
				maxValue={constMaxInput()}
				constLevelMin={constLevelMin()}
				constLevelMax={constLevelMax()}
				onMinInput={setConstMinInput}
				onMaxInput={setConstMaxInput}
				onMinCommit={(value) => {
					setConstMinInput(value);
					props.setFilters((prev) => ({
						...prev,
						constMin: parseNumberInput(value) ?? 0.0,
					}));
				}}
				onMaxCommit={(value) => {
					setConstMaxInput(value);
					props.setFilters((prev) => ({
						...prev,
						constMax: parseNumberInput(value) ?? 15.9,
					}));
				}}
				onConstFilterModeChange={(mode) => {
					if (mode === "number") {
						props.setFilters((prev) => ({
							...prev,
							constFilterMode: mode,
						}));
						setConstMinInput(toInputValue(props.filters.constMin));
						setConstMaxInput(toInputValue(props.filters.constMax));
						return;
					}
					const nextMinLevel = toConstLevel(props.filters.constMin);
					const nextMaxLevel = toConstLevel(props.filters.constMax);
					const nextMinValue = toConstValue(nextMinLevel, "min");
					const nextMaxValue = toConstValue(nextMaxLevel, "max");
					setConstLevelMin(nextMinLevel);
					setConstLevelMax(nextMaxLevel);
					setConstMinInput(toInputValue(nextMinValue));
					setConstMaxInput(toInputValue(nextMaxValue));
					props.setFilters((prev) => ({
						...prev,
						constFilterMode: mode,
						constMin: nextMinValue,
						constMax: nextMaxValue,
					}));
				}}
				onConstLevelChange={(type, value) => {
					if (type === "min") {
						setConstLevelMin(value);
						const nextValue = toConstValue(value, "min");
						setConstMinInput(toInputValue(nextValue));
						props.setFilters((prev) => ({
							...prev,
							constMin: nextValue,
						}));
						return;
					}
					setConstLevelMax(value);
					const nextValue = toConstValue(value, "max");
					setConstMaxInput(toInputValue(nextValue));
					props.setFilters((prev) => ({
						...prev,
						constMax: nextValue,
					}));
				}}
			/>
			<ScoreSection
				scoreFilterMode={props.filters.scoreFilterMode}
				scoreMinInput={scoreMinInput()}
				scoreMaxInput={scoreMaxInput()}
				scoreRankMin={scoreRankMin()}
				scoreRankMax={scoreRankMax()}
				excludeNoPlay={props.filters.excludeNoPlay}
				onScoreFilterModeChange={(mode) => {
					props.setFilters((prev) => ({
						...prev,
						scoreFilterMode: mode,
					}));
				}}
				onScoreMinInput={setScoreMinInput}
				onScoreMaxInput={setScoreMaxInput}
				onScoreMinCommit={(value) => {
					setScoreMinInput(value);
					props.setFilters((prev) => ({
						...prev,
						scoreMin: parseNumberInput(value) ?? 0,
					}));
				}}
				onScoreMaxCommit={(value) => {
					setScoreMaxInput(value);
					props.setFilters((prev) => ({
						...prev,
						scoreMax: parseNumberInput(value) ?? 1010000,
					}));
				}}
				onScoreRankChange={handleScoreRankChange}
				onExcludeNoPlayChange={(checked) =>
					props.setFilters((prev) => ({
						...prev,
						excludeNoPlay: checked,
					}))
				}
			/>
			<LampSection
				lamps={LAMP_OPTIONS}
				selected={props.filters.lamps}
				onToggle={(lamp) =>
					props.setFilters((prev) => ({
						...prev,
						lamps: toggleArray(prev.lamps, lamp).filter(
							(l): l is "FULL COMBO" | "ALL JUSTICE" | null =>
								l === "FULL COMBO" || l === "ALL JUSTICE" || l === null,
						),
					}))
				}
				onExcludeNoPlayChange={(checked) =>
					props.setFilters((prev) => ({
						...prev,
						excludeNoPlay: checked,
					}))
				}
			/>
			<GenreSection
				genres={genres()}
				selected={props.filters.genres}
				onSelectAll={() =>
					props.setFilters((prev) => ({
						...prev,
						genres: genres(),
					}))
				}
				onClear={() =>
					props.setFilters((prev) => ({
						...prev,
						genres: [],
					}))
				}
				onToggle={(genre) =>
					props.setFilters((prev) => ({
						...prev,
						genres: toggleArray(prev.genres, genre),
					}))
				}
			/>
			<VersionSection
				versions={[...CHUNITHM_VERSIONS]}
				selected={props.filters.versions}
				onSelectAll={() =>
					props.setFilters((prev) => ({
						...prev,
						versions: [...CHUNITHM_VERSIONS],
					}))
				}
				onClear={() =>
					props.setFilters((prev) => ({
						...prev,
						versions: [],
					}))
				}
				onToggle={(version) =>
					props.setFilters((prev) => ({
						...prev,
						versions: toggleArray(prev.versions, version),
					}))
				}
			/>
		</div>
	);
};

export default FilterSelectionPanel;
