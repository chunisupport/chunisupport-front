# 仕様確認が必要だったテストの解消記録

更新日: 2026-11-01

この文書は、`_report/doubtful-tests.md` で仕様確認が必要としていたテストについて、確定した仕様と修正内容を記録する。現在の仕様の根拠は `docs/`、コード、README を参照する。

## 解消した項目

### 2. 四分位数の算出方法

- 決定: フィルター統計と苦手譜面インスペクターの両方で、線形補間による分位点を使う。
- 変更: `quantile` を `src/utils/quantile.ts` へ共通化し、`src/pages/users/utils/recordStats.ts` の Q1・Q3 も同じ関数を使う。
- テスト: `src/pages/users/UserRecord/utils/recordStats.test.ts` の偶数件の期待値を線形補間値へ更新した。

### 3. 複数ソート条件のキー重複

- 決定: 同じキーを複数条件に並べず、重複したキーは未使用の既定条件で補完する。最後の条件は既定の最終条件を優先し、既に使われている場合は未使用の既定条件を使う。
- 変更: `src/utils/sortConditions.ts` の `normalizeSortConditions` で位置ごとに重複を除去する。
- テスト: `sortConditions.test.ts`、`UserRecord` / `WorldsendRecord` の初期ソート、`createRecordViewState.test.ts` の期待値を更新した。

### 4. J数なしレコード同士の並び順

- 決定: J数なし同士では順序を決めず、後続のソート条件へ委譲する。
- 変更: `src/pages/users/UserRecord/utils/sorting.ts` と `src/pages/users/WorldsendRecord/utils/sorting.ts` で `0` を返す。不要になった `compareMissingJusticeCountRecords` は削除した。
- テスト: 単一条件では入力順を維持し、複数条件では次の条件が使われることを期待値にした。

### 5. ボーダー計算の `targetJustice` の境界条件

- 決定: 目標JUSTICE数は下限値そのものを含む（`justice >= targetJustice`）。未指定時は下限0として扱う。
- 変更: `src/utils/borderCalculator.ts` の候補計算を `>=` に変更した。
- テスト: 理論値ぴったりのスコアで `targetJustice: 0` の候補が返る境界テストを追加した。

### 6. 更新日のタイムゾーンと日付妥当性

- 決定: 画面表示・日付フィルターとも日本時間（Asia/Tokyo）基準の日付を使う。ISO 8601 の日付部分がカレンダー上に存在しない場合は無効として扱う。
- 変更: `src/utils/dateFilter.ts` と `src/utils/recordUpdatedAt.ts` をJST変換と日付妥当性検証に統一した。スコア履歴は既にJST化済み。
- テスト: UTCの日付境界、不正日付（`2026-02-30` など）、表示のJST変換を追加した。
- ドキュメント: `docs/record-filter-and-columns.md` にJST比較と不正日付の扱いを追記した。

### 8. スコアランクフィルターでAAA未満をAAAへまとめる

- 決定: `0点` は0点のみ、1〜974999点は `AAA` として扱い、`scoreToFilterRank` とフィルター範囲を一致させる。
- 変更: `src/pages/users/utils/scoreRank.ts` の `SCORE_RANK_VALUES.AAA` を1にした。
- テスト: `scoreRank.test.ts` で1点・949999点がAAAになることを追加した。

### 9. マスタ外ジャンル・バージョンのOVER POWER集計

- 決定: ジャンル不明・バージョン不明も内訳行として追加し、ALLと内訳の合計を一致させる。ラベルは `不明`。
- 変更: `src/usecases/overpower/overpowerSummary.ts` のジャンル別・バージョン別集計で不明値を除外しない。
- テスト: 内訳に `不明` が含まれ、内訳合計がALLと一致することを検証した。

### 11. 降順ソート時のマスタ外ジャンル

- 決定: マスタ外のジャンルは昇順・降順とも末尾へ固定する。
- 変更: `src/utils/masterData.ts` に `compareMasterItemNamesKeepingUnknownLast` を追加し、通常楽曲一覧とWORLD'S END楽曲一覧のジャンルソートで使う。
- テスト: `masterData.test.ts` と両一覧のソートテストで、降順でもマスタ外が末尾に残ることを検証した。

### 13. APIが返せない譜面定数15.05を正常系として扱う

- 決定: 正常系のテストはAPIが返せる0.1刻みの値に限定し、15.0と15.1の境界を検証する。
- 変更: `src/utils/newSongTheoreticalRating.test.ts` の15.05のケースを15.1へ置き換え、15.0と15.1で理論単曲レーティングが0.1異なるテストを追加した。

## 実行検証

- 単体テスト: `pnpm test:unit` 相当のランナーで1710件成功、失敗0、skip 0。
- `pnpm typecheck`: 成功。
- `pnpm check:ci`: 成功。
- `pnpm build`: 成功。
