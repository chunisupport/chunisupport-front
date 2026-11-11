import { NumberField } from '@kobalte/core/number-field'
import RotateCcw from 'lucide-solid/icons/rotate-ccw'
import { createEffect, createSignal, For, type JSX, on } from 'solid-js'
import {
  type ChartConstRangeSelection,
  createChartConstRangeDraft,
} from '../../hooks/createChartConstRangeDraft'
import type { NameFolderDTO } from '../../types/api'
import { createFullChartConstRange, normalizeChartConstRange } from '../../utils/chartLevel'
import { clampNumericInput } from '../../utils/numberInput'
import {
  ONLINE_WEAK_CHART_OP_TARGET_FILTER,
  type OnlineWeakChartDifficulty,
  toggleOnlineWeakChartDifficulty,
  type WeakChartSettings,
} from '../../utils/onlineWeakChartInspector'
import { getShortVersionName } from '../../utils/versionConverter'
import { AppButton, AppIconButton } from './AppButton'
import { AppDialog } from './AppDialog'
import { toMultiSelectOptions } from './AppMultiSelect'
import { focusDialogContentOnOpen } from './appDialogUtils'
import ChartConstRangeField from './ChartConstRangeField'
import { CheckboxField } from './CheckboxField'
import {
  GenreMultiSelect,
  NameFolderFilterMultiSelect,
  VersionMultiSelect,
} from './DomainMultiSelect'
import {
  WEAK_CHART_SETTINGS_COPY as COPY,
  WEAK_CHART_SETTINGS_DIFFICULTY_OPTIONS,
} from './WeakChartSettingsDialog.constants'

/**
 * 設定画面に範囲内補正付きの数値欄を表示する。
 *
 * @param props - 入力値、範囲、刻み、ラベルと変更処理。
 * @returns 数値入力欄。
 */
export const WeakChartSettingsNumberField = (props: {
  value: string
  min: number
  max: number
  step: number
  label: string
  onChange: (value: string) => void
}): JSX.Element => (
  <NumberField
    class="block flex-1"
    value={props.value}
    onChange={(value) => props.onChange(clampNumericInput(value, props.min, props.max))}
    format={false}
    allowedInput={props.step === 1 ? /[0-9]/ : /[0-9.]/}
    step={props.step}
  >
    <NumberField.Label class="sr-only">{props.label}</NumberField.Label>
    <NumberField.Input
      min={props.min}
      max={props.max}
      step={props.step}
      class="w-full rounded border border-border-strong bg-surface px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-inset focus:ring-focus-ring"
    />
  </NumberField>
)

type WeakChartSettingsDialogProps = {
  /** ダイアログを開いているか。 */
  open: boolean
  /** 開閉状態の変更を通知する。適用・キャンセル時は false で呼ぶ。 */
  onOpenChange: (open: boolean) => void
  /** 適用中の条件。開くたびに編集欄へ読み込む。 */
  value: WeakChartSettings
  /** 「初期値に戻す」で編集欄に入れる条件。 */
  defaults: WeakChartSettings
  /** 編集した条件を適用する。 */
  onApply: (settings: WeakChartSettings) => void
  /** 「初期値に戻す」で、画面固有の追加項目も初期値へ戻す。 */
  onReset?: () => void
  /** ジャンルの選択肢。 */
  genreOptions: readonly string[]
  /** バージョン名（フルネーム）の選択肢。 */
  versionNames: readonly string[]
  /** 楽曲名順フォルダの選択肢。 */
  nameFolders: readonly NameFolderDTO[]
  /** 楽曲属性を読み込み済みか。未読み込みの間はジャンル・バージョン・楽曲名順を選べない。 */
  attributesReady: boolean
  /** チェックボックスのIDの接頭辞。 */
  idPrefix: string
  /** 楽曲名順と譜面定数の間に置く、画面固有の追加項目。 */
  children?: JSX.Element
}

/**
 * 苦手譜面インスペクター（新版・Online）の表示・集計範囲を編集するダイアログ。
 *
 * 難易度（理論値OVER POWER対象を含む）、ジャンル、バージョン、楽曲名順、レベル／譜面定数範囲を編集し、
 * 「適用」で親へ渡す。画面固有の項目は children と onReset で追加する。
 *
 * @param props - 開閉状態、適用中の条件、初期値、選択肢と変更処理。
 * @returns 表示・集計範囲のダイアログ。
 */
export const WeakChartSettingsDialog = (props: WeakChartSettingsDialogProps): JSX.Element => {
  const [difficulties, setDifficulties] = createSignal<OnlineWeakChartDifficulty[]>([])
  const [appliedConstMode, setAppliedConstMode] =
    createSignal<ChartConstRangeSelection['constFilterMode']>('level')
  const [constSelection, setConstSelection] = createSignal<ChartConstRangeSelection>({
    constFilterMode: 'level',
    constRange: createFullChartConstRange(),
  })
  const constRangeDraft = createChartConstRangeDraft({
    get: constSelection,
    set: setConstSelection,
  })
  const [genres, setGenres] = createSignal<string[] | null>(null)
  const [versions, setVersions] = createSignal<string[] | null>(null)
  const [nameFolders, setNameFolders] = createSignal<string[] | null>(null)
  let contentRef: HTMLElement | undefined

  /**
   * 条件を編集欄へ読み込む。
   *
   * @param settings - 読み込む条件。
   * @param mode - 復元する範囲入力モード。
   * @returns なし。
   */
  const load = (settings: WeakChartSettings, mode = appliedConstMode()): void => {
    setDifficulties([...settings.difficulties])
    const constRange = { min: settings.constMin, max: settings.constMax }
    setConstSelection({ constFilterMode: mode, constRange })
    constRangeDraft.sync(constRange)
    setGenres(settings.genres === null ? null : [...settings.genres])
    setVersions(settings.versions === null ? null : [...settings.versions])
    setNameFolders(settings.nameFolders === null ? null : [...settings.nameFolders])
  }

  createEffect(
    on(
      () => props.open,
      (open) => {
        if (open) load(props.value)
      }
    )
  )

  /**
   * 編集欄と画面固有の追加項目を初期値に戻す。
   *
   * @returns なし。
   */
  const reset = (): void => {
    load(props.defaults, 'level')
    props.onReset?.()
  }

  /**
   * 編集中の条件を適用して閉じる。逆順の範囲は昇順に揃え、レベル指定ではレベル全体を含める。
   *
   * @returns なし。
   */
  const apply = (): void => {
    const { constRange, constFilterMode } = constSelection()
    const { min, max } = normalizeChartConstRange(constRange, constFilterMode)
    setAppliedConstMode(constFilterMode)
    props.onApply({
      difficulties: [...difficulties()],
      constMin: min,
      constMax: max,
      genres: genres(),
      versions: versions(),
      nameFolders: nameFolders(),
    })
    props.onOpenChange(false)
  }

  /**
   * 開いた際にダイアログ本体へフォーカスする。
   *
   * @param event - 自動フォーカスイベント。
   * @returns なし。
   */
  const handleOpenAutoFocus = (event: Event): void => {
    focusDialogContentOnOpen(event, contentRef)
  }

  return (
    <AppDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      preventScroll={false}
      size="md"
      height="tall"
      contentRef={(element) => {
        contentRef = element
      }}
      onOpenAutoFocus={handleOpenAutoFocus}
      title={COPY.title}
      headerActions={
        <AppIconButton tone="danger" aria-label={COPY.reset} onClick={reset}>
          <RotateCcw class="h-5 w-5" aria-hidden="true" />
        </AppIconButton>
      }
      scroll="fill"
      bodyClass="scrollbar-none min-w-0 space-y-5"
      footer={
        <div class="mt-6 flex justify-end gap-2">
          <AppButton onClick={() => props.onOpenChange(false)}>{COPY.cancel}</AppButton>
          <AppButton variant="primary" onClick={apply}>
            {COPY.apply}
          </AppButton>
        </div>
      }
    >
      <fieldset>
        <legend class="mb-2 text-sm font-semibold">{COPY.difficulty}</legend>
        <div class="flex flex-col items-start gap-1">
          <For each={WEAK_CHART_SETTINGS_DIFFICULTY_OPTIONS}>
            {(option) => (
              <CheckboxField
                id={`${props.idPrefix}-${option.value}`}
                checked={difficulties().includes(option.value)}
                disabled={
                  difficulties().includes(ONLINE_WEAK_CHART_OP_TARGET_FILTER) &&
                  option.value !== ONLINE_WEAK_CHART_OP_TARGET_FILTER
                }
                onChange={() =>
                  setDifficulties((current) =>
                    toggleOnlineWeakChartDifficulty(current, option.value)
                  )
                }
                label={option.label}
                textVariant="large"
                class="relative flex items-center gap-2"
              />
            )}
          </For>
        </div>
      </fieldset>
      <GenreMultiSelect
        options={toMultiSelectOptions([...props.genreOptions])}
        selected={genres() ?? [...props.genreOptions]}
        onChange={(value) =>
          setGenres(
            value.length > 0 && value.length === props.genreOptions.length ? null : [...value]
          )
        }
        placeholder={COPY.filterUnselected}
        disabled={!props.attributesReady}
      />
      <VersionMultiSelect
        options={toMultiSelectOptions([...props.versionNames], getShortVersionName)}
        selected={versions() ?? [...props.versionNames]}
        onChange={(value) =>
          setVersions(
            value.length > 0 && value.length === props.versionNames.length ? null : [...value]
          )
        }
        placeholder={COPY.filterUnselected}
        disabled={!props.attributesReady}
      />
      <NameFolderFilterMultiSelect
        nameFolders={[...props.nameFolders]}
        selected={nameFolders()}
        onChange={setNameFolders}
        placeholder={COPY.filterUnselected}
        disabled={!props.attributesReady}
      />
      {props.children}
      <ChartConstRangeField idPrefix={props.idPrefix} {...constRangeDraft.fieldProps} />
    </AppDialog>
  )
}
