# レコードフィルター仕様

このドキュメントは、ユーザーレコード画面で利用するフィルター状態、保存済みフィルター API、URL クエリ表現をまとめたものです。
基準実装は `src/pages/users/UserRecord`、`src/pages/users/WorldsendRecord`、`src/pages/users/components/SavedRecordFiltersDialog.tsx`、`src/api/recordFilters.ts` です。

## 対象

レコードフィルターは、通常レコード用の `FilterState` と WORLD'S END 用の `WorldsendFilterState` に分かれます。

保存済みフィルターは localStorage ではなく、認証済みユーザーのサーバーデータとして `/internal/me/record-filters` API に保存します。
API 上は `filter_type` で通常レコードと WORLD'S END を区別し、`filter` に各画面のフィルター状態 JSON を内包します。

URL クエリでは内部 JSON をそのまま入れず、通常レコードの範囲条件だけをフラットなキーへ変換します。

## 通常レコード FilterState

```json
{
  "title": "",
  "difficulties": ["MASTER", "ULTIMA"],
  "genres": [],
  "versions": [],
  "const": {
    "min": 1,
    "max": 16
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

### 通常レコードのフィールド

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `title` | `string` | はい | 曲名、アーティスト名、読みの部分一致検索。正規化して比較します。空文字なら条件なしです。 |
| `difficulties` | `string[]` | はい | 対象難易度の配列です。難易度値は `BASIC`, `ADVANCED`, `EXPERT`, `MASTER`, `ULTIMA` のように大文字で扱います。空配列にすると全件不一致になります。 |
| `genres` | `string[]` | はい | 対象ジャンル名の配列です。空配列なら全ジャンル対象です。 |
| `versions` | `string[]` | はい | 対象バージョン名の配列です。値はバージョン API (`/internal/master/versions`) の `versions[].name` を `getShortVersionName` で短縮した名前を使います。空配列なら全バージョン対象です。 |
| `const` | `{ min: number, max: number }` | はい | 譜面定数の範囲です。 |
| `constFilterMode` | `"level"` \| `"number"` | はい | UI の入力モードです。絞り込み判定は `const.min` / `const.max` を参照します。 |
| `score` | `{ min: number, max: number }` | はい | スコア範囲です。未プレイ譜面はスコア `0` として判定します。 |
| `scoreFilterMode` | `"rank"` \| `"number"` | はい | UI の入力モードです。絞り込み判定は `score.min` / `score.max` を参照します。 |
| `justiceCount` | `{ min: number \| null, max: number \| null }` | はい | AJ 時の JUSTICE 数の範囲です。`null` なら該当する範囲端は条件なしです。 |
| `overPower` | `{ min: number \| null, max: number \| null }` | はい | OVER POWER 値の範囲です。`null` なら該当する範囲端は条件なしです。 |
| `combo_lamp` | `Array<string \| null>` | はい | 許可するコンボランプの配列です。`null` はランプなしを表します。空配列にすると全件不一致になります。 |
| `chain_lamp` | `Array<string \| null>` | はい | 許可する FULL CHAIN ランプの配列です。`null` はランプなしを表します。空配列にすると全件不一致になります。 |
| `hard_lamp` | `Array<string \| null>` | はい | 許可するクリアランプの配列です。`null` はランプなしを表します。空配列にすると全件不一致になります。 |
| `excludeNoPlay` | `boolean` | はい | `true` の場合、未プレイ譜面を除外します。 |

### 通常レコードの判定ルール

レコードは以下をすべて満たした場合に一致します。

1. `excludeNoPlay` が `true` のとき、未プレイではないこと。
2. `title` が空でないとき、曲名、アーティスト名、読みのいずれかに一致すること。
3. `difficulty` が `difficulties` に含まれること。
4. `genres` が空でないとき、レコードのジャンルが `genres` に含まれること。
5. `versions` が空でないとき、レコードのバージョンが `versions` に含まれること。
6. 譜面定数が `const.min` 以上かつ `const.max` 以下であること。
7. スコアが `score.min` 以上かつ `score.max` 以下であること。
8. `justiceCount.min` または `justiceCount.max` が `null` でないとき、コンボランプが `ALL JUSTICE` で、`justice_count` が `null` ではなく、指定範囲内であること。この場合、`combo_lamp` の選択状態は判定に使いません。
9. `overPower.min` または `overPower.max` が `null` でないとき、プレイ済み譜面で、`overpower` が指定範囲内であること。
10. JUSTICE 数フィルターが有効でないとき、コンボランプが `combo_lamp` に含まれること。
11. FULL CHAIN ランプが `chain_lamp` に含まれること。
12. クリアランプが `hard_lamp` に含まれること。

### 通常レコードのデフォルト値

- `title`: `""`
- `difficulties`: `["MASTER", "ULTIMA"]`
- `genres`: マスターデータ上の全ジャンル
- `versions`: バージョン API (`/internal/master/versions`) から取得した全バージョン名を短縮した名前
- `const.min`: `1`
- `const.max`: `16`
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

## WORLD'S END FilterState

```json
{
  "title": "",
  "attributes": [],
  "levelStarRange": {
    "min": 1,
    "max": 5
  },
  "genres": [],
  "versions": [],
  "score": {
    "min": 0,
    "max": 1010000
  },
  "scoreFilterMode": "rank",
  "justiceCount": {
    "min": null,
    "max": null
  },
  "combo_lamp": ["ALL JUSTICE", "FULL COMBO", null],
  "chain_lamp": ["FULL CHAIN PLATINUM", "FULL CHAIN GOLD", null],
  "hard_lamp": ["CATASTROPHY", "ABSOLUTE", "BRAVE", "HARD", "CLEAR", "FAILED", null],
  "excludeNoPlay": false
}
```

### WORLD'S END のフィールド

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `title` | `string` | はい | 曲名、アーティスト名、読みの部分一致検索。正規化して比較します。空文字なら条件なしです。 |
| `attributes` | `Array<string \| null>` | はい | WORLD'S END 属性の配列です。`null` は属性不明を表します。空配列にすると全件不一致になります。 |
| `levelStarRange` | `{ min: number, max: number }` | はい | ★レベルの範囲です。`level_star` が `null` のレコードは一致しません。 |
| `genres` | `string[]` | はい | 対象ジャンル名の配列です。空配列なら全ジャンル対象です。 |
| `versions` | `string[]` | はい | 対象バージョン名の配列です。値はバージョン API (`/internal/master/versions`) の `versions[].name` を `getShortVersionName` で短縮した名前を使います。空配列なら全バージョン対象です。 |
| `score` | `{ min: number, max: number }` | はい | スコア範囲です。未プレイ譜面はスコア `0` として判定します。 |
| `scoreFilterMode` | `"rank"` \| `"number"` | はい | UI の入力モードです。絞り込み判定は `score.min` / `score.max` を参照します。 |
| `justiceCount` | `{ min: number \| null, max: number \| null }` | はい | AJ 時の JUSTICE 数の範囲です。`null` なら該当する範囲端は条件なしです。 |
| `combo_lamp` | `Array<string \| null>` | はい | 許可するコンボランプの配列です。`null` はランプなしを表します。空配列にすると全件不一致になります。 |
| `chain_lamp` | `Array<string \| null>` | はい | 許可する FULL CHAIN ランプの配列です。`null` はランプなしを表します。空配列にすると全件不一致になります。 |
| `hard_lamp` | `Array<string \| null>` | はい | 許可するクリアランプの配列です。`null` はランプなしを表します。空配列にすると全件不一致になります。 |
| `excludeNoPlay` | `boolean` | はい | `true` の場合、未プレイ譜面を除外します。 |

### WORLD'S END の判定ルール

レコードは以下をすべて満たした場合に一致します。

1. `excludeNoPlay` が `true` のとき、未プレイではないこと。
2. `title` が空でないとき、曲名、アーティスト名、読みのいずれかに一致すること。
3. `attribute` が `attributes` に含まれること。
4. `level_star` が `null` ではなく、`levelStarRange.min` 以上かつ `levelStarRange.max` 以下であること。
5. `genres` が空でないとき、レコードのジャンルが `genres` に含まれること。
6. `versions` が空でないとき、レコードのリリースバージョンが `versions` に含まれること。
7. スコアが `score.min` 以上かつ `score.max` 以下であること。
8. `justiceCount.min` または `justiceCount.max` が `null` でないとき、コンボランプが `ALL JUSTICE` で、`justice_count` が `null` ではなく、指定範囲内であること。この場合、`combo_lamp` の選択状態は判定に使いません。
9. JUSTICE 数フィルターが有効でないとき、コンボランプが `combo_lamp` に含まれること。
10. FULL CHAIN ランプが `chain_lamp` に含まれること。
11. クリアランプが `hard_lamp` に含まれること。

### WORLD'S END のデフォルト値

- `title`: `""`
- `attributes`: WORLD'S END 楽曲マスタから取得した全属性
- `levelStarRange.min`: `1`
- `levelStarRange.max`: `5`
- `genres`: WORLD'S END 楽曲マスタ上の全ジャンル
- `versions`: バージョン API (`/internal/master/versions`) から取得した全バージョン名を短縮した名前
- `score.min`: `0`
- `score.max`: `1010000`
- `scoreFilterMode`: `"rank"`
- `justiceCount.min`: `null`
- `justiceCount.max`: `null`
- `combo_lamp`: `["ALL JUSTICE", "FULL COMBO", null]`
- `chain_lamp`: `["FULL CHAIN PLATINUM", "FULL CHAIN GOLD", null]`
- `hard_lamp`: `["CATASTROPHY", "ABSOLUTE", "BRAVE", "HARD", "CLEAR", "FAILED", null]`
- `excludeNoPlay`: `false`

## 共通の許可値

### `combo_lamp`

```json
["ALL JUSTICE", "FULL COMBO", null]
```

`null` は JSON 上で文字列ではなく null 値です。

### `chain_lamp`

```json
["FULL CHAIN PLATINUM", "FULL CHAIN GOLD", null]
```

`null` は JSON 上で文字列ではなく null 値です。

### `hard_lamp`

```json
["CATASTROPHY", "ABSOLUTE", "BRAVE", "HARD", "CLEAR", "FAILED", null]
```

`null` は JSON 上で文字列ではなく null 値です。

### `justiceCount`

入力値は 0 以上の整数です。
どちらか一方でも `null` でない場合、AJ 済み譜面のみが検索対象になります。
この条件は判定時の暗黙条件であり、`combo_lamp` の保存値や選択状態は変更せず、コンボランプ条件の判定をスキップします。

### `overPower`

通常レコードのみの条件です。
入力値は 0 以上、`(CONST_MAX + 3) * 5` 以下です。
現在の `CONST_MAX` は `16` のため、上限は `95` です。
小数点以下 3 桁までを扱います。
OVER POWER 達成率 (`overpower_percent`) は検索対象にしません。

## 保存済みフィルター API

保存済みフィルターは `/internal/me/record-filters` グループの API で管理します。
すべて Firebase Bearer 認証が必要です。

| エンドポイント | メソッド | 説明 |
| --- | --- | --- |
| `/internal/me/record-filters` | `GET` | 保存済みレコードフィルター一覧を取得します。 |
| `/internal/me/record-filters` | `POST` | 保存済みレコードフィルターを新規作成します。 |
| `/internal/me/record-filters/:id` | `PUT` | 保存済みレコードフィルターを完全上書き更新します。 |
| `/internal/me/record-filters/:id` | `DELETE` | 保存済みレコードフィルターを削除します。 |

### 保存リクエスト

```json
{
  "name": "高難度FC狙い",
  "filter_type": "standard",
  "schema_version": 3,
  "filter": {
    "title": "",
    "difficulties": ["MASTER", "ULTIMA"],
    "genres": [],
    "versions": ["CHUNITHM VERSE", "CHUNITHM X-VERSE"],
    "const": {
      "min": 14,
      "max": 16
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
  }
}
```

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `name` | `string` | 保存済みフィルター名です。前後空白を除いて1〜30文字、制御文字不可です。 |
| `filter_type` | `"standard"` \| `"worldsend"` | 通常レコードは `"standard"`、WORLD'S END は `"worldsend"` を使います。 |
| `schema_version` | `number` | フロント側フィルタースキーマのバージョンです。通常レコードは `3`、WORLD'S END は `2` です。 |
| `filter` | `object` | `filter_type` に対応するフィルター状態 JSON です。 |

サーバーは `filter` の内部フィールドを解釈しません。
`filter` が JSON オブジェクトであること、`schema_version` が正の整数であること、圧縮前の保存ペイロードが 8KB 以下であることを検証し、gzip 圧縮して保存します。
保存件数の上限は 100 件です。

### 取得レスポンス

```json
{
  "filters": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "高難度FC狙い",
      "filter_type": "standard",
      "schema_version": 3,
      "filter": {
        "title": "",
        "difficulties": ["MASTER", "ULTIMA"]
      },
      "created_at": "2026-06-15T12:00:00Z",
      "updated_at": "2026-06-15T12:00:00Z"
    }
  ]
}
```

`GET /internal/me/record-filters?filter_type=standard` のように `filter_type` クエリで種別を絞り込めます。
省略時は全種別を返します。
レスポンスの並び順は `updated_at` 降順です。

レスポンス DTO の `id` は保存済みフィルター ID で、UUID 形式です。

### フロント側の復元ルール

- 通常レコードは `schema_version: 3` の保存値を有効として扱います。
- WORLD'S END は `schema_version: 2` の保存値を有効として扱います。
- `filter` が `null` ではないオブジェクトの場合だけ、各画面の `normalizeFilterState` / `normalizeWorldsendFilterState` で補完します。
- スキーマバージョンが違う保存値は一覧には残しますが、`filter: null`、`isValid: false` として扱い、呼び出しや名前変更はできません。
- 旧スキーマや不正スキーマの保存値は、削除操作だけ可能です。

### フロント側の操作

- 未ログイン時は保存ボタンを無効化し、ログイン導線を表示します。
- 保存ボタンと呼出ボタンは分離します。
- 新規保存は保存名入力ダイアログで名前を入力し、`POST` で作成します。
- 新規保存時に同名フィルターがある場合は、最大30文字に収まるよう末尾へ `(2)` 形式の番号を付けます。
- 保存後は保存済みフィルター一覧を開き、保存したフィルターを強調表示します。
- 呼出ボタンは保存済みフィルター一覧を開きます。一覧の呼出ボタンを押した時点でフィルターを適用し、フィルターダイアログを閉じます。
- 一覧の編集ボタンは保存済み条件を現在のフィルターダイアログへ読み込み、保存ボタンだけを表示する編集モードへ切り替えます。
- 編集モードの保存は保存名入力を挟まず、現在の画面フィルターを使って `PUT` で完全上書きします。保存後は保存済みフィルター一覧を開き、更新したフィルターを強調表示します。
- 削除は `DELETE` で実行します。
- 作成、更新、削除後は一覧を再取得します。
- スキーマバージョン違い、型不一致、許可値外、許可範囲外の保存済みフィルターは壊れたフィルターとして表示し、呼出と編集を無効化して削除だけ可能にします。
- 保存前に API と同じ 8KB ペイロード制限を確認し、制限を超える条件は送信しません。

### API エラー

| エラーコード | 代表ステータス | 説明 |
| --- | --- | --- |
| `record_filter_not_found` | `404` | 指定したフィルターが存在しません。他ユーザーのフィルター指定も含みます。 |
| `record_filter_limit_exceeded` | `400` | 保存件数の上限を超えています。 |
| `invalid_record_filter_input` | `400` | `name` / `filter_type` / `schema_version` / `filter` / サイズ制限のいずれかが不正です。 |
| `invalid_record_filter_id` | `400` | `:id` が UUID 形式ではありません。 |

## URL クエリによるフィルター

URL クエリによるフィルター同期は、現行コードでは通常レコードの範囲条件を対象にしています。
`FilterState` の内部構造をそのまま保存せず、必要な項目だけをフラットなキーとして表現します。

```text
?constMin=14&constMax=16&scoreMin=1000000&scoreMax=1010000&justiceCountMax=20&overPowerMin=80
```

### 範囲フィルタークエリ

| クエリキー | 型 | 省略時 | 説明 |
| --- | --- | --- | --- |
| `constMin` | `number` に変換できる文字列 | 現在の内部フィルターの `const.min` | 譜面定数の下限です。`1` の場合はシリアライズ時に省略します。 |
| `constMax` | `number` に変換できる文字列 | 現在の内部フィルターの `const.max` | 譜面定数の上限です。`16` の場合はシリアライズ時に省略します。 |
| `scoreMin` | `number` に変換できる文字列 | 現在の内部フィルターの `score.min` | スコア下限です。`0` の場合はシリアライズ時に省略します。 |
| `scoreMax` | `number` に変換できる文字列 | 現在の内部フィルターの `score.max` | スコア上限です。`1010000` の場合はシリアライズ時に省略します。 |
| `justiceCountMin` | `number` に変換できる文字列 | 現在の内部フィルターの `justiceCount.min` | JUSTICE 数の下限です。`null` の場合はシリアライズ時に省略します。 |
| `justiceCountMax` | `number` に変換できる文字列 | 現在の内部フィルターの `justiceCount.max` | JUSTICE 数の上限です。`null` の場合はシリアライズ時に省略します。 |
| `overPowerMin` | `number` に変換できる文字列 | 現在の内部フィルターの `overPower.min` | OVER POWER 値の下限です。`null` の場合はシリアライズ時に省略します。 |
| `overPowerMax` | `number` に変換できる文字列 | 現在の内部フィルターの `overPower.max` | OVER POWER 値の上限です。`null` の場合はシリアライズ時に省略します。 |

パース時のルールは次の通りです。

1. 同じキーが複数指定された場合は先頭の値を使います。
2. 空文字、未指定、数値に変換できない値は、呼び出し元が渡したフォールバック値を使います。
3. 有効な数値は各フィルターの許可範囲に丸めます。
4. JUSTICE 数は整数のみ有効です。小数はフォールバック値を使います。
5. OVER POWER は小数点以下 3 桁へ丸めます。
6. `min` と `max` の大小関係はパース時には入れ替えません。

内部フィルターから URL クエリへ出力する場合:

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

過去には通常レコードの保存済みフィルターを localStorage の `chunisup_saved_filters` に保存していました。
また、WORLD'S END の保存済みフィルターを localStorage の `chunisup_saved_worldsend_filters` に保存していました。
現行コードではこれらの localStorage キーを読み込みません。

過去には `FilterState` 直下に `constMin` / `constMax`, `scoreMin` / `scoreMax`, `justiceCountMin` / `justiceCountMax`, `overPowerMin` / `overPowerMax` を持つ保存形式がありました。
現行仕様ではこの形式を復元しません。

過去に記載されていた `chunisup_tracking_condition` は現行コードでは使用していません。
