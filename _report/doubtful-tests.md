# 仕様確認が必要なテスト

再検証日: 2026-10-03
調査対象: `develop`

この文書は、現在の実装・テストを固定しているものの、期待値を仕様として確定してよいか判断が必要な項目だけを記録する。

## 優先度: 高

### 1. 検索語末尾の全角英字を無条件に1文字削除

- `removeTrailingFullwidthAlphabet`は、検索語の末尾が全角英字なら常に1文字削除する。
- `src/utils/searchUtils.test.ts`も、この動作を明示的に固定している。
- 確定済みの検索語や、曲名・アーティスト名に全角英字を含む検索でも末尾1文字が失われる。
- 確認事項:
  - IME変換途中だけをUIイベントで判定して補正するか。
  - 確定済み文字列にも現在の補正を適用する仕様とするか。

## 優先度: 中

### 2. 四分位数の算出方法

- `getRecordStats`（`src/pages/users/utils/recordStats.ts`）は、Q1を`floor((n - 1) × 0.25)`、Q3を`floor((n - 1) × 0.75)`番目の値として選ぶ。
- そのため、2件のスコアではQ1とQ3の両方が最小値になる。
- `src/pages/users/UserRecord/utils/recordStats.test.ts`も、この結果を固定している。
- 一方、苦手譜面インスペクターの`inspectWeakCharts`（`src/utils/weakChartInspector.ts`）は線形補間で四分位数を求めており、`src/utils/weakChartInspector.test.ts`もその値（例: Q1=1000250）を前提にしている。
- 同じ「四分位数」でも画面によって定義が異なる。
- 確認事項:
  - 現在のインデックス切り捨て方式をフィルター統計の正式な四分位数定義とするか。
  - 苦手譜面インスペクターと同じ線形補間へ統一するか。

### 3. 複数ソート条件のキー重複

- `createInitialSortConditions`は、第1条件だけを指定値へ置き換えるため、指定キーが既定の第2条件以降と同じ場合でも重複を除去しない。
- `src/utils/sortConditions.test.ts`は`level`が第1・第2条件へ重複する結果を固定している。
- WORLD'S ENDでも、初期ソートで`attribute`が第1・第2条件へ重複する結果をテストしている。
- 同じキーを続けて比較しても後段の条件は実質的なタイブレークにならない。
- 確認事項:
  - 重複キーを許可して表示どおり保持するか。
  - 後続の重複キーを除外し、別の既定条件で補完するか。

### 4. J数なしレコード同士の並び順

- 通常譜面とWORLD'S ENDのJ数ソートは、共通の`compareMissingJusticeCountRecords`（`src/pages/users/utils/justiceCountSorting.ts`）でJ数なし同士を「既プレイ優先、スコア降順」に並べる。
- `src/pages/users/WorldsendRecord/utils/sorting.test.ts`も、J数ソートの昇順・降順に関係なくこの順になることを固定している。
- そのため、J数なし同士では後続のソート条件よりスコアが優先される。
- 確認事項:
  - J数なし同士は常にスコア降順、元順維持、または次のソート条件へ委譲するか。

### 5. ボーダー計算の`targetJustice`の境界条件と命名

- `src/utils/borderCalculator.test.ts`は`targetJustice: 100`に対して、指定値そのものではなく`justice > targetJustice`となる候補を期待している。
- 実装も指定値を含めない厳密な下限として扱う。
- 入力検証やUIでは「目標JUSTICE数」という名称を使用しているため、境界の意味が直感的とは限らない。
- 確認事項:
  - 下限値そのものを含む`justice >= targetJustice`とするか、現在どおり`justice > targetJustice`を維持するか。
  - 厳密な下限を維持する場合、変数名やUI文言をその意味に合わせるか。

### 6. 更新日のタイムゾーンと日付妥当性

- `toRecordDateString`はISO 8601文字列の先頭にある`YYYY-MM-DD`をそのまま抽出し、タイムゾーン変換をしない。同じ関数を使う`findLatestRecordDate`（レーティング画像Ver.2の最新更新日）も同じ扱いになる。
- `src/utils/dateFilter.test.ts`は`2026-05-31T23:59:59Z`を6月1日の下限から除外する。日本時間では6月1日だが、文字列上の日付である5月31日として扱う仕様になっている。
- レコード表示用の`formatUpdatedAt`（`src/utils/recordUpdatedAt.ts`）も先頭の年月日が正規表現へ一致すればそのまま表示するため、`2026-99-99...`のようなカレンダー上存在しない日付を表示用には拒否しない。
- 一方、更新日ソートは`Date.parse`を使用するため、不正日付を無効値として扱う。
- また、楽曲管理の`formatUpdatedAt`（`src/pages/song-management/utils/songDraftCommon.ts`）、称号管理の登録日時、譜面統計の生成日時は日本時間へ変換して表示し、各テストもそれを固定している。
- 確認事項:
  - レコード更新日の表示・フィルター基準を日本時間、UTC、文字列上の日付のどれにするか。
  - 表示・フィルター・ソートで日付妥当性の判定を統一するか。

### 7. コースレコードのEXクラスをエンブレム表示しない

- `resolveCourseClassEmblemName`は`1`〜`5`と`inf`だけをエンブレム名へ変換し、`extra`は`null`としてバッジ表示へフォールバックする。
- `src/utils/courseClassDisplay.test.ts`も「EXと未対応値のコースクラスはエンブレム対象外になること」として`extra`→`null`を固定している。
- 一方、EXクラス専用のエンブレムSVG（`emblem_extra.svg` / `base_extra.svg`）が追加され、`ClassEmblem`にも`extra`が登録されているが、現在`extra`を渡す呼び出し元はない。
- 確認事項:
  - コースレコードのEXクラスも専用エンブレムで表示するか。
  - EXだけバッジ表示を維持する場合、未使用のEX用エンブレムを残す理由を明確にするか。

## 優先度: 低

### 8. スコアランクフィルターでAAA未満をAAAへまとめる

- スコアランクフィルターの選択肢は`0点`の次が`AAA`で、下位ランクを持たない。
- `scoreToFilterRank`は1〜AAA未満のスコアも`AAA`へ変換する。
- 確認事項:
  - `0点`と`AAA`の間をAAAへまとめる仕様とするか。
  - `AAA未満`などの専用値を追加するか。

### 9. マスタ外ジャンル・バージョンのOVER POWER集計

- `src/usecases/overpower/overpowerSummary.test.ts`は、不明ジャンル・不明バージョンの値をALLへ含める一方、各内訳から除外する期待を持つ。
- そのため、ALLと表示中の内訳合計が一致しない。
- 確認事項:
  - 「不明」行を内訳へ追加するか。
  - ALLから除外するか。
  - 現状を仕様とする場合、合計が一致しないことをUI上で許容するか。

### 10. 固定件数目標が対象数を超えた場合

- `src/pages/goals/utils/goalRainbow.test.ts`は、保存済みの固定件数が現在の対象楽曲数を超えても固定値を維持する期待を持つ。
- たとえば対象が1曲まで減っても固定目標3曲が残り、達成不能な目標になる。
- 確認事項:
  - 保存済みの固定目標を履歴として維持するか。
  - 現在の対象数へ上限補正するか。
  - 達成不能状態をUIで明示するか。

### 11. 降順ソート時のマスタ外ジャンル

- `compareMasterItemNames`はマスタ順序にない名称を既知の項目より後へ配置し、`src/utils/masterData.test.ts`もその規則を固定している。
- 楽曲一覧とWORLD'S END楽曲一覧の`sortSongs`はジャンル比較結果へ降順係数を掛けるため、降順ではマスタ外ジャンルが先頭側へ反転する。
- 確認事項:
  - マスタ外ジャンルは昇順・降順とも末尾へ固定するか。
  - 降順ではマスタ項目と一緒に順序を反転させるか。

### 12. OVER POWER達成率の表示桁数

- 共通の`formatOverPowerPercent`は、桁数を省略した場合に小数点以下5桁で表示する。
- 目標カードは`OVER_POWER_PERCENT_DECIMAL_PLACES = 3`をローカルに定義し、小数点以下3桁を明示的に指定している。
- 現在の差はコード上で明示された画面固有の指定になっている。
- 確認事項:
  - 目標カードだけ3桁とする仕様を維持するか。
  - 共通表示と同じ5桁へ統一するか。
