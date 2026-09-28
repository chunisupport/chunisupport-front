# フロントエンド パフォーマンス調査

作成日: 2026-09-26
検証日: 2026-09-27（記載の行番号と挙動をコードと照合済み）

## 目的と前提

画面の初期表示、キー入力、画像化で重くなりそうな箇所を、実装に基づいて列挙する。計測値ではなく、コード上の計算量と描画範囲からの見立てである。

- 通常レコードは未プレイ込みで譜面数分（おおよそ数千件）とする。
- 目標は最大 300 件（`GOALS_LIMIT`）とする。

## 結論

優先して見るべきは次の3つ。

1. プロフィールは、表示タブに関係なく全レコードの取得と集計が走る。
2. レコード検索は1文字ごとに正規化、全件フィルター、ソート、統計、IndexedDB 書き込みが走る。
3. 通常の譜面系目標の進捗は「目標数 × 全レコード」で処理し、虹枠と OVER POWER 目標もそれぞれ全曲・全譜面規模の処理を繰り返す。フォーム入力時にも対象条件の再計算が走る。

ジャケット画像への `loading="lazy"` の一律付与は、効果がなく副作用があるため対策に含めない（「[ジャケット画像の遅延読み込み](#ジャケット画像の遅延読み込み)」を参照）。

## 優先度: 高

### 1. プロフィールはレーティング表示でも全レコード処理が走る

`UserPage` はタブに関係なく全レコードを取る。

- `src/pages/users/UserPage/UserPage.tsx:137-138`

`UserProfileView` はレーティング、通常レコード、WORLD'S END、OVER POWER を `forceMount` している。非表示でもマウントされ、`hidden` で隠しているだけである。コースだけは開くまで取らない。

- `src/pages/users/UserPage/UserProfileView.tsx:251`
- 同 `374`, `421-444`, `480`

ネームプレートはレコード到着時に全楽曲マスタを読み、理論値 OVER POWER 対象難易度を組む。

- `src/pages/users/UserPage/components/UserNameplate.tsx:236-265`

レコードの取得経路は次のとおり（`src/usecases/cache/fetchUserRecordWithCache.ts`）。

- 本人: API で更新日時を確認してから IndexedDB キャッシュを照合し、使えなければ全件を API から取得する。
- 他人: 常に API から全件を取得する。

その後、曲メタ付与、フィルター、ソート、統計、OVER POWER 集計（項目9のグラフ分布を含む）が、見ていないタブでも走り得る。レーティング枠のジャケットも、レコードタブや OVER POWER タブの表示中に取得が始まる。

`forceMount` はタブ往復のスクロールと入力状態を残すためと思われる。計算とジャケット取得まで常時にする必要はない。表示中タブだけ集計する、または非表示タブはマウントを遅らせる、が効く。

### 2. レコード検索が1文字ごとに正規化、ソート、統計、IndexedDB 書き込み

`src` 内に検索デバウンスはない。曲名入力（`SearchTextField` の `onChange`）は即 `applyFilters` を呼び、画面更新と IndexedDB 保存が同時に起きる。

- `src/pages/users/UserRecord/UserRecord.tsx:266-269`
- 同 `352`

一致判定はレコードごとに曲名、アーティスト、読みを `NFKC` 正規化する。検索用の正規化済み文字列は事前計算されていない。

- `src/pages/users/UserRecord/utils/filtering.ts:23-40`

続けて全件フィルター、複数条件ソート、プレイ済みスコアの統計をやり直す。

- `src/pages/users/UserRecord/utils/pageModel.ts:64-93`

WORLD'S END も同じパターンである。件数は少ないので影響は一段小さい。表の描画自体は仮想化済みである。

対策: 入力の反映は短くデバウンスし、IndexedDB への保存はさらに遅らせる。正規化は曲メタ付与時に1回だけ行う。

### 3. 目標進捗が目標ごとに全件規模の処理を繰り返す

`buildGoalsWithProgress` は目標の種別ごとに次の処理を行う。

- 通常の譜面系目標: `filterRecordsByAttributes` を呼ぶ。この関数は呼び出しのたびに `new Map(songs)` を作り、全レコードを走査する。
- 虹枠目標: 条件に合う楽曲を抽出してから集計する。
- OVER POWER 目標: 全譜面から集計用データを組み立てる別経路を通る。

目標の上限は 300 件なので、最悪で「300 × 全レコード」規模になる。

- `src/pages/goals/GoalsList/goalsListProgress.ts:56-92`
- `src/pages/goals/utils/goalProgress.ts:160-190`
- `src/pages/goals/GoalsList/constants.ts:5`

目標フォームは、メモ化されていない件数・最大値の取得関数を入力のたびに複数回呼ぶ。プレビュー（`previewProgress`）は `createMemo` だが、タイトルも依存に含むため、タイトル入力の1文字ごとに対象レコードを再計算する。

- `src/pages/goals/GoalsList/components/form/GoalFormDialog.tsx:185-193`
- 同 `340-368`

一覧カードは仮想化されていない。グループ全表示で各グループを展開している場合、全カードが DOM に乗る。各カードはドラッグ用リスナーを張る（解除はしている）。

- `src/pages/goals/GoalsList/components/card/GoalCard.tsx:66-71`

対策: 曲マップと属性の解決結果を目標間で共有する。フォームの件数表示は入力確定か短いデバウンスに寄せ、プレビューの計算からタイトルを切り離す。一覧が長いグループだけ仮想化する。

## 優先度: 中

### 4. 楽曲選択ダイアログが全曲を仮想化せず描画

`SongSelectionDialogBase` は `props.items()` をそのまま `<For>` する。対象はお気に入り（全楽曲）と未解禁（通常と ULTIMA）である。開いた後に全行が DOM に乗り、検索も即時である。`setTimeout(0)` で描画を後続のタスクへ送っているが、仮想化はない。

- `src/pages/users/components/SongSelectionDialogBase.tsx:161-162`
- `src/pages/users/components/createSongSelectionDialogModel.ts:91`

未解禁ダイアログでは、選択変更のたびに全曲・全譜面を対象にした OVER POWER 比較も再計算する。

- `src/pages/users/UserOverPower/components/LockedSongsDialog.tsx:241-250`

楽曲管理の左リストも同様に全件を `<For>` で描画する。

- `src/pages/song-management/components/ManagedSongListPanel.tsx:103`

### 5. SnapDOM が複製 DOM を2回ラスター化する

`captureElementAsImage` は対象を `cloneNode(true)` して画面外に置き、`embedFonts: true` と `reconcile: true` でキャプチャしたあと、フォント準備のために `toBlob` を2回呼ぶ。

- `src/utils/domImageCapture.ts:55-98`
- 同 `126-148`

レーティング画像はダイアログを開くと、ジャケットの準備完了後に自動で走る。シートはベスト30と新曲20のジャケットを先にデコードする。

- `src/pages/users/UserPage/components/RatingImagePreviewDialog.tsx:281-294`
- 同 `402-410`

スコア登録結果も同じ経路で、差分カードを含むレポートを撮る。差分が多いと、非仮想化リストと画像化の負荷が重なる。

2回目の `toBlob` は Chrome のフォント準備のための意図的な手順である。自動実行を保存や共有の直前に寄せれば初回の計算量は減るが、完成画像を開いた時点で確認できる現在のプレビュー動作が変わる。プレビューを維持するなら、先にキャプチャの所要時間と対象 DOM の負荷を計測する。

### 6. 初期バンドルに Firebase Auth と Analytics が入る

`firebase.ts` は import 時に `getAnalytics` まで初期化する。`ApplicationAvailabilityGate`、`NavBar`、`fetchWithAuth` が `auth` を import しているため、全ページの起動経路に Firebase が載る。ページ本体は `lazy()` だが、この依存は分割されていない。

- `src/lib/firebase.ts:1-23`
- `src/components/availability/ApplicationAvailabilityGate.tsx:16`
- `src/components/NavBar/NavBar.tsx:38`
- `src/api/fetchWithAuth.ts:2`

なお `lucide-solid` は名前付き import、`chart.js` は必要なコントローラだけの import で、バレル問題としては弱い。

### 7. 譜面統計とランダム選曲の入力が全件スキャン

どちらもデバウンスはない。表や候補リストの描画は別問題で、ここは計算側の話である。

- 譜面統計: `src/utils/chartStats.ts:240-246`。キー入力ごとに全譜面の曲名を正規化する。表は仮想化済み。
- ランダム選曲: `src/pages/tools/RandomSongSelectorPage.tsx:779-806`。定数やスコアの入力のたびに全譜面候補をフィルターする。
- 楽曲一覧は正規化済み配列を使うので上より軽い。バージョン絞り込み時は曲ごとにバージョン名解決が走る。

### 8. 管理画面、ランキング、苦手譜面の長いリスト・再描画

- データ充足: `src/pages/admin/AdminDataCoveragePage.tsx:455` が欠測譜面を全行描画する。
- ベスト枠ランキング: `src/pages/tools/BestSlotRankingPage.tsx:194-198` が追加読み込み済みのページを保持し、全取得分を連結して描画する。
- 苦手譜面: `src/pages/tools/WeakChartInspectorPage.tsx:186-205` がテーマや軸の変更で Chart.js を `destroy` して、集計条件に合うプレイ済み譜面で作り直す。
- オンライン苦手譜面: `src/pages/tools/OnlineWeakChartInspectorPage.tsx:127-130` が難易度ごとの静的 JSON をまとめて取得する。表自体は仮想化済み。

### 9. OVER POWER グラフの分布が帯の数だけ全件を走査する

`buildGraphRows` はサマリー行ごとに、スコア帯とコンボ帯の数だけ `records.filter` する。行ごとのレコードは分類済みなので、1軸あたりの計算量は「帯の数 × 全レコード」である。全体・ジャンル・レベル・バージョンの4軸を `createMemo` でそれぞれ即時計算するため、グラフを表示していなくても、項目1の `forceMount` 中に動く。

- `src/pages/users/UserOverPower/utils/graphRows.ts:106-122`
- `src/pages/users/UserOverPower/UserOverPower.tsx:158-180`

対策: 帯判定は1回の走査にまとめられる。

## 優先度: 低

- 目標一覧は `fetchMe` を待ってから残りを並列取得する。1往復のウォーターフォールである。ユーザー名が必要なのはプロフィール、レコード、未解禁曲だけで、目標、グループ、楽曲、マスタ、バージョンは `fetchMe` と並列にできる（`src/pages/goals/GoalsList/goalsListResource.ts:46-71`）。

## ジャケット画像の遅延読み込み

ジャケットには現在 `loading="lazy"` も `fetchpriority` も付いていない。ただし、これを一律に付けるのは誤りである。現状の実装では取得を遅らせられず、付け方によっては画像化と LCP を悪化させる。

### 現在の表示の仕組み

`JacketImage`（`src/components/common/JacketImage.tsx`）は Kobalte の `Image` をラップしている。

`Image.Img` は DOM の `<img>` で取得していない。`src` が決まった時点で `new Image()` を作ってリクエストを始め、`loaded` になってから初めて `<img>` をマウントする。

```60:79:node_modules/@kobalte/core/src/image/image-img.tsx
const image = new window.Image();
// ...
image.src = src;
```

```97:100:node_modules/@kobalte/core/src/image/image-img.tsx
<Show when={loadingStatus() === "loaded"}>
  <Polymorphic<ImageImgRenderProps>
    as="img"
```

読み込み完了前（`loading` と `error`）は `Image.Fallback` が出る。`JacketImage` は `fallbackDelay` を渡していないので、フォールバックを渡した箇所では待ち時間なしでプレースホルダーが出る。フォールバックを渡しているのは次だけである。

- 楽曲カード、WORLD'S END 楽曲カード
- 楽曲詳細のメタカード
- レーティング画像シート（`RatingImageJacketMedia`）

レーティング枠の `UserRecordCard` はフォールバックを渡していないので、ジャケットは読み込み完了まで単に出ない。

### 属性を足しても取得は遅れない

`Image.Img` に `loading="lazy"` を付けても、リクエスト開始後にマウントされる要素に付くだけで、取得自体は止まらない。ドキュメント外の `new Image()` はビューポート判定の対象にならない。

### ネイティブの `<img>` に変えても一律には付けない

仮に取得を DOM の `<img loading="lazy">` に移しても、次の箇所には付けない。

- **楽曲詳細**: ジャケットはファーストビューの LCP 候補である。`lazy` は禁止で、付けるなら `fetchpriority="high"` 側である。`high` と `lazy` は併用しない。
- **レーティング画像**: 画像化対象のシート自体が `left: -100000px` の画面外に置かれ（`RatingImagePreviewDialog.tsx:582`）、デコード完了を待ってから SnapDOM する。画面外の遅延読み込み画像は取得されないことがあり、準備完了待ちが終わらないか、プレースホルダーのまま写る。
- **楽曲カード**: 仮想化され、表示範囲と前後4行の overscan がマウントされる。overscan 分の取得を遅らせられる可能性はあるが、表示中のジャケットまで遅延させないようにする必要がある。
- **プロフィールのレーティング枠**: `forceMount` で他タブ表示中もマウントされる。隠れたタブ内の `lazy` は、表示されるまで取得されないことがある。帯域にはプラスだが、タブを開いた瞬間のプレースホルダー点滅と、画像化の準備完了待ちが長くなる。

楽曲詳細の取得優先度を上げたい場合も、現行の `Image.Img` が先に始める `new Image()` のリクエストへ優先度を反映する方法が別途必要である。

### 方針

効くのは属性の一括付与ではなく、見えないタブや画面外では `JacketImage` をマウントしない（または `src` を渡すのを遅らせる）ことである。画像化対象と楽曲詳細は、今どおり即時取得のままにする。画像化の待ち時間を短くする目的で遅延読み込みを使ってはいけない。

## 問題にしなかったもの

- レコード表、楽曲表、楽曲カード、フレンド比較、譜面統計、コースレコードは `createWindowVirtualTable` で仮想化されている。
- 確認した継続的なタイマーとイベントリスナーには解除処理がある。Xタイムラインと Turnstile の `load` / `error` リスナーは `onCleanup` ではなく `{ once: true }` で発火後に解除される。signal をループで書いて更新が連鎖する effect は見当たらない。
- マーキーと称号アニメーションは `transform` と `opacity` である。`backdrop-blur` や `will-change` の乱用、レイアウトプロパティのアニメーションは見当たらない。
- ホットパスで props を分割代入して再計算が増えている箇所は見当たらない。

## 着手順の目安

1. プロフィールの非表示タブで、全件集計とジャケット取得を止める（項目1、9）。
2. レコード検索のデバウンス、保存の分離、正規化の事前計算（項目2）。
3. 目標進捗の曲マップ共有と、フォーム再スキャンの抑制（項目3）。
4. 楽曲選択ダイアログの仮想化（項目4）。
5. レーティング画像のキャプチャ時間を計測し、完成画像のプレビューを維持しながら負荷を下げる（項目5）。

ジャケットの `loading="lazy"` はこの順に入れない。
