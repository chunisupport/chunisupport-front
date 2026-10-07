# フロントエンドのマスタデータ利用状況

調査日: 2026-10-07

対象は現在のフロントエンド作業ツリー（未コミット変更を含む）。個別APIの有無は隣接する `chunisupport-api` の `internal/app/router.go` と `docs/API.md` でも確認した。稼働中サーバーへの疎通・デプロイ状態は未確認。

## 取得経路と依存の区別

全件取得のHTTP呼び出しは `src/api/songs.ts` の `fetchMasterDataFromApi` に集約されている。`fetchMasterData` は成功結果をセッション中メモリに保持し、同時呼び出しも同じPromiseへまとめる。呼び出し箇所の数だけ毎回通信する構成ではない。

直接呼び出す画面側の取得処理は9箇所、共通usecaseは1箇所。加えて、用途別の取得関数3箇所が内部で `fetchMasterData` を呼ぶ。

- **画面・ロジックの依存**: `MasterDataDTO` を受け取り、必要なプロパティを取り出しているか。
- **通信の依存**: 個別の取得関数でも、内部で `GET /internal/master` を呼んでいないか。

用途別の関数への置き換えだけでも前者は減らせるが、全件取得を減らすには個別APIへの切り替えが必要。

## 全件取得を直接呼ぶ画面側の取得処理

以下のパスは `src/` からの相対パス。

| 取得箇所 | 実際に必要なフィールド | 用途 |
| --- | --- | --- |
| `pages/songs/useSongsListQuery.ts` | `genres` | 通常楽曲一覧のジャンル選択肢・ソート順 |
| `pages/songs/useWorldsendSongsListQuery.ts` | `genres` | WORLD'S END一覧のジャンル選択肢・ソート順 |
| `pages/songs/components/useSongDetailBase.ts` | 通常詳細: `genres`, `difficulties`, `rating_bands`。WORLD'S END詳細: `genres`, `rating_bands` | 編集フォームのジャンル、通常譜面タブ、統計のレーティング帯。バージョン名は別の `fetchVersions` で解決 |
| `pages/song-management/SongManagementPage.tsx` | `genres`, `difficulties`, `versions` | ジャンル・難易度IDの解決、ULTIMA追加、編集フォームのバージョン選択肢 |
| `pages/goals/GoalsList/goalsListResource.ts` | `genres`, `difficulties`, `achievement_types` | 目標フォーム、条件IDの名称解決、進捗計算、レコードへの遷移条件。バージョンは別取得 |
| `pages/users/UserRecord/UserRecord.tsx` | `genres`, `difficulties` | フィルターの初期値・選択肢、お気に入り楽曲ダイアログのジャンル選択肢。バージョンは別取得 |
| `pages/users/UserOverPower/UserOverPower.tsx` | `genres` | ジャンル別集計の表示順、未解禁曲の絞り込み、レコード遷移時の初期フィルター |
| `pages/tools/LockedSongDiscoveryPage.tsx` | `genres` | ジャンル選択肢とレコード遷移時の初期フィルター |
| `pages/tools/UniFillMatrix/UniFillMatrixPage.tsx` | `genres` | レコード遷移時の初期フィルター。表自体の名前順フォルダは統計用メタデータ経由 |

## 既にカプセル化されている取得経路

| 関数・定義箇所 | 利用先 | 必要なフィールド | 通信として全件取得に依存するか |
| --- | --- | --- | --- |
| `fetchRatingBands` / `api/ratingBands.ts` | ベスト枠ランキング、オンライン苦手譜面インスペクター | `rating_bands` | 依存する |
| `fetchPossessions` / `api/possessions.ts` | 共通 `UserNameplate`、フレンド画面、レーティング画像プレビュー | `possessions` | 依存する。`UserNameplate` は表示名が渡されている場合は取得しない |
| `fetchGoalFilterOptions` / `api/songs.ts` | ランダム選曲の保存済み目標による絞り込み | `difficulties`, `genres` | 依存する。返却型は既に必要な2フィールドだけ |
| `fetchPlayerStatsChartMetadata` / `usecases/overpower/fetchTheoreticalTargetDifficulties.ts` | 自分の統計データ取得を経由し統計ダッシュボード・UniFillMatrix等で利用 | `name_folders`, `genres` | 依存する。曲別情報・表示名等へ加工し、画面へ全マスタを渡さない |

`fetchTheoreticalTargetDifficultyBySongId` は楽曲APIだけを使い、全マスタには依存しない。同じファイル内の `fetchPlayerStatsChartMetadata` と区別する。

## フィールド別の整理

| フィールド | 現在の用途・制約 | 個別APIの状態（ローカルAPIコード） |
| --- | --- | --- |
| `genres` | 最も広い範囲で利用。名前だけでなくID、表示順 `sort_order`、短縮名 `short_name` が必要 | なし |
| `difficulties` | 通常譜面タブ、レコード選択肢、楽曲管理・目標のID解決 | なし |
| `versions` | 多くは `fetchVersions` へ分離済み。ただし楽曲管理の画面と両管理hookでは全マスタの値を使用 | `/internal/master/versions` があり、フロントでも利用済み |
| `achievement_types` | 目標フォームの目標種別選択肢。全件取得ラッパーで文字列・オブジェクト形式を正規化 | なし |
| `rating_bands` | 通常・WORLD'S END詳細の統計、ベスト枠ランキング、苦手譜面インスペクター | なし。フロントの用途別関数のみ存在 |
| `possessions` | IDからポゼッション名を解決し、プロフィール系表示や画像生成で使用 | なし。フロントの用途別関数のみ存在 |
| `name_folders` | 統計用メタデータでコード・表示名・表示順を取得。曲の分類結果は `SongDTO.name_folder_code` を使う | `/internal/master/name-folders` があるが、フロントからは未利用 |
| `account_types` | 本番コードで実データを読み取る利用箇所なし。型や空データ定義には残存 | `/internal/master/permissions` は存在するが、管理者向け権限文字列一覧であり同一のDTOではない |

全マスタから独立した取得経路として、`api/honors.ts` は `/internal/master/honor-types`、`api/users.ts` は `/internal/master/permissions` を利用する。これらのURLに `master` が含まれていても、全件取得への依存とは区別する。

## 型・引数を通じて残る依存

`fetchMasterData` の呼び出しを置き換えるだけでは、次の箇所に全マスタ型の受け渡しが残る。

| 箇所 | 必要な範囲 |
| --- | --- |
| `utils/recordFilterDefaults.ts` の `getMasterDataDefaults` / `buildDefaultFilter` | マスタからは `genres` のみ。バージョンは別引数 |
| `pages/users/UserRecord/components/filterDialog/FilterSelectionPanel.tsx` | `difficulties`, `genres` |
| `pages/goals/GoalsList/goalsListResource.ts` の `GoalsListData` と目標フォーム | `difficulties`, `genres`, `achievement_types` |
| `pages/goals/utils/goalProgress.ts`, `goalOverPower.ts`, `goalRecordFilter.ts` | `difficulties`, `genres` |
| `pages/goals/utils/goalRainbow.ts` | `genres` |
| `pages/goals/utils/goalForm.ts` の `formatGoalAttributesLabel` | `difficulties`, `genres`。現在は定義・テストのみで、本番コードからの呼び出しなし |
| `pages/song-management/hooks/createStandardSongManagement.ts` | `genres`, `difficulties`, `versions` |
| `pages/song-management/hooks/createWorldsendSongManagement.ts` | `genres`, `versions` |

`utils/masterData.ts` は受け取った項目の並べ替え等を行う純粋関数であり、全件取得APIを呼ぶモジュールではない。

難易度の正規順序・正規化・略称・色は `constants/difficulty.ts`、ランプのフィルター選択肢は `constants/recordFilterOptions.ts` に既に存在する。表示順だけの用途と、API保存用IDの解決が必要な用途は分けて検討する必要がある。

## 直接参照を減らすための移行候補

以下は検討案であり、APIや画面の仕様変更は行っていない。

| 優先度 | 候補 | 効果・注意点 |
| --- | --- | --- |
| 高 | ジャンルの用途別取得関数と必要な型を定義し、一覧・OVER POWER・フィルター等を移す | 広い範囲で全マスタの受け渡しを減らせる。通信量も減らす場合はジャンル個別APIが必要。ID・表示順・短縮名を保持する |
| 高 | `buildDefaultFilter` 等の入力を全マスタから必要なジャンル情報へ縮小する | UniFillMatrix等が、レコード遷移のためだけに全マスタを直接取得する依存を解消できる |
| 高 | 楽曲管理の `versions` を既存 `fetchVersions` へ移す | 既存APIで対応できる。ただしジャンル・難易度の依存は別途残る |
| 中 | 名前順フォルダを既存個別APIへ移す | API追加は不要。統計用メタデータにはジャンル取得も残るため、この変更だけでは全件取得はなくならない |
| 中 | 楽曲詳細の `rating_bands` を既存 `fetchRatingBands` に寄せる | 画面から直接フィールドを読む箇所を減らせる。全件通信を減らすにはラッパー内部の個別API化も必要 |
| 中 | 目標関連を `GoalFilterOptions` と成果種別に分離する | `MasterDataDTO` を進捗・条件解決・フォームへ広く伝播させる構成を縮小できる |
| 中 | `fetchRatingBands`・`fetchPossessions` の内部取得を個別APIへ移す | 既存の利用画面への変更を抑えて全件通信への依存を減らせる。API側の追加が必要 |
| 要判断 | 難易度の表示用選択肢を既存定数から作るか、個別APIから取得するか | 前者は表示用途の通信を省ける。後者はAPIのID対応を維持しやすい。目標・楽曲管理の数値IDを名前の定数だけで代替しない |

画面からの直接参照を減らすことを先行する場合は、用途別取得関数・必要な入力型への移行から進められる。全件取得そのものの廃止を目指す場合は、既存の個別APIへの移行に加え、ジャンル・難易度・成果種別・レーティング帯・ポゼッションの取得契約をAPI側と揃える必要がある。

取得経路を分割する際は、現在の成功結果キャッシュ・同時リクエスト共有・失敗後の再試行を維持する。バージョン管理操作の `invalidateVersionCaches` は現在、バージョン一覧と全マスタの両キャッシュを無効化するため、キャッシュの移設時にも無効化対象を確認する。
