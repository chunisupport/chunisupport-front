# 楽曲管理のマスターデータ取得

楽曲管理画面は、ジャンル・難易度を `fetchMasterData`、バージョン一覧を `fetchVersions` で取得する。バージョン一覧の取得先は `GET /internal/master/versions`。

画面で取得したバージョン一覧を、通常楽曲・WORLD'S END楽曲のフィルター選択肢と、リリース日からバージョンを判定する絞り込み処理で共有する。編集セクションは全マスタとバージョン一覧の読み込み完了を待つ。

通常楽曲の管理hookが受け取るマスターデータはジャンル・難易度、WORLD'S END楽曲の管理hookはジャンルに限定する。バージョン一覧はそれぞれ別引数で受け取る。

`src/queries/masterData.ts` の `fetchVersions` / `fetchMasterData` は、TanStack Query の `staleTime: Infinity` / `gcTime: Infinity` で成功結果をセッション中に再利用し、同時リクエストを共有する。`retry: false` のため自動再試行はせず、失敗後の次回呼び出しで再取得する。バージョン管理操作は `src/queries/versions.ts` を経由し、成功後に `invalidateVersionCaches` が `removeQueries` でバージョン一覧と全マスタのキャッシュ・進行中 query を破棄する。無効化前の応答は以後のキャッシュには採用しない。取得中に query が削除された場合は、`fetchQueryWithRestartOnRemoval` が最大1回だけ再取得し、待機中の呼び出し元にも最新値を返す。query を残した通常のキャンセルは再取得しない。全マスタのキーは `['master', 'all']` とし、バージョン一覧・ジャンル一覧とは兄弟関係にする。
