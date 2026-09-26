import { RadioGroup } from '@kobalte/core/radio-group'
import { TextField } from '@kobalte/core/text-field'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import {
  CircleCheck,
  CircleSlash,
  CircleX,
  LoaderCircle,
  Play,
  Terminal,
  TriangleAlert,
  UserRound,
} from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Match, Show, Switch } from 'solid-js'
import { startSongBatchJob } from '../../api/songBatch'
import { Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { AppConfirmDialog } from '../../components/common/AppConfirmDialog'
import { CheckboxField } from '../../components/common/CheckboxField'
import { FILTER_DIALOG_FIELD_FOCUS_CLASS } from '../../components/common/filterStyles'
import { SelectableCardItem } from '../../components/common/SelectableCardButton'
import { ADMIN_SONG_BATCH_PAGE_TITLE } from '../../constants/pageTitles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { songBatchJobsQueryOptions, songBatchQueryKeys } from '../../queries/songBatch'
import type { SongBatchJobDTO, SongBatchJobStatus, SongBatchMode } from '../../types/api'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { formatJstDateTime } from '../../utils/jstDateTime'
import {
  findRunningSongBatchJob,
  formatSongBatchDuration,
  isSongBatchConfirmationSatisfied,
  resolveSongBatchStatusTone,
  type SongBatchStatusTone,
} from '../../utils/songBatchJob'
import {
  ADMIN_SONG_BATCH_COPY,
  SONG_BATCH_CONFIRMATION_COPY,
  SONG_BATCH_MODE_LABELS,
  SONG_BATCH_MODE_OPTIONS,
  SONG_BATCH_STATUS_LABELS,
  SONG_BATCH_TRIGGER_LABELS,
} from './adminSongBatch.constants'

/** ジョブ状態の色調ごとのバッジスタイル */
const STATUS_TONE_CLASS: Record<SongBatchStatusTone, string> = {
  info: 'border-info-border bg-info-bg text-info',
  success: 'border-success-border bg-success-bg text-success',
  warning: 'border-warning-border bg-warning-bg text-warning',
  danger: 'border-danger-border bg-danger-bg text-danger',
}

const STATUS_ICON_CLASS = 'h-4 w-4 shrink-0'

/** 確認文言の入力欄。スマートフォンでの自動ズームを避けるため文字サイズを16pxにする */
const CONFIRMATION_INPUT_CLASS = `mt-2 w-full rounded border border-border-strong bg-surface px-3 py-2 font-sans text-base text-text hover:border-input-border-hover ${FILTER_DIALOG_FIELD_FOCUS_CLASS}`

/**
 * RadioGroup から受け取った値が実行モードかどうか判定する。
 *
 * @param value - RadioGroup の選択値。
 * @returns 実行モードの場合は true。
 */
const isSongBatchMode = (value: string): value is SongBatchMode =>
  SONG_BATCH_MODE_OPTIONS.some((option) => option.value === value)

/**
 * ジョブ状態に対応するアイコンを表示する。
 *
 * @param props.status - 楽曲バッチジョブの状態。
 * @returns 状態を表すアイコン。
 */
const SongBatchStatusIcon = (props: { status: SongBatchJobStatus }): JSX.Element => (
  <Switch>
    <Match when={props.status === 'RUNNING'}>
      <LoaderCircle class={`${STATUS_ICON_CLASS} animate-spin`} aria-hidden="true" />
    </Match>
    <Match when={props.status === 'SUCCEEDED'}>
      <CircleCheck class={STATUS_ICON_CLASS} aria-hidden="true" />
    </Match>
    <Match when={props.status === 'SUCCEEDED_WITH_WARNINGS'}>
      <TriangleAlert class={STATUS_ICON_CLASS} aria-hidden="true" />
    </Match>
    <Match when={props.status === 'FAILED'}>
      <CircleX class={STATUS_ICON_CLASS} aria-hidden="true" />
    </Match>
    <Match when={props.status === 'INTERRUPTED'}>
      <CircleSlash class={STATUS_ICON_CLASS} aria-hidden="true" />
    </Match>
  </Switch>
)

/**
 * 楽曲バッチの実行履歴1件をカードで表示する。
 *
 * @param props.job - 表示する楽曲バッチジョブ。
 * @returns 状態、実行条件、起動元、日時、失敗理由を含むカード。
 */
const SongBatchJobCard = (props: { job: SongBatchJobDTO }): JSX.Element => {
  const startedAt = createMemo(() => formatJstDateTime(props.job.started_at))
  const duration = createMemo(() => formatSongBatchDuration(props.job))

  return (
    <li class="rounded-lg border border-border bg-surface p-4">
      <div class="flex flex-wrap items-center gap-2">
        <span
          class={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-semibold ${
            STATUS_TONE_CLASS[resolveSongBatchStatusTone(props.job.status)]
          }`}
        >
          <SongBatchStatusIcon status={props.job.status} />
          {SONG_BATCH_STATUS_LABELS[props.job.status]}
        </span>
        <span class="font-semibold text-text">{SONG_BATCH_MODE_LABELS[props.job.mode]}</span>
        <Show when={props.job.fill_missing_release_date}>
          <span class="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
            {ADMIN_SONG_BATCH_COPY.fillMissingReleaseDateBadge}
          </span>
        </Show>
        <span class="ml-auto inline-flex items-center gap-1 font-sans text-sm text-text-muted">
          <Show
            when={props.job.trigger === 'ADMIN'}
            fallback={
              <>
                <Terminal class={STATUS_ICON_CLASS} aria-hidden="true" />
                {SONG_BATCH_TRIGGER_LABELS.CLI}
              </>
            }
          >
            <UserRound class={STATUS_ICON_CLASS} aria-hidden="true" />
            <span class="sr-only">{SONG_BATCH_TRIGGER_LABELS.ADMIN}: </span>
            {props.job.requested_by ?? ADMIN_SONG_BATCH_COPY.deletedRequester}
          </Show>
        </span>
      </div>

      <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt class="text-text-muted">{ADMIN_SONG_BATCH_COPY.startedAt}</dt>
          <dd class="font-medium text-text">
            <Show when={startedAt()} fallback={ADMIN_SONG_BATCH_COPY.startedAtUnknown}>
              {(formatted) => <time datetime={props.job.started_at}>{formatted()}</time>}
            </Show>
          </dd>
        </div>
        <Show when={duration()}>
          {(value) => (
            <div>
              <dt class="text-text-muted">{ADMIN_SONG_BATCH_COPY.duration}</dt>
              <dd class="font-medium text-text">{value()}</dd>
            </div>
          )}
        </Show>
        <Show when={props.job.warning_count > 0}>
          <div>
            <dt class="text-text-muted">{ADMIN_SONG_BATCH_COPY.warningCount}</dt>
            <dd class="font-medium text-warning">{props.job.warning_count}</dd>
          </div>
        </Show>
      </dl>

      <Show when={props.job.error_message}>
        {(message) => (
          <p class="mt-3 whitespace-pre-wrap break-words rounded-md bg-danger-bg p-3 font-sans text-sm text-danger">
            {message()}
          </p>
        )}
      </Show>
    </li>
  )
}

/**
 * ADMINが楽曲バッチを実行し、実行履歴を確認する画面を表示する。
 *
 * @returns 実行フォーム、確認ダイアログ、実行履歴。
 */
const AdminSongBatchPage = (): JSX.Element => {
  useDocumentTitle(ADMIN_SONG_BATCH_PAGE_TITLE)

  const queryClient = useQueryClient()
  const jobsQuery = useQuery(() => songBatchJobsQueryOptions())
  const startMutation = useMutation(() => ({
    mutationFn: startSongBatchJob,
    onSettled: () => queryClient.invalidateQueries({ queryKey: songBatchQueryKeys.jobs }),
  }))

  const [mode, setMode] = createSignal<SongBatchMode>('NORMAL')
  const [fillMissingReleaseDate, setFillMissingReleaseDate] = createSignal(false)
  const [confirmationOpen, setConfirmationOpen] = createSignal(false)
  const [confirmationInput, setConfirmationInput] = createSignal('')
  const [actionError, setActionError] = createSignal('')
  const [actionSuccess, setActionSuccess] = createSignal('')

  const runningJob = createMemo(() => findRunningSongBatchJob(jobsQuery.data ?? []))
  // 実行中かどうか分からない間は実行させず、サーバー側の排他だけに頼らない
  const isRunDisabled = createMemo(
    () => jobsQuery.data === undefined || runningJob() !== null || startMutation.isPending
  )
  const confirmationCopy = createMemo(() => SONG_BATCH_CONFIRMATION_COPY[mode()])
  const runVariant = createMemo(() => (mode() === 'MAJOR_UPDATE' ? 'danger' : 'primary'))

  /**
   * 確認ダイアログを開く。表示中は実行条件を変更できないため、確定時の値をそのまま送信する。
   *
   * @param event - 実行フォームの送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    if (isRunDisabled()) return

    setActionError('')
    setActionSuccess('')
    setConfirmationInput('')
    setConfirmationOpen(true)
  }

  /**
   * 確認済みの実行条件でジョブの開始を一度だけ要求する。
   *
   * @returns なし。
   */
  const handleConfirm = (): void => {
    if (startMutation.isPending || !isSongBatchConfirmationSatisfied(mode(), confirmationInput())) {
      return
    }

    startMutation.mutate(
      { mode: mode(), fill_missing_release_date: fillMissingReleaseDate() },
      {
        onSuccess: () => setActionSuccess(ADMIN_SONG_BATCH_COPY.startSuccess),
        onError: (error) =>
          setActionError(toUserFriendlyErrorMessage(error, ADMIN_SONG_BATCH_COPY.startFailure)),
        onSettled: () => setConfirmationOpen(false),
      }
    )
  }

  return (
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <h1 class="text-2xl font-semibold text-text">{ADMIN_SONG_BATCH_COPY.heading}</h1>

      <form
        class="rounded-lg border border-border bg-surface p-4 sm:p-5"
        aria-labelledby="song-batch-run-heading"
        aria-busy={startMutation.isPending}
        onSubmit={handleSubmit}
      >
        <h2 id="song-batch-run-heading" class="text-sm font-medium text-text-muted">
          {ADMIN_SONG_BATCH_COPY.runSection}
        </h2>

        <RadioGroup
          name="song-batch-mode"
          value={mode()}
          onChange={(value) => {
            if (isSongBatchMode(value)) setMode(value)
          }}
          disabled={isRunDisabled()}
          class="mt-3 space-y-1"
        >
          <RadioGroup.Label class="block text-sm font-medium text-text-muted">
            {ADMIN_SONG_BATCH_COPY.modeLabel}
          </RadioGroup.Label>
          <div class="grid gap-2 sm:grid-cols-2">
            <For each={SONG_BATCH_MODE_OPTIONS}>
              {(option) => (
                <SelectableCardItem
                  value={option.value}
                  title={option.label}
                  description={option.description}
                  ariaLabel={option.label}
                  danger={option.value === 'MAJOR_UPDATE'}
                  density="compact"
                  class="rounded-md py-3"
                />
              )}
            </For>
          </div>
        </RadioGroup>

        <CheckboxField
          class="mt-4"
          checked={fillMissingReleaseDate()}
          onChange={setFillMissingReleaseDate}
          disabled={isRunDisabled()}
          label={ADMIN_SONG_BATCH_COPY.fillMissingReleaseDateLabel}
          description={ADMIN_SONG_BATCH_COPY.fillMissingReleaseDateDescription}
        />

        <div class="mt-5 flex justify-end">
          <AppButton
            type="submit"
            variant={runVariant()}
            disabled={isRunDisabled()}
            leftIcon={
              <Show when={runningJob()} fallback={<Play class="h-4 w-4" aria-hidden="true" />}>
                <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
              </Show>
            }
          >
            {runningJob() ? ADMIN_SONG_BATCH_COPY.runningButton : ADMIN_SONG_BATCH_COPY.runButton}
          </AppButton>
        </div>

        <Show when={actionError()}>
          <p class="mt-3 text-sm text-danger" role="alert">
            {actionError()}
          </p>
        </Show>
        <Show when={actionSuccess()}>
          <p class="mt-3 text-sm text-success" role="status">
            {actionSuccess()}
          </p>
        </Show>
      </form>

      <section aria-labelledby="song-batch-history-heading">
        <h2 id="song-batch-history-heading" class="text-sm font-medium text-text-muted">
          {ADMIN_SONG_BATCH_COPY.historySection}
        </h2>
        <Switch>
          <Match when={jobsQuery.isPending}>
            <div class="flex min-h-48 items-center justify-center" aria-busy="true">
              <Loading />
              <span class="sr-only">{ADMIN_SONG_BATCH_COPY.loadingHistory}</span>
            </div>
          </Match>
          <Match when={jobsQuery.isError && jobsQuery.data === undefined}>
            <div class="mt-3 rounded-lg border border-danger-border bg-danger-bg p-4">
              <p class="text-sm text-danger" role="alert">
                {ADMIN_SONG_BATCH_COPY.historyLoadFailed}
              </p>
              <AppButton variant="surface" class="mt-3" onClick={() => void jobsQuery.refetch()}>
                {ADMIN_SONG_BATCH_COPY.retryButton}
              </AppButton>
            </div>
          </Match>
          <Match when={jobsQuery.data}>
            {(jobs) => (
              <>
                <Show when={jobsQuery.isError}>
                  <div class="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-danger-border bg-danger-bg px-3 py-2">
                    <p class="text-sm text-danger" role="alert">
                      {ADMIN_SONG_BATCH_COPY.historyRefreshFailed}
                    </p>
                    <AppButton variant="surface" size="sm" onClick={() => void jobsQuery.refetch()}>
                      {ADMIN_SONG_BATCH_COPY.retryButton}
                    </AppButton>
                  </div>
                </Show>
                <Show
                  when={jobs().length > 0}
                  fallback={
                    <p class="mt-3 text-sm text-text-muted">{ADMIN_SONG_BATCH_COPY.emptyHistory}</p>
                  }
                >
                  <ul class="mt-3 flex flex-col gap-3">
                    <For each={jobs()}>{(job) => <SongBatchJobCard job={job} />}</For>
                  </ul>
                </Show>
              </>
            )}
          </Match>
        </Switch>
      </section>

      <AppConfirmDialog
        open={confirmationOpen()}
        onOpenChange={setConfirmationOpen}
        title={confirmationCopy().title}
        description={confirmationCopy().description}
        cancelLabel={ADMIN_SONG_BATCH_COPY.cancelButton}
        confirmLabel={
          startMutation.isPending
            ? ADMIN_SONG_BATCH_COPY.submitting
            : confirmationCopy().confirmButton
        }
        confirmVariant={runVariant()}
        pending={startMutation.isPending}
        confirmDisabled={!isSongBatchConfirmationSatisfied(mode(), confirmationInput())}
        onConfirm={handleConfirm}
      >
        <Show when={mode() === 'MAJOR_UPDATE'}>
          <TextField
            class="mt-4"
            value={confirmationInput()}
            onChange={setConfirmationInput}
            disabled={startMutation.isPending}
          >
            <TextField.Label class="block text-sm font-medium text-text-muted">
              {ADMIN_SONG_BATCH_COPY.confirmationInputLabel}
            </TextField.Label>
            <TextField.Input autocomplete="off" class={CONFIRMATION_INPUT_CLASS} />
          </TextField>
        </Show>
      </AppConfirmDialog>
    </div>
  )
}

export default AdminSongBatchPage
