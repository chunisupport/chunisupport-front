# レコードフィルタ JSON 仕様

このドキュメントは、ユーザーレコード画面で利用しているレコードフィルタ JSON の仕様をまとめたものです。
基準実装は `src/pages/users/UserRecord` 配下です。

## 対象

レコードフィルタ本体は `FilterState` です。
保存済みフィルタや追跡条件では、この `FilterState` を別の JSON が内包します。

## FilterState

```json
{
  "title": "",
  "difficulties": ["MASTER", "ULTIMA"],
  "genres": [],
  "versions": [],
  "constMin": 1,
  "constMax": 15.9,
  "constFilterMode": "level",
  "scoreMin": 0,
  "scoreMax": 1010000,
  "scoreFilterMode": "rank",
  "lamps": ["ALL JUSTICE", "FULL COMBO", null],
  "excludeNoPlay": false
}
```

## 各フィールド

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `title` | `string` | はい | 曲名の部分一致検索。判定時は大文字小文字を区別しません。空文字なら条件なしです。 |
| `difficulties` | `string[]` | はい | 対象難易度の配列です。実装上はレコードの `difficulty` と完全一致で比較します。空配列にすると全件不一致になります。 |
| `genres` | `string[]` | はい | 対象ジャンル名の配列です。空配列なら全ジャンル対象です。 |
| `versions` | `string[]` | はい | 対象バージョン名の配列です。空配列なら全バージョン対象です。値はバージョン API (`/internal/master/versions`) の `versions[].name` を使います。 |
| `constMin` | `number` | はい | 譜面定数の下限です。 |
| `constMax` | `number` | はい | 譜面定数の上限です。 |
| `constFilterMode` | `"level"` \| `"number"` | はい | UI の入力モードです。現在の絞り込み判定自体は `constMin` / `constMax` のみを参照します。 |
| `scoreMin` | `number` | はい | スコアの下限です。未プレイ譜面には適用されません。 |
| `scoreMax` | `number` | はい | スコアの上限です。未プレイ譜面には適用されません。 |
| `scoreFilterMode` | `"rank"` \| `"number"` | はい | UI の入力モードです。現在の絞り込み判定自体は `scoreMin` / `scoreMax` のみを参照します。 |
| `lamps` | `Array<string \| null>` | はい | 許可するコンボランプの配列です。`null` はランプなしを表します。未プレイ譜面には適用されません。空配列にするとプレイ済み譜面は全件不一致になります。 |
| `excludeNoPlay` | `boolean` | はい | `true` の場合、未プレイ譜面を除外します。 |

## 判定ルール

レコードは以下をすべて満たした場合に一致します。

1. `excludeNoPlay` が `true` のとき、未プレイではないこと。
2. `title` が空でないとき、曲名に `title` が部分一致すること。
3. `difficulty` が `difficulties` に含まれること。
4. `genres` が空でないとき、レコードのジャンルが `genres` に含まれること。
5. `versions` が空でないとき、レコードのバージョンが `versions` に含まれること。
6. 譜面定数が `constMin` 以上かつ `constMax` 以下であること。
7. プレイ済み譜面の場合のみ、スコアが `scoreMin` 以上かつ `scoreMax` 以下であること。
8. プレイ済み譜面の場合のみ、コンボランプが `lamps` に含まれること。

## デフォルト値

初期値は次の通りです。

- `title`: `""`
- `difficulties`: `["MASTER", "ULTIMA"]`
- `genres`: マスターデータ上の全ジャンル
- `versions`: バージョン API (`/internal/master/versions`) から取得した全バージョン名
- `constMin`: `1.0`
- `constMax`: `15.9`
- `constFilterMode`: `"level"`
- `scoreMin`: `0`
- `scoreMax`: `1010000`
- `scoreFilterMode`: `"rank"`
- `lamps`: `["ALL JUSTICE", "FULL COMBO", null]`
- `excludeNoPlay`: `false`

## 許可値

### `difficulties`

API の `PlayerRecordDTO["difficulty"]` と同じ値を使います。
この画面の既定値では `MASTER` と `ULTIMA` を使用しています。

### `versions`

固定配列は持たず、バージョン API (`/internal/master/versions`) が返す `versions[].name` をそのまま使います。
配列順も API のレスポンス順に従います。

### `lamps`

この画面で選択可能な値は以下です。

```json
["ALL JUSTICE", "FULL COMBO", null]
```

`null` は JSON 上で文字列ではなく null 値です。

## 保存済みフィルタ JSON

ローカルストレージの `chunisup_saved_filters` には、`FilterState` を内包した配列を保存します。

```json
[
  {
    "id": "1744041600000",
    "name": "高難度FC狙い",
    "filter": {
      "title": "",
      "difficulties": ["MASTER", "ULTIMA"],
      "genres": [],
      "versions": ["CHUNITHM VERSE", "CHUNITHM X-VERSE"],
      "constMin": 14,
      "constMax": 15.9,
      "constFilterMode": "number",
      "scoreMin": 1000000,
      "scoreMax": 1010000,
      "scoreFilterMode": "number",
      "lamps": ["FULL COMBO"],
      "excludeNoPlay": true
    },
    "savedAt": 1744041600000
  }
]
```

## 追跡条件 JSON

ローカルストレージの `chunisup_tracking_condition` には、保存済みフィルタ参照用の JSON を保存します。

```json
{
  "filterId": "1744041600000",
  "filterName": "高難度FC狙い",
  "scoreMin": 1009000,
  "lamps": ["ALL JUSTICE", "FULL COMBO"],
  "savedAt": 1744041600000
}
```
