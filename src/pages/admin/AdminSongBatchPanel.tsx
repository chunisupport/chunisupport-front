import { RadioGroup } from '@kobalte/core/radio-group'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { Wrench } from 'lucide-solid'
import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  untrack,
} from 'solid-js'
import { startSongBatchJob } from '../../api/songBatch'
import { AppConfirmDialog } from '../../components/common/AppConfirmDialog'
import { showSuccessToast } from '../../components/common/AppToast'
import { CheckboxField } from '../../components/common/CheckboxField'
import { SelectableCardItem } from '../../components/common/SelectableCardButton'
import { songBatchJobsQueryOptions, songBatchQueryKeys } from '../../queries/songBatch'
import { availability } from '../../stores/availability'
import type { SongBatchJobDTO, SongBatchMode } from '../../types/api'
import { refreshAvailability } from '../../usecases/availability/refreshAvailability'
import { findRunningBatchJob } from '../../utils/batchJob'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  getSongBatchConfirmationDelaySeconds,
  isSongBatchModeAvailable,
} from '../../utils/songBatchJob'
import {
  BATCH_JOB_ICON_CLASS,
  BatchJobCard,
  BatchJobHistory,
  BatchJobRunButton,
} from './AdminBatchJob'
import {
  BATCH_JOB_COPY,
  formatSongBatchConfirmLabel,
  SONG_BATCH_CONFIRMATION_COPY,
  SONG_BATCH_COPY,
  SONG_BATCH_MODE_LABELS,
  SONG_BATCH_MODE_OPTIONS,
} from './adminBatch.constants'

/** 確認ダイアログの待機秒数を減らす間隔（ミリ秒） */
const CONFIRMATION_COUNTDOWN_INTERVAL_MS = 1_000

/**
 * RadioGroup から受け取った値が実行モードかどうか判定する。
 *
 * @param value - RadioGroup の選択値。
 * @returns 実行モードの場合は true。
 */
const isSongBatchMode = (value: string): value is SongBatchMode =>
  SONG_BATCH_MODE_OPTIONS.some((option) => option.value === value)

/**
 * 楽曲バッチの実行履歴1件を、実行モードと除外データソース数を添えて表示する。
 *
 * @param props.job - 表示する楽曲バッチジョブ。
 * @returns 楽曲バッチ固有の項目を含む実行履歴カード。
 */
const SongBatchJobCard = (props: { job: SongBatchJobDTO }): JSX.Element => (
  <BatchJobCard
    job={props.job}
    summary={
      <>
        <span class="font-semibold text-text">{SONG_BATCH_MODE_LABELS[props.job.mode]}</span>
        <Show when={props.job.fill_missing_release_date}>
          <span class="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
            {SONG_BATCH_COPY.fillMissingReleaseDateBadge}
          </span>
        </Show>
      </>
    }
    details={
      <Show when={props.job.warning_count > 0}>
        <div>
          <dt class="text-text-muted">{SONG_BATCH_COPY.warningCount}</dt>
          <dd class="font-medium text-warning">{props.job.warning_count}</dd>
        </div>
      </Show>
    }
  />
)

/**
 * バッチ管理画面の楽曲バッチタブ。楽曲バッチを実行し、実行履歴を確認する。
 *
 * @returns 実行フォーム、確認ダイアログ、実行履歴。
 */
const AdminSongBatchPanel = (): JSX.Element => {
  const queryClient = useQueryClient()
  const jobsQuery = useQuery(() => songBatchJobsQueryOptions())
  const startMutation = useMutation(() => ({
    mutationFn: startSongBatchJob,
    onSettled: () => queryClient.invalidateQueries({ queryKey: songBatchQueryKeys.jobs }),
  }))

  const [mode, setMode] = createSignal<SongBatchMode>('NORMAL')
  const [fillMissingReleaseDate, setFillMissingReleaseDate] = createSignal(true)
  const [confirmationOpen, setConfirmationOpen] = createSignal(false)
  const [confirmationWaitSeconds, setConfirmationWaitSeconds] = createSignal(0)
  const [actionError, setActionError] = createSignal('')

  const isMaintenance = createMemo(() => availability.state.kind === 'maintenance')
  const runningJob = createMemo(() => findRunningBatchJob(jobsQuery.data ?? []))
  // 実行中かどうか分からない間は実行させず、サーバー側の排他だけに頼らない
  const isRunDisabled = createMemo(
    () => jobsQuery.data === undefined || runningJob() !== null || startMutation.isPending
  )
  const confirmationCopy = createMemo(() => SONG_BATCH_CONFIRMATION_COPY[mode()])
  const runVariant = createMemo(() => (mode() === 'MAJOR_UPDATE' ? 'danger' : 'primary'))
  const isConfirmDisabled = createMemo(
    () => confirmationWaitSeconds() > 0 || !isSongBatchModeAvailable(mode(), isMaintenance())
  )

  // 表示中のメンテナンス状態が古いまま大型アップデートを選べないよう、開いた時点で再確認する
  onMount(() => {
    void refreshAvailability()
  })

  // メンテナンスが終了したら大型アップデートの選択と確認を取り消す
  createEffect(() => {
    if (isSongBatchModeAvailable(mode(), isMaintenance())) return
    setConfirmationOpen(false)
    setMode('NORMAL')
  })

  // 確認ダイアログを開いている間だけ、実行ボタンを有効化するまでの秒数を数える
  createEffect(() => {
    if (!confirmationOpen()) return

    setConfirmationWaitSeconds(getSongBatchConfirmationDelaySeconds(untrack(mode)))
    const intervalId = window.setInterval(() => {
      setConfirmationWaitSeconds((seconds) => Math.max(0, seconds - 1))
    }, CONFIRMATION_COUNTDOWN_INTERVAL_MS)
    onCleanup(() => window.clearInterval(intervalId))
  })

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
    setConfirmationOpen(true)
  }

  /**
   * 確認済みの実行条件でジョブの開始を一度だけ要求する。成功時はトーストで通知する。
   *
   * @returns なし。
   */
  const handleConfirm = (): void => {
    if (startMutation.isPending || isConfirmDisabled()) return

    startMutation.mutate(
      { mode: mode(), fill_missing_release_date: fillMissingReleaseDate() },
      {
        onSuccess: () => showSuccessToast(SONG_BATCH_COPY.startSuccess),
        onError: (error) =>
          setActionError(toUserFriendlyErrorMessage(error, SONG_BATCH_COPY.startFailure)),
        onSettled: () => setConfirmationOpen(false),
      }
    )
  }

  return (
    <div class="flex flex-col gap-4">
      <form
        class="rounded-lg border border-border bg-surface p-4 sm:p-5"
        aria-labelledby="song-batch-run-heading"
        aria-busy={startMutation.isPending}
        onSubmit={handleSubmit}
      >
        <h2 id="song-batch-run-heading" class="text-sm font-medium text-text-muted">
          {BATCH_JOB_COPY.runSection}
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
            {SONG_BATCH_COPY.modeLabel}
          </RadioGroup.Label>
          <div class="grid gap-2 sm:grid-cols-2">
            <For each={SONG_BATCH_MODE_OPTIONS}>
              {(option) => (
                <SelectableCardItem
                  value={option.value}
                  title={option.label}
                  description={option.description}
                  ariaLabel={option.label}
                  disabled={!isSongBatchModeAvailable(option.value, isMaintenance())}
                  danger={option.value === 'MAJOR_UPDATE'}
                  density="compact"
                  class="rounded-md py-3"
                >
                  <Show when={!isSongBatchModeAvailable(option.value, isMaintenance())}>
                    <span title={SONG_BATCH_COPY.maintenanceOnly}>
                      <Wrench class={BATCH_JOB_ICON_CLASS} aria-hidden="true" />
                      <span class="sr-only">{SONG_BATCH_COPY.maintenanceOnly}</span>
                    </span>
                  </Show>
                </SelectableCardItem>
              )}
            </For>
          </div>
        </RadioGroup>

        <CheckboxField
          class="mt-4"
          checked={fillMissingReleaseDate()}
          onChange={setFillMissingReleaseDate}
          disabled={isRunDisabled()}
          label={SONG_BATCH_COPY.fillMissingReleaseDateLabel}
        />

        <div class="mt-5 flex justify-end">
          <BatchJobRunButton
            running={runningJob() !== null}
            disabled={isRunDisabled()}
            variant={runVariant()}
          />
        </div>

        <Show when={actionError()}>
          <p class="mt-3 text-sm text-danger" role="alert">
            {actionError()}
          </p>
        </Show>
      </form>

      <BatchJobHistory
        headingId="song-batch-history-heading"
        query={jobsQuery}
        renderJob={(job) => <SongBatchJobCard job={job} />}
      />

      <AppConfirmDialog
        open={confirmationOpen()}
        onOpenChange={setConfirmationOpen}
        title={confirmationCopy().title}
        description={confirmationCopy().description}
        cancelLabel={BATCH_JOB_COPY.cancelButton}
        confirmLabel={
          startMutation.isPending
            ? BATCH_JOB_COPY.submitting
            : formatSongBatchConfirmLabel(
                confirmationCopy().confirmButton,
                confirmationWaitSeconds()
              )
        }
        confirmVariant={runVariant()}
        pending={startMutation.isPending}
        confirmDisabled={isConfirmDisabled()}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

export default AdminSongBatchPanel
