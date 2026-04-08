import type { Component, Setter } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'
import type { MasterDataDTO, VersionSummaryDTO } from '../../../../../types/api'
import { MAX_SCORE } from '../../../../../utils/scoreRank'
import { LAMP_OPTIONS } from '../../types/filterDefaults'
import type { Difficulty, FilterState } from '../../types/types'
import { parseNumberInput, toggleArray } from '../../utils/filterDialog'
import {
  SCORE_RANK_MAX_VALUES,
  SCORE_RANK_VALUES,
  SCORE_RANKS,
  type ScoreRank,
} from '../../utils/scoreRank'
import ConstRangeSection from './sections/ConstRangeSection'
import DifficultySection from './sections/DifficultySection'
import GenreSection from './sections/GenreSection'
import LampSection from './sections/LampSection'
import ScoreSection from './sections/ScoreSection'
import VersionSection from './sections/VersionSection'

type FilterSelectionPanelProps = {
  open: boolean
  filters: FilterState
  setFilters: Setter<FilterState>
  masterData?: MasterDataDTO
  versions?: VersionSummaryDTO[]
  defaultFilter: FilterState
  resetKey: number
}

/** 数値を入力欄用の文字列に変換するユーティリティ関数 */
const toInputValue = (value?: number | null) =>
  value === undefined || value === null ? '' : String(value)

const FilterSelectionPanel: Component<FilterSelectionPanelProps> = (props) => {
  const [scoreRankMin, setScoreRankMin] = createSignal('0点')
  const [scoreRankMax, setScoreRankMax] = createSignal('SSS+')
  const [constLevelMin, setConstLevelMin] = createSignal('1')
  const [constLevelMax, setConstLevelMax] = createSignal('15+')
  const [constMinInput, setConstMinInput] = createSignal(toInputValue(props.filters.constMin))
  const [constMaxInput, setConstMaxInput] = createSignal(toInputValue(props.filters.constMax))
  const [scoreMinInput, setScoreMinInput] = createSignal(toInputValue(props.filters.scoreMin))
  const [scoreMaxInput, setScoreMaxInput] = createSignal(toInputValue(props.filters.scoreMax))

  const Const2Level = (value: number) => {
    const normalized = Math.max(1, Math.min(value, 15.9))
    if (normalized <= 6.9) {
      return String(Math.floor(normalized))
    }
    const base = Math.floor(normalized)
    const decimal = normalized - base
    if (decimal >= 0.5) {
      return `${base}+`
    }
    return String(base)
  }

  const Level2Const = (level: string, type: 'min' | 'max') => {
    const isPlus = level.endsWith('+')
    const base = Number.parseInt(level.replace('+', ''), 10)
    if (base <= 6) {
      return type === 'min' ? base : Number((base + 0.9).toFixed(1))
    }
    if (isPlus) {
      return type === 'min' ? Number((base + 0.5).toFixed(1)) : Number((base + 0.9).toFixed(1))
    }
    return type === 'min' ? base : Number((base + 0.4).toFixed(1))
  }

  const Score2Rank = (value: number) => {
    const highestRank = SCORE_RANKS[SCORE_RANKS.length - 1]
    const normalized = Math.max(
      SCORE_RANK_VALUES['0点'],
      Math.min(value, SCORE_RANK_VALUES[highestRank])
    )
    for (const rank of SCORE_RANKS) {
      const maxValue = Rank2Score(rank, 'max')
      if (normalized <= maxValue) {
        return rank
      }
    }
    return highestRank
  }

  const Rank2Score = (rank: ScoreRank, type: 'min' | 'max') => {
    if (type === 'max') {
      return SCORE_RANK_MAX_VALUES[rank]
    }
    return SCORE_RANK_VALUES[rank]
  }

  // フィルターダイアログが開かれた時にフィルター状態を同期
  createEffect(() => {
    if (!props.open) return
    setConstMinInput(toInputValue(props.filters.constMin))
    setConstMaxInput(toInputValue(props.filters.constMax))
    setScoreMinInput(toInputValue(props.filters.scoreMin))
    setScoreMaxInput(toInputValue(props.filters.scoreMax))
    setConstLevelMin(Const2Level(props.filters.constMin))
    setConstLevelMax(Const2Level(props.filters.constMax))
    setScoreRankMin(Score2Rank(props.filters.scoreMin))
    setScoreRankMax(Score2Rank(props.filters.scoreMax))
  })

  /** 定数入力モードの変更時に内部値を同期 */
  const handleConstFilterModeChange = (mode: 'level' | 'number') => {
    // レベル->定数の場合
    if (mode === 'number') {
      // 内部の保持値をそのままセット
      setConstMinInput(toInputValue(props.filters.constMin))
      setConstMaxInput(toInputValue(props.filters.constMax))
      // フィルター状態を更新
      props.setFilters((prev) => ({
        ...prev,
        constFilterMode: mode,
      }))
      return
    }
    // 定数->レベルの場合
    // 内部の保持値を変換してセット
    const nextMinLevel = Const2Level(props.filters.constMin)
    const nextMaxLevel = Const2Level(props.filters.constMax)
    const nextMinValue = Level2Const(nextMinLevel, 'min')
    const nextMaxValue = Level2Const(nextMaxLevel, 'max')
    setConstLevelMin(nextMinLevel)
    setConstLevelMax(nextMaxLevel)
    // フィルター状態を更新
    props.setFilters((prev) => ({
      ...prev,
      constFilterMode: mode,
      constMin: nextMinValue,
      constMax: nextMaxValue,
    }))
  }

  /** 定数入力モードの変更時に内部値を同期 */
  const handleScoreFilterModeChange = (mode: 'number' | 'rank') => {
    // ランク->数値の場合
    if (mode === 'number') {
      // 内部の保持値をそのままセット
      setScoreMinInput(toInputValue(props.filters.scoreMin))
      setScoreMaxInput(toInputValue(props.filters.scoreMax))
      // フィルター状態を更新
      props.setFilters((prev) => ({
        ...prev,
        scoreFilterMode: mode,
      }))
      return
    }
    // 数値->ランクの場合
    // 内部の保持値を変換してセット
    const nextMinRank = Score2Rank(props.filters.scoreMin)
    const nextMaxRank = Score2Rank(props.filters.scoreMax)
    const nextMinValue = Rank2Score(nextMinRank, 'min')
    const nextMaxValue = Rank2Score(nextMaxRank, 'max')
    setScoreRankMin(nextMinRank)
    setScoreRankMax(nextMaxRank)
    // setScoreMinInput(toInputValue(nextMinValue));
    // setScoreMaxInput(toInputValue(nextMaxValue));
    // フィルター状態を更新
    props.setFilters((prev) => ({
      ...prev,
      scoreFilterMode: mode,
      scoreMin: nextMinValue,
      scoreMax: nextMaxValue,
    }))
  }

  /** レベル変更時に適切な定数をフィルターにセット */
  const handleConstLevelChange = (type: 'min' | 'max', value: string) => {
    if (type === 'min') {
      setConstLevelMin(value)
      const nextValue = Level2Const(value, 'min')
      setConstMinInput(toInputValue(nextValue))
      props.setFilters((prev) => ({
        ...prev,
        constMin: nextValue,
      }))
      return
    }
    setConstLevelMax(value)
    const nextValue = Level2Const(value, 'max')
    setConstMaxInput(toInputValue(nextValue))
    props.setFilters((prev) => ({
      ...prev,
      constMax: nextValue,
    }))
  }

  /** スコアランク変更時に適切なスコアをフィルターにセット */
  const handleScoreRankChange = (type: 'min' | 'max', value: string) => {
    const nextValue = Rank2Score(value as ScoreRank, type)
    if (type === 'min') {
      setScoreRankMin(value)
      setScoreMinInput(toInputValue(nextValue))
      props.setFilters((prev) => ({
        ...prev,
        scoreMin: nextValue,
      }))
      return
    }
    setScoreRankMax(value)
    setScoreMaxInput(toInputValue(nextValue))
    props.setFilters((prev) => ({
      ...prev,
      scoreMax: nextValue,
    }))
  }

  const difficulties = () => props.masterData?.difficulties?.map((d) => d.name as Difficulty) ?? []
  const genres = () => props.masterData?.genres?.map((g) => g.name) ?? []
  const versions = () => props.versions?.map((version) => version.name) ?? []

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
          setConstMinInput(value)
          props.setFilters((prev) => ({
            ...prev,
            constMin: parseNumberInput(value) ?? 0.0,
          }))
        }}
        onMaxCommit={(value) => {
          setConstMaxInput(value)
          props.setFilters((prev) => ({
            ...prev,
            constMax: parseNumberInput(value) ?? 15.9,
          }))
        }}
        onConstFilterModeChange={handleConstFilterModeChange}
        onConstLevelChange={handleConstLevelChange}
      />
      <ScoreSection
        scoreFilterMode={props.filters.scoreFilterMode}
        scoreMinInput={scoreMinInput()}
        scoreMaxInput={scoreMaxInput()}
        scoreRankMin={scoreRankMin()}
        scoreRankMax={scoreRankMax()}
        excludeNoPlay={props.filters.excludeNoPlay}
        onScoreFilterModeChange={handleScoreFilterModeChange}
        onScoreMinInput={setScoreMinInput}
        onScoreMaxInput={setScoreMaxInput}
        onScoreMinCommit={(value) => {
          setScoreMinInput(value)
          props.setFilters((prev) => ({
            ...prev,
            scoreMin: parseNumberInput(value) ?? 0,
          }))
        }}
        onScoreMaxCommit={(value) => {
          setScoreMaxInput(value)
          props.setFilters((prev) => ({
            ...prev,
            scoreMax: parseNumberInput(value) ?? MAX_SCORE,
          }))
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
              (l): l is 'FULL COMBO' | 'ALL JUSTICE' | null =>
                l === 'FULL COMBO' || l === 'ALL JUSTICE' || l === null
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
        versions={versions()}
        selected={props.filters.versions}
        onSelectAll={() =>
          props.setFilters((prev) => ({
            ...prev,
            versions: versions(),
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
  )
}

export default FilterSelectionPanel
