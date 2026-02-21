import { Dialog } from '@kobalte/core/dialog'
import type { Component } from 'solid-js'
import { createEffect, createSignal, Show } from 'solid-js'
import {
  type GoalAchievementType,
  type GoalAttributes,
  type GoalCreateRequest,
  type GoalDTO,
  type GoalUpdateRequest,
  type MasterDataDTO,
} from '../../../../../types/api'
import { COMBO_LAMP_OPTIONS, GOAL_TYPE_LABELS, HARD_LAMP_OPTIONS } from '../../utils/goalForm'

type GoalRequest = GoalCreateRequest | GoalUpdateRequest

interface GoalFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialGoal?: GoalDTO
  masterData: MasterDataDTO
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: GoalRequest) => Promise<void>
  resolveAllCount: (attributes: GoalAttributes) => number
}

const ACHIEVEMENT_TYPES: GoalAchievementType[] = [
  'rank_count',
  'score_count',
  'avg_score',
  'hardlamp_count',
  'combolamp_count',
  'total_score',
  'overpower_value',
  'overpower_percent',
]

const isCountAchievementType = (type: GoalAchievementType): boolean =>
  type === 'score_count' ||
  type === 'rank_count' ||
  type === 'hardlamp_count' ||
  type === 'combolamp_count'

const GoalFormDialog: Component<GoalFormDialogProps> = (props) => {
  const [title, setTitle] = createSignal('')
  const [achievementType, setAchievementType] = createSignal<GoalAchievementType>('score_count')
  const [score, setScore] = createSignal('1000000')
  const [count, setCount] = createSignal('1')
  const [countMode, setCountMode] = createSignal<'number' | 'all'>('number')
  const [total, setTotal] = createSignal('100')
  const [hardLamp, setHardLamp] = createSignal<'HRD' | 'BRV' | 'ABS' | 'CTS'>('HRD')
  const [comboLamp, setComboLamp] = createSignal<'FC' | 'AJ'>('FC')
  const [invert, setInvert] = createSignal(false)

  const [diff, setDiff] = createSignal<string>('')
  const [constMin, setConstMin] = createSignal('')
  const [constMax, setConstMax] = createSignal('')
  const [genre, setGenre] = createSignal<string>('')
  const [ver, setVer] = createSignal<string>('')

  const [errorMessage, setErrorMessage] = createSignal('')

  const getTotalScoreMax = (): number => props.resolveAllCount(getDraftAttributes()) * 1010000

  createEffect(() => {
    if (!props.open) return
    setErrorMessage('')

    const goal = props.initialGoal
    if (!goal) {
      setTitle('')
      setAchievementType('score_count')
      setScore('1000000')
      setCount('1')
      setCountMode('number')
      setTotal('100')
      setHardLamp('HRD')
      setComboLamp('FC')
      setInvert(false)
      setDiff('')
      setConstMin('')
      setConstMax('')
      setGenre('')
      setVer('')
      return
    }

    setTitle(goal.title)
    setAchievementType(goal.achievement_type)
    if ('score' in goal.achievement_params) {
      setScore(String(goal.achievement_params.score))
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
    if ('lamp' in goal.achievement_params && ['HRD', 'BRV', 'ABS', 'CTS'].includes(goal.achievement_params.lamp)) {
      setHardLamp(goal.achievement_params.lamp)
    }
    if ('lamp' in goal.achievement_params && ['FC', 'AJ'].includes(goal.achievement_params.lamp)) {
      setComboLamp(goal.achievement_params.lamp)
    }
    setInvert(goal.invert)
    setDiff(typeof goal.attributes.diff === 'number' ? String(goal.attributes.diff) : '')
    setConstMin(typeof goal.attributes.const?.min === 'number' ? String(goal.attributes.const.min) : '')
    setConstMax(typeof goal.attributes.const?.max === 'number' ? String(goal.attributes.const.max) : '')
    setGenre(typeof goal.attributes.genre === 'number' ? String(goal.attributes.genre) : '')
    setVer(typeof goal.attributes.ver === 'number' ? String(goal.attributes.ver) : '')

    if (hasCountParam) {
      setCountMode(allCount > 0 && goal.achievement_params.count === allCount ? 'all' : 'number')
    } else {
      setCountMode('number')
    }
  })

  const getDraftAttributes = (): GoalRequest['attributes'] => ({
    ...(diff() ? { diff: Number(diff()) } : {}),
    ...((constMin() || constMax())
      ? {
        const: {
          ...(constMin() ? { min: Number(constMin()) } : {}),
          ...(constMax() ? { max: Number(constMax()) } : {}),
        },
      }
      : {}),
    ...(genre() ? { genre: Number(genre()) } : {}),
    ...(ver() ? { ver: Number(ver()) } : {}),
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
    const parsedScore = Number(score())
    const parsedCount = Number(count())
    const parsedTotal = Number(total())
    const parsedConstMin = constMin() === '' ? undefined : Number(constMin())
    const parsedConstMax = constMax() === '' ? undefined : Number(constMax())

    if (
      (currentType === 'score_count' || currentType === 'rank_count' || currentType === 'avg_score') &&
      (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 1010000)
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
        setErrorMessage(`総スコア目標は最大 ${maxTotalScore.toLocaleString('ja-JP')} 以下で入力してください。`)
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
        <Dialog.Content class="fixed z-50 left-1/2 top-1/2 max-h-[90vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
          <Dialog.Title class="text-lg font-bold">
            {props.mode === 'create' ? '目標を作成' : '目標を編集'}
          </Dialog.Title>

          <div class="mt-4 space-y-4">
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
                onChange={(event) => setAchievementType(event.currentTarget.value as GoalAchievementType)}
                class="w-full rounded border border-gray-300 px-3 py-2"
              >
                {ACHIEVEMENT_TYPES.map((type) => (
                  <option value={type}>{GOAL_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </label>

            <Show when={achievementType() === 'score_count' || achievementType() === 'rank_count' || achievementType() === 'avg_score'}>
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

            <Show when={achievementType() === 'score_count' || achievementType() === 'rank_count' || achievementType() === 'hardlamp_count' || achievementType() === 'combolamp_count'}>
              <label class="block text-sm">
                <span class="mb-1 block text-gray-700">
                  {invert() ? '未達成件数目標' : '件数目標'}
                </span>
                <div class="space-y-2">
                  <select
                    value={countMode()}
                    onChange={(event) => setCountMode(event.currentTarget.value as 'number' | 'all')}
                    class="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="number">数値を指定</option>
                    <option value="all">条件に当てはまるものすべて</option>
                  </select>
                  <Show
                    when={countMode() === 'number'}
                    fallback={
                      <p class="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
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
                  onChange={(event) => setHardLamp(event.currentTarget.value as 'HRD' | 'BRV' | 'ABS' | 'CTS')}
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

            <Show when={achievementType() === 'total_score' || achievementType() === 'overpower_value' || achievementType() === 'overpower_percent'}>
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
                <label class="block text-sm">
                  <span class="mb-1 block text-gray-700">難易度</span>
                  <select
                    value={diff()}
                    onChange={(event) => setDiff(event.currentTarget.value)}
                    class="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">指定なし</option>
                    {props.masterData.difficulties.map((item) => (
                      <option value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>

                <label class="block text-sm">
                  <span class="mb-1 block text-gray-700">ジャンル</span>
                  <select
                    value={genre()}
                    onChange={(event) => setGenre(event.currentTarget.value)}
                    class="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">指定なし</option>
                    {props.masterData.genres.map((item) => (
                      <option value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>

                <label class="block text-sm">
                  <span class="mb-1 block text-gray-700">バージョン</span>
                  <select
                    value={ver()}
                    onChange={(event) => setVer(event.currentTarget.value)}
                    class="w-full rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">指定なし</option>
                    {props.masterData.versions.map((item) => (
                      <option value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>

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

            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={invert()}
                onChange={(event) => handleInvertChange(event.currentTarget.checked)}
              />
              進捗表示を反転（未達寄り）
            </label>

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
              class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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
