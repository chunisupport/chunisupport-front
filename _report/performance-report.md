# フロントエンド パフォーマンス調査

作成日: 2026-09-26

## 目的

画面の初期表示、キー入力、画像化で重くなりそうな箇所を、実装に基づいて列挙する。計測値ではなく、コード上の計算量と描画範囲からの見立てである。

通常レコードは未プレイ込みで譜面数分（おおよそ数千件）、目標は最大 300 件（`GOALS_LIMIT`）を前提にする。

## 結論

優先して見るべきは次の3つ。

1. プロフィールは、表示タブに関係なく全レコードの取得と集計が走る。
2. レコード検索は1文字ごとに正規化、全件フィルター、ソート、統計、IndexedDB 書き込みが走る。
3. 通常の譜面系目標の進捗は「目標数 × 全レコード」で処理し、虹枠と OVER POWER 目標もそれぞれ全曲・全譜面規模の処理を繰り返す。フォーム入力時にも対象条件の再計算が走る。

ジャケットへ `loading="lazy"` を一律に付けても、現状の実装では画像リクエストの開始を遅らせられず、付け方によっては画像化と LCP に影響する。詳細は次節。

## ジャケットの `loading="lazy"`

雑に全部へ付けて回らない。フォールバックがあることと、遅延読み込みが安全であることは別である。

### フォールバックの実際

Kobalte の `Image.Fallback` は、読み込み完了前（`loading` と `error` の両方）に出る。`JacketImage` は `fallbackDelay` を渡していないので、フォールバックを渡した箇所では待ち時間なしでプレースホルダーが出る。

プレースホルダーを渡しているのは次だけ。

- 楽曲カード、WORLD'S END 楽曲カード
- 楽曲詳細のメタカード
- レーティング画像シート（`RatingImageJacketMedia`）

レーティング枠の `UserRecordCard` はフォールバックを渡していない。ジャケットは読み込み完了まで単に出ない。

### 属性を足しても取得は遅れない

`Image.Img` は、DOM の `<img>` で取得していない。`src` が決まった時点で `new Image()` を作り、`loaded` になってから初めて `<img>` をマウントする。

```60:79:node_modules/@kobalte/core/src/image/image-img.tsx
const image = new window.Image();
// ...
image.src = src;
```

```96:102:node_modules/@kobalte/core/src/image/image-img.tsx
return (
  <Show when={loadingStatus() === "loaded"}>
    <Polymorphic<ImageImgRenderProps>
      as="img"
```

そのため `Image.Img` に `loading="lazy"` を付けても、リクエスト開始後の要素に付くだけで、取得自体は止まらない。ドキュメント外の `Image` はビューポート判定の対象にならない。

遅延したいなら、見えるまで `JacketImage` をマウントしないか、`src` を渡すのを遅らせる必要がある。属性の追加では足りない。

### ネイティブの `<img>` に変えても一律では付けない

仮に取得を DOM の `<img loading="lazy">` に移しても、次は外す。

- 楽曲詳細のジャケットはファーストビューの LCP 候補である。`loading="lazy"` は禁止で、付けるなら `fetchpriority="high"` 側である。`high` と `lazy` は併用しない。
- レーティング画像は、デコード完了を待ってから SnapDOM する。画像化用の複製は `left: -100000px` に置かれる。遅延読み込みの画像は画面外では取得されないことがあり、プレースホルダーのまま写る。
- 楽曲カードは仮想化され、表示範囲と前後4行の overscan がマウントされる。現在の Kobalte `Image.Img` に `lazy` を足しても先行リクエストは減らない。ネイティブ画像に変えた場合は overscan 分の取得を遅らせられる可能性があるが、表示中のジャケットまで遅延させないようにする必要がある。
- プロフィールのレーティング枠は `forceMount` で、他タブ表示中もマウントされる。隠れたタブ内の `lazy` は、表示されるまで取得されないことがある。帯域にはプラスだが、タブを開いた瞬間のプレースホルダー点滅と、画像化の準備完了待ちが長くなる。

ジャケットで効くのは属性の一括付与ではなく、見えないタブや画面外では `JacketImage` をマウントしないことである。画像化対象と楽曲詳細は、今どおり即時取得のままにする。

## 高

### 1. プロフィールはレーティング表示でも全レコード処理が走る

`UserPage` はタブに関係なく全レコードを取る。

- `src/pages/users/UserPage/UserPage.tsx:137-138`

`UserProfileView` はレーティング、通常レコード、WORLD'S END、OVER POWER を `forceMount` している。非表示でもマウントされ、`hidden` で隠しているだけである。コースだけは開くまで取らない。

- `src/pages/users/UserPage/UserProfileView.tsx:251`
- 同 `374`, `421-444`, `480`

ネームプレートはレコード到着時に全楽曲マスタを読み、理論値 OVER POWER 対象難易度を組む。

- `src/pages/users/UserPage/components/UserNameplate.tsx:236-265`

本人の場合も API で更新日時を確認してから IndexedDB キャッシュを照合し、キャッシュが使えなければ全件を API から取得する。他人の場合は API から全件を取得する。その後、曲メタ付与、フィルター、ソート、統計、OVER POWER 集計が、見ていないタブでも走り得る。レーティング枠のジャケット（既定で表示）も、レコードタブや OVER POWER タブの表示中に取得が始まる。

`forceMount` はタブ往復のスクロールと入力状態を残すためと思われる。計算とジャケット取得まで常時にする必要はない。表示中タブだけ集計する、または非表示タブはマウントを遅らせる、が効く。

### 2. レコード検索が1文字ごとに正規化、ソート、統計、IndexedDB 書き込み

`src` 内に検索デバウンスはない。曲名入力は即 `applyFilters` で、画面更新と IndexedDB 保存が同時に起きる。

- `src/pages/users/UserRecord/UserRecord.tsx:266-268`
- 同 `351-353`

一致判定はレコードごとに曲名、アーティスト、読みを `NFKC` 正規化する。検索用の正規化済み文字列は事前計算されていない。

- `src/pages/users/UserRecord/utils/filtering.ts:23-40`

続けて全件フィルター、複数条件ソート、プレイ済みスコアの統計をやり直す。

- `src/pages/users/UserRecord/utils/pageModel.ts:64-93`

WORLD'S END も同じパターンである。件数は少ないので影響は一段小さい。表の描画自体は仮想化済みである。

入力の反映は短くデバウンスし、IndexedDB への保存はさらに遅くする。正規化は曲メタ付与時に1回だけ行う。

### 3. 目標進捗が目標ごとに全件規模の処理を繰り返す

`buildGoalsWithProgress` は通常の譜面系目標ごとに `filterRecordsByAttributes` を呼ぶ。その関数は呼び出しのたびに `new Map(songs)` を作り、全レコードを走査する。虹枠目標は楽曲を抽出し、OVER POWER 目標は全譜面から集計用データを組み立てる別経路を通る。目標の上限は 300 件である。

- `src/pages/goals/GoalsList/goalsListProgress.ts:56-92`
- `src/pages/goals/utils/goalProgress.ts:160-190`
- `src/pages/goals/GoalsList/constants.ts:5`

フォームはメモされていない関数を、入力のたびに複数回呼ぶ。プレビューも全レコードを再計算する。

- `src/pages/goals/GoalsList/components/form/GoalFormDialog.tsx:185-193`
- 同 `340-368`

一覧カードは仮想化されていない。グループ全表示で各グループを展開している場合、全カードが DOM に乗る。各カードはドラッグ用リスナーを張り、解除はしている。

曲マップと属性の解決結果は目標間で共有し、フォームの件数表示は入力確定か短いデバウンスに寄せる。一覧が長いグループだけ仮想化する。

## 中

### 4. 楽曲選択ダイアログが全曲を仮想化せず描画

`SongSelectionDialogBase` は `props.items()` をそのまま `<For>` する。お気に入りは全楽曲、未解禁は通常と ULTIMA である。開いた後に全行が DOM に乗り、検索も即時である。`setTimeout(0)` で描画を後続のタスクへ送っているが、仮想化はない。未解禁では、選択変更のたびに全曲・全譜面を対象にした OVER POWER 比較も再計算する。

- `src/pages/users/components/SongSelectionDialogBase.tsx:161-162`
- `src/pages/users/UserOverPower/components/LockedSongsDialog.tsx:241-250`

楽曲管理の左リストも同様である。

### 5. SnapDOM が複製 DOM を2回ラスター化する

`captureElementAsImage` は対象を `cloneNode(true)` して画面外に置き、`embedFonts: true` と `reconcile: true` でキャプチャしたあと、フォント準備のために `toBlob` を2回呼ぶ。

- `src/utils/domImageCapture.ts:55-98`
- 同 `120-148`

レーティング画像はダイアログを開くと、ジャケットの準備完了後に自動で走る。シートはベスト30と新曲20のジャケットを先にデコードする。

- `src/pages/users/UserPage/components/RatingImagePreviewDialog.tsx:281-294`
- 同 `402-410`

スコア登録結果も同じ経路で、差分カードを含むレポートを撮る。差分が多いと、非仮想化リストと画像化が重なる。

2回目の `toBlob` は Chrome のフォント準備のための意図的な手順である。自動実行を保存や共有の直前に寄せれば初回の計算量は減るが、完成画像を開いた時点で確認できる現在のプレビュー動作が変わる。プレビューを維持するなら、キャプチャの再実行回数や対象 DOM の負荷を先に計測する。ジャケットの遅延読み込みでこの待ちを短くしてはいけない。

### 6. 初期バンドルに Firebase Auth と Analytics が入る

`firebase.ts` は起動時に `getAnalytics` まで初期化する。`ApplicationAvailabilityGate` と `fetchWithAuth` が `auth` を import しているため、全ページの起動経路に Firebase が載る。ページ本体は `lazy()` だが、この依存は分割されていない。

- `src/lib/firebase.ts:1-23`
- `src/components/availability/ApplicationAvailabilityGate.tsx:16`

`lucide-solid` は名前付き import、`chart.js` は必要なコントローラだけの import で、バレル問題としては弱い。

### 7. 譜面統計とランダム選曲の入力が全件スキャン

デバウンスはない。表や候補リストの描画は別問題で、ここは計算側である。

- 譜面統計: `src/utils/chartStats.ts:240-246`。キー入力ごとに全譜面の曲名を正規化する。表は仮想化済み。
- ランダム選曲: `src/pages/tools/RandomSongSelectorPage.tsx:779-806`。定数やスコアの入力のたびに全譜面候補をフィルターする。
- 楽曲一覧は正規化済み配列を使うので上より軽い。バージョン絞り込み時は曲ごとにバージョン名解決が走る。

### 8. 管理画面、ランキング、苦手譜面の長いリスト

- データ充足: `src/pages/admin/AdminDataCoveragePage.tsx:455` が欠測譜面を全行描画する。
- ベスト枠ランキング: `src/pages/tools/BestSlotRankingPage.tsx:194-198` が追加読み込み済みのページを保持し、全取得分を連結して描画する。
- 苦手譜面: `src/pages/tools/WeakChartInspectorPage.tsx:186-205` がテーマや軸の変更で Chart.js を `destroy` して、集計条件に合うプレイ済み譜面で作り直す。
- オンライン苦手譜面: `src/pages/tools/OnlineWeakChartInspectorPage.tsx:127-130` が難易度ごとの静的 JSON をまとめて取得する。表自体は仮想化済み。

### 9. OVER POWER グラフの分布が行 × 帯 × レコードの filter

サマリー行ごとに、スコア帯とコンボ帯の数だけ `records.filter` する。項目1の `forceMount` 中に動く。

- `src/pages/users/UserOverPower/utils/graphRows.ts:106-122`

帯判定は1回の走査にまとめられる。

## 低

- ジャケットに `loading="lazy"` も `fetchpriority` もない。理由と、一律付与が不適切なことは上の節のとおり。楽曲詳細の取得優先度を上げるなら、現行 Kobalte `Image.Img` が先に始める `new Image()` のリクエストへ反映できる方法が必要である。
- 目標一覧は `fetchMe` のあとで楽曲とレコードを取る。1往復のウォーターフォールである（`src/pages/goals/GoalsList/goalsListResource.ts:46-71`）。

## 問題にしなかったもの

- レコード表、楽曲表、楽曲カード、フレンド比較、譜面統計、コースレコードは `createWindowVirtualTable` で仮想化されている。
- 確認した継続的なタイマーとイベントリスナーには解除処理がある。Xタイムラインの `load` / `error` リスナーは `onCleanup` ではなく `{ once: true }` で発火後に解除される。signal をループで書いて更新が連鎖する effect は見当たらない。
- マーキーと称号アニメーションは `transform` と `opacity` である。`backdrop-blur` や `will-change` の乱用、レイアウトプロパティのアニメーションは見当たらない。
- ホットパスで props を分割代入して再計算が増えている箇所は見当たらない。

## 着手順の目安

1. プロフィールの非表示タブで、全件集計とジャケット取得を止める。
2. レコード検索のデバウンス、保存の分離、正規化の事前計算。
3. 目標進捗の曲マップ共有と、フォーム再スキャンの抑制。
4. 楽曲選択ダイアログの仮想化。
5. レーティング画像のキャプチャ時間と再実行回数を計測し、完成画像のプレビューを維持しながら負荷を下げる。

ジャケットの `loading="lazy"` はこの順に入れない。
