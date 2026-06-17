# 目標カード → 通常レコード遷移 計画書

## 目的

目標一覧画面の目標カードタイトルをクリックすると、その目標を**まだ達成していない曲**だけが表示された通常レコード画面へ遷移できるようにする。

ユーザーは目標の進捗確認から、改善すべき譜面の洗い出しまでを一連の操作で行える。

## 背景・要件

- 遷移先は通常レコード（`record_normal`）のみ。WORLD'S END レコードは対象外。
- フィルタの適用方法は、IndexedDB（`viewSettings.standardRecordFilter`）へ書き込んでから遷移する。
- 既存の `UserRecord` はマウント時に `readStandardRecordFilterSetting()` でフィルタを復元するため、この方式と整合する。
- `/goals` と `/users/:username/record_normal` は別ルートであり、遷移時に `UserRecord` は再マウントされる。

## 現状認識

### 目標側

| ファイル | 役割 |
|---|---|
| `src/pages/goals/GoalsList/GoalsList.tsx` | 目標一覧。`filterRecordsByAttributes` + `calculateGoalProgress` で進捗算出 |
| `src/pages/goals/GoalsList/components/GoalCard.tsx` | 目標カード表示。タイトルは現状テキストのみ（クリック不可） |
| `src/pages/goals/utils/goalProgress.ts` | 目標条件でのレコード絞り込み・進捗計算 |
| `src/pages/goals/utils/goalVersion.ts` | 目標用バージョン番号 ↔ 表示名の変換 |

### レコード側

| ファイル | 役割 |
|---|---|
| `src/pages/users/UserRecord/UserRecord.tsx` | マウント時に IndexedDB からフィルタ復元、`applyFilters` で保存 |
| `src/pages/users/UserRecord/utils/filtering.ts` | `FilterState` によるレコード一致判定 |
| `src/pages/users/UserRecord/types/filterDefaults.ts` | `FilterState` 既定値・`buildDefaultFilter` |
| `src/repositories/viewSettingsRepository.ts` | `saveStandardRecordFilterSetting` / `readStandardRecordFilterSetting` |

### ルーティング

- 目標画面: `/goals`
- 通常レコード: `/users/{username}/record_normal`（`buildUserProfilePagePath(username, 'record_normal')`）

## 基本方針

### 1. 変換ロジックをユーティリティに切り出す

`GoalDTO` から通常レコードの `FilterState` へ変換する純粋関数を `src/pages/goals/utils/goalRecordFilter.ts` に新設する。

`goalProgress.ts` の達成判定と対になる「未達成」条件を、レコードフィルタの包含リスト・数値範囲で表現する。

### 2. ベースフィルタは `buildDefaultFilter` を使う

ユーザーが以前保存していたフィルタをマージしない。目標由来の条件だけが反映された状態にするため、毎回 `buildDefaultFilter(masterData, versions)` を起点にする。

### 3. IndexedDB 書き込み → 遷移の順序を守る

```text
1. buildGoalRecordFilter(goal, masterData, versions)
2. await saveStandardRecordFilterSetting(filter)
3. navigate(buildUserProfilePagePath(username, 'record_normal'))
```

保存完了前に遷移すると、古いフィルタが復元される可能性があるため、`await` してから遷移する。

### 4. 集計系目標は初版ではリンク非活性とする

曲単位で「未達成」を一意に定義しづらい目標種別は、初版ではタイトルクリックを無効化する。

対象外（初版）:

- `total_score`（総スコア）
- `overpower_value`（総 OVER POWER）
- `overpower_percent`（OVER POWER 達成率）

## 目標属性 → FilterState 変換

`filterRecordsByAttributes`（`goalProgress.ts`）と同じ解釈で、マスタ ID をレコードフィルタの表示名へ変換する。

| 目標 `attributes` | `FilterState` フィールド | 変換方法 |
|---|---|---|
| `diff`（難易度 ID） | `difficulties` | `masterData.difficulties` で ID → 名前。未指定時は `buildDefaultFilter` の全難易度を維持 |
| `const.min` / `const.max` | `const.min` / `const.max` | そのまま反映。未指定の端は `CONST_MIN` / `CONST_MAX` |
| `genre`（ジャンル ID） | `genres` | `masterData.genres` で ID → 名前。未指定時は `[]`（全ジャンル） |
| `ver`（バージョン番号） | `versions` | `buildGoalVersionNameMap(versions)` で番号 → 短縮表示名 |

共通設定:

- `title`: `''`（曲名検索なし）
- `excludeNoPlay`: `false`（未プレイ譜面も未達成として含める）
- `constFilterMode`: `'number'`
- `justiceCount` / `overPower`: 既定の null 範囲（未使用）

## 未達成条件（achievement_type 別）

`calculateGoalProgress` の「達成」と逆の条件をフィルタへ落とし込む。

### `rank_count` / `score_count`

- 達成条件: `record.score >= achievement_params.score`
- 未達成フィルタ:
  - `score.min = 0`
  - `score.max = achievement_params.score - 1`
  - `scoreFilterMode = 'number'`

`rank_count` の `achievement_params.score` はランク下限スコア（`getRankGoalScore` 相当）が保存されている。数値比較で未達成を表現する。

### `hardlamp_count`

- 達成条件: `clear_lamp` の順位が要求ランプ以上
- ランプ順位（`goalProgress.ts` と同一）:

  ```text
  HARD < BRAVE < ABSOLUTE < CATASTROPHY
  ```

- 未達成フィルタ: `hard_lamp` を要求未満のランプのみに限定

| `achievement_params.lamp` | 未達成として含める `hard_lamp` |
|---|---|
| `HRD` | `CLEAR`, `FAILED`, `null` |
| `BRV` | `HARD`, `CLEAR`, `FAILED`, `null` |
| `ABS` | `HARD`, `BRAVE`, `CLEAR`, `FAILED`, `null` |
| `CTS` | `HARD`, `BRAVE`, `ABSOLUTE`, `CLEAR`, `FAILED`, `null` |

`combo_lamp` / `chain_lamp` は `buildDefaultFilter` の全選択肢を維持（絞り込みなし）。

### `combolamp_count`

- 達成条件: `combo_lamp` の順位が要求以上
- ランプ順位:

  ```text
  null < FULL COMBO < ALL JUSTICE
  ```

- 未達成フィルタ: `combo_lamp` を要求未満のみに限定

| `achievement_params.lamp` | 未達成として含める `combo_lamp` |
|---|---|
| `FC` | `null` |
| `AJ` | `null`, `FULL COMBO` |

### `avg_score`

- 達成条件: 対象譜面の平均スコア `>= achievement_params.score`
- 未達成フィルタ（初版）:
  - `score.max = achievement_params.score - 1`
  - `scoreFilterMode = 'number'`

厳密には「平均未満の曲」ではなく「目標平均スコア未満の曲」を表示する。UX 上は「改善余地のある曲」として許容する。

### 集計系（初版対象外）

`total_score` / `overpower_value` / `overpower_percent` は曲単位の未達成定義が曖昧なため、初版ではタイトルをリンク化しない。将来、属性範囲のみの遷移やソート指定付き遷移を検討する。

## UI 変更

### GoalCard

- `onOpenRecords?: (goal: GoalDTO) => void` プロパティを追加
- タイトル `<h2>` を `<button type="button">` に変更
  - クリック可能時: `hover:underline` などでリンク風のスタイル
  - 非活性時（集計系）: 現状のテキスト表示を維持、`cursor-default`
- `isGoalRecordNavigationEnabled(goal)` で活性判定

### GoalsList

- `handleOpenUnachievedRecords(goal)` を実装
- `resource` の取得データ（`masterData`, `versions`）とログインユーザー名を利用
- `GoalCard` に `onOpenRecords` を渡す

### ユーザー名の取得

`resource` 取得時に `fetchMe()` の `username` を一緒に保持し、クリック時の再取得を避ける。

```typescript
// resource 返却値に username を追加
return {
  username: me.username,
  // ...
}
```

## 実装タスク

| # | タスク | 対象ファイル |
|---|---|---|
| 1 | `buildGoalRecordFilter` 実装 | `src/pages/goals/utils/goalRecordFilter.ts`（新規） |
| 2 | `isGoalRecordNavigationEnabled` 実装 | 同上 |
| 3 | 単体テスト追加 | `src/pages/goals/utils/goalRecordFilter.test.ts`（新規） |
| 4 | GoalCard タイトルをクリック可能に | `src/pages/goals/GoalsList/components/GoalCard.tsx` |
| 5 | 遷移ハンドラ接続 | `src/pages/goals/GoalsList/GoalsList.tsx` |
| 6 | `npm run check:ci` / `npm run build` / `npm run test:unit` 通過確認 | — |

## テスト方針

`node:test` + Given-When-Then で `goalRecordFilter.test.ts` を記述する。

### 検証観点

1. **属性変換**: 難易度・定数・ジャンル・バージョンが `FilterState` に正しく反映されること
2. **未達成一致**: `filterRecordsByAttributes` で絞ったレコードのうち、`calculateGoalProgress` で未達成とみなされる曲だけが `isRecordMatched(buildGoalRecordFilter(...))` を満たすこと
3. **達成曲の除外**: 達成済みの曲がフィルタに一致しないこと
4. **未プレイ含有**: `excludeNoPlay: false` により未プレイ譜面が含まれること
5. **ナビゲーション活性**: 集計系目標で `isGoalRecordNavigationEnabled` が `false` を返すこと

### テスト用ヘルパ

`goalProgress.test.ts` と同様に `createRecord` / `createGoal` / `createSong` を流用または共通化する。

## 注意点・既知の制約

### フィルタの上書き

遷移により、ユーザーが以前 IndexedDB に保存していた通常レコードフィルタは失われる。意図した仕様としてドキュメント化する。復元が必要な場合は、ユーザーが「保存済みフィルター」機能で別名保存している前提とする。

### 同一タブ内の再遷移

`/goals` → `/users/.../record_normal` の遷移では `UserRecord` が再マウントされるため問題ない。将来、目標とレコードを同一ページ内で切り替える構成に変わった場合は、フィルタ再読込の仕組みが必要になる。

### `invert` フラグ

目標の `invert` はカード表示の反転用であり、達成判定ロジックには影響しない。フィルタ構築でも `invert` は無視する。

### 難易度の大文字統一

ドメインルールに従い、難易度名は `MASTER`, `ULTIMA` 等の大文字で扱う。`masterData.difficulties[].name` をそのまま利用する。

## 将来拡張（スコープ外）

| 案 | 概要 | メリット |
|---|---|---|
| クエリパラメータ方式 | `?goalId=123` でレコード側が目標を読み込みフィルタ構築 | 既存フィルタを壊さない |
| 集計系目標の対応 | 属性範囲のみ遷移 + スコア昇順ソートを URL で指定 | 総スコア目標でも「伸ばしどころ」を示せる |
| 遷移前確認ダイアログ | 「現在のフィルタが上書きされます」の確認 | 誤操作防止 |
| WORLD'S END 対応 | 目標に WE 条件が追加された場合の別画面遷移 | 将来の目標拡張に備える |

## 関連ファイル一覧

```
src/pages/goals/utils/goalRecordFilter.ts          # 新規: 変換ロジック
src/pages/goals/utils/goalRecordFilter.test.ts     # 新規: 単体テスト
src/pages/goals/GoalsList/components/GoalCard.tsx  # 改修: タイトルクリック
src/pages/goals/GoalsList/GoalsList.tsx            # 改修: 遷移ハンドラ
src/repositories/viewSettingsRepository.ts         # 利用: saveStandardRecordFilterSetting
src/pages/users/UserPage/profilePageQuery.ts       # 利用: buildUserProfilePagePath
src/pages/goals/utils/goalProgress.ts              # 参照: 達成判定の基準
src/pages/users/UserRecord/types/filterDefaults.ts # 参照: buildDefaultFilter
```

## 完了条件

- [ ] 件数系・ランプ系・平均スコア系目標のタイトルクリックで、未達成曲のみが表示された通常レコード画面へ遷移できる
- [ ] 集計系目標のタイトルはクリック不可である
- [ ] `goalRecordFilter.test.ts` で達成/未達成の整合性が検証されている
- [ ] `npm run check:ci` / `npm run build` / `npm run test:unit` がエラーなく通る
- [ ] 変更箇所に TSDoc が付与されている