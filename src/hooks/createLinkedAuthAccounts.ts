import { onIdTokenChanged } from 'firebase/auth'
import { type Accessor, createSignal, onCleanup } from 'solid-js'

import { auth } from '../lib/firebase'
import type { LinkedAuthAccount } from '../usecases/auth/authProviders'

/** ログイン中ユーザーの連携アカウントと、その再読み込み */
export type LinkedAuthAccountsState = {
  /** ログイン中ユーザーに連携された認証プロバイダのアカウント */
  accounts: Accessor<readonly LinkedAuthAccount[]>
  /** 連携・解除の直後に、ログイン中ユーザーの連携アカウントを読み直す */
  refresh: () => void
}

/**
 * ログイン中ユーザーの連携アカウントを取得する。
 * Firebase の User は連携・解除で中身が書き換わるだけで通知されない場合があるため、
 * ログイン状態の変化に加えて、操作した側から明示的に読み直せるようにする。
 *
 * @returns 連携アカウントのAccessorと再読み込み関数。
 */
export const createLinkedAuthAccounts = (): LinkedAuthAccountsState => {
  const readAccounts = (): readonly LinkedAuthAccount[] => [
    ...(auth.currentUser?.providerData ?? []),
  ]
  const [accounts, setAccounts] = createSignal(readAccounts())
  const refresh = () => setAccounts(readAccounts())

  onCleanup(onIdTokenChanged(auth, refresh))

  return { accounts, refresh }
}
