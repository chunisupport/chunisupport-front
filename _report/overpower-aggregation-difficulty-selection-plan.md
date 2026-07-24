# OVER POWER 集計対象への MASTER + ULTIMA 追加

## 1. 目的

OVER POWER サマリーの集計対象に、需要の高い `MASTER + ULTIMA` を追加する。
既存の単一選択UIを維持し、MASTER譜面とULTIMA譜面を譜面単位で単純加算する固定軸として扱う。

## 2. 現状

現在の集計対象は単一選択であり、以下の 7 軸をプルダウンから選ぶ。

- `OVER POWER対象`
- `BASIC`
- `ADVANCED`
- `EXPERT`
- `MASTER`
- `ULTIMA`
- `全難易度`

`OVER POWER対象` は曲ごとに現在の OVER POWER 対象譜面を 1 件選ぶ集計である。一方、難易度および `全難易度` は譜面単位の集計である。

## 3. 決定事項

### 3.1 `MASTER + ULTIMA` の意味

`MASTER + ULTIMA` は、MASTER 譜面と ULTIMA 譜面を両方合算する。
ULTIMA 譜面がある曲は 2 譜面として計上される。曲ごとに MASTER または ULTIMA のどちらか一方だけを選ぶ集計ではない。
現在の `is_op_target` や楽曲マスタの `op_target_difficulty` は判定に使用しない。

### 3.2 既存集計との関係

- `OVER POWER対象` の曲単位集計は変更しない。
- `MASTER`、`ULTIMA`、`全難易度` を含む既存の譜面単位集計は変更しない。
- `MASTER + ULTIMA` 選択中の件数表示は、ほかの難易度指定と同じ `譜面数` とする。

## 4. UI 仕様

既存の集計対象プルダウンへ `MASTER + ULTIMA` を追加する。

```text
[ MASTER + ULTIMA ▼ ]
```

## 5. データ・ロジック仕様

`OverPowerAggregationTarget` へ、固定集計対象ID `MASTER_ULTIMA` を追加する。

```ts
type OverPowerAggregationTarget =
  | OverPowerDifficulty
  | 'MASTER_ULTIMA'
  | 'OP_TARGET'
  | 'ALL'
```

`selectOverPowerChartEntries` は `MASTER_ULTIMA` の場合、難易度が `MASTER` または `ULTIMA` の全譜面エントリを返す。既存の `OP_TARGET` 分岐は通さない。
サマリーとグラフは同じ抽出結果を利用するため、現在値、理論値、譜面数、ランク分布、コンボ分布のすべてが両難易度の合算になる。

## 6. 実装計画

1. `MASTER_ULTIMA` の集計対象IDと対象難易度を定数化する。
2. `OverPowerAggregationTarget` と `selectOverPowerChartEntries` を固定軸へ対応させる。
3. 既存の集計対象プルダウンへ `MASTER + ULTIMA` を追加する。
4. OP対象フラグに関係なく両難易度を加算する単体テストを追加する。
5. 品質確認を行う。
   - `pnpm check:ci`
   - `pnpm typecheck`
   - `pnpm test:unit`
   - `pnpm build`

## 7. 受け入れ条件

- 初期表示は従来どおり `OVER POWER対象` である。
- `MASTER + ULTIMA` を選ぶと、MASTER と ULTIMA の譜面だけが合算される。
- 同じ曲にMASTERとULTIMAがある場合は2譜面として数える。
- 現在のOP対象難易度や `is_op_target` によって片方へ絞り込まれない。
- `OVER POWER対象` の結果は変更前と同じである。
- 件数ラベルは `譜面数` となる。
- 既存の未解禁曲除外、グラフ、テーブル、ジャンル・レベル・バージョン別集計がすべて選択結果に追従する。

## 8. 対象外

- 集計対象を URL クエリやローカルストレージへ保存・共有する機能。
- 難易度の任意複数選択UI。
- 曲ごとに MASTER または ULTIMA の片方だけを選ぶ集計規則。
