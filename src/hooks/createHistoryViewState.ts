import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  type Signal,
  untrack,
} from 'solid-js'
import { isHistoryPopNavigation } from '../utils/appMainScrollRestoration'

/**
 * 履歴遷移で復元する表示状態のキャッシュを作成する。
 *
 * @typeParam T - 保存する表示状態の型。
 * @returns キーごとの表示状態を扱う Primitive。
 */
export const createHistoryViewState = <T>() => {
  const savedStates = new Map<string, T>()

  /**
   * ユーザーやタブのキーに対応する表示状態を保持する。
   *
   * @param key - 表示状態を区別するキー。
   * @param initialValue - 新規遷移または未保存時の初期値。
   * @returns 現在値の accessor と setter。
   */
  return (key: Accessor<string>, initialValue: Accessor<T>): Signal<T> => {
    const state = createMemo(() => {
      const currentKey = key()
      const initial = untrack(() =>
        isHistoryPopNavigation() && savedStates.has(currentKey)
          ? (savedStates.get(currentKey) as T)
          : initialValue()
      )
      return { key: currentKey, signal: createSignal(initial) }
    })

    createEffect(() => {
      const current = state()
      savedStates.set(current.key, current.signal[0]())
    })

    return [
      () => state().signal[0](),
      ((value: T | ((previous: T) => T)) =>
        state().signal[1]((previous) =>
          typeof value === 'function' ? (value as (previous: T) => T)(previous) : value
        )) as Signal<T>[1],
    ]
  }
}
