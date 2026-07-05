import { TextField } from '@kobalte/core/text-field'
import type { Component, Setter } from 'solid-js'
import { createEffect, createSignal, Show } from 'solid-js'
import { CHART_CONST_MAX, CHART_CONST_MIN, SCORE_MIN } from '../../../../../constants/chart'
import {
  RECORD_CHAIN_LAMP_OPTIONS,
  RECORD_COMBO_LAMP_OPTIONS,
  RECORD_HARD_LAMP_OPTIONS,
} from '../../../../../constants/recordFilterOptions'
import type { MasterDataDTO, VersionSummaryDTO } from '../../../../../types/api'
import type { Difficulty, FilterState } from '../../../../../types/recordFilter'
import { sortMasterItemsBySortOrder } from '../../../../../utils/masterData'
import { truncateDecimal } from '../../../../../utils/numberFormat'
import { MAX_SCORE } from '../../../../../utils/scoreRank'
import { getShortVersionName } from '../../../../../utils/versionConverter'
import LampSection from '../../../components/filter/LampSection'
import MultiSelectFilterSection from '../../../components/filter/MultiSelectFilterSection'
import NumericRangeSection from '../../../components/filter/NumericRangeSection'
import ScoreSection from '../../../components/filter/ScoreSection'
import { RECORD_FILTER_NAME_MAX_LENGTH } from '../../../components/savedRecordFilters'
import {
  JUSTICE_COUNT_RANGE_FILTER,
  OVER_POWER_RANGE_FILTER,
} from '../../../constants/rangeFilters'
import {
  parseNumberInput,
  toggleArray,
  toInputValue,
  updateOptionalNumberRange,
} from '../../../utils/filterValue'
import { formatFullChainLampLabel } from '../../../utils/fullChainDisplay'
import { filterRankToScore, type ScoreRank, scoreToFilterRank } from '../../../utils/scoreRank'
import ConstRangeSection from './sections/ConstRangeSection'
import DifficultySection from './sections/DifficultySection'

type FilterSelectionPanelProps = {
  open: boolean
  filters: FilterState
  setFilters: Setter<FilterState>
  masterData?: MasterDataDTO
  versions?: VersionSummaryDTO[]
  defaultFilter: FilterState
  resetKey: number
  /** 編集中のフィルター名。null の場合は編集中でない。 */
  editingFilterName?: string | null
  /** フィルター名が変更されたときのコールバック。 */
  onEditingFilterNameChange?: (name: string) => void
}

/** フィルター名入力を API の最大文字数に丸める。 */
const limitNameInput = (value: string): string =>
  Array.from(value).slice(0, RECORD_FILTER_NAME_MAX_LENGTH).join('')

/** 通常のフィルターダイアログ上で Select の選択肢を前面に表示する z-index クラス。 */
const FILTER_SELECT_CONTENT_Z_INDEX_CLASS = 'z-60'

/**
 * プレイヤーレコードのフィルター条件を選択するパネルを描画する。
 *
 * @param props - フィルター状態、マスターデータ、リセット状態を含むパネル設定。
 * @returns フィルター条件を編集するための選択パネル。
 */
const FilterSelectionPanel: Component<FilterSelectionPanelProps> = (props) => {
  const [scoreRankMin, setScoreRankMin] = createSignal('0点')
  const [scoreRankMax, setScoreRankMax] = createSignal('SSS+')
  const [constLevelMin, setConstLevelMin] = createSignal('1')
  const [constLevelMax, setConstLevelMax] = createSignal('16')
  const [constMinInput, setConstMinInput] = createSignal(toInputValue(props.filters.const.min))
  const [constMaxInput, setConstMaxInput] = createSignal(toInputValue(props.filters.const.max))
  const [scoreMinInput, setScoreMinInput] = createSignal(toInputValue(props.filters.score.min))
  const [scoreMaxInput, setScoreMaxInput] = createSignal(toInputValue(props.filters.score.max))
  const [justiceCountMinInput, setJusticeCountMinInput] = createSignal(
    toInputValue(props.filters.justiceCount.min)
  )
  const [justiceCountMaxInput, setJusticeCountMaxInput] = createSignal(
    toInputValue(props.filters.justiceCount.max)
  )
  const [overPowerMinInput, setOverPowerMinInput] = createSignal(
    toInputValue(props.filters.overPower.min)
  )
  const [overPowerMaxInput, setOverPowerMaxInput] = createSignal(
    toInputValue(props.filters.overPower.max)
  )

  const Const2Level = (value: number) => {
    const normalized = Math.max(CHART_CONST_MIN, Math.min(value, CHART_CONST_MAX))
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
      return type === 'min' ? base : truncateDecimal(base + 0.9, 1)
    }
    if (isPlus) {
      return type === 'min' ? truncateDecimal(base + 0.5, 1) : truncateDecimal(base + 0.9, 1)
    }
    if (base >= CHART_CONST_MAX) {
      return CHART_CONST_MAX
    }
    return type === 'min' ? base : truncateDecimal(base + 0.4, 1)
  }

  // フィルターダイアログが開かれた時にフィルター状態を同期
  createEffect(() => {
    if (!props.open) return
    setConstMinInput(toInputValue(props.filters.const.min))
    setConstMaxInput(toInputValue(props.filters.const.max))
    setScoreMinInput(toInputValue(props.filters.score.min))
    setScoreMaxInput(toInputValue(props.filters.score.max))
    setJusticeCountMinInput(toInputValue(props.filters.justiceCount.min))
    setJusticeCountMaxInput(toInputValue(props.filters.justiceCount.max))
    setOverPowerMinInput(toInputValue(props.filters.overPower.min))
    setOverPowerMaxInput(toInputValue(props.filters.overPower.max))
    setConstLevelMin(Const2Level(props.filters.const.min))
    setConstLevelMax(Const2Level(props.filters.const.max))
    setScoreRankMin(scoreToFilterRank(props.filters.score.min))
    setScoreRankMax(scoreToFilterRank(props.filters.score.max))
  })

  /** 定数入力モードの変更時に内部値を同期 */
  const handleConstFilterModeChange = (mode: 'level' | 'number') => {
    // レベル->定数の場合
    if (mode === 'number') {
      // 内部の保持値をそのままセット
      setConstMinInput(toInputValue(props.filters.const.min))
      setConstMaxInput(toInputValue(props.filters.const.max))
      // フィルター状態を更新
      props.setFilters((prev) => ({
        ...prev,
        constFilterMode: mode,
      }))
      return
    }
    // 定数->レベルの場合
    // 内部の保持値を変換してセット
    const nextMinLevel = Const2Level(props.filters.const.min)
    const nextMaxLevel = Const2Level(props.filters.const.max)
    const nextMinValue = Level2Const(nextMinLevel, 'min')
    const nextMaxValue = Level2Const(nextMaxLevel, 'max')
    setConstLevelMin(nextMinLevel)
    setConstLevelMax(nextMaxLevel)
    // フィルター状態を更新
    props.setFilters((prev) => ({
      ...prev,
      constFilterMode: mode,
      const: {
        min: nextMinValue,
        max: nextMaxValue,
      },
    }))
  }

  /** 定数入力モードの変更時に内部値を同期 */
  const handleScoreFilterModeChange = (mode: 'number' | 'rank') => {
    // ランク->数値の場合
    if (mode === 'number') {
      // 内部の保持値をそのままセット
      setScoreMinInput(toInputValue(props.filters.score.min))
      setScoreMaxInput(toInputValue(props.filters.score.max))
      // フィルター状態を更新
      props.setFilters((prev) => ({
        ...prev,
        scoreFilterMode: mode,
      }))
      return
    }
    // 数値->ランクの場合
    // 内部の保持値を変換してセット
    const nextMinRank = scoreToFilterRank(props.filters.score.min)
    const nextMaxRank = scoreToFilterRank(props.filters.score.max)
    const nextMinValue = filterRankToScore(nextMinRank, 'min')
    const nextMaxValue = filterRankToScore(nextMaxRank, 'max')
    setScoreRankMin(nextMinRank)
    setScoreRankMax(nextMaxRank)
    // フィルター状態を更新
    props.setFilters((prev) => ({
      ...prev,
      scoreFilterMode: mode,
      score: {
        min: nextMinValue,
        max: nextMaxValue,
      },
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
        const: {
          ...prev.const,
          min: nextValue,
        },
      }))
      return
    }
    setConstLevelMax(value)
    const nextValue = Level2Const(value, 'max')
    setConstMaxInput(toInputValue(nextValue))
    props.setFilters((prev) => ({
      ...prev,
      const: {
        ...prev.const,
        max: nextValue,
      },
    }))
  }

  /** スコアランク変更時に適切なスコアをフィルターにセット */
  const handleScoreRankChange = (type: 'min' | 'max', value: string) => {
    const nextValue = filterRankToScore(value as ScoreRank, type)
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

  const difficulties = () => props.masterData?.difficulties?.map((d) => d.name as Difficulty) ?? []
  const genres = () => sortMasterItemsBySortOrder(props.masterData?.genres ?? []).map((g) => g.name)
  const versions = () => props.versions?.map((version) => getShortVersionName(version.name)) ?? []

  /**
   * JUSTICE数の入力値をフィルター状態へ反映する。
   *
   * @param type - 更新対象の範囲端。
   * @param value - 入力欄から受け取った文字列。
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

  /**
   * OVER POWERの入力値をフィルター状態へ反映する。
   *
   * @param type - 更新対象の範囲端。
   * @param value - 入力欄から受け取った文字列。
   */
  const commitOverPowerRange = (type: 'min' | 'max', value: string) => {
    const nextRange = updateOptionalNumberRange(
      {
        min: props.filters.overPower.min,
        max: props.filters.overPower.max,
      },
      type,
      value,
      {
        min: OVER_POWER_RANGE_FILTER.min,
        max: OVER_POWER_RANGE_FILTER.max,
        decimalPlaces: 3,
      }
    )
    const nextValue = toInputValue(nextRange[type])
    if (type === 'min') {
      setOverPowerMinInput(nextValue)
      props.setFilters((prev) => ({
        ...prev,
        overPower: {
          ...prev.overPower,
          min: nextRange.min,
        },
      }))
      return
    }
    setOverPowerMaxInput(nextValue)
    props.setFilters((prev) => ({
      ...prev,
      overPower: {
        ...prev.overPower,
        max: nextRange.max,
      },
    }))
  }

  return (
    <div class="scrollbar-none min-h-0 flex-1 space-y-4 overflow-y-auto">
      <Show when={props.editingFilterName != null}>
        <div>
          <span class="block text-sm font-medium mb-1">フィルター名</span>
          <TextField>
            <TextField.Input
              class="w-full rounded border border-border-strong bg-surface px-3 py-2 font-sans text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
              maxLength={RECORD_FILTER_NAME_MAX_LENGTH}
              value={props.editingFilterName ?? ''}
              onInput={(event) =>
                props.onEditingFilterNameChange?.(limitNameInput(event.currentTarget.value))
              }
            />
          </TextField>
        </div>
      </Show>
      <DifficultySection
        difficulties={difficulties()}
        selected={props.filters.difficulties}
        currentOpTargetOnly={props.filters.currentOpTargetOnly}
        onToggle={(diff) =>
          props.setFilters((prev) => ({
            ...prev,
            difficulties: toggleArray(prev.difficulties, diff),
          }))
        }
        onCurrentOpTargetOnlyChange={(checked) =>
          props.setFilters((prev) => ({
            ...prev,
            currentOpTargetOnly: checked,
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
            const: {
              ...prev.const,
              min: parseNumberInput(value) ?? CHART_CONST_MIN,
            },
          }))
        }}
        onMaxCommit={(value) => {
          setConstMaxInput(value)
          props.setFilters((prev) => ({
            ...prev,
            const: {
              ...prev.const,
              max: parseNumberInput(value) ?? CHART_CONST_MAX,
            },
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
          props.setFilters((prev) => ({
            ...prev,
            excludeNoPlay: checked,
          }))
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
      <NumericRangeSection
        config={OVER_POWER_RANGE_FILTER}
        minValue={overPowerMinInput()}
        maxValue={overPowerMaxInput()}
        onMinInput={setOverPowerMinInput}
        onMaxInput={setOverPowerMaxInput}
        onMinCommit={(value) => commitOverPowerRange('min', value)}
        onMaxCommit={(value) => commitOverPowerRange('max', value)}
      />
      <LampSection
        title="コンボランプ"
        idPrefix="combo-lamp"
        lamps={RECORD_COMBO_LAMP_OPTIONS}
        selected={props.filters.combo_lamp}
        onToggle={(lamp) =>
          props.setFilters((prev) => ({
            ...prev,
            combo_lamp: toggleArray(prev.combo_lamp, lamp).filter(
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
      <LampSection
        title="FULL CHAIN"
        idPrefix="chain-lamp"
        lamps={RECORD_CHAIN_LAMP_OPTIONS}
        selected={props.filters.chain_lamp}
        formatLabel={formatFullChainLampLabel}
        onToggle={(lamp) =>
          props.setFilters((prev) => ({
            ...prev,
            chain_lamp: toggleArray(prev.chain_lamp, lamp).filter(
              (l): l is 'FULL CHAIN GOLD' | 'FULL CHAIN PLATINUM' | null =>
                l === 'FULL CHAIN GOLD' || l === 'FULL CHAIN PLATINUM' || l === null
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
      <LampSection
        title="ハードランプ"
        idPrefix="hard-lamp"
        lamps={RECORD_HARD_LAMP_OPTIONS}
        selected={props.filters.hard_lamp}
        onToggle={(lamp) =>
          props.setFilters((prev) => ({
            ...prev,
            hard_lamp: toggleArray(prev.hard_lamp, lamp).filter(
              (l): l is 'FAILED' | 'CLEAR' | 'HARD' | 'BRAVE' | 'ABSOLUTE' | 'CATASTROPHY' | null =>
                l === 'FAILED' ||
                l === 'CLEAR' ||
                l === 'HARD' ||
                l === 'BRAVE' ||
                l === 'ABSOLUTE' ||
                l === 'CATASTROPHY' ||
                l === null
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
      <MultiSelectFilterSection
        title="ジャンル"
        options={genres()}
        selected={props.filters.genres}
        placeholder="ジャンルを選択"
        contentZIndexClass={FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
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
      <MultiSelectFilterSection
        title="バージョン"
        options={versions()}
        selected={props.filters.versions}
        placeholder="バージョンを選択"
        contentZIndexClass={FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
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
