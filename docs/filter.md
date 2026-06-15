# レコードフィルタ仕様

このドキュメントは、ユーザーレコード画面で利用しているレコードフィルタの内部 JSON と URL クエリの仕様をまとめたものです。
基準実装は `src/pages/users/UserRecord` 配下です。

## 対象

レコードフィルタ本体は `FilterState` です。
保存済みフィルタでは、この `FilterState` を別の JSON が内包します。
URL クエリでは、内部 JSON をそのまま入れず、外部表現としてフラットなキーへ変換します。

## FilterState

```json
{
  "title": "",
  "difficulties": ["MASTER", "ULTIMA"],
  "genres": [],
  "versions": [],
  "const": {
    "min": 1,
    "max": 16.0
  },
  "constFilterMode": "level",
  "score": {
    "min": 0,
    "max": 1010000
  },
  "scoreFilterMode": "rank",
  "justiceCount": {
    "min": null,
    "max": null
  },
  "overPower": {
    "min": null,
    "max": null
  },
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
| `versions` | `string[]` | はい | 対象バージョン名の配列です。空配列なら全バージョン対象です。値はバージョン API (`/internal/master/versions`) の `versions[].name` を `getShortVersionName` で短縮した名前を使います。 |
| `const` | `{ min: number, max: number }` | はい | 譜面定数の範囲です。`min` が下限、`max` が上限です。 |
| `constFilterMode` | `"level"` \| `"number"` | はい | UI の入力モードです。現在の絞り込み判定自体は `const.min` / `const.max` のみを参照します。 |
| `score` | `{ min: number, max: number }` | はい | スコア範囲です。`min` が下限、`max` が上限です。未プレイ譜面はスコア `0` として判定します。 |
| `scoreFilterMode` | `"rank"` \| `"number"` | はい | UI の入力モードです。現在の絞り込み判定自体は `score.min` / `score.max` のみを参照します。 |
| `justiceCount` | `{ min: number \| null, max: number \| null }` | はい | AJ時のJUSTICE数の範囲です。`null` なら該当する範囲端は条件なしです。 |
| `overPower` | `{ min: number \| null, max: number \| null }` | はい | OVER POWER値の範囲です。`null` なら該当する範囲端は条件なしです。 |
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
6. 譜面定数が `const.min` 以上かつ `const.max` 以下であること。
7. スコアが `score.min` 以上かつ `score.max` 以下であること。未プレイ譜面はスコア `0` として扱います。
8. `justiceCount.min` または `justiceCount.max` が `null` でないとき、コンボランプが `ALL JUSTICE` で、`justice_count` が `null` ではなく、指定範囲内であること。この場合、`combo_lamp` の選択状態は判定に使いません。
9. `overPower.min` または `overPower.max` が `null` でないとき、プレイ済み譜面で、`overpower` が指定範囲内であること。
10. コンボランプが `combo_lamp` に含まれること。
11. FULL CHAINランプが `chain_lamp` に含まれること。
12. クリアランプが `hard_lamp` に含まれること。

## デフォルト値

初期値は次の通りです。

- `title`: `""`
- `difficulties`: `["MASTER", "ULTIMA"]`
- `genres`: マスターデータ上の全ジャンル
- `versions`: バージョン API (`/internal/master/versions`) から取得した全バージョン名を短縮した名前
- `const.min`: `1.0`
- `const.max`: `16.0`
- `constFilterMode`: `"level"`
- `score.min`: `0`
- `score.max`: `1010000`
- `scoreFilterMode`: `"rank"`
- `justiceCount.min`: `null`
- `justiceCount.max`: `null`
- `overPower.min`: `null`
- `overPower.max`: `null`
- `combo_lamp`: `["ALL JUSTICE", "FULL COMBO", null]`
- `chain_lamp`: `["FULL CHAIN PLATINUM", "FULL CHAIN GOLD", null]`
- `hard_lamp`: `["CATASTROPHY", "ABSOLUTE", "BRAVE", "HARD", "CLEAR", "FAILED", null]`
- `excludeNoPlay`: `false`

## 許可値

### `difficulties`

API の `PlayerRecordDTO["difficulty"]` と同じ値を使います。
この画面の既定値では `MASTER` と `ULTIMA` を使用しています。

### `versions`

固定配列は持たず、バージョン API (`/internal/master/versions`) が返す `versions[].name` を `getShortVersionName` で短縮して使います。
配列順は API のレスポンス順に従います。

### `combo_lamp`

この画面で選択可能な値は以下です。

```json
["ALL JUSTICE", "FULL COMBO", null]
```

`null` は JSON 上で文字列ではなく null 値です。

### `justiceCount`

入力値は0以上の整数です。
どちらか一方でも `null` でない場合、AJ済み譜面のみが検索対象になります。
この条件は判定時の暗黙条件であり、`combo_lamp` の保存値や選択状態は変更せず、コンボランプ条件の判定もスキップします。

### `overPower`

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
現行スキーマの `schemaVersion` は `3` です。
読み込み時は `schemaVersion: 3` かつ `filter.const`, `filter.score`, `filter.justiceCount`, `filter.overPower` が範囲オブジェクトの保存値だけを復元します。
旧スキーマや不正な保存値はマイグレーションせず破棄し、現行スキーマの保存値だけを `localStorage` へ書き戻します。

```json
[
  {
    "schemaVersion": 3,
    "id": "1744041600000",
    "name": "高難度FC狙い",
    "filter": {
      "title": "",
      "difficulties": ["MASTER", "ULTIMA"],
      "genres": [],
      "versions": ["CHUNITHM VERSE", "CHUNITHM X-VERSE"],
      "const": {
        "min": 14,
        "max": 16.0
      },
      "constFilterMode": "number",
      "score": {
        "min": 1000000,
        "max": 1010000
      },
      "scoreFilterMode": "number",
      "justiceCount": {
        "min": null,
        "max": 20
      },
      "overPower": {
        "min": 80,
        "max": 95
      },
      "combo_lamp": ["FULL COMBO"],
      "chain_lamp": ["FULL CHAIN PLATINUM", "FULL CHAIN GOLD", null],
      "hard_lamp": ["CATASTROPHY", "ABSOLUTE", "BRAVE", "HARD"],
      "excludeNoPlay": true
    },
    "savedAt": 1744041600000
  }
]
```

## URL クエリによるフィルタ

URL クエリでは `FilterState` の内部構造をそのまま保存せず、必要な項目だけをフラットなキーとして表現します。
範囲フィルタは内部では `const: { min, max }` のようなオブジェクトですが、URL クエリでは `constMin` / `constMax` のようなフラットキーを使います。

```text
?constMin=14&constMax=16&scoreMin=1000000&scoreMax=1010000&justiceCountMax=20&overPowerMin=80
```

### 範囲フィルタクエリ

| クエリキー | 型 | 省略時 | 説明 |
| --- | --- | --- | --- |
| `constMin` | `number` に変換できる文字列 | 現在の内部フィルタの `const.min` | 譜面定数の下限です。`1.0` の場合はシリアライズ時に省略します。 |
| `constMax` | `number` に変換できる文字列 | 現在の内部フィルタの `const.max` | 譜面定数の上限です。`16.0` の場合はシリアライズ時に省略します。 |
| `scoreMin` | `number` に変換できる文字列 | 現在の内部フィルタの `score.min` | スコア下限です。`0` の場合はシリアライズ時に省略します。 |
| `scoreMax` | `number` に変換できる文字列 | 現在の内部フィルタの `score.max` | スコア上限です。`1010000` の場合はシリアライズ時に省略します。 |
| `justiceCountMin` | `number` に変換できる文字列 | 現在の内部フィルタの `justiceCount.min` | JUSTICE数の下限です。`null` の場合はシリアライズ時に省略します。 |
| `justiceCountMax` | `number` に変換できる文字列 | 現在の内部フィルタの `justiceCount.max` | JUSTICE数の上限です。`null` の場合はシリアライズ時に省略します。 |
| `overPowerMin` | `number` に変換できる文字列 | 現在の内部フィルタの `overPower.min` | OVER POWER値の下限です。`null` の場合はシリアライズ時に省略します。 |
| `overPowerMax` | `number` に変換できる文字列 | 現在の内部フィルタの `overPower.max` | OVER POWER値の上限です。`null` の場合はシリアライズ時に省略します。 |

パース時のルールは次の通りです。

1. 同じキーが複数指定された場合は先頭の値を使います。
2. 空文字、未指定、数値に変換できない値は、呼び出し元が渡したフォールバック値を使います。
3. 有効な数値は各フィルタの許可範囲に丸めます。
4. JUSTICE数は整数のみ有効です。小数はフォールバック値を使います。
5. OVER POWERは小数点以下3桁へ丸めます。
6. `min` と `max` の大小関係はパース時には入れ替えません。

### 内部フィルタとの変換

内部フィルタから URL クエリへ出力する場合:

```json
{
  "const": {
    "min": 14,
    "max": 16
  },
  "score": {
    "min": 1000000,
    "max": 1010000
  },
  "justiceCount": {
    "min": null,
    "max": 20
  },
  "overPower": {
    "min": 80,
    "max": null
  }
}
```

は、次のクエリ表現になります。

```json
{
  "constMin": "14",
  "scoreMin": "1000000",
  "justiceCountMax": "20",
  "overPowerMin": "80"
}
```

`const.max`, `score.max`, `justiceCount.min`, `overPower.max` がデフォルト値のため、それぞれ `constMax`, `scoreMax`, `justiceCountMin`, `overPowerMax` は省略されます。

## 旧仕様

過去には `FilterState` 直下に `constMin` / `constMax`, `scoreMin` / `scoreMax`, `justiceCountMin` / `justiceCountMax`, `overPowerMin` / `overPowerMax` を持つ保存形式がありました。
現行仕様ではこの形式を復元しません。
また、過去に記載されていた `chunisup_tracking_condition` は現行コードでは使用していません。
