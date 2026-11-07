import { type Accessor, createResource, createSignal } from 'solid-js'
import type {
  AccountType,
  ApiToken,
  ApiTokenIssueRequest,
  ApiTokenIssueResponse,
  ApiTokenListResponse,
  ApiTokenPermission,
  ApiTokenRenameRequest,
} from '../../types/api'
import {
  canIssueReadWriteApiToken,
  resolveApiTokenIssuePermission,
} from '../../utils/apiTokenPermission'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { API_TOKEN_MAX_COUNT, API_TOKEN_SETTINGS_COPY } from './ApiTokenSettings.constants.ts'
import { isApiTokenNameError, isValidApiTokenName, normalizeApiTokenName } from './apiTokenName'

type ApiTokenSettingsOptions = {
  /** APIトークン一覧の取得を開始する認証済みユーザー名 */
  username: Accessor<string>
  /** APIトークンを発行するユーザーのアカウント種別 */
  accountType: Accessor<AccountType>
  /** APIトークン一覧を取得する */
  fetchTokens: () => Promise<ApiTokenListResponse>
  /** APIトークンを発行する */
  issueToken: (request: ApiTokenIssueRequest) => Promise<ApiTokenIssueResponse>
  /** APIトークンの名前を変更する */
  renameToken: (id: number, request: ApiTokenRenameRequest) => Promise<ApiToken>
  /** APIトークンを削除する */
  deleteToken: (id: number) => Promise<void>
}

/** 操作に失敗したAPIトークンの行に表示するエラー */
type TokenActionError = {
  /** エラーを表示する行のAPIトークンID */
  tokenId: number
  /** 表示する文言 */
  message: string
}

/**
 * 発行レスポンスから、一覧に表示する管理情報だけを取り出す。
 * 平文のトークンを一覧の状態に残さないため。
 *
 * @param issued - 発行APIのレスポンス。
 * @returns 一覧に追加するAPIトークン管理情報。
 */
const toApiTokenMetadata = (issued: ApiTokenIssueResponse): ApiToken => ({
  id: issued.id,
  name: issued.name,
  permission: issued.permission,
  token_prefix: issued.token_prefix,
  last_used_at: issued.last_used_at,
  created_at: issued.created_at,
})

/**
 * APIトークンの一覧と、発行・名前変更・削除の操作状態を管理する。
 * 各操作の成功後は一覧を取得し直さずに結果を反映し、失敗時のエラーは操作した入力欄・ダイアログ・行に表示する。
 *
 * @param options - 対象ユーザー、アカウント種別、およびAPIトークンのAPI呼び出し。
 * @returns 一覧のResourceと取得済みの一覧、各操作の入力・処理中・成功・失敗の状態、および操作関数。
 */
export const createApiTokenSettings = (options: ApiTokenSettingsOptions) => {
  const [issueName, setIssueNameSignal] = createSignal('')
  const [issuePermission, setIssuePermission] = createSignal<ApiTokenPermission>('read')
  const [issueFormOpen, setIssueFormOpenSignal] = createSignal(false)
  const [issueNameError, setIssueNameError] = createSignal('')
  const [issueActionError, setIssueActionError] = createSignal('')
  const [issueSuccess, setIssueSuccess] = createSignal('')
  const [issuing, setIssuing] = createSignal(false)
  const [generatedToken, setGeneratedToken] = createSignal<ApiTokenIssueResponse>()
  const [editingTokenId, setEditingTokenId] = createSignal<number | null>(null)
  const [editingName, setEditingNameSignal] = createSignal('')
  const [editingNameError, setEditingNameError] = createSignal('')
  const [mutatingTokenId, setMutatingTokenId] = createSignal<number | null>(null)
  const [tokenActionError, setTokenActionError] = createSignal<TokenActionError | null>(null)
  const [tokenActionSuccess, setTokenActionSuccess] = createSignal('')
  const [deleteTarget, setDeleteTarget] = createSignal<ApiToken | null>(null)

  const [tokens, { mutate: mutateTokens }] = createResource(options.username, () =>
    options.fetchTokens()
  )

  /**
   * 取得済みのAPIトークン一覧を返す。
   * 取得に失敗したResourceを読むと例外になるため、失敗時は未取得として扱う。
   *
   * @returns 取得済みの一覧。取得中または取得失敗時は undefined。
   */
  const loadedTokens = (): ApiTokenListResponse | undefined => (tokens.error ? undefined : tokens())

  /**
   * 現在のアカウントが書き込み権限付きAPIトークンを発行できるか判定する。
   *
   * @returns EDITORまたはADMINの場合は true。
   */
  const canIssueReadWrite = (): boolean => canIssueReadWriteApiToken(options.accountType())

  /**
   * 一覧取得前・発行中・上限到達時に発行操作を無効化する。
   *
   * @returns APIトークンを発行できない場合は true。
   */
  const isIssueDisabled = (): boolean => {
    const loaded = loadedTokens()
    return issuing() || !loaded || loaded.tokens.length >= API_TOKEN_MAX_COUNT
  }

  /**
   * 発行用の名前入力を反映し、入力欄のエラーを解消する。
   *
   * @param value - 新しい入力値。
   * @returns なし。
   */
  const setIssueName = (value: string): void => {
    setIssueNameSignal(value)
    setIssueNameError('')
  }

  /**
   * 発行ダイアログの開閉を反映する。発行中は閉じさせない。
   * 開くときは前回のエラーを消し、書き込み権限を発行できないアカウントでは読み取りへ戻す。
   *
   * @param open - ダイアログを開く場合は true。
   * @returns なし。
   */
  const setIssueFormOpen = (open: boolean): void => {
    if (issuing()) return
    setIssueFormOpenSignal(open)
    if (!open) return
    setIssueNameError('')
    setIssueActionError('')
    if (!canIssueReadWrite()) setIssuePermission('read')
  }

  /**
   * 入力された名前と権限でAPIトークンを発行し、一覧の先頭へ追加する。
   * 発行できない状態で呼ばれた場合や発行中に重ねて呼ばれた場合は何もしない。
   * 名前に起因するエラーは名前入力欄に、それ以外は発行ダイアログに表示する。
   *
   * @returns 発行処理完了後に解決されるPromise。
   */
  const issue = async (): Promise<void> => {
    if (isIssueDisabled()) return

    setIssueNameError('')
    setIssueActionError('')
    setIssueSuccess('')
    setTokenActionSuccess('')
    if (!isValidApiTokenName(issueName())) {
      setIssueNameError(API_TOKEN_SETTINGS_COPY.nameValidationError)
      return
    }

    setIssuing(true)
    try {
      const issued = await options.issueToken({
        name: normalizeApiTokenName(issueName()),
        permission: resolveApiTokenIssuePermission(options.accountType(), issuePermission()),
      })
      setGeneratedToken(issued)
      setIssueNameSignal('')
      setIssuePermission('read')
      setIssueFormOpenSignal(false)
      setIssueSuccess(API_TOKEN_SETTINGS_COPY.issueSuccess)
      mutateTokens((current) => ({
        tokens: [toApiTokenMetadata(issued), ...(current?.tokens ?? [])],
      }))
    } catch (caught) {
      const message = toUserFriendlyErrorMessage(caught, API_TOKEN_SETTINGS_COPY.issueFailure)
      if (isApiTokenNameError(caught)) {
        setIssueNameError(message)
      } else {
        setIssueActionError(message)
      }
    } finally {
      setIssuing(false)
    }
  }

  /**
   * 指定したAPIトークンの名前変更入力を開始する。
   *
   * @param token - 名前変更対象のAPIトークン。
   * @returns なし。
   */
  const startRenaming = (token: ApiToken): void => {
    setEditingTokenId(token.id)
    setEditingNameSignal(token.name)
    setEditingNameError('')
    setTokenActionError(null)
    setTokenActionSuccess('')
  }

  /**
   * 名前変更用の入力を反映し、入力欄のエラーを解消する。
   *
   * @param value - 新しい入力値。
   * @returns なし。
   */
  const setEditingName = (value: string): void => {
    setEditingNameSignal(value)
    setEditingNameError('')
  }

  /**
   * APIトークンの名前変更入力を終了する。
   *
   * @returns なし。
   */
  const cancelRenaming = (): void => {
    setEditingTokenId(null)
    setEditingNameSignal('')
    setEditingNameError('')
  }

  /**
   * 入力されたAPIトークン名を保存し、一覧の該当行を置き換える。
   * ほかのAPIトークンを操作中に呼ばれた場合は何もしない。
   * 名前に起因するエラーは名前入力欄に、それ以外は対象の行に表示する。
   *
   * @param tokenId - 名前変更対象のAPIトークンID。
   * @returns 更新処理完了後に解決されるPromise。
   */
  const rename = async (tokenId: number): Promise<void> => {
    if (mutatingTokenId() !== null) return

    setEditingNameError('')
    setTokenActionError(null)
    setTokenActionSuccess('')
    if (!isValidApiTokenName(editingName())) {
      setEditingNameError(API_TOKEN_SETTINGS_COPY.nameValidationError)
      return
    }

    setMutatingTokenId(tokenId)
    try {
      const renamed = await options.renameToken(tokenId, {
        name: normalizeApiTokenName(editingName()),
      })
      mutateTokens((current) =>
        current
          ? { tokens: current.tokens.map((token) => (token.id === renamed.id ? renamed : token)) }
          : current
      )
      cancelRenaming()
      setTokenActionSuccess(API_TOKEN_SETTINGS_COPY.renameSuccess)
    } catch (caught) {
      const message = toUserFriendlyErrorMessage(caught, API_TOKEN_SETTINGS_COPY.renameFailure)
      if (isApiTokenNameError(caught)) {
        setEditingNameError(message)
      } else {
        setTokenActionError({ tokenId, message })
      }
    } finally {
      setMutatingTokenId(null)
    }
  }

  /**
   * 前回の操作結果を消し、指定APIトークンの削除確認ダイアログを開く。
   *
   * @param token - 削除対象のAPIトークン。
   * @returns なし。
   */
  const openDeleteDialog = (token: ApiToken): void => {
    setTokenActionError(null)
    setTokenActionSuccess('')
    setDeleteTarget(token)
  }

  /**
   * 削除確認ダイアログの開閉要求を反映する。開く操作は削除ボタンから行うため、閉じる要求のみ扱う。
   *
   * @param open - ダイアログを開く場合は true。
   * @returns なし。
   */
  const setDeleteDialogOpen = (open: boolean): void => {
    if (open) return
    setDeleteTarget(null)
  }

  /**
   * 確認ダイアログで確定されたAPIトークンを削除し、一覧から取り除く。
   * 操作中に重ねて呼ばれた場合は何もしない。完了後は成否によらずダイアログを閉じ、失敗時のエラーは対象の行に表示する。
   *
   * @returns 削除処理完了後に解決されるPromise。
   */
  const confirmDelete = async (): Promise<void> => {
    const token = deleteTarget()
    if (!token || mutatingTokenId() !== null) return

    setMutatingTokenId(token.id)
    try {
      await options.deleteToken(token.id)
      mutateTokens((current) =>
        current ? { tokens: current.tokens.filter((item) => item.id !== token.id) } : current
      )
      if (generatedToken()?.id === token.id) setGeneratedToken(undefined)
      if (editingTokenId() === token.id) cancelRenaming()
      setTokenActionSuccess(API_TOKEN_SETTINGS_COPY.deleteSuccess)
    } catch (caught) {
      setTokenActionError({
        tokenId: token.id,
        message: toUserFriendlyErrorMessage(caught, API_TOKEN_SETTINGS_COPY.deleteFailure),
      })
    } finally {
      setMutatingTokenId(null)
      setDeleteTarget(null)
    }
  }

  /**
   * 指定したAPIトークンの行に表示するエラー文言を返す。
   *
   * @param tokenId - 行のAPIトークンID。
   * @returns その行の操作に失敗した場合の文言。ない場合は空文字。
   */
  const tokenActionErrorFor = (tokenId: number): string => {
    const actionError = tokenActionError()
    return actionError?.tokenId === tokenId ? actionError.message : ''
  }

  return {
    tokens,
    loadedTokens,
    canIssueReadWrite,
    isIssueDisabled,
    issueFormOpen,
    setIssueFormOpen,
    issueName,
    setIssueName,
    issuePermission,
    setIssuePermission,
    issueNameError,
    issueActionError,
    issueSuccess,
    issuing,
    issue,
    generatedToken,
    editingTokenId,
    editingName,
    setEditingName,
    editingNameError,
    startRenaming,
    cancelRenaming,
    rename,
    mutatingTokenId,
    tokenActionErrorFor,
    tokenActionSuccess,
    deleteTarget,
    openDeleteDialog,
    setDeleteDialogOpen,
    confirmDelete,
  }
}
