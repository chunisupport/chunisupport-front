# 画面上部エラー表示の調査

再検証日: 2026-10-08
調査対象: `develop`

## 調査範囲

- 対象: `src/pages` 配下で、ページ見出し直下または主要コンテンツの先頭付近にエラー文言を表示している実装。
- 除外: 入力欄・ボタン・ダイアログ内など、操作対象の近くに出ているエラー表示。
- 備考: `toUserFriendlyErrorMessage(...)` を通る文言は、APIエラーコードやHTTPステータスに応じて `src/types/api.ts` / `src/utils/errorMessage.ts` の共通文言に置き換わる。

## 結論

前回調査（2026-09-25）で上部エラー表示としていた画面は、共通トースト（`src/components/common/AppToast.tsx` の `showErrorToast` / `showSuccessToast`）へ移行済み、または上部表示枠が削除済みである。

現在、操作失敗をページ上部（一覧の先頭）にまとめて表示しているのは、目標一覧の1か所のみ。

| 画面 | ルート | 実装箇所 | 上部に出るエラー文言 |
| --- | --- | --- | --- |
| 目標 | `/goals` | `src/pages/goals/GoalsList/GoalsList.tsx`（`actionError`）、`components/list/GoalsListContent.tsx` で一覧の先頭に表示 | 下記「目標一覧のエラー文言」を参照 |

## 目標一覧のエラー文言

いずれも `toUserFriendlyErrorMessage(error, fallback)` を通るため、APIエラーコード・HTTPステータスが取れる場合は共通文言が表示される可能性がある。

| 操作 | fallback 文言 | 操作対象 |
| --- | --- | --- |
| 目標のコピー | `目標のコピーに失敗しました。`（`GOAL_COPY_ERROR_MESSAGE`） | 目標カードのコピーボタン |
| 未達成レコードの表示 | `未達成レコードの表示に失敗しました。`（`RECORD_NAVIGATION_ERROR_MESSAGE`） | 目標カードのレコード表示ボタン |
| 目標の削除 | `削除に失敗しました。`（`GoalsList.tsx` にハードコード） | 削除確認ダイアログ |
| 並び替えの保存 | `並び順の保存に失敗しました。`（`GOAL_REORDER_ERROR_MESSAGE`） | ドラッグした目標カード |

いずれも操作対象の目標カードやダイアログが特定できるため、AGENTS.md の「対象要素の近くに表示」に合わせる場合は、トースト化またはカード・ダイアログ内への表示が候補になる。

## トーストへ移行済みの画面

前回調査で上部エラー表示としていた画面の現状:

| 画面 | ルート | 現状 |
| --- | --- | --- |
| フレンド | `/friends`, `/friends/receive`, `/friends/request` | 取得失敗・操作失敗・ユーザー名コピー失敗・成功通知をトーストで表示（`FriendsPage.tsx`） |
| ユーザー管理 | `/admin/users` | 削除失敗をトーストで表示。権限変更・不審フラグ更新の失敗は各ユーザー行に表示 |
| 楽曲管理（ADMIN） / 楽曲編集（EDITOR） | `/admin/songs`, `/editor/songs` | 入力検証・更新・追加・削除・復活の結果をトーストで表示（`song-management/hooks/createStandardSongManagement.ts`、`createWorldsendSongManagement.ts`） |
| スコア登録（一時） | `/register-score-temp` | アップロード時の検証エラー・失敗・成功をトーストで表示。確定保存（uploadToken 入力）の導線は削除済み |
| 称号管理 | `/admin/honors` | ページ上部の表示枠は削除済み。作成・編集の失敗は編集ダイアログ内に表示 |

## 対象外として確認したもの

- ページ全体の読み込み失敗: 対象要素を特定できないため、AGENTS.md で上部表示が許可されている。
  - データ網羅状況（`AdminDataCoveragePage.tsx`）、ユーザー統計（`AdminUsersPage.tsx`）、メンテナンス状態（`AdminMaintenancePage.tsx`）
- スコア登録（`RegisterScorePage.tsx`）のエラー状態: 画面の表示状態そのものがエラー表示に切り替わるため、上部通知ではない。
- ログイン画面・新規登録画面: フォームカード内の認証エラー表示であり、ページ全体上部の通知バナーではない。
- フレンド申請フォームの `requestErrorMessage`: ユーザー名入力欄の近くに出る。
- ダイアログ内のエラー: 称号編集、バージョン編集・削除（`AdminVersionsPage.tsx`）、コース編集（`CourseManagementPage.tsx`）、レコードフィルター保存など。
- ボーダー計算（`BorderCalculatorPage.tsx`）の到達不能表示: 計算結果欄に出る結果表示であり、エラー通知ではない。

## 共通エラー文言

`toUserFriendlyErrorMessage(...)` 経由で表示され得る共通文言は、`src/types/api.ts` のエラーコード別文言と `src/utils/errorMessage.ts` の HTTP ステータス別文言を参照。
