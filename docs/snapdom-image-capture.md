# SnapDOM による DOM 画像化ガイド

このドキュメントは、SnapDOM を使って画面上の DOM を PNG などへ画像化するときの設計・実装方針をまとめたものです。

SnapDOM は DOM を複製し、スタイルやフォントなどを埋め込んだ SVG を生成してからラスタ画像へ変換します。そのため、通常の画面描画では問題にならないサブピクセル単位の差、フォント再描画、Flexbox・Grid の内容依存サイズが、改行・省略・はみ出しとして現れることがあります。

## 基本方針

- 画像化前の DOM レイアウトを安定させる。SnapDOM のオプションだけで不安定なレイアウトを補正しようとしない。
- 画像の論理幅を先に決め、狭い画面では表示だけを縮小する。
- 自由入力や曲名など、あらゆる文字を含み得る箇所では、対象文字を収録したフォントを明示する。
- Flexbox・Grid 内の文字要素へ、文字幅と同じだけの余裕のない幅を割り当てない。
- ラベルや数値など、意味上分割できない文字列は改行禁止にする。
- すべての画像化で `reconcile: true` を指定する。
- 高解像度化は Canvas のメモリ使用量を確認してから行う。
- PC だけでなく、実際のスマートフォンでも画像を確認する。

## 画像の論理サイズと画面表示を分離する

画像として一定のレイアウトを出力したい場合、画像化対象の論理幅を固定します。狭い画面では、固定幅の要素を祖先の `transform: scale(...)` で縮小表示します。

画像化するときは、画面表示用の `transform` を引き継がない固定幅の複製を `document.body` 直下へ作成し、その複製を SnapDOM へ渡します。

寸法取得では、用途を区別します。

- `offsetWidth` / `offsetHeight`: transform 適用前の論理サイズを取得する。
- `getBoundingClientRect()`: transform 適用後の画面上の実寸を取得する。

画像化用の論理サイズを決める際に `getBoundingClientRect()` を使うと、狭い画面で縮小された幅が画像へ混入する可能性があります。

なお、固定幅の複製を作っても、複製は同じ `document` 内にあります。ビューポート依存のメディアクエリ、ルートフォントサイズ、`text-size-adjust` などは引き続き影響するため、画像化用DOMではこれらに依存しないスタイルを使用します。

## Flexbox・Grid 内の文字幅に余裕を持たせる

### 曲名などの可変長テキスト

Flexbox 内で可変長テキストを1行省略する場合は、文字要素へ残り幅を割り当てます。

```tsx
<div class="flex min-w-0 items-center gap-2">
  <span class="w-10 shrink-0">MAS</span>
  <span class="shrink-0 whitespace-nowrap">14+</span>
  <h3 class="min-w-0 flex-1 truncate font-sans">楽曲名</h3>
</div>
```

`min-w-0 truncate` だけでは不十分です。`flex-grow` がない文字要素は、短い文字列の場合に内容幅とほぼ同じ幅になることがあります。画面上では収まっていても、SVG 内でフォントの字幅がわずかに増えると、上限幅未満の文字列まで省略されます。

`flex-1` などで残り幅を確保すると、本当に利用可能幅を超えた文字列だけが省略対象になります。

### Grid 内の固定ラベル

Grid の `auto` 列も内容幅とほぼ同じ幅になります。次のような意味上分割できない文字列は、明示的に改行を禁止します。

```tsx
<span class="whitespace-nowrap">Lv. 252</span>
```

文字列と要素幅がほぼ同じ場合、わずかな丸め差だけで空白位置から改行されることがあります。`shrink-0` は Flexbox の縮小制御であり、Grid 内部の文字改行を禁止するものではありません。

Grid の可変長列には `minmax(0, 1fr)` を使い、長い文字列側へ省略可能な逃げ先を用意します。

```tsx
<div class="grid grid-cols-[auto_minmax(0,1fr)]">
  <span class="whitespace-nowrap">Lv. 252</span>
  <span class="min-w-0 truncate">プレイヤー名</span>
</div>
```

## `text-overflow` は画像化前の幅を正しくする

SnapDOM は `text-overflow: ellipsis` や line clamp の結果を、SVG 内のテキストへ焼き込むことがあります。

そのため、SnapDOM へ渡す時点で文字要素の幅が誤っていると、不必要に短い文字列が SVG へ確定します。後から出力サイズや `dpr` を変更しても、失われた文字列は戻りません。

省略が意図どおりか、画像化前の DOM で次を確認します。

- `clientWidth`: 文字を表示できる幅。
- `scrollWidth`: 省略がなければ必要になる幅。
- 算出済みの `flex-grow`、`flex-basis`、`min-width`。
- `white-space`、`overflow`、`text-overflow`。

`scrollWidth <= clientWidth` なのに画像だけが省略される場合は、内容幅ぴったりの要素、SVG 内の再レイアウト、埋め込みフォントの字幅差を疑います。

## フォントを準備する

画像化前に FontFaceSet の準備完了を待ち、SnapDOM ではフォント埋め込みを有効にします。

```typescript
await document.fonts.ready

const result = await snapdom(element, {
  embedFonts: true,
  reconcile: true,
})
```

ただし、`document.fonts.ready` は文書側で必要なフォントの読み込み完了を示すもので、生成した SVG を Canvas が初めて描画するときの準備まで保証するものではありません。

Chrome 系ブラウザで、同じ `CaptureResult` の初回ラスタライズだけ埋め込みフォントが崩れることを確認した場合は、同じ結果を再利用して1回目を破棄します。

```typescript
const rasterizeOptions = { dpr: 2, type: 'png' as const }

await result.toBlob(rasterizeOptions)
const blob = await result.toBlob(rasterizeOptions)
```

このウォームアップは常に必要とは限りません。ブラウザと対象フォントで再現を確認した場合に採用し、理由をコメントへ残します。

自由入力、曲名、アーティスト名などには `font-sans` を使用し、対象文字を含まない欧文フォントだけを指定しないでください。

## `reconcile` の役割と限界

`reconcile: true` は、SnapDOM がスタイル適用済みの複製を画面外へ配置し、元の DOM と寸法が異なる要素へ幅・高さを固定する機能です。文字の再折り返し、固定幅バッジ、table-cell などのレイアウト差を抑えられます。

```typescript
const result = await snapdom(element, {
  embedFonts: true,
  reconcile: true,
})
```

注意点は次のとおりです。

- 追加のレイアウト計測が走るため、処理時間が増える。
- 元の DOM の幅が誤っている場合、その誤った幅を正しい仕様には変えられない。
- 内容幅ぴったりの文字要素や、改行可能な固定ラベルの安全余白は作らない。
- `truncate` によりすでに省略された文字列は復元しない。
- 画像化対象やブラウザによっては、固定された寸法とSVG内の文字寸法が競合する可能性がある。

このプロジェクトでは、SnapDOM を使うすべての画像化で `reconcile: true` を必須とします。`reconcile` を無効にした画像では固定幅の難易度ラベルを含むレイアウト崩れが発生したため、省略しないでください。

ただし、`reconcile` は誤ったCSSを正しいレイアウトへ直す機能ではありません。Flexbox・Grid・改行・省略のCSSを先に安定させてください。

## `dpr`、出力寸法、メモリ

`dpr` と `scale` は出力解像度を増やしますが、Canvas のピクセル数とメモリ使用量も増やします。

概算の生ピクセルメモリは次の式で確認できます。`scale` を指定しない場合は `1` として扱います。

```text
width × height × (dpr × scale)² × 4 bytes
```

例えば、論理サイズが `496 × 8,000px`、`dpr: 2` の場合、Canvas は `992 × 16,000px` になり、生ピクセルだけで約64MBを使用します。変換中は SVG、Image、Canvas、Blob が同時に存在する可能性があるため、実際のピークメモリはさらに大きくなります。

- 出力する論理サイズに上限を設ける。
- 長い要素は上限内へ縮小してから画像化する。
- 必要以上に高い `dpr` を指定しない。
- 画像化後は不要なDOMを `finally` で削除する。
- スマートフォンで複数の高解像度 Blob を同時保持しない。

### ブラウザ上限を超えると自動縮小される

SnapDOM は、生成する SVG の画像デコード上限または Canvas 上限を超えると、処理を失敗させる代わりに出力を自動縮小することがあります。その場合、指定した `dpr` や `scale` は要求値であり、実際の出力ピクセル寸法を保証しません。

現在使用している SnapDOM の実装では、1辺が 16,384 px、または総面積が `16,384 × 16,384` ピクセルを超えた際に縮小されます。ただし、この値や判定方法は SnapDOM・ブラウザの更新で変わり得るため、固定仕様として依存しないでください。

実装時は、次を確認します。

- コンソールに `[snapDOM]` から始まる downscaling 警告が出ていないか。
- 生成した Canvas の `width` / `height`。
- デコードした画像の `naturalWidth` / `naturalHeight`。
- 保存した PNG の実ピクセル寸法。

自動縮小に任せると、文字や罫線の見え方、保存画像の縮尺が意図せず変わります。長い画像は分割する、`dpr` / `scale` を下げる、論理サイズを見直すなどして、上限内に収めることを優先します。

## 画像と外部アセット

SnapDOM は画像、CSS の背景画像、フォントなどを取得して出力へ埋め込みます。外部アセットは通常の画面表示よりもCORS制約の影響を受けやすいため、次を確認します。

- 同一オリジン、または適切なCORSレスポンスヘッダーを持つURLを使用する。
- 外部フォントやスタイルシートでは、必要に応じて `crossorigin` 属性を設定する。
- 画像の読み込み完了が画面の状態に影響する場合は、対象画像の `decode()` 完了を待つ。
- 遅延読み込み画像が実URLへ解決されていることを確認する。
- CORS対応ができない外部アセットに `useProxy` を使う場合は、プロキシの運用・許可ドメイン・障害時の挙動を先に決める。
- 画像取得失敗時にプレースホルダーを許容するか、`fallbackURL` を使うかを画面仕様として決める。
- iframe は同一オリジンを前提とし、外部iframeの内容を画像化できるとは考えない。

外部アセットが欠落した場合に画像生成全体を失敗させるか、プレースホルダーで継続するかは、機能ごとに明示します。

## 背景色とテーマ

透明背景を意図しない場合は、画像化対象の算出済み背景色を渡します。

```typescript
const result = await snapdom(element, {
  backgroundColor: getComputedStyle(element).backgroundColor,
  embedFonts: true,
  reconcile: true,
})
```

画像専用テーマを使う場合は、画像化対象のルートへ `data-theme` などを明示し、画面の現在テーマへ不用意に依存させません。

## 実装チェックリスト

### レイアウト

- [ ] 画像の論理幅・高さと、狭い画面での表示倍率を分離した。
- [ ] 表示用transformを画像化対象から切り離した。
- [ ] Flexbox の可変長文字へ `min-w-0` と残り幅を受け取る指定を付けた。
- [ ] Grid の可変長列へ `minmax(0, 1fr)` を使った。
- [ ] ラベル、レベル、日時など分割できない文字列を改行禁止にした。
- [ ] 固定幅バッジへ明示幅と `shrink-0` を付けた。
- [ ] `clientWidth` と `scrollWidth` から、省略対象が仕様どおりであることを確認した。

### フォントとSnapDOM

- [ ] `document.fonts.ready` を待った。
- [ ] `embedFonts: true` を指定した。
- [ ] 任意文字を含む箇所へ `font-sans` を指定した。
- [ ] `reconcile: true` を指定した。
- [ ] 初回ラスタライズだけ崩れる場合、同じ `CaptureResult` の再利用を検証した。

### 出力と検証

- [ ] 背景色と画像用テーマを明示した。
- [ ] 画像、背景画像、フォントなどの外部アセットとCORSを確認した。
- [ ] `dpr`・`scale` 適用後のCanvas寸法とメモリ使用量を確認した。
- [ ] SnapDOM の自動縮小警告と、保存画像の実ピクセル寸法を確認した。
- [ ] PCと実際のスマートフォンで確認した。
- [ ] 長い日本語、英数字混在、空白を含むラベル、境界付近の文字列を試した。
- [ ] 画像化用の一時DOM、Object URL、不要なBlobを破棄した。

## 参考

- [SnapDOM API](https://github.com/zumerlab/snapdom/blob/main/docs/docs/api/index.html)
- [SnapDOM Options](https://github.com/zumerlab/snapdom/blob/main/docs/docs/options/index.html)
- [SnapDOM Features](https://github.com/zumerlab/snapdom/blob/main/FEATURES.md)
- 基準実装: [`RegisterScoreResultView.tsx`](../src/pages/register-score/RegisterScoreResultView.tsx)
