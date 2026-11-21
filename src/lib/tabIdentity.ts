/**
 * タブ内の認証操作と別タブから届く UID 変更を区別する。
 * @param onExternalChange - 旧画面を閉じる処理。
 * @returns Firebase の通知先と API 送信前の照合関数。
 */
export const createTabIdentity = (onExternalChange: () => void) => {
  let expected: string | null | undefined
  let localTarget: string | null | undefined
  let invalidated = false

  /** 現在の UID が画面と一致するか確認し、不一致なら一度だけ画面を閉じる。 */
  const matches = (uid: string | null): boolean => {
    if (!invalidated && expected !== undefined && expected !== uid && localTarget !== uid) {
      invalidated = true
      onExternalChange()
    }
    return !invalidated
  }
  return {
    matches,
    /** このタブ内で切り替え中の UID。中止時は undefined で取り消す。 */
    expect: (uid: string | null | undefined) => {
      localTarget = uid
    },
    /** 初回通知で基準を確定し、その後の通知を照合する。 */
    observe: (uid: string | null) => {
      if (matches(uid)) expected = uid
      if (uid === localTarget) localTarget = undefined
    },
  }
}
