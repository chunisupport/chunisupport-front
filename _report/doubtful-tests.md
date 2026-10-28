# 仕様確認が必要なテスト

再検証日: 2026-10-28
調査対象: `origin/develop`（`7b27bec5788c4204715ec4be772e98917cdf0e4b`）

この文書は、現在の実装・テストを固定しているものの、期待値を仕様として確定してよいか判断が必要な項目だけを記録する。

## 継続して仕様確認が必要な項目

前回の番号を維持する。8件ともテストの成功だけでは仕様の妥当性を確定できない項目であり、不具合確定という意味ではない。

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

今回追加確認したスコア履歴（`src/utils/scoreHistory.ts:10`、`src/utils/scoreHistory.test.ts:44`）にも不一致がある。履歴表示は `Intl.DateTimeFormat` にタイムゾーンを渡さず実行環境の日時を使うが、バージョン境界はJSTで生成する。同じ `2026-06-22T00:30:00+09:00` の表示を別プロセスで確認すると、`TZ=UTC` と `America/Los_Angeles` は `26/06/21`、`Asia/Tokyo` は `26/06/22` になる。追加されたテストの正午のデータはUTC/JSTのどちらでも同日になるため、この差を検出しない。表示日とバージョン境界の基準を決めたうえで、日付境界のテストが必要。

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

### 11. 降順ソート時のマスタ外ジャンル

- `compareMasterItemNames`はマスタ順序にない名称を既知の項目より後へ配置し、`src/utils/masterData.test.ts`もその規則を固定している。
- 楽曲一覧とWORLD'S END楽曲一覧の`sortSongs`はジャンル比較結果へ降順係数を掛けるため、降順ではマスタ外ジャンルが先頭側へ反転する。
- 確認事項:
  - マスタ外ジャンルは昇順・降順とも末尾へ固定するか。
  - 降順ではマスタ項目と一緒に順序を反転させるか。

## 新たに見つかったテスト前提の疑義

### 13. APIが返せない譜面定数15.05を正常系として扱う

- 根拠: `src/utils/newSongTheoreticalRating.test.ts:222` は「APIから小数第2位を含む譜面定数15.05が返る」として理論値17.25と候補スコア差-1を期待する。
- APIの `internal/domain/vo/chartconstant/chartconstant.go:20` は0.1刻み以外を拒否する。通常の有効データからこの前提は作れない。
- フロントの計算処理自体の数学的一貫性を調べるテストとしては意味があるが、APIとの整合性や実運用の回帰を保証する例としては不適切。実際の正常値15.0/15.1の境界と区別する必要がある。
- 確認事項: 任意精度入力を許容する計算関数のテストとして意図を明記するか、API契約に沿う入力で表示・候補計算の整合性を検証するか。これだけで実運用のバグとは判定しない。

## 前回から外した項目

| 前回番号 | 現在の確認結果 |
| --- | --- |
| 1. 全角英字の削除 | 解消。`src/utils/searchUtils.ts:55` は変換中だけ補正し、確定後は末尾を残す。`src/hooks/createComposingSearchInput.test.ts` と検索・レコード絞り込みのテストにも確定済み全角英字の回帰検証がある。 |
| 7. EXクラスのエンブレム | 仕様意図を確認。`src/utils/courseClassDisplay.ts:76` に「EXは独自デザインのためバッジ表示のまま」と明記されている。素材が存在することだけでは期待値の誤りの根拠にならないため、要確認項目から外した。 |
| 10. 固定件数目標 | APIの正式仕様 `chunisupport-api/docs/API.md:2505` に、対象数が減っても固定件数を維持する旨がある。`goalRainbow.test.ts:171` は仕様に沿うため、疑義から外した。 |
| 12. OP達成率の桁数 | 画面固有の明示的指定であり、差があるだけでは疑義としない。目標カードは3桁、共通フォーマッターは5桁。目標入力も3桁制約をテストしている。 |

## 再検証の根拠と範囲

- 前回資料更新コミット `dbfda65d` 以降、変更された単体テストファイルは79件。変更一覧と追加テスト名を走査し、検索、フィルター、ソート、日付、目標進捗、OP集計、理論値、統計、苦手譜面分析、キャッシュ、認証の追加・変更を重点的に読んだ。全実装の網羅監査やブラウザでの全画面検証を意味しない。
- 仕様の根拠は `docs/` と現行コードを使った。この資料自体は仕様確定の根拠ではない。
- 継続項目の参照先:
  - 2: `src/pages/users/utils/recordStats.ts:165`、`src/pages/users/UserRecord/utils/recordStats.test.ts:53`、`src/utils/weakChartInspector.ts:134`。
  - 3: `src/utils/sortConditions.ts:44`、`src/utils/sortConditions.test.ts`。
  - 4: `src/pages/users/utils/justiceCountSorting.ts:25`、`src/pages/users/WorldsendRecord/utils/sorting.test.ts`。
  - 5: `src/utils/borderCalculator.ts:128`、`src/utils/borderCalculator.test.ts:15`、`src/pages/tools/BorderCalculatorPage.tsx:27`。
  - 6: `src/utils/dateFilter.ts:11`、`src/utils/dateFilter.test.ts`、`src/utils/recordUpdatedAt.ts:11`。履歴については本文の追加確認を参照。
  - 8: `src/pages/users/utils/scoreRank.ts:44`、`src/pages/users/utils/scoreRank.test.ts:41`。AAA未満の全入力域を直接テストしているわけではない。
  - 9: `src/usecases/overpower/overpowerSummary.test.ts:156`、同ディレクトリ `overpowerSummary.ts`。
  - 11: `src/utils/masterData.test.ts`、`src/pages/songs/SongsList/utils/sorting.ts:99`、`src/pages/songs/WorldsendSongsList/utils/sorting.ts:116`。マスタ外項目を含む降順は一覧ソートの既存テストで直接保証されていない。
- バージョン空配列はhelper単体だと全件一致するが、通常/WORLD'S END画面は `pageModel.ts:74` / `WorldsendRecord.tsx:156` で空配列も公開済み条件へ展開する。単体helperだけを根拠に未公開曲が画面へ漏れるとは指摘しない。

## 実行検証

- `pnpm test:unit` はpnpmが依存ディレクトリ再構築の非対話確認で失敗し、ランナー起動前に終了した。
- 同スクリプトの実体である `node --import ./scripts/register-ts-extension-loader.mjs --disable-warning=ExperimentalWarning --test 'src/**/*.test.ts'` を実行し、**1,643件成功、失敗0、skip 0**（約44秒）。テスト成功は、本文に挙げた期待値の仕様妥当性を保証しない。
- スコア履歴のTZ差はUTC/JST/Los Angelesの別プロセスで再現確認した。
- 今回は調査Markdownのみを変更し、実装・テスト・正式仕様は変更していない。型検査・本番ビルド・実ブラウザ・外部API/IndexedDBの実環境連携は未実行。
