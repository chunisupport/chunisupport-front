import {
  AUTH_PROVIDER_BY_KIND,
  AUTH_PROVIDERS,
  type AuthProviderDefinition,
  type AuthProviderKind,
} from '../../constants/authProviders.ts'
import type { FeatureFlagName } from '../../constants/featureFlags.ts'
import type { XAccountDTO } from '../../types/api.ts'

/** Firebase ユーザーに連携された認証プロバイダのアカウント情報 */
export type LinkedAuthAccount = {
  /** Firebase Authentication の providerId */
  providerId: string
  /** プロバイダ側のユーザーID。X では数値のユーザーID */
  uid: string
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
 * 画面に選択肢として表示する認証プロバイダを、各定義の feature-flag で絞り込む。
 * 連携済みアカウントの判定や再認証には全プロバイダを使うため、この結果は表示と解除可否の判定にだけ使う。
 *
 * @param providers - 表示順に並んだ認証プロバイダ。
 * @param isFeatureEnabled - 現在の環境で機能が有効かを返す関数。
 * @returns 表示する認証プロバイダ。順序は維持する。
 */
export const selectVisibleAuthProviders = (
  providers: readonly AuthProviderDefinition[],
  isFeatureEnabled: (name: FeatureFlagName) => boolean
): readonly AuthProviderDefinition[] =>
  providers.filter(
    (provider) => provider.featureFlag === undefined || isFeatureEnabled(provider.featureFlag)
  )

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
 * Google はメールアドレス、X は @ID で見分けるのが一般的なため、優先する項目を変える。
 * X の @ID は Firebase の連携情報に含まれないため、API に保存された値を使う。
 * 連携し直した後などに古い値が残っている場合があるため、数値IDが現在の連携先と一致するときだけ使い、
 * それ以外は表示名で代用する。
 *
 * @param account - 連携済みのアカウント。
 * @param kind - アカウントの認証プロバイダの種類。
 * @param xAccount - API に保存された X アカウント。未取得の場合は null または undefined。
 * @returns @ID、表示名、メールアドレスのいずれか。どれもない場合は空文字。
 */
export const resolveAuthAccountName = (
  account: LinkedAuthAccount,
  kind: AuthProviderKind,
  xAccount?: XAccountDTO | null
): string => {
  if (kind === 'google') return account.email ?? account.displayName ?? ''
  if (xAccount?.id === account.uid) return `@${xAccount.username}`
  return account.displayName ?? account.email ?? ''
}

/**
 * ログインに使った認証プロバイダのアカウント概要を取得する。
 * 複数連携している場合は、画面の表示順で先頭のプロバイダを代表とする。
 * X は @ID で見分けるのが一般的なため、認証直後に得た @ID があれば表示名より優先する。
 *
 * @param accounts - Firebase ユーザーの providerData。
 * @param xUsername - 認証直後の結果から得た X の @ID（先頭の @ を除く）。得られない場合は省略する。
 * @returns アカウント概要。対応する認証プロバイダが連携されていない場合は undefined。
 */
export const resolveAuthAccountSummary = (
  accounts: readonly LinkedAuthAccount[],
  xUsername?: string
): AuthAccountSummary | undefined => {
  for (const provider of AUTH_PROVIDERS) {
    const account = findLinkedAuthAccount(accounts, provider.kind)
    if (account) {
      return {
        kind: provider.kind,
        label: provider.label,
        name:
          provider.kind === 'x' && xUsername
            ? `@${xUsername}`
            : resolveAuthAccountName(account, provider.kind),
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
 * 画面に表示しない認証プロバイダは、ログイン画面からも使えないため残る方法に数えない。
 *
 * @param accounts - Firebase ユーザーの providerData。
 * @param kind - 解除する認証プロバイダの種類。
 * @param visibleProviders - 現在の環境で画面に表示する認証プロバイダ。省略時は全プロバイダ。
 * @returns 連携済みかつ表示中の他のログイン方法が残る場合は true。
 */
export const canUnlinkAuthProvider = (
  accounts: readonly LinkedAuthAccount[],
  kind: AuthProviderKind,
  visibleProviders: readonly AuthProviderDefinition[] = AUTH_PROVIDERS
): boolean =>
  findLinkedAuthAccount(accounts, kind) !== undefined &&
  visibleProviders.some(
    (provider) =>
      provider.kind !== kind && findLinkedAuthAccount(accounts, provider.kind) !== undefined
  )
