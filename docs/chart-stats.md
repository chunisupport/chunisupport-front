# レコード統計

`/tools/chart-stats` は、全プレイヤーを対象に集計した譜面別のレコード統計を表示する公開ページです。

## データ取得

フロントエンドのホスト名へ `static.` を付けた配信元から、難易度別のJSONを取得します。
`PUBLIC_CHART_STATS_BASE_URL` が設定されている場合は、その配信元を優先します。ローカル開発では `https://static.chunisup-dev.f5.si` を使用します。

| 難易度 | パス |
| --- | --- |
| BASIC | `/v1/chart-stats/BASIC.json` |
| ADVANCED | `/v1/chart-stats/ADVANCED.json` |
| EXPERT | `/v1/chart-stats/EXPERT.json` |
| MASTER | `/v1/chart-stats/MASTER.json` |
| ULTIMA | `/v1/chart-stats/ULTIMA.json` |
| WORLD'S END | `/v1/chart-stats/WORLDS_END.json` |

`rank`、`clear`、`combo` の各値は排他的な人数です。グラフは排他的な人数の構成比を表示し、表は各到達条件以上の累積人数または達成率を表示します。達成率の分母は `player_count` です。

## 表示仕様

- 初期難易度は `MASTER`、初期表示は `RANK` のグラフです。
- グラフ表示と表表示はどちらもTanStack Virtualで仮想化された1譜面1行の表形式で、ページングしません。
- グラフ表示は曲名、定数、人数、分布グラフを横並びにします。
- 定数と人数の列は中央揃えです。WORLD'S ENDでは定数の代わりに `Lv./属性` を表示します。
- グラフには数値を表示せず、表表示では `人数` と `割合` を切り替えられます。
- グラフの帯は行高を抑えた細い表示とし、曲名セル全体から楽曲詳細へ移動できます。
- 集計カテゴリは `RANK`、`COMBO`、`HARD` を切り替えられます。
- 表では達成率に応じたヒートマップを任意で有効にできます。セル内の数値は常に残します。
- 曲名検索はUnicode正規化後の部分一致です。
- 表はすべての列、グラフは曲名・定数・人数の列を見出し操作でソートできます。同列の3回目の操作でソートを解除します。ソート状態は画面内に閉じて保持し、表では集計カテゴリの切り替え時に解除します。
- 曲名から、選択中の難易度を指定した楽曲詳細へ移動できます。
