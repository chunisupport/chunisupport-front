/**
 * 非同期処理を直列に実行し、実行中に届いた値は最新の1件だけを次に実行する関数を作る。
 * 連続した保存要求をまとめ、最後に要求された値は必ず実行する。
 *
 * @param run - 値を受け取って実行する非同期処理。失敗は無視し、後続の実行を止めない。
 * @returns 値を実行待ちにする関数。
 */
export const createLatestOnlyRunner = <T>(
  run: (value: T) => Promise<void>
): ((value: T) => void) => {
  let hasPending = false
  let pendingValue: T
  let running = false

  /** 実行待ちの値がなくなるまで、最新の値を1件ずつ実行する */
  const drain = async () => {
    running = true
    while (hasPending) {
      const value = pendingValue
      hasPending = false
      await run(value).catch(() => undefined)
    }
    running = false
  }

  return (value) => {
    pendingValue = value
    hasPending = true
    if (!running) void drain()
  }
}
