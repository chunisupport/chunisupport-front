# OVER POWER 集計対象の難易度複数選択化

## 1. 目的

OVER POWER サマリーの集計対象に、需要の高い `MASTER + ULTIMA` を追加する。
単一の組み合わせを新しい固定軸として増やすのではなく、難易度を複数選択できる仕様へ変更して、将来の任意組み合わせにも対応する。

## 2. 現状

現在の集計対象は単一選択であり、以下の 7 軸をプルダウンから選ぶ。

- `OVER POWER対象`
- `BASIC`
- `ADVANCED`
- `EXPERT`
- `MASTER`
- `ULTIMA`
- `全難易度`

`OVER POWER対象` は曲ごとに現在の OVER POWER 対象譜面を 1 件選ぶ集計である。一方、難易度および `全難易度` は譜面単位の集計である。この二つは集計単位が異なるにもかかわらず、同じ選択肢として並んでいる。

## 3. 決定事項

### 3.1 集計モード

集計対象を以下の二つの排他的なモードに分ける。

| モード | 集計対象 | 件数表示 |
| --- | --- | --- |
| `OVER POWER対象` | 曲ごとに現在の OVER POWER 対象となる 1 譜面 | 曲数 |
| 難易度指定 | 選択した難易度に属する全譜面 | 譜面数 |

`OVER POWER対象` と難易度指定を同時に選ぶことはできない。

### 3.2 難易度指定

- `BASIC`、`ADVANCED`、`EXPERT`、`MASTER`、`ULTIMA` をチェックボックスで複数選択できる。
- 選択数は 1 件以上とする。最後に残った難易度は解除できない。
- `全難易度` は独立した集計軸として廃止する。5 難易度をすべて選択した状態が、その機能を置き換える。
- `MASTER + ULTIMA` は独立した集計ロジックや永続的な軸にはしない。`MASTER` と `ULTIMA` が選択された状態として扱う。
- 利用頻度を考慮し、ドロップダウン内には `MASTER + ULTIMA` を一操作で設定するプリセット操作を置く。同様に、全難易度を一操作で設定する操作も置く。

### 3.3 `MASTER + ULTIMA` の意味

`MASTER + ULTIMA` は、MASTER 譜面と ULTIMA 譜面を両方合算する。
ULTIMA 譜面がある曲は 2 譜面として計上される。曲ごとに MASTER または ULTIMA のどちらか一方だけを選ぶ集計ではない。

## 4. UI 仕様

既存の集計対象プルダウンと同じ位置にトリガーを置く。トリガーを押すと、チェックボックスを含むポップオーバーを開く。通常の単一選択 Select ではなくポップオーバーとすることで、複数選択時にも選択状態を確認しながら操作できるようにする。

```text
[ OVER POWER対象 ▼ ]

┌────────────────────────┐
│ OVER POWER対象          │
├────────────────────────┤
│ MASTER + ULTIMA  全選択 │
│ ☐ BASIC                 │
│ ☐ ADVANCED              │
│ ☐ EXPERT                │
│ ☐ MASTER                │
│ ☐ ULTIMA                │
└────────────────────────┘
```

### 4.1 操作

- `OVER POWER対象` を選ぶと、集計モードを `OVER POWER対象` に切り替える。
- 難易度のチェック操作をすると、集計モードを難易度指定に切り替える。
- `MASTER + ULTIMA` は難易度指定を `MASTER` と `ULTIMA` に置き換える。
- `全選択` は 5 難易度すべてを選択する。
- 難易度指定で最後の 1 件を解除しようとする操作は無効化する。

### 4.2 トリガーの表示

トリガーには現在の集計対象を表示する。

| 状態 | 表示 |
| --- | --- |
| `OVER POWER対象` モード | `OVER POWER対象` |
| 1 難易度 | 難易度名（例: `MASTER`） |
| `MASTER` と `ULTIMA` | `MASTER + ULTIMA` |
| 5 難易度 | `BASIC〜ULTIMA` |
| その他の複数選択 | 選択済み難易度を表示。収まらない場合は件数表記へ省略する。 |

難易度指定を選んでいる間はサマリーの件数ラベルを `譜面数` とし、`OVER POWER対象` のときだけ `曲数` とする。

## 5. データ・ロジック仕様

現在の `OverPowerAggregationTarget` は文字列ユニオンである。集計モードと複数難易度を明示する識別可能ユニオンへ変更する。

```ts
type OverPowerAggregationTarget =
  | { mode: 'op-target' }
  | {
      mode: 'difficulties'
      difficulties: readonly OverPowerDifficulty[]
    }
```

実装では難易度配列が空にならないことを UI と集計関数の境界で保証する。既定値は、現在と同じ `OVER POWER対象` とする。

`selectOverPowerChartEntries` は以下のように振る舞う。

- `op-target` の場合は現在の曲ごとの OVER POWER 対象譜面選択ロジックを維持する。
- `difficulties` の場合は、`difficulties` に含まれる難易度の譜面エントリだけを返す。
- 旧 `ALL` 分岐は削除する。5 難易度を渡した場合に旧 `ALL` と同じ譜面エントリが返る。

`buildOverPowerSummary` とグラフ用の譜面エントリ取得は、同じ `OverPowerAggregationTarget` を受け取り、同じ選択結果を利用する。

## 6. 実装計画

1. 集計対象の型を変更する。
   - `src/usecases/overpower/types.ts` の `OverPowerAggregationTarget` を識別可能ユニオンへ変更する。
   - 既定値および利用箇所を新しい型に置き換える。

2. 集計ロジックを複数難易度に対応させる。
   - `src/usecases/overpower/aggregation.ts` の `selectOverPowerChartEntries` を変更する。
   - `src/usecases/overpower/overpowerSummary.ts` の既定値と引数利用を変更する。
   - 旧 `ALL` を前提にしたコメント・テスト名を更新する。

3. OVER POWER 画面の選択UIを置き換える。
   - `src/pages/users/UserOverPower/UserOverPower.tsx` から単一選択の `AppSelect` 利用を外す。
   - `src/pages/users/UserOverPower/components/OverPowerAggregationTargetSelect.tsx` を追加し、トリガーとポップオーバー内の難易度チェックボックスを実装する。
   - 画面固有の操作であり、現時点では 1 箇所でしか使わないため、共通コンポーネントには切り出さない。
   - チェックボックスには既存の `CheckboxField` を用いる。難易度選択であるため `textVariant="large"` を統一して使う。
   - `AppMultiSelect` は使用しない。難易度選択は Select ベースの複数選択ではなく、チェックボックスを明示したUIとする。

4. 定数と表示文言を整理する。
   - `src/pages/users/UserOverPower/constants.ts` の旧単一選択肢定数を、難易度順序・プリセット・操作ラベルへ置き換える。
   - `src/pages/users/UserOverPower/types.ts` の単一選択肢用型を削除または新コンポーネント用の型へ変更する。
   - UI文言・プリセット名・表示文字列は定数に集約する。

5. テストを追加・更新する。
   - `src/usecases/overpower/aggregation.test.ts` を追加し、難易度配列での抽出を直接テストする。
   - `src/usecases/overpower/overpowerSummary.test.ts` の `ALL` 前提を「5難易度選択」に更新する。
   - `MASTER + ULTIMA` が両難易度を合算し、ULTIMA付き楽曲を 2 譜面として数えることをテストする。
   - `OVER POWER対象` の既存結果が変わらないことをテストする。
   - グラフ用のレコードグループが選択難易度だけを反映することを確認する。

6. 品質確認を行う。
   - `pnpm check:ci`
   - `pnpm typecheck`
   - `pnpm test:unit`
   - `pnpm build`
   - ライト・ダークテーマ、および狭い画面幅でポップオーバーとトリガー表示を手動確認する。

## 7. 受け入れ条件

- 初期表示は従来どおり `OVER POWER対象` である。
- `MASTER + ULTIMA` プリセットを選ぶと、MASTER と ULTIMA の譜面だけが合算される。
- 任意の 1〜5 難易度を選択して集計できる。
- 全5難易度の選択結果は、変更前の `全難易度` と同じである。
- `OVER POWER対象` の結果は変更前と同じである。
- 集計モードに応じて、件数ラベルが `曲数` と `譜面数` に正しく切り替わる。
- 0 件の難易度選択は作れない。
- 既存の未解禁曲除外、グラフ、テーブル、ジャンル・レベル・バージョン別集計がすべて選択結果に追従する。

## 8. 対象外

- 集計対象を URL クエリやローカルストレージへ保存・共有する機能。
- 曲ごとに MASTER または ULTIMA の片方だけを選ぶ新しい集計規則。
- 他画面での難易度選択UIの共通化。

現在の集計対象は画面内の一時状態であり、URL・ローカルストレージには保存していない。そのため、今回も選択状態の永続化は扱わない。
