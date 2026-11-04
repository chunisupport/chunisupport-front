import {
  AUTH_PROVIDER_BY_KIND,
  AUTH_PROVIDERS,
  type AuthProviderKind,
} from '../../constants/authProviders.ts'

/** Firebase ユーザーに連携された認証プロバイダのアカウント情報 */
export type LinkedAuthAccount = {
  /** Firebase Authentication の providerId */
  providerId: string
  /** プロバイダ側の表示名 */
  displayName: string | null
  /** プロバイダ側のメールアドレス */
  email: string | null
}

/** 画面に表示する連携アカウントの概要 */
export type AuthAccountSummary = {
  /** 認証プロバイダの種類 */
  kind: AuthProviderKind
  /** 認証プロバイダの表示名 */
  label: string
  /** アカウントを識別するための表示名またはメールアドレス */
  name: string
}

/**
 * 指定した認証プロバイダで連携済みのアカウントを探す。
 *
 * @param accounts - Firebase ユーザーの providerData。
 * @param kind - 探す認証プロバイダの種類。
 * @returns 連携済みのアカウント。未連携の場合は undefined。
 */
export const findLinkedAuthAccount = (
  accounts: readonly LinkedAuthAccount[],
  kind: AuthProviderKind
): LinkedAuthAccount | undefined => {
  const { providerId } = AUTH_PROVIDER_BY_KIND[kind]
  return accounts.find((account) => account.providerId === providerId)
}

/**
 * 連携アカウントを利用者が見分けられる名前を取得する。
 * Google はメールアドレス、X は表示名で見分けるのが一般的なため、優先する項目を変える。
 *
 * @param account - 連携済みのアカウント。
 * @param kind - アカウントの認証プロバイダの種類。
 * @returns 表示名またはメールアドレス。どちらもない場合は空文字。
 */
export const resolveAuthAccountName = (
  account: LinkedAuthAccount,
  kind: AuthProviderKind
): string =>
  (kind === 'google'
    ? (account.email ?? account.displayName)
    : (account.displayName ?? account.email)) ?? ''

/**
 * ログインに使った認証プロバイダのアカウント概要を取得する。
 * 複数連携している場合は、画面の表示順で先頭のプロバイダを代表とする。
 *
 * @param accounts - Firebase ユーザーの providerData。
 * @returns アカウント概要。対応する認証プロバイダが連携されていない場合は undefined。
 */
export const resolveAuthAccountSummary = (
  accounts: readonly LinkedAuthAccount[]
): AuthAccountSummary | undefined => {
  for (const provider of AUTH_PROVIDERS) {
    const account = findLinkedAuthAccount(accounts, provider.kind)
    if (account) {
      return {
        kind: provider.kind,
        label: provider.label,
        name: resolveAuthAccountName(account, provider.kind),
      }
    }
  }
  return undefined
}

/**
 * 本人確認の再認証に使う認証プロバイダを決める。
 * 連携済みのプロバイダでなければ Firebase が再認証を拒否するため、連携済みのものを選ぶ。
 *
 * @param accounts - Firebase ユーザーの providerData。
 * @returns 再認証に使う認証プロバイダの種類。対応するものがない場合は Google。
 */
export const resolveReauthProviderKind = (
  accounts: readonly LinkedAuthAccount[]
): AuthProviderKind => resolveAuthAccountSummary(accounts)?.kind ?? 'google'

/**
 * 認証プロバイダの連携を解除できるか判定する。
 * ログイン方法がなくなるとログインできなくなるため、最後の1つは解除させない。
 *
 * @param accounts - Firebase ユーザーの providerData。
 * @param kind - 解除する認証プロバイダの種類。
 * @returns 連携済みかつ他のログイン方法が残る場合は true。
 */
export const canUnlinkAuthProvider = (
  accounts: readonly LinkedAuthAccount[],
  kind: AuthProviderKind
): boolean => findLinkedAuthAccount(accounts, kind) !== undefined && accounts.length > 1
