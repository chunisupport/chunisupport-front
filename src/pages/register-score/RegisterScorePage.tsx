import { A, useSearchParams } from '@solidjs/router'
import { ArrowRight, CheckCircle, ListMusic, Music, Trophy, UserRound } from 'lucide-solid'
import { createMemo, createSignal, For, Match, onMount, Show, Switch } from 'solid-js'

import { postPlayerDataCommit } from '../../api/register-data'
import { fetchMe } from '../../api/users'
import { Loading } from '../../components'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import { useSongsData } from '../../stores/songsData'
import type {
  PlayerDataRecordChange,
  PlayerDataRecordState,
  PlayerDataResult,
} from '../../types/api'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { formatOverPowerPercent, formatOverPowerValue } from '../users/utils/overPowerFormat'
import { formatPlayerRating } from '../users/utils/ratingFormat'
import { isValidUploadToken, normalizeUploadTokenParam } from './registerScoreToken'

type RegisterScoreState = 'committing' | 'success' | 'error'

const REGISTER_SCORE_MESSAGES = {
  invalidToken: 'tokenが不正です。登録用URLを確認してください。',
  missingUser: 'ログインユーザー情報を取得できませんでした。ページを再読み込みしてください。',
  fallbackError: '登録に失敗しました。',
  success: '登録しました！',
  title: 'スコア登録',
  processing: 'スコアデータを登録しています。',
  myPageLink: 'マイページへ移動',
  changedSongsTitle: '更新した楽曲',
  changedSongsEmpty: '今回更新された楽曲はありません。',
  profileLabel: 'PROFILE',
  newRecordLabel: 'NEW',
  updatedRecordLabel: 'UPDATE',
  fullRecordLabel: '通常譜面',
  worldsendRecordLabel: "WORLD'S END",
  unknownSongTitle: '楽曲名を取得中',
} as const

const NO_DATA_TEXT = '-'

type SongLookupItem = {
  official_idx?: string
  title: string
}

/**
 * エラー表示に利用するメッセージへ変換する。
 *
 * @param error - API呼び出しで発生したエラー。
 * @returns 画面表示用のエラーメッセージ。
 */
const resolveRegisterScoreErrorMessage = (error: unknown): string => {
  return toUserFriendlyErrorMessage(error, REGISTER_SCORE_MESSAGES.fallbackError)
}

/**
 * 数値をスコア表示用の3桁区切り文字列へ変換する。
 *
 * @param score - 表示対象のスコア。
 * @returns 日本語ロケールのスコア文字列。
 */
const formatScore = (score: number): string => {
  return score.toLocaleString('ja-JP')
}

/**
 * 差分がスコア更新を含む場合に増分を表示する。
 *
 * @param change - APIから返却された1譜面分の差分。
 * @returns スコア増分の表示文字列。新規登録やスコア変化なしの場合は空文字。
 */
const formatScoreDelta = (change: PlayerDataRecordChange): string => {
  if (!change.before) return ''

  const delta = change.after.score - change.before.score
  if (delta <= 0) return ''

  return `+${formatScore(delta)}`
}

/**
 * ランプ系の値を画面表示用に整える。
 *
 * @param value - APIから返却されたランプ名。
 * @returns 値がない場合はプレースホルダー、それ以外はランプ名。
 */
const formatLampValue = (value: string | null): string => {
  return value ?? NO_DATA_TEXT
}

/**
 * 登録結果の実変更件数を取得する。
 *
 * @param result - APIから返却された登録結果。
 * @returns 通常譜面とWORLD'S ENDの実変更件数合計。
 */
const getChangedRecordsCount = (result: PlayerDataResult): number => {
  if (
    result.counts.full_records_actually_changed === undefined &&
    result.counts.worldsend_records_actually_changed === undefined
  ) {
    return result.changes?.length ?? 0
  }

  return (
    (result.counts.full_records_actually_changed ?? 0) +
    (result.counts.worldsend_records_actually_changed ?? 0)
  )
}

/**
 * 楽曲一覧から公式idxに対応するタイトルを検索する。
 *
 * @param songs - 検索対象の楽曲一覧。
 * @param idx - API差分に含まれる公式idx。
 * @returns 見つかった楽曲タイトル。見つからない場合はundefined。
 */
const findSongTitleByOfficialIdx = (songs: SongLookupItem[], idx: string): string | undefined => {
  return songs.find((song) => song.official_idx === idx)?.title
}

/**
 * 差分レコードの種別に応じた表示ラベルを返す。
 *
 * @param recordType - APIから返却されたレコード種別。
 * @returns 画面表示用のレコード種別ラベル。
 */
const getRecordTypeLabel = (recordType: PlayerDataRecordChange['record_type']): string => {
  return recordType === 'worldsend'
    ? REGISTER_SCORE_MESSAGES.worldsendRecordLabel
    : REGISTER_SCORE_MESSAGES.fullRecordLabel
}

/**
 * 差分種別に応じた表示ラベルを返す。
 *
 * @param changeType - APIから返却された差分種別。
 * @returns 画面表示用の差分種別ラベル。
 */
const getChangeTypeLabel = (changeType: PlayerDataRecordChange['change_type']): string => {
  return changeType === 'new'
    ? REGISTER_SCORE_MESSAGES.newRecordLabel
    : REGISTER_SCORE_MESSAGES.updatedRecordLabel
}

/**
 * スコア以外のレコード状態を小さな差分行として表示する。
 *
 * @param label - 表示対象の項目名。
 * @param before - 更新前の値。
 * @param after - 更新後の値。
 * @returns 差分行の JSX 要素。
 */
const RecordStateLine = (props: { label: string; before: string | null; after: string | null }) => (
  <div class="flex min-w-0 items-center justify-between gap-2 text-xs text-gray-600">
    <span class="shrink-0">{props.label}</span>
    <span class="min-w-0 truncate text-right">
      <Show when={props.before !== null} fallback={formatLampValue(props.after)}>
        {formatLampValue(props.before)}
        <ArrowRight class="mx-1 inline h-3 w-3 align-[-0.15em] text-gray-400" aria-hidden="true" />
        <span class="font-medium text-gray-900">{formatLampValue(props.after)}</span>
      </Show>
    </span>
  </div>
)

/**
 * 登録後のプロフィール概要を明るいカードで表示する。
 *
 * @param props - APIから返却された登録結果。
 * @returns プロフィール概要カード。
 */
const RegisterScoreProfileCard = (props: { result: PlayerDataResult }) => (
  <section class="rounded-lg border border-gray-200 bg-white p-5 text-gray-900 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide text-emerald-700">
          <UserRound class="h-4 w-4" aria-hidden="true" />
          {REGISTER_SCORE_MESSAGES.profileLabel}
        </p>
        <h2 class="truncate text-2xl font-semibold">{props.result.summary.name}</h2>
        <p class="mt-1 text-sm text-gray-500">Lv. {props.result.summary.level}</p>
      </div>
      <div class="rounded-md bg-emerald-50 px-3 py-2 text-right">
        <p class="text-xs font-medium text-emerald-700">RATING</p>
        <p class="font-oswald text-2xl font-semibold text-emerald-900">
          {formatPlayerRating(props.result.summary.rating)}
        </p>
      </div>
    </div>

    <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
        <p class="text-xs font-medium text-gray-500">OVER POWER</p>
        <p class="mt-1 font-oswald text-xl font-semibold text-gray-900">
          <Show when={props.result.summary.overpower_value !== null} fallback={NO_DATA_TEXT}>
            {formatOverPowerValue(props.result.summary.overpower_value ?? 0)}
          </Show>
        </p>
      </div>
      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
        <p class="text-xs font-medium text-gray-500">OVER POWER %</p>
        <p class="mt-1 font-oswald text-xl font-semibold text-gray-900">
          <Show when={props.result.summary.overpower_percentage !== null} fallback={NO_DATA_TEXT}>
            {formatOverPowerPercent(props.result.summary.overpower_percentage ?? 0)}%
          </Show>
        </p>
      </div>
      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
        <p class="text-xs font-medium text-gray-500">CHANGED</p>
        <p class="mt-1 flex items-center gap-2 font-oswald text-xl font-semibold text-gray-900">
          <Trophy class="h-5 w-5 text-amber-500" aria-hidden="true" />
          {getChangedRecordsCount(props.result)}
        </p>
      </div>
    </div>
  </section>
)

/**
 * 1譜面分の登録差分をカード表示する。
 *
 * @param props - 表示対象の差分と解決済み楽曲タイトル。
 * @returns 差分カード。
 */
const RegisterScoreChangeCard = (props: { change: PlayerDataRecordChange; songTitle: string }) => (
  <article class="rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            {getChangeTypeLabel(props.change.change_type)}
          </span>
          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {getRecordTypeLabel(props.change.record_type)}
          </span>
          <Show when={props.change.diff}>
            {(diff) => (
              <span class="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                {diff()}
              </span>
            )}
          </Show>
        </div>
        <h3 class="truncate text-base font-semibold">{props.songTitle}</h3>
        <p class="mt-1 text-xs text-gray-500">idx: {props.change.idx}</p>
      </div>
      <Music class="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
    </div>

    <div class="mt-4 rounded-md bg-gray-50 p-3">
      <div class="flex items-end justify-between gap-3">
        <div>
          <p class="text-xs font-medium text-gray-500">SCORE</p>
          <p class="font-oswald text-2xl font-semibold text-gray-900">
            <Show when={props.change.before} fallback={formatScore(props.change.after.score)}>
              {(before: () => PlayerDataRecordState) => (
                <>
                  {formatScore(before().score)}
                  <ArrowRight
                    class="mx-2 inline h-4 w-4 align-[-0.15em] text-gray-400"
                    aria-hidden="true"
                  />
                  <span class="text-emerald-700">{formatScore(props.change.after.score)}</span>
                </>
              )}
            </Show>
          </p>
        </div>
        <Show when={formatScoreDelta(props.change)}>
          {(delta) => (
            <span class="rounded-full bg-emerald-100 px-2 py-1 font-oswald text-sm font-semibold text-emerald-700">
              {delta()}
            </span>
          )}
        </Show>
      </div>

      <div class="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-3">
        <RecordStateLine
          label="CLEAR"
          before={props.change.before?.clear_lamp ?? null}
          after={props.change.after.clear_lamp}
        />
        <RecordStateLine
          label="COMBO"
          before={props.change.before?.combo_lamp ?? null}
          after={props.change.after.combo_lamp}
        />
        <RecordStateLine
          label="CHAIN"
          before={props.change.before?.full_chain ?? null}
          after={props.change.after.full_chain}
        />
      </div>
    </div>
  </article>
)

/**
 * `/register-score` でアップロードトークンを確定保存する画面を表示する。
 *
 * @returns スコア登録画面。
 */
const RegisterScorePage = () => {
  const [searchParams] = useSearchParams<{ token: string | string[] }>()
  const songsData = useSongsData()
  const [state, setState] = createSignal<RegisterScoreState>('committing')
  const [errorMessage, setErrorMessage] = createSignal('')
  const [username, setUsername] = createSignal(authSession.user?.username ?? null)
  const [registerResult, setRegisterResult] = createSignal<PlayerDataResult | null>(null)

  useDocumentTitle(REGISTER_SCORE_MESSAGES.title)

  const changes = createMemo(() => registerResult()?.changes ?? [])
  const songTitleByIdx = (change: PlayerDataRecordChange) => {
    const fullSongs = songsData.songsResponse()?.songs ?? []
    const worldsendSongs = songsData.worldsendSongsResponse()?.songs ?? []

    return (
      findSongTitleByOfficialIdx(
        change.record_type === 'worldsend' ? worldsendSongs : fullSongs,
        change.idx
      ) ?? REGISTER_SCORE_MESSAGES.unknownSongTitle
    )
  }

  onMount(async () => {
    const uploadToken = normalizeUploadTokenParam(searchParams.token)
    if (!uploadToken || !isValidUploadToken(uploadToken)) {
      setErrorMessage(REGISTER_SCORE_MESSAGES.invalidToken)
      setState('error')
      return
    }

    try {
      const result = await postPlayerDataCommit(uploadToken)
      setRegisterResult(result)
      if ((result.changes ?? []).some((change) => change.record_type === 'full')) {
        songsData.ensureSongsLoaded()
      }
      if ((result.changes ?? []).some((change) => change.record_type === 'worldsend')) {
        songsData.ensureWorldsendSongsLoaded()
      }
      if (!username()) {
        try {
          const me = await fetchMe({ redirectOnUnauthorized: false })
          setUsername(me.username)
        } catch {
          setUsername(null)
        }
      }
      setState('success')
    } catch (error) {
      setErrorMessage(resolveRegisterScoreErrorMessage(error))
      setState('error')
    }
  })

  const userPagePath = () => {
    const currentUsername = username()
    return currentUsername ? `/users/${encodeURIComponent(currentUsername)}` : null
  }

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <h1 class="text-2xl font-semibold">{REGISTER_SCORE_MESSAGES.title}</h1>

      <Switch>
        <Match when={state() === 'committing'}>
          <section class="rounded-lg border border-border bg-surface p-6">
            <Loading />
            <p class="mt-4 text-center text-sm text-text-muted" aria-live="polite">
              {REGISTER_SCORE_MESSAGES.processing}
            </p>
          </section>
        </Match>

        <Match when={state() === 'success'}>
          <section class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900 shadow-sm sm:p-6">
            <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3">
                <CheckCircle class="h-7 w-7 text-emerald-600" aria-hidden="true" />
                <p class="text-lg font-semibold">{REGISTER_SCORE_MESSAGES.success}</p>
              </div>
              <Switch>
                <Match when={userPagePath()}>
                  {(path) => (
                    <A
                      href={path()}
                      class="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      {REGISTER_SCORE_MESSAGES.myPageLink}
                      <ArrowRight class="h-4 w-4" aria-hidden="true" />
                    </A>
                  )}
                </Match>
                <Match when={true}>
                  <p class="text-sm text-red-600" aria-live="polite">
                    {REGISTER_SCORE_MESSAGES.missingUser}
                  </p>
                </Match>
              </Switch>
            </div>

            <Show when={registerResult()}>
              {(result) => (
                <div class="flex flex-col gap-5">
                  <RegisterScoreProfileCard result={result()} />

                  <section class="flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-3">
                      <h2 class="flex items-center gap-2 text-lg font-semibold">
                        <ListMusic class="h-5 w-5 text-emerald-600" aria-hidden="true" />
                        {REGISTER_SCORE_MESSAGES.changedSongsTitle}
                      </h2>
                      <span class="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-700 shadow-sm">
                        {changes().length}
                      </span>
                    </div>

                    <Show
                      when={changes().length > 0}
                      fallback={
                        <p class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500 shadow-sm">
                          {REGISTER_SCORE_MESSAGES.changedSongsEmpty}
                        </p>
                      }
                    >
                      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <For each={changes()}>
                          {(change) => (
                            <RegisterScoreChangeCard
                              change={change}
                              songTitle={songTitleByIdx(change)}
                            />
                          )}
                        </For>
                      </div>
                    </Show>
                  </section>
                </div>
              )}
            </Show>
          </section>
        </Match>

        <Match when={state() === 'error'}>
          <p class="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
            {errorMessage()}
          </p>
        </Match>
      </Switch>
    </main>
  )
}

export default RegisterScorePage
