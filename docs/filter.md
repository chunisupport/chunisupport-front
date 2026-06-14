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
  "constMax": 16.0,
  "constFilterMode": "level",
  "scoreMin": 0,
  "scoreMax": 1010000,
  "scoreFilterMode": "rank",
  "justiceCountMin": null,
  "justiceCountMax": null,
  "overPowerMin": null,
  "overPowerMax": null,
  "combo_lamp": ["ALL JUSTICE", "FULL COMBO", null],
  "chain_lamp": ["FULL CHAIN PLATINUM", "FULL CHAIN GOLD", null],
  "hard_lamp": ["CATASTROPHY", "ABSOLUTE", "BRAVE", "HARD", "CLEAR", "FAILED", null],
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
| `justiceCountMin` | `number \| null` | はい | AJ時のJUSTICE数の下限です。`null` なら下限なしです。 |
| `justiceCountMax` | `number \| null` | はい | AJ時のJUSTICE数の上限です。`null` なら上限なしです。 |
| `overPowerMin` | `number \| null` | はい | OVER POWER値の下限です。`null` なら下限なしです。 |
| `overPowerMax` | `number \| null` | はい | OVER POWER値の上限です。`null` なら上限なしです。 |
| `combo_lamp` | `Array<string \| null>` | はい | 許可するコンボランプの配列です。`null` はランプなしを表します。空配列にすると全件不一致になります。 |
| `chain_lamp` | `Array<string \| null>` | はい | 許可するFULL CHAINランプの配列です。`null` はランプなしを表します。空配列にすると全件不一致になります。 |
| `hard_lamp` | `Array<string \| null>` | はい | 許可するクリアランプの配列です。`null` はランプなしを表します。空配列にすると全件不一致になります。 |
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
8. `justiceCountMin` または `justiceCountMax` が `null` でないとき、コンボランプが `ALL JUSTICE` で、`justice_count` が `null` ではなく、指定範囲内であること。この場合、`combo_lamp` の選択状態は判定に使いません。
9. `overPowerMin` または `overPowerMax` が `null` でないとき、プレイ済み譜面で、`overpower` が指定範囲内であること。
10. コンボランプが `combo_lamp` に含まれること。
11. FULL CHAINランプが `chain_lamp` に含まれること。
12. クリアランプが `hard_lamp` に含まれること。

## デフォルト値

初期値は次の通りです。

- `title`: `""`
- `difficulties`: `["MASTER", "ULTIMA"]`
- `genres`: マスターデータ上の全ジャンル
- `versions`: バージョン API (`/internal/master/versions`) から取得した全バージョン名
- `constMin`: `1.0`
- `constMax`: `16.0`
- `constFilterMode`: `"level"`
- `scoreMin`: `0`
- `scoreMax`: `1010000`
- `scoreFilterMode`: `"rank"`
- `justiceCountMin`: `null`
- `justiceCountMax`: `null`
- `overPowerMin`: `null`
- `overPowerMax`: `null`
- `combo_lamp`: `["ALL JUSTICE", "FULL COMBO", null]`
- `chain_lamp`: `["FULL CHAIN PLATINUM", "FULL CHAIN GOLD", null]`
- `hard_lamp`: `["CATASTROPHY", "ABSOLUTE", "BRAVE", "HARD", "CLEAR", "FAILED", null]`
- `excludeNoPlay`: `false`

## 許可値

### `difficulties`

API の `PlayerRecordDTO["difficulty"]` と同じ値を使います。
この画面の既定値では `MASTER` と `ULTIMA` を使用しています。

### `versions`

固定配列は持たず、バージョン API (`/internal/master/versions`) が返す `versions[].name` をそのまま使います。
配列順も API のレスポンス順に従います。

### `combo_lamp`

この画面で選択可能な値は以下です。

```json
["ALL JUSTICE", "FULL COMBO", null]
```

`null` は JSON 上で文字列ではなく null 値です。

### `justiceCountMin` / `justiceCountMax`

入力値は0以上の整数です。
どちらか一方でも `null` でない場合、AJ済み譜面のみが検索対象になります。
この条件は判定時の暗黙条件であり、`combo_lamp` の保存値や選択状態は変更せず、コンボランプ条件の判定もスキップします。

### `overPowerMin` / `overPowerMax`

入力値は0以上、`(CONST_MAX + 3) * 5` 以下です。
現在の `CONST_MAX` は `16.0` のため、上限は `95` です。
小数点以下3桁までを扱います。
OVER POWER達成率 (`overpower_percent`) は検索対象にしません。

### `chain_lamp`

この画面で選択可能な値は以下です。

```json
["FULL CHAIN PLATINUM", "FULL CHAIN GOLD", null]
```

`null` は JSON 上で文字列ではなく null 値です。

### `hard_lamp`

この画面で選択可能な値は以下です。

```json
["CATASTROPHY", "ABSOLUTE", "BRAVE", "HARD", "CLEAR", "FAILED", null]
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
      "constMax": 16.0,
      "constFilterMode": "number",
      "scoreMin": 1000000,
      "scoreMax": 1010000,
      "scoreFilterMode": "number",
      "justiceCountMin": null,
      "justiceCountMax": 20,
      "overPowerMin": 80,
      "overPowerMax": 95,
      "combo_lamp": ["FULL COMBO"],
      "chain_lamp": ["FULL CHAIN PLATINUM", "FULL CHAIN GOLD", null],
      "hard_lamp": ["CATASTROPHY", "ABSOLUTE", "BRAVE", "HARD"],
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
  "combo_lamp": ["ALL JUSTICE", "FULL COMBO"],
  "chain_lamp": ["FULL CHAIN PLATINUM"],
  "hard_lamp": ["CATASTROPHY", "ABSOLUTE", "BRAVE", "HARD"],
  "savedAt": 1744041600000
}
```
