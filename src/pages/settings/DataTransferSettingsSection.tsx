import { FileField, type Details as FileFieldDetails } from '@kobalte/core/file-field'
import { Download, FileUp, X } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal, For, Show } from 'solid-js'
import {
  exportUserDataTransfer,
  importUserDataTransfer,
  validateUserDataTransfer,
} from '../../api/settings'
import { Loading } from '../../components'
import { AppButton, getAppButtonClass } from '../../components/common/AppButton'
import type { DataTransferCountsResponse } from '../../types/api'
import { clearClientCache } from '../../usecases/cache/clearClientCache'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  DATA_TRANSFER_ACCEPT,
  DATA_TRANSFER_BLOCKER_MESSAGES,
  DATA_TRANSFER_COPY,
  DATA_TRANSFER_COUNT_ITEMS,
  DATA_TRANSFER_MAX_FILE_SIZE_BYTES,
} from './DataTransferSettings.constants'

type DataTransferSettingsSectionProps = {
  /** 現在のアカウントがプレイヤーデータを保持しているか */
  hasUserData: boolean
  /** インポート後に設定画面のユーザー情報を再取得する処理 */
  onImported: () => Promise<void>
}

type DataTransferCountsProps = {
  /** セクション別の移行対象件数 */
  counts: DataTransferCountsResponse
}

/**
 * セクション別の移行対象件数を一覧表示する。
 *
 * @param props - APIが返した移行対象件数。
 * @returns 件数一覧のJSX要素。
 */
const DataTransferCounts: Component<DataTransferCountsProps> = (props) => (
  <dl class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
    <For each={DATA_TRANSFER_COUNT_ITEMS}>
      {(item) => (
        <div class="flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2">
          <dt class="text-sm text-text-muted">{item.label}</dt>
          <dd class="font-semibold text-text">{props.counts[item.key].toLocaleString('ja-JP')}</dd>
        </div>
      )}
    </For>
  </dl>
)

/**
 * Blobをブラウザのダウンロードとして保存する。
 *
 * @param blob - 保存する署名付き移行JSON。
 * @param filename - ダウンロード時のファイル名。
 * @returns なし。
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

/**
 * ユーザーデータのエクスポート・検証・インポート操作を表示する。
 *
 * @param props - インポート完了後の画面更新処理。
 * @returns データ移行設定セクション。
 */
export const DataTransferSettingsSection: Component<DataTransferSettingsSectionProps> = (props) => {
  const [selectedFile, setSelectedFile] = createSignal<File>()
  const [isImportOpen, setIsImportOpen] = createSignal(false)
  const [validation, setValidation] =
    createSignal<Awaited<ReturnType<typeof validateUserDataTransfer>>>()
  const [exporting, setExporting] = createSignal(false)
  const [validating, setValidating] = createSignal(false)
  const [importing, setImporting] = createSignal(false)
  const [exportError, setExportError] = createSignal('')
  const [exportSuccess, setExportSuccess] = createSignal('')
  const [fileError, setFileError] = createSignal('')
  const [importError, setImportError] = createSignal('')
  const [importSuccess, setImportSuccess] = createSignal('')

  /**
   * エクスポートAPIのレスポンスをJSONファイルとして保存する。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const handleExport = async (): Promise<void> => {
    if (!props.hasUserData) {
      return
    }

    setExportError('')
    setExportSuccess('')
    setExporting(true)
    try {
      const exported = await exportUserDataTransfer()
      downloadBlob(exported.blob, exported.filename)
      setExportSuccess(DATA_TRANSFER_COPY.exportSuccess)
    } catch (error) {
      setExportError(toUserFriendlyErrorMessage(error, DATA_TRANSFER_COPY.exportFailure))
    } finally {
      setExporting(false)
    }
  }

  /**
   * FileFieldの選択内容を取り込み、以前の検証結果を破棄する。
   *
   * @param details - Kobalte FileFieldが返す受付・拒否ファイル。
   * @returns なし。
   */
  const handleFileChange = (details: FileFieldDetails): void => {
    const rejection = details.rejectedFiles[0]
    setFileError(
      rejection?.errors.includes('FILE_TOO_LARGE')
        ? DATA_TRANSFER_COPY.fileTooLarge
        : rejection
          ? DATA_TRANSFER_COPY.invalidFile
          : ''
    )
    setSelectedFile(details.acceptedFiles[0])
    setValidation(undefined)
    setImportError('')
    setImportSuccess('')
  }

  /**
   * 選択された移行ファイルをAPIで検証し、確認内容を表示する。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const handleValidate = async (): Promise<void> => {
    if (props.hasUserData) {
      return
    }

    const file = selectedFile()
    if (!file) {
      setFileError(DATA_TRANSFER_COPY.invalidFile)
      return
    }

    setFileError('')
    setImportError('')
    setImportSuccess('')
    setValidation(undefined)
    setValidating(true)
    try {
      setValidation(await validateUserDataTransfer(file))
    } catch (error) {
      setImportError(toUserFriendlyErrorMessage(error, DATA_TRANSFER_COPY.validationFailure))
    } finally {
      setValidating(false)
    }
  }

  /**
   * 検証時と同じ移行ファイルを再送し、インポートを確定する。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const handleImport = async (): Promise<void> => {
    const file = selectedFile()
    const currentValidation = validation()
    if (props.hasUserData || !file || !currentValidation?.importable) {
      return
    }

    setImportError('')
    setImportSuccess('')
    setImporting(true)
    try {
      await importUserDataTransfer(file)
      await clearClientCache().catch(() => undefined)
      setImportSuccess(DATA_TRANSFER_COPY.importSuccess)
      await props.onImported().catch(() => undefined)
    } catch (error) {
      setImportError(toUserFriendlyErrorMessage(error, DATA_TRANSFER_COPY.importFailure))
    } finally {
      setImporting(false)
    }
  }

  return (
    <section id="data-transfer" class="py-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-text">{DATA_TRANSFER_COPY.title}</h2>
          <p class="mt-1 text-sm text-text-muted">{DATA_TRANSFER_COPY.description}</p>
        </div>
      </div>

      <div class="mt-4 divide-y divide-border border-y border-border">
        <article class="py-4">
          <h3 class="font-semibold text-text">{DATA_TRANSFER_COPY.exportTitle}</h3>
          <p class="mt-1 text-sm text-text-muted">{DATA_TRANSFER_COPY.exportDescription}</p>
          <AppButton
            variant="primary"
            class="mt-4"
            onClick={handleExport}
            disabled={!props.hasUserData || exporting()}
            aria-busy={exporting()}
            leftIcon={
              exporting() ? (
                <Loading size="inline" ariaHidden />
              ) : (
                <Download aria-hidden="true" class="h-4 w-4" />
              )
            }
          >
            {exporting() ? DATA_TRANSFER_COPY.exportingButton : DATA_TRANSFER_COPY.exportButton}
          </AppButton>
          <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
            {exportError()}
          </p>
          <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
            {exportSuccess()}
          </p>
        </article>

        <article class="py-4">
          <h3 class="font-semibold text-text">{DATA_TRANSFER_COPY.importTitle}</h3>
          <p class="mt-1 text-sm text-text-muted">{DATA_TRANSFER_COPY.importDescription}</p>
          <Show
            when={isImportOpen()}
            fallback={
              <AppButton
                class="mt-4"
                onClick={() => setIsImportOpen(true)}
                disabled={props.hasUserData}
              >
                {DATA_TRANSFER_COPY.startImportButton}
              </AppButton>
            }
          >
            <form
              method="post"
              class="mt-4"
              onSubmit={(event) => {
                event.preventDefault()
                void handleValidate()
              }}
            >
              <FileField
                accept={[...DATA_TRANSFER_ACCEPT]}
                maxFileSize={DATA_TRANSFER_MAX_FILE_SIZE_BYTES}
                disabled={props.hasUserData || validating() || importing()}
                validationState={fileError() ? 'invalid' : undefined}
                onFileChange={handleFileChange}
              >
                <FileField.Label class="text-sm font-semibold text-text">
                  {DATA_TRANSFER_COPY.fileLabel}
                </FileField.Label>
                <FileField.Dropzone class="mt-2 flex min-h-36 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface p-4 text-center text-text-muted transition hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring data-disabled:cursor-not-allowed data-disabled:opacity-60">
                  <FileUp aria-hidden="true" class="h-8 w-8" />
                  <span class="text-sm">{DATA_TRANSFER_COPY.dropzone}</span>
                  <FileField.Trigger
                    type="button"
                    class={getAppButtonClass({ variant: 'secondary', size: 'sm' })}
                  >
                    {DATA_TRANSFER_COPY.chooseFile}
                  </FileField.Trigger>
                </FileField.Dropzone>
                <FileField.HiddenInput name="data-transfer-file" />
                <FileField.Description class="mt-2 text-xs text-text-subtle">
                  {DATA_TRANSFER_COPY.fileDescription}
                </FileField.Description>
                <FileField.ErrorMessage class="mt-2 text-sm text-danger">
                  {fileError()}
                </FileField.ErrorMessage>
                <FileField.ItemList>
                  {(file) => (
                    <FileField.Item class="mt-3 flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
                      <FileField.ItemName class="min-w-0 flex-1 truncate font-sans text-sm text-text" />
                      <FileField.ItemSize class="shrink-0 text-xs text-text-subtle" />
                      <FileField.ItemDeleteTrigger
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded text-text-muted hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        aria-label={`${file.name}${DATA_TRANSFER_COPY.removeFileSuffix}`}
                      >
                        <X aria-hidden="true" class="h-4 w-4" />
                      </FileField.ItemDeleteTrigger>
                    </FileField.Item>
                  )}
                </FileField.ItemList>
              </FileField>

              <AppButton
                type="submit"
                class="mt-4"
                disabled={props.hasUserData || !selectedFile() || validating() || importing()}
                aria-busy={validating()}
                leftIcon={validating() ? <Loading size="inline" ariaHidden /> : undefined}
              >
                {validating()
                  ? DATA_TRANSFER_COPY.validatingButton
                  : DATA_TRANSFER_COPY.validateButton}
              </AppButton>
              <AppButton
                class="mt-4 ml-2"
                onClick={() => {
                  setIsImportOpen(false)
                  setSelectedFile(undefined)
                  setValidation(undefined)
                  setFileError('')
                  setImportError('')
                  setImportSuccess('')
                }}
                disabled={validating() || importing()}
              >
                {DATA_TRANSFER_COPY.cancelImportButton}
              </AppButton>
            </form>
          </Show>
          <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
            {importError()}
          </p>
        </article>
      </div>

      <Show when={validation()}>
        {(checked) => (
          <article
            class={`mt-4 rounded-xl border p-4 ${
              checked().importable
                ? 'border-success-border bg-success-bg'
                : 'border-danger-border bg-danger-bg'
            }`}
          >
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h3 class="font-semibold text-text">{DATA_TRANSFER_COPY.previewTitle}</h3>
              <span
                class={`w-fit text-sm font-semibold ${
                  checked().importable ? 'text-success' : 'text-danger'
                }`}
              >
                {checked().importable
                  ? DATA_TRANSFER_COPY.importable
                  : DATA_TRANSFER_COPY.notImportable}
              </span>
            </div>
            <dl class="mt-3 text-sm">
              <div>
                <dt class="text-text-subtle">{DATA_TRANSFER_COPY.playerLabel}</dt>
                <dd class="mt-1 font-sans font-semibold text-text">{checked().player_name}</dd>
              </div>
            </dl>
            <div class="mt-4">
              <DataTransferCounts counts={checked().counts} />
            </div>

            <Show when={checked().blockers.length > 0}>
              <ul class="mt-4 space-y-1 text-sm text-danger">
                <For each={checked().blockers}>
                  {(blocker) => <li>{DATA_TRANSFER_BLOCKER_MESSAGES[blocker]}</li>}
                </For>
              </ul>
            </Show>
            <Show when={checked().unresolved_references.length > 0}>
              <div class="mt-4">
                <h4 class="text-sm font-semibold text-danger">
                  {DATA_TRANSFER_COPY.unresolvedReferencesTitle}（
                  {checked().unresolved_reference_count.toLocaleString('ja-JP')}
                  {DATA_TRANSFER_COPY.countUnit}）
                </h4>
                <ul class="mt-2 max-h-48 list-inside list-disc overflow-y-auto rounded-md bg-surface p-3 font-mono text-xs text-danger">
                  <For each={checked().unresolved_references}>
                    {(reference) => <li class="break-all">{reference}</li>}
                  </For>
                </ul>
              </div>
            </Show>

            <Show when={checked().importable}>
              <AppButton
                variant="primary"
                class="mt-4"
                onClick={handleImport}
                disabled={props.hasUserData || importing() || Boolean(importSuccess())}
                aria-busy={importing()}
                leftIcon={importing() ? <Loading size="inline" ariaHidden /> : undefined}
              >
                {importing() ? DATA_TRANSFER_COPY.importingButton : DATA_TRANSFER_COPY.importButton}
              </AppButton>
            </Show>
            <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
              {importSuccess()}
            </p>
          </article>
        )}
      </Show>
    </section>
  )
}
