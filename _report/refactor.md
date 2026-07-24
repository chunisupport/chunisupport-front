# リファクタリング指摘書 (2026-07-13時点)

本ドキュメントは、現行コードベースを再確認したうえで、**未解決の改善点のみ**を整理したものです。
解消済みの項目、現行実装では成立しない項目、他項目と重複する指摘は削除または統合しています。

## 優先度定義

- **Critical (緊急)**: 認証・権限制御の破綻、機密情報の漏えい、主要機能の停止に直結する問題。即時対応が必要。
- **High (高)**: 初期表示性能、データ整合性、またはアーキテクチャの根幹を継続的に損なう問題。優先して対応が必要。
- **Medium (中)**: 安定性、性能、保守性、テスト容易性を明確に損なう問題。関連機能の拡張前に解消することが望ましい。
- **Low (低)**: コード品質や一貫性に関わる問題。関連箇所の改修に合わせて計画的に解消する。

## 対象範囲

- 本番コード: `src` 配下の SolidJS コンポーネント、store、usecase、repository、API ラッパー、型・utility
- ビルド・テスト: `package.json`, `rsbuild.config.mjs`, `scripts` および既存テスト
- ドキュメント: `README.md`, `docs/*.md`, `_report/*.md`

## 確認結果

- `pnpm check:ci`: 成功
- `pnpm typecheck`: 成功
- `pnpm build`: 成功
- `pnpm test:unit`: 成功
- 本番ビルドの初期 HTML が直接読み込む JavaScript は 2 ファイル、非圧縮で合計 485,598 bytes です。トップレベル route のページ本体は非同期 chunk へ分割され、変更前の 1,061,015 bytes から 54.23% 削減されています。
- 静的検査と既存の純粋関数テストでは検出されない、SolidJS のリアクティビティ、画面状態、キャッシュ無効化、feature 境界、ブラウザ操作フローを中心に記載しています。

## 作業者へ注意

解決した事項は「解決済み」と追記せず、**必ずこの文書から削除してください**。
複数 feature で使う型・表示規則・状態管理を、既存 feature から直接参照して増やさず、`src/types`, `src/constants`, `src/utils`, `src/hooks`, `src/stores`, `src/components/common` など適切な共通領域へ移してください。

---

## 課題一覧

### パフォーマンス (PERF)

-

### UI・リアクティビティ (UI)

-

### 信頼性・運用 (OPS / TEST)

| ID | 優先度 | 概要 | 詳細・対応方針 |
|---|---|---|---|
| **OPS-001** | **Medium** | mock・一時検証画面が本番 route に常設されている | `src/App.tsx:487-494` は `RegisterScoreMockPage` と `RegisterScoreTempPage` を build mode に関係なく登録しています。一時画面は `src/pages/register-score-temp/RegisterScoreTempPage.tsx:20-25` 自身を検証ページと定義し、`:228-240` に外部 test bookmarklet URL、`:246-259` に旧 clipboard fallback を保持しています。`src/pages/register-score-mock/RegisterScoreMockPage.tsx:34-396` にインライン定義された大きな fixture も本番成果物の非同期 chunk に含まれ、route 訪問時には取得されます。現行スコア登録へ役割を統合して削除するか、明示的な開発用 entry / build flag で本番成果物から除外すべきです。 |
| **TEST-001** | **Medium** | 重要な画面状態・操作フローを検証する component / E2E テスト基盤がない | `package.json:22` の標準テストは `src/**/*.test.ts` だけを対象とし、リポジトリ内に first-party の `.test.tsx` やブラウザ E2E テストはありません。`src/pages/settings/Settings.tsx:72-285` のプライバシー・API token・データ削除・退会、`src/pages/friends/FriendsPage.tsx:397-630` の申請状態遷移、`src/pages/songs/SongManagementPage.tsx:699-1055` の CRUD は、API wrapper や一部 pure function のテストだけでは focus、loading、二重送信、成功後の再取得、SolidJS の反応性を固定できません。状態遷移を primitive / usecase に抽出して Given-When-Then の単体テストを追加し、少数の重要フローには Solid 対応 component test またはブラウザテストを導入すべきです。 |

### アーキテクチャ・責務 (ARCH)

| ID | 優先度 | 概要 | 詳細・対応方針 |
|---|---|---|---|
| **ARCH-001** | **High** | `SongManagementPage` に通常曲・WORLD'S END 管理の全責務が集中 | `src/pages/songs/SongManagementPage.tsx` は 1,850 行あり、型・draft 定義と変換 (`:39-517`)、resource・画面状態・CRUD (`:518-1070`)、通常曲と WORLD'S END の作成・編集 UI (`:1081-1849`) が同居しています。専用テストもなく、`src/pages/admin/AdminSongsPage.tsx:1` と `src/pages/editor/EditorSongsPage.tsx:1` から feature を越えて直接利用されています。共有 song-management feature へ移し、Song / WORLD'S END ごとの form、draft 変換・検証 usecase、API mutation primitive、権限別 composition に分割すべきです。 |
| **ARCH-002** | **Medium** | 通常・WORLD'S END レコード画面の view-state 管理が重複 | 通常レコードの filtering・sorting・stats は抽出済みですが、`src/pages/users/UserRecord/UserRecord.tsx:97-146,167-226` には resource、フィルター復元・保存、列設定、sort、複数ダイアログの状態が残ります。`src/pages/users/WorldsendRecord/WorldsendRecord.tsx:72-180` も同じ初期復元、IndexedDB 永続化、列・sort・dialog 状態を別実装しています。両画面で共通する restore / persist / reset / visible-columns / primary-sort の状態遷移を小さな record view-state primitive へ切り出し、各ページは種別固有の filter と renderer を注入する構成にすべきです。 |
| **ARCH-003** | **Medium** | `RandomSongSelectorPage` に設定状態・永続化・表示が集中 | `src/pages/tools/RandomSongSelectorPage.tsx` は 1,357 行あり、ローカル UI helper と API 接続 (`:170-496`)、多数の signal・memo (`:497-719`)、初期化・sessionStorage・handler (`:721-918`)、設定ダイアログと結果 UI (`:920-1355`) が同居しています。抽選 core は `src/utils/randomSongSelector.ts` へ抽出・テスト済みですが、ページ固有の状態遷移は直接検証できません。`createRandomSongSelectorModel` 相当の primitive、基本条件、レコード条件、重み設定、結果一覧のコンポーネントへ段階的に分割すべきです。 |
| **ARCH-004** | **Medium** | お気に入り曲・未解禁曲の選択ダイアログが大幅に重複 | `src/pages/users/UserRecord/components/FavoriteSongsDialog.tsx:61-385` と `src/pages/users/UserOverPower/components/LockedSongsDialog.tsx:105-565` は、全画面 Dialog、検索、ジャンル・バージョン絞り込み、選択済み表示、遅延リスト、draft Set、保存・エラー、入れ子フィルターダイアログを別実装しています。`src/pages/users/components/songSelectionDialog.ts:8-100` には一部 pure helper だけが共通化されています。検索・絞り込み・draft 選択・保存状態を shared primitive にし、共通 `SongSelectionDialogBase` へ種別固有の行、上限、追加条件、payload 変換を渡す構成にすべきです。 |
| **ARCH-006** | **Medium** | 一括マスターデータへの直接依存が複数 feature に残る | `fetchMasterData` はメモリキャッシュ済みですが、`src/pages/goals/GoalsList/goalsListResource.ts:44`、`UserOverPower.tsx:69`、`UserRecord.tsx:98`、`SongManagementPage.tsx:530`、通常・WORLD'S END 楽曲一覧、`useSongDetailBase.ts:15` など 7 箇所で一括 DTO を直接取得しています。各画面が genres、difficulties、rating bands、achievement types の一部だけを必要とするにもかかわらず、API shape と更新単位へ広く結合しています。既存の `versions` と同様に用途別 API / accessor へ分離し、移行中も `useGenres`、`useDifficulties` などカプセル化された単位を通して参照すべきです。 |

### 実装品質・共通化 (QUAL)

| ID | 優先度 | 概要 | 詳細・対応方針 |
|---|---|---|---|
| **QUAL-003** | **Medium** | Dialog shell と破壊的操作 UI の共通基盤が未整備 | Overlay、固定高 Content、header/body/footer、z-index を各画面が直接組み立てており、`src/pages/tools/RandomSongSelectorPage.tsx:1037-1038,1125-1126` や前述の 2 つの楽曲選択ダイアログで同型 shell が重複しています。一方、ユーザー物理削除、API token 削除、楽曲削除は `src/pages/admin/AdminUsersPage.tsx:48`、`src/pages/settings/Settings.tsx:196`、`src/pages/songs/SongManagementPage.tsx:998,1031` で `window.confirm` を使います。プロジェクトの focus・scroll・デザイントークン規約を一元適用できる `AppDialog` / `AppAlertDialog` shell を共通化し、破壊的操作も Kobalte ベースへ統一すべきです。 |
| **QUAL-004** | **Low** | TODO / FIXME が設計課題とデザイン案を混在させたまま残る | 現存するタスク系コメントは `src/constants/recordFilterOptions.ts:4`、`src/components/NavBar/NavBar.tsx:326`、`src/pages/users/UserPage/components/UserNameplate.tsx:218` の 3 件です。定数の出所、responsive layout、将来 UI 案が同じ TODO / FIXME として残っています。実装課題は issue / 本レポートへ移し、採用条件のないアイデアコメントは削除し、コード内に残す場合は判断条件と責任範囲を明記すべきです。 |

## まとめ

- 最優先は、**楽曲管理画面の責務分割 (`ARCH-001`)** です。変更影響範囲を直接縮小できます。
- record view-state、楽曲選択ダイアログ、Dialog shell は複数 feature へ広がっているため、新しい個別実装を足す前に共通領域へ寄せる必要があります。
- 旧 `REF-F05` は、保存フィルターの API 化、schema version、shape 検証、旧 schema 移行、テストが実装済みのため削除しました。
- 旧 `REF-F04` は pure logic の抽出が進んだため、通常・WORLD'S END の view-state 重複へ焦点を絞って `ARCH-002` へ更新し、優先度を High から Medium へ見直しました。
- 旧 `REF-F08` は現存 3 件へ更新して `QUAL-004`、旧 `REF-F11` は大規模な画面実装と feature 越境利用を反映して `ARCH-001` へ移しました。
