# 目標カードから通常レコードへの遷移仕様

目標一覧画面の目標カードから、その目標に対して未達成の譜面を表示した通常レコード画面へ遷移する機能の仕様を定義します。

## 対象

- 遷移元: `/goals`
- 遷移先: `/users/{username}/record_normal`
- 対象レコード: 通常レコードのみ
- 対象外: WORLD'S END レコード

## ユーザー操作

曲単位の未達成条件へ変換できる目標では、目標カードのタイトルを操作可能な Kobalte `Button` として表示し、外部遷移を示すアイコンを付けます。タイトルを選択すると、対象目標の属性と未達成条件が通常レコードフィルターへ反映され、ログインユーザーの通常レコード画面へ遷移します。

集計値だけで達成を判定する次の目標は、曲単位の未達成条件を一意に定義できないため、タイトルを操作できないテキストとして表示します。

- `total_score`
- `overpower_value`
- `overpower_percent`

## 遷移処理

遷移時は次の順序で処理します。

1. `buildGoalRecordFilter` で `GoalDTO` を通常レコードの `FilterState` へ変換する。
2. `saveStandardRecordFilterSetting` で `viewSettings.standardRecordFilter` へ保存する。
3. 保存完了後、`buildUserProfilePagePath(username, 'record_normal')` が返すパスへ遷移する。

通常レコード画面はマウント時に IndexedDB のフィルターを復元します。古い値を読み込まないよう、保存処理の完了を待ってから遷移しなければなりません。保存または遷移に失敗した場合は、目標一覧画面のエラー表示領域へユーザー向けメッセージを表示します。

この操作では、以前の通常レコードフィルターをマージせず、目標から生成したフィルターで上書きします。名前付きの保存済みフィルターには影響しません。

## フィルターの基本値

フィルターは `buildDefaultFilter(masterData, versions)` を起点とし、目標属性の意味が目標進捗の絞り込みと一致するように次の値を設定します。

| フィールド | 設定値 |
| --- | --- |
| `title` | `''` |
| `difficulties` | 指定された難易度。未指定時は全難易度 |
| `genres` | 指定されたジャンル。未指定時は `[]`（全ジャンル） |
| `versions` | 指定されたバージョン。未指定時は `[]`（全バージョン） |
| `const.min` | 指定値。未指定時は `CONST_MIN` |
| `const.max` | 指定値。未指定時は `CONST_MAX` |
| `constFilterMode` | `'number'` |
| `score.min` | `0` |
| `score.max` | `MAX_SCORE`。スコア条件を持つ目標では後述の上限へ変更 |
| `scoreFilterMode` | `'number'` |
| `excludeNoPlay` | `false` |

`justiceCount`、`overPower`、`combo_lamp`、`chain_lamp`、`hard_lamp` は、目標種別固有の変更がない限り `buildDefaultFilter` の値を維持します。

### 属性の変換

| 目標属性 | 変換先 | 変換規則 |
| --- | --- | --- |
| `diff` | `difficulties` | マスターデータの ID から難易度名へ変換し、大文字に統一する |
| `genre` | `genres` | マスターデータの ID からジャンル名へ変換する |
| `ver` | `versions` | リリース日順の 1 始まり番号として解釈し、`buildGoalVersionNameMap` で短縮バージョン名へ変換する |
| `const.min` / `const.max` | `const.min` / `const.max` | 指定値をそのまま使用する |

`diff`、`genre`、`ver` は単一値と配列の両方を受け付け、有効な整数 ID の配列へ正規化します。難易度は `BASIC`、`ADVANCED`、`EXPERT`、`MASTER`、`ULTIMA` のような大文字のドメイン値として扱います。

## 目標種別ごとの未達成条件

### `rank_count`、`score_count`

達成条件 `score >= achievement_params.score` の反対を表すため、次のスコア範囲を使用します。

```text
score.min = 0
score.max = max(0, achievement_params.score - 1)
```

### `avg_score`

目標平均そのものの未達成を曲単位では判定できないため、`achievement_params.score` 未満の譜面を改善対象として表示します。スコア範囲は `rank_count`、`score_count` と同じです。

### `hardlamp_count`

要求クリアランプ未満の譜面だけを `hard_lamp` に設定します。

| 要求値 | 表示対象の `hard_lamp` |
| --- | --- |
| `HRD` | `CLEAR`, `FAILED`, `null` |
| `BRV` | `HARD`, `CLEAR`, `FAILED`, `null` |
| `ABS` | `BRAVE`, `HARD`, `CLEAR`, `FAILED`, `null` |
| `CTS` | `ABSOLUTE`, `BRAVE`, `HARD`, `CLEAR`, `FAILED`, `null` |

### `combolamp_count`

要求コンボランプ未満の譜面だけを `combo_lamp` に設定します。

| 要求値 | 表示対象の `combo_lamp` |
| --- | --- |
| `FC` | `null` |
| `AJ` | `FULL COMBO`, `null` |

## 補足ルール

- 未プレイ譜面は未達成候補に含めます。
- `invert` はカードの進捗表示にだけ使用し、フィルター変換には影響しません。
- `/goals` と通常レコードは別ルートであり、遷移時に通常レコード画面が再マウントされることを前提とします。
- 同一ページ内で画面を切り替える構成へ変更する場合は、保存後にフィルターを再読込する仕組みが必要です。

## 基準実装

| ファイル | 役割 |
| --- | --- |
| `src/pages/goals/utils/goalRecordFilter.ts` | 目標からフィルターへの変換と遷移可否判定 |
| `src/pages/goals/utils/goalRecordFilter.test.ts` | 属性変換、未達成条件、遷移可否の単体テスト |
| `src/pages/goals/GoalsList/components/GoalCard.tsx` | 操作可能な目標タイトルの表示 |
| `src/pages/goals/GoalsList/GoalsList.tsx` | フィルター保存と通常レコードへの遷移 |
| `src/repositories/viewSettingsRepository.ts` | 通常レコードフィルターの IndexedDB 保存 |
| `src/pages/users/UserPage/profilePageQuery.ts` | 通常レコード画面のパス生成 |

通常レコードの `FilterState` と IndexedDB 永続化の詳細は [レコードフィルター・列表示設定](./record-filter-and-columns.md) を参照してください。
