import type { UseQueryResult } from '@tanstack/solid-query'
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
import { createMemo, For, Match, Show, Switch } from 'solid-js'
import { Loading } from '../../components'
import { AppButton, type AppButtonVariant } from '../../components/common/AppButton'
import type { BatchJobDTO, BatchJobStatus } from '../../types/api'
import {
  type BatchJobStatusTone,
  formatBatchJobDuration,
  resolveBatchJobStatusTone,
} from '../../utils/batchJob'
import { formatJstDateTime } from '../../utils/jstDateTime'
import {
  BATCH_JOB_COPY,
  BATCH_JOB_STATUS_LABELS,
  BATCH_JOB_TRIGGER_LABELS,
} from './adminBatch.constants'

/** ジョブ状態の色調ごとのバッジスタイル */
const STATUS_TONE_CLASS: Record<BatchJobStatusTone, string> = {
  info: 'border-info-border bg-info-bg text-info',
  success: 'border-success-border bg-success-bg text-success',
  warning: 'border-warning-border bg-warning-bg text-warning',
  danger: 'border-danger-border bg-danger-bg text-danger',
}

/** 実行履歴で使う小さいアイコンのクラス */
export const BATCH_JOB_ICON_CLASS = 'h-4 w-4 shrink-0'

type BatchJobRunButtonProps = {
  /** 実行中のジョブがあるか */
  running: boolean
  /** ボタンを無効化するか */
  disabled: boolean
  /** ボタンの配色 */
  variant: AppButtonVariant
}

/**
 * 実行フォームの送信ボタンを表示する。実行中はスピナーと「実行中」を表示する。
 *
 * @param props - 実行中かどうか、無効化するかどうか、配色。
 * @returns 実行フォームの送信ボタン。
 */
export const BatchJobRunButton = (props: BatchJobRunButtonProps): JSX.Element => (
  <AppButton
    type="submit"
    variant={props.variant}
    disabled={props.disabled}
    leftIcon={
      <Show when={props.running} fallback={<Play class="h-4 w-4" aria-hidden="true" />}>
        <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
      </Show>
    }
  >
    {props.running ? BATCH_JOB_COPY.runningButton : BATCH_JOB_COPY.runButton}
  </AppButton>
)

/**
 * ジョブ状態に対応するアイコンを表示する。
 *
 * @param props.status - バッチジョブの状態。
 * @returns 状態を表すアイコン。
 */
const BatchJobStatusIcon = (props: { status: BatchJobStatus }): JSX.Element => (
  <Switch>
    <Match when={props.status === 'RUNNING'}>
      <LoaderCircle class={`${BATCH_JOB_ICON_CLASS} animate-spin`} aria-hidden="true" />
    </Match>
    <Match when={props.status === 'SUCCEEDED'}>
      <CircleCheck class={BATCH_JOB_ICON_CLASS} aria-hidden="true" />
    </Match>
    <Match when={props.status === 'SUCCEEDED_WITH_WARNINGS'}>
      <TriangleAlert class={BATCH_JOB_ICON_CLASS} aria-hidden="true" />
    </Match>
    <Match when={props.status === 'FAILED'}>
      <CircleX class={BATCH_JOB_ICON_CLASS} aria-hidden="true" />
    </Match>
    <Match when={props.status === 'INTERRUPTED'}>
      <CircleSlash class={BATCH_JOB_ICON_CLASS} aria-hidden="true" />
    </Match>
  </Switch>
)

type BatchJobCardProps = {
  /** 表示するバッチジョブ */
  job: BatchJobDTO
  /** 状態バッジの横に表示する、バッチ固有の実行条件 */
  summary?: JSX.Element
  /** 開始日時・所要時間に続けて表示する、バッチ固有の項目（`<div><dt/><dd/></div>` の並び） */
  details?: JSX.Element
}

/**
 * バッチの実行履歴1件をカードで表示する。
 *
 * @param props - 表示するジョブと、バッチ固有の実行条件・項目。
 * @returns 状態、起動元、日時、失敗理由を含むカード。
 */
export const BatchJobCard = (props: BatchJobCardProps): JSX.Element => {
  const startedAt = createMemo(() => formatJstDateTime(props.job.started_at))
  const duration = createMemo(() => formatBatchJobDuration(props.job))

  return (
    <li class="rounded-lg border border-border bg-surface p-4">
      <div class="flex flex-wrap items-center gap-2">
        <span
          class={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-semibold ${
            STATUS_TONE_CLASS[resolveBatchJobStatusTone(props.job.status)]
          }`}
        >
          <BatchJobStatusIcon status={props.job.status} />
          {BATCH_JOB_STATUS_LABELS[props.job.status]}
        </span>
        {props.summary}
        <span class="ml-auto inline-flex items-center gap-1 font-sans text-sm text-text-muted">
          <Show
            when={props.job.trigger === 'ADMIN'}
            fallback={
              <>
                <Terminal class={BATCH_JOB_ICON_CLASS} aria-hidden="true" />
                {BATCH_JOB_TRIGGER_LABELS.CLI}
              </>
            }
          >
            <UserRound class={BATCH_JOB_ICON_CLASS} aria-hidden="true" />
            <span class="sr-only">{BATCH_JOB_TRIGGER_LABELS.ADMIN}: </span>
            {props.job.requested_by ?? BATCH_JOB_COPY.deletedRequester}
          </Show>
        </span>
      </div>

      <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt class="text-text-muted">{BATCH_JOB_COPY.startedAt}</dt>
          <dd class="font-medium text-text">
            <Show when={startedAt()} fallback={BATCH_JOB_COPY.startedAtUnknown}>
              {(formatted) => <time datetime={props.job.started_at}>{formatted()}</time>}
            </Show>
          </dd>
        </div>
        <Show when={duration()}>
          {(value) => (
            <div>
              <dt class="text-text-muted">{BATCH_JOB_COPY.duration}</dt>
              <dd class="font-medium text-text">{value()}</dd>
            </div>
          )}
        </Show>
        {props.details}
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

type BatchJobHistoryProps<TJob extends BatchJobDTO> = {
  /** 見出し要素のID。セクションのアクセシブルネームに使う */
  headingId: string
  /** 実行履歴の query */
  query: UseQueryResult<TJob[]>
  /** 実行履歴1件を描画する */
  renderJob: (job: TJob) => JSX.Element
}

/**
 * バッチの実行履歴を、読み込み中・取得失敗・空の状態を含めて表示する。
 *
 * @param props - 見出しID、実行履歴の query、1件の描画方法。
 * @returns 実行履歴セクション。
 */
export const BatchJobHistory = <TJob extends BatchJobDTO>(
  props: BatchJobHistoryProps<TJob>
): JSX.Element => (
  <section aria-labelledby={props.headingId}>
    <h2 id={props.headingId} class="text-sm font-medium text-text-muted">
      {BATCH_JOB_COPY.historySection}
    </h2>
    <Switch>
      <Match when={props.query.isPending}>
        <div class="flex min-h-48 items-center justify-center" aria-busy="true">
          <Loading />
          <span class="sr-only">{BATCH_JOB_COPY.loadingHistory}</span>
        </div>
      </Match>
      <Match when={props.query.isError && props.query.data === undefined}>
        <div class="mt-3 rounded-lg border border-danger-border bg-danger-bg p-4">
          <p class="text-sm text-danger" role="alert">
            {BATCH_JOB_COPY.historyLoadFailed}
          </p>
          <AppButton variant="surface" class="mt-3" onClick={() => void props.query.refetch()}>
            {BATCH_JOB_COPY.retryButton}
          </AppButton>
        </div>
      </Match>
      <Match when={props.query.data}>
        {(jobs) => (
          <>
            <Show when={props.query.isError}>
              <div class="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-danger-border bg-danger-bg px-3 py-2">
                <p class="text-sm text-danger" role="alert">
                  {BATCH_JOB_COPY.historyRefreshFailed}
                </p>
                <AppButton variant="surface" size="sm" onClick={() => void props.query.refetch()}>
                  {BATCH_JOB_COPY.retryButton}
                </AppButton>
              </div>
            </Show>
            <Show
              when={jobs().length > 0}
              fallback={<p class="mt-3 text-sm text-text-muted">{BATCH_JOB_COPY.emptyHistory}</p>}
            >
              <ul class="mt-3 flex flex-col gap-3">
                <For each={jobs()}>{(job) => props.renderJob(job)}</For>
              </ul>
            </Show>
          </>
        )}
      </Match>
    </Switch>
  </section>
)
