import type { Component, Setter } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'
import { SCORE_MIN } from '../../../../constants/chart.ts'
import { MAX_SCORE } from '../../../../utils/scoreRank.ts'
import {
  RECORD_CHAIN_LAMP_OPTIONS,
  RECORD_COMBO_LAMP_OPTIONS,
  RECORD_HARD_LAMP_OPTIONS,
} from '../../constants/recordFilterOptions.ts'
import LampSection from '../../UserRecord/components/filterDialog/sections/LampSection.tsx'
import NumericRangeSection from '../../UserRecord/components/filterDialog/sections/NumericRangeSection.tsx'
import ScoreSection from '../../UserRecord/components/filterDialog/sections/ScoreSection.tsx'
import { JUSTICE_COUNT_RANGE_FILTER } from '../../UserRecord/constants/rangeFilters.ts'
import type { ChainLamp, ComboLamp, HardLamp } from '../../UserRecord/types/types.ts'
import {
  parseNumberInput,
  toggleArray,
  updateOptionalNumberRange,
} from '../../UserRecord/utils/filterDialog.ts'
import {
  SCORE_RANK_MAX_VALUES,
  SCORE_RANK_VALUES,
  SCORE_RANKS,
  type ScoreRank,
} from '../../UserRecord/utils/scoreRank.ts'
import { formatFullChainLampLabel } from '../../utils/fullChainDisplay.ts'
import type { WorldsendFilterState } from '../types/filterTypes.ts'
import { formatWorldsendAttribute } from '../utils/filterDialog.ts'
import WorldsendLevelRangeSection from './WorldsendLevelRangeSection.tsx'
import WorldsendMultiSelectSection from './WorldsendMultiSelectSection.tsx'

type WorldsendFilterSelectionPanelProps = {
  open: boolean
  filters: WorldsendFilterState
  setFilters: Setter<WorldsendFilterState>
  defaultFilter: WorldsendFilterState
}

/** 数値を入力欄用の文字列に変換する。 */
const toInputValue = (value?: number | null) =>
  value === undefined || value === null ? '' : String(value)

/**
 * WORLD'S END レコードのフィルター条件を選択するパネルを表示する。
 *
 * @param props - フィルター状態、更新ハンドラー、初期値を含むパネル設定。
 * @returns WORLD'S END フィルター条件編集パネルの JSX 要素。
 */
const WorldsendFilterSelectionPanel: Component<WorldsendFilterSelectionPanelProps> = (props) => {
  const [scoreRankMin, setScoreRankMin] = createSignal('0点')
  const [scoreRankMax, setScoreRankMax] = createSignal('SSS+')
  const [scoreMinInput, setScoreMinInput] = createSignal(toInputValue(props.filters.score.min))
  const [scoreMaxInput, setScoreMaxInput] = createSignal(toInputValue(props.filters.score.max))
  const [justiceCountMinInput, setJusticeCountMinInput] = createSignal(
    toInputValue(props.filters.justiceCount.min)
  )
  const [justiceCountMaxInput, setJusticeCountMaxInput] = createSignal(
    toInputValue(props.filters.justiceCount.max)
  )

  /**
   * スコアをランク入力用のラベルへ変換する。
   *
   * @param value - 変換対象のスコア。
   * @returns スコアが属するランクラベル。
   */
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

  /**
   * スコアランクを範囲端のスコアへ変換する。
   *
   * @param rank - 変換対象のランクラベル。
   * @param type - 下限または上限。
   * @returns ランクに対応するスコア。
   */
  const Rank2Score = (rank: ScoreRank, type: 'min' | 'max') => {
    if (type === 'max') {
      return SCORE_RANK_MAX_VALUES[rank]
    }
    return SCORE_RANK_VALUES[rank]
  }

  createEffect(() => {
    if (!props.open) return
    setScoreMinInput(toInputValue(props.filters.score.min))
    setScoreMaxInput(toInputValue(props.filters.score.max))
    setJusticeCountMinInput(toInputValue(props.filters.justiceCount.min))
    setJusticeCountMaxInput(toInputValue(props.filters.justiceCount.max))
    setScoreRankMin(Score2Rank(props.filters.score.min))
    setScoreRankMax(Score2Rank(props.filters.score.max))
  })

  /**
   * スコア入力モードの変更をフィルターへ反映する。
   *
   * @param mode - 数値入力またはランク入力。
   * @returns なし。
   */
  const handleScoreFilterModeChange = (mode: 'number' | 'rank') => {
    if (mode === 'number') {
      setScoreMinInput(toInputValue(props.filters.score.min))
      setScoreMaxInput(toInputValue(props.filters.score.max))
      props.setFilters((prev) => ({ ...prev, scoreFilterMode: mode }))
      return
    }

    const nextMinRank = Score2Rank(props.filters.score.min)
    const nextMaxRank = Score2Rank(props.filters.score.max)
    const nextMinValue = Rank2Score(nextMinRank, 'min')
    const nextMaxValue = Rank2Score(nextMaxRank, 'max')
    setScoreRankMin(nextMinRank)
    setScoreRankMax(nextMaxRank)
    props.setFilters((prev) => ({
      ...prev,
      scoreFilterMode: mode,
      score: {
        min: nextMinValue,
        max: nextMaxValue,
      },
    }))
  }

  /**
   * スコアランクの変更をフィルターへ反映する。
   *
   * @param type - 下限または上限。
   * @param value - 選択されたランクラベル。
   * @returns なし。
   */
  const handleScoreRankChange = (type: 'min' | 'max', value: string) => {
    const nextValue = Rank2Score(value as ScoreRank, type)
    if (type === 'min') {
      setScoreRankMin(value)
      setScoreMinInput(toInputValue(nextValue))
      props.setFilters((prev) => ({
        ...prev,
        score: {
          ...prev.score,
          min: nextValue,
        },
      }))
      return
    }

    setScoreRankMax(value)
    setScoreMaxInput(toInputValue(nextValue))
    props.setFilters((prev) => ({
      ...prev,
      score: {
        ...prev.score,
        max: nextValue,
      },
    }))
  }

  /**
   * JUSTICE数の入力値をフィルターへ反映する。
   *
   * @param type - 下限または上限。
   * @param value - 入力欄から受け取った文字列。
   * @returns なし。
   */
  const commitJusticeCountRange = (type: 'min' | 'max', value: string) => {
    const nextRange = updateOptionalNumberRange(
      {
        min: props.filters.justiceCount.min,
        max: props.filters.justiceCount.max,
      },
      type,
      value,
      { min: JUSTICE_COUNT_RANGE_FILTER.min, max: JUSTICE_COUNT_RANGE_FILTER.max, integer: true }
    )
    const nextValue = toInputValue(nextRange[type])
    if (type === 'min') {
      setJusticeCountMinInput(nextValue)
      props.setFilters((prev) => ({
        ...prev,
        justiceCount: {
          ...prev.justiceCount,
          min: nextRange.min,
        },
      }))
      return
    }

    setJusticeCountMaxInput(nextValue)
    props.setFilters((prev) => ({
      ...prev,
      justiceCount: {
        ...prev.justiceCount,
        max: nextRange.max,
      },
    }))
  }

  return (
    <div class="scrollbar-none min-h-0 flex-1 space-y-4 overflow-y-auto">
      <WorldsendMultiSelectSection
        title="属性"
        options={props.defaultFilter.attributes}
        selected={props.filters.attributes}
        formatLabel={formatWorldsendAttribute}
        onSelectAll={() =>
          props.setFilters((prev) => ({ ...prev, attributes: props.defaultFilter.attributes }))
        }
        onClear={() => props.setFilters((prev) => ({ ...prev, attributes: [] }))}
        onToggle={(attribute) =>
          props.setFilters((prev) => ({
            ...prev,
            attributes: toggleArray(prev.attributes, attribute),
          }))
        }
      />
      <WorldsendLevelRangeSection
        minValue={props.filters.levelStarRange.min}
        maxValue={props.filters.levelStarRange.max}
        onChange={(type, value) =>
          props.setFilters((prev) => ({
            ...prev,
            levelStarRange:
              type === 'min'
                ? {
                    min: value,
                    max: Math.max(value, prev.levelStarRange.max),
                  }
                : {
                    min: Math.min(prev.levelStarRange.min, value),
                    max: value,
                  },
          }))
        }
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
            score: {
              ...prev.score,
              min: parseNumberInput(value) ?? SCORE_MIN,
            },
          }))
        }}
        onScoreMaxCommit={(value) => {
          setScoreMaxInput(value)
          props.setFilters((prev) => ({
            ...prev,
            score: {
              ...prev.score,
              max: parseNumberInput(value) ?? MAX_SCORE,
            },
          }))
        }}
        onScoreRankChange={handleScoreRankChange}
        onExcludeNoPlayChange={(checked) =>
          props.setFilters((prev) => ({ ...prev, excludeNoPlay: checked }))
        }
      />
      <NumericRangeSection
        config={JUSTICE_COUNT_RANGE_FILTER}
        minValue={justiceCountMinInput()}
        maxValue={justiceCountMaxInput()}
        onMinInput={setJusticeCountMinInput}
        onMaxInput={setJusticeCountMaxInput}
        onMinCommit={(value) => commitJusticeCountRange('min', value)}
        onMaxCommit={(value) => commitJusticeCountRange('max', value)}
      />
      <LampSection
        title="コンボランプ"
        idPrefix="worldsend-combo-lamp"
        lamps={RECORD_COMBO_LAMP_OPTIONS}
        selected={props.filters.combo_lamp}
        onToggle={(lamp) =>
          props.setFilters((prev) => ({
            ...prev,
            combo_lamp: toggleArray(prev.combo_lamp, lamp).filter(
              (value): value is ComboLamp =>
                value === 'FULL COMBO' || value === 'ALL JUSTICE' || value === null
            ),
          }))
        }
        onExcludeNoPlayChange={(checked) =>
          props.setFilters((prev) => ({ ...prev, excludeNoPlay: checked }))
        }
      />
      <LampSection
        title="FULL CHAIN"
        idPrefix="worldsend-chain-lamp"
        lamps={RECORD_CHAIN_LAMP_OPTIONS}
        selected={props.filters.chain_lamp}
        formatLabel={formatFullChainLampLabel}
        onToggle={(lamp) =>
          props.setFilters((prev) => ({
            ...prev,
            chain_lamp: toggleArray(prev.chain_lamp, lamp).filter(
              (value): value is ChainLamp =>
                value === 'FULL CHAIN GOLD' || value === 'FULL CHAIN PLATINUM' || value === null
            ),
          }))
        }
        onExcludeNoPlayChange={(checked) =>
          props.setFilters((prev) => ({ ...prev, excludeNoPlay: checked }))
        }
      />
      <LampSection
        title="ハードランプ"
        idPrefix="worldsend-hard-lamp"
        lamps={RECORD_HARD_LAMP_OPTIONS}
        selected={props.filters.hard_lamp}
        onToggle={(lamp) =>
          props.setFilters((prev) => ({
            ...prev,
            hard_lamp: toggleArray(prev.hard_lamp, lamp).filter(
              (value): value is HardLamp =>
                value === 'FAILED' ||
                value === 'CLEAR' ||
                value === 'HARD' ||
                value === 'BRAVE' ||
                value === 'ABSOLUTE' ||
                value === 'CATASTROPHY' ||
                value === null
            ),
          }))
        }
        onExcludeNoPlayChange={(checked) =>
          props.setFilters((prev) => ({ ...prev, excludeNoPlay: checked }))
        }
      />
      <WorldsendMultiSelectSection
        title="ジャンル"
        options={props.defaultFilter.genres}
        selected={props.filters.genres}
        formatLabel={(genre) => genre}
        onSelectAll={() =>
          props.setFilters((prev) => ({ ...prev, genres: props.defaultFilter.genres }))
        }
        onClear={() => props.setFilters((prev) => ({ ...prev, genres: [] }))}
        onToggle={(genre) =>
          props.setFilters((prev) => ({ ...prev, genres: toggleArray(prev.genres, genre) }))
        }
      />
      <WorldsendMultiSelectSection
        title="バージョン"
        options={props.defaultFilter.versions}
        selected={props.filters.versions}
        formatLabel={(version) => version}
        onSelectAll={() =>
          props.setFilters((prev) => ({ ...prev, versions: props.defaultFilter.versions }))
        }
        onClear={() => props.setFilters((prev) => ({ ...prev, versions: [] }))}
        onToggle={(version) =>
          props.setFilters((prev) => ({ ...prev, versions: toggleArray(prev.versions, version) }))
        }
      />
    </div>
  )
}

export default WorldsendFilterSelectionPanel
