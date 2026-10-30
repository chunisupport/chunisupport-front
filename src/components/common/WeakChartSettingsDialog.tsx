import { Dialog } from '@kobalte/core/dialog'
import { NumberField } from '@kobalte/core/number-field'
import { RotateCcw } from 'lucide-solid'
import { createEffect, createSignal, For, type JSX, on } from 'solid-js'
import { CHART_CONST_MAX, CHART_CONST_MIN } from '../../constants/chart'
import type { NameFolderDTO } from '../../types/api'
import { clampNumericInput } from '../../utils/numberInput'
import {
  ONLINE_WEAK_CHART_OP_TARGET_FILTER,
  type OnlineWeakChartDifficulty,
  toggleOnlineWeakChartDifficulty,
  type WeakChartSettings,
} from '../../utils/onlineWeakChartInspector'
import { getShortVersionName } from '../../utils/versionConverter'
import { AppButton, AppIconButton } from './AppButton'
import { toMultiSelectOptions } from './AppMultiSelect'
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
 * 苦手譜面インスペクター（Online・Unified）の表示・集計範囲を編集するダイアログ。
 *
 * 難易度（理論値OVER POWER対象を含む）、ジャンル、バージョン、楽曲名順、譜面定数を編集し、
 * 「適用」で親へ渡す。画面固有の項目は children と onReset で追加する。
 *
 * @param props - 開閉状態、適用中の条件、初期値、選択肢と変更処理。
 * @returns 表示・集計範囲のダイアログ。
 */
export const WeakChartSettingsDialog = (props: WeakChartSettingsDialogProps): JSX.Element => {
  const [difficulties, setDifficulties] = createSignal<OnlineWeakChartDifficulty[]>([])
  const [constMin, setConstMin] = createSignal('')
  const [constMax, setConstMax] = createSignal('')
  const [genres, setGenres] = createSignal<string[] | null>(null)
  const [versions, setVersions] = createSignal<string[] | null>(null)
  const [nameFolders, setNameFolders] = createSignal<string[] | null>(null)
  let contentRef!: HTMLDivElement

  /**
   * 条件を編集欄へ読み込む。
   *
   * @param settings - 読み込む条件。
   * @returns なし。
   */
  const load = (settings: WeakChartSettings): void => {
    setDifficulties([...settings.difficulties])
    setConstMin(String(settings.constMin))
    setConstMax(String(settings.constMax))
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
    load(props.defaults)
    props.onReset?.()
  }

  /**
   * 編集中の条件を適用して閉じる。譜面定数は空欄なら全範囲とし、大小が逆なら入れ替える。
   *
   * @returns なし。
   */
  const apply = (): void => {
    const min = Number(constMin()) || CHART_CONST_MIN
    const max = Number(constMax()) || CHART_CONST_MAX
    props.onApply({
      difficulties: [...difficulties()],
      constMin: Math.min(min, max),
      constMax: Math.max(min, max),
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
    event.preventDefault()
    contentRef.focus()
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content
          ref={contentRef}
          onOpenAutoFocus={handleOpenAutoFocus}
          class="fixed left-1/2 top-1/2 z-50 flex h-5/6 max-h-11/12 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-surface p-6 shadow-lg"
        >
          <div class="mb-4 flex shrink-0 items-center justify-between">
            <Dialog.Title class="text-lg font-bold">{COPY.title}</Dialog.Title>
            <AppIconButton tone="danger" aria-label={COPY.reset} onClick={reset}>
              <RotateCcw class="h-5 w-5" aria-hidden="true" />
            </AppIconButton>
          </div>
          <div class="scrollbar-none min-h-0 min-w-0 flex-1 basis-0 space-y-5 overflow-y-auto">
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
            <div class="space-y-1">
              <span class="block text-sm text-text-muted">{COPY.chartConstRange}</span>
              <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-center gap-2">
                <WeakChartSettingsNumberField
                  value={constMin()}
                  min={CHART_CONST_MIN}
                  max={CHART_CONST_MAX}
                  step={0.1}
                  label={COPY.chartConstMin}
                  onChange={setConstMin}
                />
                <span class="text-center text-text-muted" aria-hidden="true">
                  ～
                </span>
                <WeakChartSettingsNumberField
                  value={constMax()}
                  min={CHART_CONST_MIN}
                  max={CHART_CONST_MAX}
                  step={0.1}
                  label={COPY.chartConstMax}
                  onChange={setConstMax}
                />
              </div>
            </div>
          </div>
          <div class="mt-6 flex shrink-0 justify-end gap-2">
            <AppButton onClick={() => props.onOpenChange(false)}>{COPY.cancel}</AppButton>
            <AppButton variant="primary" onClick={apply}>
              {COPY.apply}
            </AppButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
