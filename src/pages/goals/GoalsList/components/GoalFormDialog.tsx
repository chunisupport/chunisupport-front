import { Checkbox } from '@kobalte/core/checkbox'
import { Dialog } from '@kobalte/core/dialog'
import { Check } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createEffect, createSignal, For, Show } from 'solid-js'
import type {
  GoalAchievementType,
  GoalAttributes,
  GoalCreateRequest,
  GoalDTO,
  GoalUpdateRequest,
  MasterDataDTO,
  VersionDTO,
} from '../../../../../types/api'
import {
  getScoreRank,
  MAX_SCORE,
  SCORE_RANK_MIN_SCORES,
  SCORE_RANKS_ASC,
  type ScoreRank,
} from '../../../../utils/scoreRank'
import { getShortVersionName } from '../../../../utils/versionConverter'
import {
  COMBO_LAMP_OPTIONS,
  HARD_LAMP_OPTIONS,
  resolveGoalAchievementTypeLabel,
} from '../../utils/goalForm'

type GoalRequest = GoalCreateRequest | GoalUpdateRequest

interface GoalFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialGoal?: GoalDTO
  masterData: MasterDataDTO
  versions: VersionDTO[]
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: GoalRequest) => Promise<void>
  resolveAllCount: (attributes: GoalAttributes) => number
}

const isCountAchievementType = (type: GoalAchievementType): boolean =>
  type === 'score_count' ||
  type === 'rank_count' ||
  type === 'hardlamp_count' ||
  type === 'combolamp_count'

const normalizeAttributeSelection = (value: number | number[] | undefined): string[] => {
  if (typeof value === 'number') return [String(value)]
  if (Array.isArray(value)) {
    return value
      .filter((item): item is number => Number.isInteger(item))
      .map((item) => String(item))
  }
  return []
}

const parseAttributeSelection = (selectedValues: string[]): number | number[] | undefined => {
  const normalized = Array.from(new Set(selectedValues))
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value))

  if (normalized.length === 0) return undefined
  if (normalized.length === 1) return normalized[0]
  return normalized
}

const toggleSelection = (current: string[], value: string, checked: boolean): string[] => {
  if (checked) {
    return current.includes(value) ? current : [...current, value]
  }
  return current.filter((item) => item !== value)
}

/**
 * バージョン選択肢として扱えるIDを正規化して返します。
 * APIレスポンスでIDが文字列になるケースも考慮し、数値へ変換した値を利用します。
 *
 * @param versions バージョン一覧
 * @returns 選択肢として表示可能なバージョン情報
 */
const getSelectableVersions = (versions: VersionDTO[]): { id: string; label: string }[] =>
  versions
    .filter((item) => Number.isInteger(Number(item.id)))
    .map((item) => ({ id: String(item.id), label: getShortVersionName(item.name) }))

/**
 * Kobalteのチェックボックス行を描画します。
 *
 * @param props 表示ラベルとチェック状態、変更ハンドラ
 * @returns チェックボックス行
 */
const FilterCheckboxRow: Component<{
  id: string
  label: JSX.Element
  checked: boolean
  onChange: (checked: boolean) => void
}> = (props) => (
  <Checkbox
    checked={props.checked}
    onChange={props.onChange}
    class="flex items-center gap-2 text-sm text-gray-700"
  >
    <Checkbox.Input id={props.id} />
    <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-gray-50 data-checked:border-primary-600 data-checked:bg-primary-600 data-checked:text-white">
      <Checkbox.Indicator>
        <Check class="h-4 w-4" />
      </Checkbox.Indicator>
    </Checkbox.Control>
    <Checkbox.Label for={props.id}>{props.label}</Checkbox.Label>
  </Checkbox>
)

const GoalFormDialog: Component<GoalFormDialogProps> = (props) => {
  const [title, setTitle] = createSignal('')
  const [achievementType, setAchievementType] = createSignal<GoalAchievementType>('score_count')
  const [score, setScore] = createSignal(String(MAX_SCORE - 10000))
  const [rank, setRank] = createSignal<ScoreRank>('S')
  const [count, setCount] = createSignal('1')
  const [countMode, setCountMode] = createSignal<'number' | 'all'>('number')
  const [total, setTotal] = createSignal('100')
  const [hardLamp, setHardLamp] = createSignal<'HRD' | 'BRV' | 'ABS' | 'CTS'>('HRD')
  const [comboLamp, setComboLamp] = createSignal<'FC' | 'AJ'>('FC')
  const [invert, setInvert] = createSignal(false)

  const [diffs, setDiffs] = createSignal<string[]>([])
  const [constMin, setConstMin] = createSignal('')
  const [constMax, setConstMax] = createSignal('')
  const [genres, setGenres] = createSignal<string[]>([])
  const [versions, setVersions] = createSignal<string[]>([])

  const [errorMessage, setErrorMessage] = createSignal('')

  /**
   * 現在の対象条件で理論上の総スコア最大値を計算します。
   *
   * @returns 総スコア最大値
   */
  const getTotalScoreMax = (): number => props.resolveAllCount(getDraftAttributes()) * MAX_SCORE

  createEffect(() => {
    if (!props.open) return
    setErrorMessage('')

    const goal = props.initialGoal
    if (!goal) {
      setTitle('')
      setAchievementType('score_count')
      setScore(String(MAX_SCORE - 10000))
      setRank('S')
      setCount('1')
      setCountMode('number')
      setTotal('100')
      setHardLamp('HRD')
      setComboLamp('FC')
      setInvert(false)
      setDiffs([])
      setConstMin('')
      setConstMax('')
      setGenres([])
      setVersions([])
      return
    }

    setTitle(goal.title)
    setAchievementType(goal.achievement_type)
    if ('score' in goal.achievement_params) {
      setScore(String(goal.achievement_params.score))
      if (goal.achievement_type === 'rank_count') {
        setRank(getScoreRank(goal.achievement_params.score))
      }
    }
    const allCount = props.resolveAllCount(goal.attributes)
    const hasCountParam = 'count' in goal.achievement_params
    if (hasCountParam) {
      const rawCount = goal.achievement_params.count
      setCount(String(goal.invert ? Math.max(allCount - rawCount, 0) : rawCount))
    }
    if ('total' in goal.achievement_params) {
      setTotal(String(goal.achievement_params.total))
    }
    if (
      'lamp' in goal.achievement_params &&
      ['HRD', 'BRV', 'ABS', 'CTS'].includes(goal.achievement_params.lamp)
    ) {
      setHardLamp(goal.achievement_params.lamp)
    }
    if ('lamp' in goal.achievement_params && ['FC', 'AJ'].includes(goal.achievement_params.lamp)) {
      setComboLamp(goal.achievement_params.lamp)
    }
    setInvert(goal.invert)
    setDiffs(normalizeAttributeSelection(goal.attributes.diff))
    setConstMin(
      typeof goal.attributes.const?.min === 'number' ? String(goal.attributes.const.min) : ''
    )
    setConstMax(
      typeof goal.attributes.const?.max === 'number' ? String(goal.attributes.const.max) : ''
    )
    setGenres(normalizeAttributeSelection(goal.attributes.genre))
    setVersions(normalizeAttributeSelection(goal.attributes.ver))

    if (hasCountParam) {
      setCountMode(allCount > 0 && goal.achievement_params.count === allCount ? 'all' : 'number')
    } else {
      setCountMode('number')
    }
  })

  const getDraftAttributes = (): GoalRequest['attributes'] => ({
    ...(parseAttributeSelection(diffs()) !== undefined
      ? { diff: parseAttributeSelection(diffs()) }
      : {}),
    ...(constMin() || constMax()
      ? {
          const: {
            ...(constMin() ? { min: Number(constMin()) } : {}),
            ...(constMax() ? { max: Number(constMax()) } : {}),
          },
        }
      : {}),
    ...(parseAttributeSelection(genres()) !== undefined
      ? { genre: parseAttributeSelection(genres()) }
      : {}),
    ...(parseAttributeSelection(versions()) !== undefined
      ? { ver: parseAttributeSelection(versions()) }
      : {}),
  })

  const handleSave = async () => {
    setErrorMessage('')
    const trimmed = title().trim()
    if (!trimmed) {
      setErrorMessage('タイトルを入力してください。')
      return
    }
    if (trimmed.length > 30) {
      setErrorMessage('タイトルは30文字以内で入力してください。')
      return
    }

    const currentType = achievementType()
    const parsedScore =
      currentType === 'rank_count' ? SCORE_RANK_MIN_SCORES[rank()] : Number(score())
    const parsedCount = Number(count())
    const parsedTotal = Number(total())
    const parsedConstMin = constMin() === '' ? undefined : Number(constMin())
    const parsedConstMax = constMax() === '' ? undefined : Number(constMax())

    if (
      (currentType === 'score_count' ||
        currentType === 'rank_count' ||
        currentType === 'avg_score') &&
      (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > MAX_SCORE)
    ) {
      setErrorMessage('スコアは 0 ～ 1,010,000 の範囲で入力してください。')
      return
    }

    const isCountType = isCountAchievementType(currentType)

    const attributes = getDraftAttributes()
    const allCount = props.resolveAllCount(attributes)

    if (isCountType && countMode() === 'number') {
      const countMin = invert() ? 0 : 1
      if (!Number.isInteger(parsedCount) || parsedCount < countMin) {
        setErrorMessage(`件数は${countMin}以上の整数で入力してください。`)
        return
      }
    }

    if (isCountType && countMode() === 'all' && allCount <= 0) {
      setErrorMessage('条件に当てはまる譜面がありません。条件を見直してください。')
      return
    }

    if (
      (currentType === 'total_score' ||
        currentType === 'overpower_value' ||
        currentType === 'overpower_percent') &&
      (!Number.isFinite(parsedTotal) || parsedTotal < 0)
    ) {
      setErrorMessage('合計/割合の目標値は0以上で入力してください。')
      return
    }

    if (currentType === 'total_score') {
      const maxTotalScore = getTotalScoreMax()
      if (parsedTotal > maxTotalScore) {
        setErrorMessage(
          `総スコア目標は最大 ${maxTotalScore.toLocaleString('ja-JP')} 以下で入力してください。`
        )
        return
      }
    }

    if (
      (typeof parsedConstMin === 'number' && !Number.isFinite(parsedConstMin)) ||
      (typeof parsedConstMax === 'number' && !Number.isFinite(parsedConstMax))
    ) {
      setErrorMessage('定数範囲が不正です。')
      return
    }
    if (
      typeof parsedConstMin === 'number' &&
      typeof parsedConstMax === 'number' &&
      parsedConstMin > parsedConstMax
    ) {
      setErrorMessage('定数の最小値は最大値以下にしてください。')
      return
    }

    const targetCount =
      countMode() === 'all'
        ? allCount
        : invert()
          ? allCount - Math.floor(parsedCount)
          : Math.floor(parsedCount)

    if (isCountType && targetCount <= 0) {
      setErrorMessage('件数目標の変換結果が0以下です。条件または入力値を見直してください。')
      return
    }

    const achievement_params =
      currentType === 'score_count' || currentType === 'rank_count'
        ? { score: Math.floor(parsedScore), count: targetCount }
        : currentType === 'avg_score'
          ? { score: Math.floor(parsedScore) }
          : currentType === 'hardlamp_count'
            ? { lamp: hardLamp(), count: targetCount }
            : currentType === 'combolamp_count'
              ? { lamp: comboLamp(), count: targetCount }
              : { total: parsedTotal }

    await props.onSave({
      title: trimmed,
      achievement_type: currentType,
      achievement_params,
      attributes,
      invert: invert(),
    })
  }

  /**
   * 進捗反転設定を切り替え、件数指定時は表示中の入力値を維持するよう変換します。
   *
   * @param next 反転状態
   */
  const handleInvertChange = (next: boolean) => {
    if (isCountAchievementType(achievementType()) && countMode() === 'number') {
      const parsed = Number(count())
      if (Number.isInteger(parsed) && parsed >= 0) {
        const allCount = props.resolveAllCount(getDraftAttributes())
        setCount(String(Math.max(allCount - parsed, 0)))
      }
    }
    setInvert(next)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/30 z-40" />
        <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col rounded-lg bg-white p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:max-h-[90dvh] sm:w-[92vw] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <Dialog.Title class="text-lg font-bold">
            {props.mode === 'create' ? '目標を作成' : '目標を編集'}
          </Dialog.Title>

          <div class="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <label class="block text-sm">
              <span class="mb-1 block text-gray-700">タイトル</span>
              <input
                type="text"
                maxlength={30}
                value={title()}
                onInput={(event) => setTitle(event.currentTarget.value)}
                class="w-full rounded border border-gray-300 px-3 py-2"
              />
            </label>

            <label class="block text-sm">
              <span class="mb-1 block text-gray-700">目標種別</span>
              <select
                value={achievementType()}
                onChange={(event) => {
                  const nextType = event.currentTarget.value as GoalAchievementType
                  setAchievementType(nextType)
                  if (nextType === 'rank_count') {
                    setRank('S')
                    setScore(String(SCORE_RANK_MIN_SCORES.S))
                  }
                }}
                class="w-full rounded border border-gray-300 px-3 py-2"
              >
                {props.masterData.achievement_types.map((item) => (
                  <option value={item.code}>
                    {resolveGoalAchievementTypeLabel(item.code, {
                      locale: 'ja',
                      fallbackLabel: item.label ?? item.name,
                    })}
                  </option>
                ))}
              </select>
            </label>

            <Show when={achievementType() === 'score_count' || achievementType() === 'avg_score'}>
              <label class="block text-sm">
                <span class="mb-1 block text-gray-700">スコア目標</span>
                <input
                  type="number"
                  value={score()}
                  onInput={(event) => setScore(event.currentTarget.value)}
                  class="w-full rounded border border-gray-300 px-3 py-2"
                />
              </label>
            </Show>

            <Show when={achievementType() === 'rank_count'}>
              <label class="block text-sm">
                <span class="mb-1 block text-gray-700">ランク目標</span>
                <select
                  value={rank()}
                  onChange={(event) => {
                    const nextRank = event.currentTarget.value as ScoreRank
                    setRank(nextRank)
                    setScore(String(SCORE_RANK_MIN_SCORES[nextRank]))
                  }}
                  class="w-full rounded border border-gray-300 px-3 py-2"
                >
                  {SCORE_RANKS_ASC.map((scoreRank) => (
                    <option value={scoreRank}>
                      {scoreRank}（{SCORE_RANK_MIN_SCORES[scoreRank].toLocaleString('ja-JP')}）
                    </option>
                  ))}
                </select>
              </label>
            </Show>

            <Show
              when={
                achievementType() === 'score_count' ||
                achievementType() === 'rank_count' ||
                achievementType() === 'hardlamp_count' ||
                achievementType() === 'combolamp_count'
              }
            >
              <label class="block text-sm">
                <span class="mb-1 block text-gray-700">
                  {invert() ? '未達成件数目標' : '件数目標'}
                </span>
                <div class="space-y-2">
                  <select
                    value={countMode()}
                    onChange={(event) =>
                      setCountMode(event.currentTarget.value as 'number' | 'all')
                    }
                    class="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="number">数値を指定</option>
                    <option value="all">条件に当てはまるものすべて</option>
                  </select>
                  <Show
                    when={countMode() === 'number'}
                    fallback={
                      <p class="rounded border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700">
                        現在の対象譜面数: {props.resolveAllCount(getDraftAttributes())} 件
                      </p>
                    }
                  >
                    <input
                      type="number"
                      min={invert() ? 0 : 1}
                      value={count()}
                      onInput={(event) => setCount(event.currentTarget.value)}
                      class="w-full rounded border border-gray-300 px-3 py-2"
                    />
                    <Show when={invert()}>
                      <p class="mt-1 text-xs text-gray-600">
                        入力値は「許容する未達成数」です（保存時に達成件数へ変換）。
                      </p>
                    </Show>
                  </Show>
                </div>
              </label>
            </Show>

            <Show when={achievementType() === 'hardlamp_count'}>
              <label class="block text-sm">
                <span class="mb-1 block text-gray-700">ハードランプ</span>
                <select
                  value={hardLamp()}
                  onChange={(event) =>
                    setHardLamp(event.currentTarget.value as 'HRD' | 'BRV' | 'ABS' | 'CTS')
                  }
                  class="w-full rounded border border-gray-300 px-3 py-2"
                >
                  {HARD_LAMP_OPTIONS.map((lamp) => (
                    <option value={lamp.value}>{lamp.label}</option>
                  ))}
                </select>
              </label>
            </Show>

            <Show when={achievementType() === 'combolamp_count'}>
              <label class="block text-sm">
                <span class="mb-1 block text-gray-700">コンボランプ</span>
                <select
                  value={comboLamp()}
                  onChange={(event) => setComboLamp(event.currentTarget.value as 'FC' | 'AJ')}
                  class="w-full rounded border border-gray-300 px-3 py-2"
                >
                  {COMBO_LAMP_OPTIONS.map((lamp) => (
                    <option value={lamp.value}>{lamp.label}</option>
                  ))}
                </select>
              </label>
            </Show>

            <Show
              when={
                achievementType() === 'total_score' ||
                achievementType() === 'overpower_value' ||
                achievementType() === 'overpower_percent'
              }
            >
              <label class="block text-sm">
                <span class="mb-1 block text-gray-700">合計/割合目標</span>
                <input
                  type="number"
                  value={total()}
                  onInput={(event) => setTotal(event.currentTarget.value)}
                  class="w-full rounded border border-gray-300 px-3 py-2"
                />
                <Show when={achievementType() === 'total_score'}>
                  <p class="mt-1 text-xs text-gray-600">
                    最大値: {getTotalScoreMax().toLocaleString('ja-JP')}（対象譜面数 × 1,010,000）
                  </p>
                </Show>
              </label>
            </Show>

            <div class="rounded border border-gray-200 p-3">
              <p class="mb-2 text-sm font-semibold text-gray-700">対象条件（任意）</p>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <fieldset class="block text-sm space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="block text-gray-700">難易度（複数可）</span>
                    <button
                      type="button"
                      class="text-xs text-primary-600 hover:text-primary-700"
                      onClick={() => setDiffs([])}
                    >
                      クリア
                    </button>
                  </div>
                  <div class="max-h-36 space-y-1 overflow-y-auto rounded border border-gray-300 px-3 py-2">
                    {props.masterData.difficulties.map((item) => (
                      <FilterCheckboxRow
                        id={`goal-diff-${item.id}`}
                        label={<span>{item.name}</span>}
                        checked={diffs().includes(String(item.id))}
                        onChange={(checked) =>
                          setDiffs((prev) => toggleSelection(prev, String(item.id), checked))
                        }
                      />
                    ))}
                  </div>
                  <p class="text-xs text-gray-500">未選択で「指定なし」になります。</p>
                </fieldset>

                <fieldset class="block text-sm space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="block text-gray-700">ジャンル（複数可）</span>
                    <button
                      type="button"
                      class="text-xs text-primary-600 hover:text-primary-700"
                      onClick={() => setGenres([])}
                    >
                      クリア
                    </button>
                  </div>
                  <div class="max-h-36 space-y-1 overflow-y-auto rounded border border-gray-300 px-3 py-2">
                    {props.masterData.genres.map((item) => (
                      <FilterCheckboxRow
                        id={`goal-genre-${item.id}`}
                        label={<span>{item.name}</span>}
                        checked={genres().includes(String(item.id))}
                        onChange={(checked) =>
                          setGenres((prev) => toggleSelection(prev, String(item.id), checked))
                        }
                      />
                    ))}
                  </div>
                  <p class="text-xs text-gray-500">未選択で「指定なし」になります。</p>
                </fieldset>

                <fieldset class="block text-sm space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="block text-gray-700">バージョン（複数可）</span>
                    <button
                      type="button"
                      class="text-xs text-primary-600 hover:text-primary-700"
                      onClick={() => setVersions([])}
                    >
                      クリア
                    </button>
                  </div>
                  <div class="max-h-36 space-y-1 overflow-y-auto rounded border border-gray-300 px-3 py-2">
                    <For each={getSelectableVersions(props.versions)}>
                      {(item) => (
                        <FilterCheckboxRow
                          id={`goal-version-${item.id}`}
                          label={<span>{item.label}</span>}
                          checked={versions().includes(item.id)}
                          onChange={(checked) =>
                            setVersions((prev) => toggleSelection(prev, item.id, checked))
                          }
                        />
                      )}
                    </For>
                  </div>
                  <p class="text-xs text-gray-500">未選択で「指定なし」になります。</p>
                </fieldset>

                <div class="grid grid-cols-2 gap-2">
                  <label class="block text-sm">
                    <span class="mb-1 block text-gray-700">定数min</span>
                    <input
                      type="number"
                      step="0.1"
                      value={constMin()}
                      onInput={(event) => setConstMin(event.currentTarget.value)}
                      class="w-full rounded border border-gray-300 px-3 py-2"
                    />
                  </label>
                  <label class="block text-sm">
                    <span class="mb-1 block text-gray-700">定数max</span>
                    <input
                      type="number"
                      step="0.1"
                      value={constMax()}
                      onInput={(event) => setConstMax(event.currentTarget.value)}
                      class="w-full rounded border border-gray-300 px-3 py-2"
                    />
                  </label>
                </div>
              </div>
            </div>

            <FilterCheckboxRow
              id="goal-invert"
              label={<span>進捗表示を反転（未達寄り）</span>}
              checked={invert()}
              onChange={handleInvertChange}
            />

            <Show when={errorMessage()}>
              <p class="text-sm text-red-600">{errorMessage()}</p>
            </Show>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
              onClick={() => props.onOpenChange(false)}
              disabled={props.isSaving}
            >
              キャンセル
            </button>
            <button
              type="button"
              class="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              onClick={() => {
                void handleSave()
              }}
              disabled={props.isSaving}
            >
              {props.isSaving ? '保存中...' : '保存する'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default GoalFormDialog
