# デザイントークン化計画

## 目的

ChuniSupport の画面色を Tailwind の通常色ユーティリティ（例: `bg-green-500`, `text-gray-700`, `border-red-300`）へ直接依存させず、意味を持つデザイントークン経由で扱える状態にする。

これにより、ダークテーマ導入、ブランドカラー変更、アクセシビリティ改善、将来的な通常色ユーティリティの使用縮小を、各コンポーネントの個別修正ではなくトークン定義の変更で進めやすくする。

## 現状認識

- Tailwind CSS v4 を利用しており、`src/styles/tailwind.css` の `@theme` で `primary` カラーが定義されている。
- 画面実装には `bg-white`, `text-gray-700`, `border-gray-200`, `bg-green-50`, `text-red-600` などの通常色ユーティリティが広く使われている。
- 難易度色など、ドメイン上の意味を持つ色も一部で直接カラーコードや通常色ユーティリティとして扱われている。
- ダークテーマに必要な「画面の意味に応じた色の差し替え単位」がまだ不足している。

## 基本方針

### トークンの実体名と Tailwind 公開名を分ける

ライト・ダークテーマで値を差し替える実体は、アプリ固有の CSS 変数 `--cs-color-*` として定義する。Tailwind のクラスとして公開する名前だけを `@theme inline` の `--color-*` に接続する。

例:

- 実体: `--cs-color-surface`
- Tailwind 公開名: `--color-surface`
- 利用クラス: `bg-surface`, `text-text-muted`, `border-border`

計画内で「トークン」と呼ぶ場合は原則として `--cs-color-*` の実体を指し、コンポーネントからは Tailwind クラスを経由して利用する。

### 意味ベースのトークンを優先する

コンポーネントでは「何色か」ではなく「何の役割か」を表すクラスを使う。

例:

- `bg-white` ではなく `bg-surface`
- `text-gray-700` ではなく `text-text-muted`
- `border-gray-200` ではなく `border-border`
- `bg-green-600` ではなく `bg-action-primary`
- `text-red-600` ではなく `text-danger`

### Tailwind の通常色はトークン定義の材料として扱う

移行初期は、トークンの実体として Tailwind の標準色を参照してよい。

```css
:root,
[data-theme='light'] {
  --cs-color-surface: var(--color-white);
  --cs-color-text-muted: var(--color-gray-600);
  --cs-color-action-primary: var(--color-green-600);
}

@theme inline {
  --color-surface: var(--cs-color-surface);
  --color-text-muted: var(--cs-color-text-muted);
  --color-action-primary: var(--cs-color-action-primary);
}
```

ただし、コンポーネントからは `bg-green-600` のような通常色ユーティリティを直接使わない方向へ段階的に寄せる。

Tailwind CSS v4 の `@theme` はユーティリティ生成のための定義として扱う。ライト・ダークテーマで値を差し替える実体は `--cs-color-*` のようなアプリ固有 CSS 変数に置き、`@theme inline` で Tailwind の `bg-surface`, `text-text-muted` などへ接続する。

### すべてを一度に置換しない

既存画面の色指定は多いため、最初から完全移行を狙わない。先にトークン体系と利用ルールを固め、新規実装・改修箇所から置換する。

## トークン階層

### 1. プリミティブトークン

色そのものを表す。Tailwind 標準色、ブランドカラー、ドメインカラーなどの材料層。

例:

- `--cs-color-brand-green-600`
- `--cs-color-brand-green-700`
- `--cs-color-difficulty-basic-bg`
- `--cs-color-difficulty-basic-text`
- `--cs-color-difficulty-advanced-bg`
- `--cs-color-difficulty-advanced-text`
- `--cs-color-difficulty-expert-bg`
- `--cs-color-difficulty-expert-text`
- `--cs-color-difficulty-master-bg`
- `--cs-color-difficulty-master-text`
- `--cs-color-difficulty-ultima-bg`
- `--cs-color-difficulty-ultima-text`
- `--cs-color-honor-title-*-bg`
- `--cs-color-honor-title-*-text`

この層はコンポーネントから直接使わない。

### 2. セマンティックトークン

UI上の役割を表す。コンポーネントが主に使う層。

例:

- `--cs-color-bg`
- `--cs-color-surface`
- `--cs-color-surface-muted`
- `--cs-color-surface-raised`
- `--cs-color-text`
- `--cs-color-text-muted`
- `--cs-color-text-subtle`
- `--cs-color-border`
- `--cs-color-border-strong`
- `--cs-color-action-primary`
- `--cs-color-action-primary-hover`
- `--cs-color-danger`
- `--cs-color-danger-bg`
- `--cs-color-success`
- `--cs-color-success-bg`
- `--cs-color-warning`
- `--cs-color-warning-bg`
- `--cs-color-info`
- `--cs-color-info-bg`

### 3. コンポーネントトークン

特定コンポーネントで繰り返し出る組み合わせを表す。共通コンポーネント化とセットで導入する。

例:

- `--cs-color-card-bg`
- `--cs-color-card-border`
- `--cs-color-dialog-bg`
- `--cs-color-dialog-overlay`
- `--cs-color-input-bg`
- `--cs-color-input-border`
- `--cs-color-nav-bg`
- `--cs-color-nav-item-active-bg`
- `--cs-color-table-header-bg`
- `--cs-color-table-row-hover-bg`

最初から増やしすぎず、同じ意味の組み合わせが複数箇所に出た時点で追加する。

## 初期トークン案

まずは以下を `src/styles/tailwind.css` に追加する。

実体値は `:root, [data-theme='light']` のアプリ固有 CSS 変数として定義する。

```css
:root,
[data-theme='light'] {
  --cs-color-bg: var(--color-gray-50);
  --cs-color-surface: var(--color-white);
  --cs-color-surface-muted: var(--color-gray-50);
  --cs-color-surface-raised: var(--color-white);
  --cs-color-surface-hover: var(--color-gray-100);

  --cs-color-text: var(--color-gray-900);
  --cs-color-text-muted: var(--color-gray-600);
  --cs-color-text-subtle: var(--color-gray-400);
  --cs-color-text-inverse: var(--color-white);
  --cs-color-text-placeholder: var(--color-gray-400);

  --cs-color-border: var(--color-gray-200);
  --cs-color-border-strong: var(--color-gray-300);
  --cs-color-focus-ring: var(--color-primary-500);

  --cs-color-action-primary: var(--color-primary-600);
  --cs-color-action-primary-hover: var(--color-primary-700);
  --cs-color-action-primary-muted: var(--color-primary-50);
  --cs-color-action-primary-border: var(--color-primary-200);
  --cs-color-action-secondary: var(--color-gray-200);
  --cs-color-action-secondary-hover: var(--color-gray-300);

  --cs-color-danger: var(--color-red-600);
  --cs-color-danger-hover: var(--color-red-700);
  --cs-color-danger-bg: var(--color-red-50);
  --cs-color-danger-border: var(--color-red-300);

  --cs-color-success: var(--color-green-700);
  --cs-color-success-bg: var(--color-green-50);
  --cs-color-success-border: var(--color-green-300);

  --cs-color-warning: var(--color-yellow-700);
  --cs-color-warning-bg: var(--color-yellow-50);
  --cs-color-warning-border: var(--color-yellow-300);

  --cs-color-info: var(--color-blue-700);
  --cs-color-info-bg: var(--color-blue-50);
  --cs-color-info-border: var(--color-blue-300);

  --cs-color-overlay: rgb(0 0 0 / 30%);
  --cs-color-disabled-bg: var(--color-gray-100);
  --cs-color-disabled-text: var(--color-gray-300);
  --cs-color-input-bg: var(--color-white);
  --cs-color-input-border: var(--color-gray-300);
  --cs-color-input-border-hover: var(--color-gray-400);
}
```

Tailwind ユーティリティとして使う名前は `@theme inline` で接続する。

```css
@theme inline {
  --color-bg: var(--cs-color-bg);
  --color-surface: var(--cs-color-surface);
  --color-surface-muted: var(--cs-color-surface-muted);
  --color-surface-raised: var(--cs-color-surface-raised);
  --color-surface-hover: var(--cs-color-surface-hover);

  --color-text: var(--cs-color-text);
  --color-text-muted: var(--cs-color-text-muted);
  --color-text-subtle: var(--cs-color-text-subtle);
  --color-text-inverse: var(--cs-color-text-inverse);
  --color-text-placeholder: var(--cs-color-text-placeholder);

  --color-border: var(--cs-color-border);
  --color-border-strong: var(--cs-color-border-strong);
  --color-focus-ring: var(--cs-color-focus-ring);

  --color-action-primary: var(--cs-color-action-primary);
  --color-action-primary-hover: var(--cs-color-action-primary-hover);
  --color-action-primary-muted: var(--cs-color-action-primary-muted);
  --color-action-primary-border: var(--cs-color-action-primary-border);
  --color-action-secondary: var(--cs-color-action-secondary);
  --color-action-secondary-hover: var(--cs-color-action-secondary-hover);

  --color-danger: var(--cs-color-danger);
  --color-danger-hover: var(--cs-color-danger-hover);
  --color-danger-bg: var(--cs-color-danger-bg);
  --color-danger-border: var(--cs-color-danger-border);

  --color-success: var(--cs-color-success);
  --color-success-bg: var(--cs-color-success-bg);
  --color-success-border: var(--cs-color-success-border);

  --color-warning: var(--cs-color-warning);
  --color-warning-bg: var(--cs-color-warning-bg);
  --color-warning-border: var(--cs-color-warning-border);

  --color-info: var(--cs-color-info);
  --color-info-bg: var(--cs-color-info-bg);
  --color-info-border: var(--cs-color-info-border);

  --color-overlay: var(--cs-color-overlay);
  --color-disabled-bg: var(--cs-color-disabled-bg);
  --color-disabled-text: var(--cs-color-disabled-text);
  --color-input-bg: var(--cs-color-input-bg);
  --color-input-border: var(--cs-color-input-border);
  --color-input-border-hover: var(--cs-color-input-border-hover);
}
```

この段階では既存の `primary` 定義は維持する。

## ダークテーマ対応方針

テーマ切り替えは、ルート要素に `data-theme` を付与して CSS 変数を差し替える方式を基本とする。

```css
:root,
[data-theme='light'] {
  --cs-color-bg: var(--color-gray-50);
  --cs-color-surface: var(--color-white);
  --cs-color-text: var(--color-gray-900);
}

[data-theme='dark'] {
  --cs-color-bg: var(--color-gray-950);
  --cs-color-surface: var(--color-gray-900);
  --cs-color-text: var(--color-gray-50);
}
```

テーマ状態は将来的に `light | dark | system` を扱えるようにする。初期導入では、保存先は `localStorage`、未設定時は `prefers-color-scheme` を参照する方針とする。

初期表示のちらつきを避けるため、保存済みテーマまたは `prefers-color-scheme` から決定した `data-theme` は、可能な限りアプリ描画前に `document.documentElement` へ付与する。

### テーマで変えない固定色

以下の色は、ライトテーマ・ダークテーマのどちらでも原則として変更しない。

- 難易度色
- 称号の背景色

これらは画面の明暗に追従するUI色ではなく、ゲーム由来の意味や装飾表現を持つ固定色として扱う。背景色を固定する場合、可読性を保つために中のテキスト色も固定ペアとして定義する。

例:

```css
:root,
[data-theme='light'],
[data-theme='dark'] {
  --cs-color-difficulty-basic-bg: #00ab84;
  --cs-color-difficulty-basic-text: var(--color-white);

  --cs-color-honor-title-normal-bg: var(--color-yellow-200);
  --cs-color-honor-title-normal-text: var(--color-gray-900);
}

@theme inline {
  --color-difficulty-basic-bg: var(--cs-color-difficulty-basic-bg);
  --color-difficulty-basic-text: var(--cs-color-difficulty-basic-text);

  --color-honor-title-normal-bg: var(--cs-color-honor-title-normal-bg);
  --color-honor-title-normal-text: var(--cs-color-honor-title-normal-text);
}
```

`[data-theme='dark']` 側では、上記の固定色トークンを上書きしない。ダークテーマで調整が必要になった場合も、まずは周囲の `surface`, `border`, `shadow` などを調整し、難易度色・称号背景色そのものの変更は最後に検討する。

既存の称号表示は `src/styles/tailwind.css` の `.user-honor-title` と `--honor-background` で管理されている。Phase 3 ではこの既存クラスを急に廃止せず、まず `--honor-background: var(--color-honor-title-normal-bg)` のようにトークンへ接続する。称号表示が複数コンポーネントへ広がった時点で、Tailwind クラス化または共通コンポーネント化を検討する。

ULTIMA のカード枠線のような `repeating-linear-gradient` は単一の色トークンに押し込めない。Phase 3 では背景色・文字色の固定ペアとは別に、必要であれば `difficultyCardBorderColor` の返却クラスや共通コンポーネント側で表現用クラスとして扱う。

## 移行ステップ

### Phase 1: トークン基盤を追加する

- `src/styles/tailwind.css` に `--cs-color-*` の実体変数と `@theme inline` の接続定義を追加する。
- `body` またはアプリのルート背景・文字色を `bg-bg text-text` 相当にする。
- 既存の `primary` 定義は壊さず維持する。

完了条件:

- 新しいトークンクラスが Tailwind で利用できる。
- 既存画面の見た目が大きく変わらない。
- `bg-overlay`, `bg-surface-hover`, `border-input-border`, `text-disabled-text` など、Phase 2 で必要になる状態トークンも利用できる。

### Phase 2: 共通UIから置換する

優先順位:

1. ナビゲーション
2. ダイアログ
3. ボタン
4. 入力欄
5. カード
6. テーブル

この段階で、繰り返し使うUIは `src/components/common` などに共通化する。

完了条件:

- 新規・変更される共通UIで通常色ユーティリティを直接使わない。
- `bg-white`, `text-gray-*`, `border-gray-*` の主要な繰り返し箇所がトークンへ置き換わっている。

### Phase 3: ドメインカラーを分離する

難易度、称号、ランプ、スコアランク、WORLD'S END など、UI状態ではなくドメイン上の意味を持つ色を専用トークンへ分ける。

例:

- `bg-difficulty-basic-bg`
- `text-difficulty-basic-text`
- `bg-difficulty-advanced-bg`
- `text-difficulty-advanced-text`
- `bg-difficulty-expert-bg`
- `text-difficulty-expert-text`
- `bg-difficulty-master-bg`
- `text-difficulty-master-text`
- `bg-difficulty-ultima-bg`
- `text-difficulty-ultima-text`
- `bg-honor-title-normal-bg`
- `text-honor-title-normal-text`

ドメインカラーは、視認性やゲーム由来の意味が強いため、UIテーマと同じ基準で反転させない。特に難易度色と称号の背景色は固定色として扱い、背景用・文字用のペアを定義する。

既存の `src/utils/difficultyUtils.ts` には、難易度バッジ、インラインスタイル用の HEX 値、カード左端の `before:*` クラスが混在している。Phase 3 では、まず表示用途ごとに返却値の責務を分け、単純な背景・文字色は `bg-difficulty-*-bg` と `text-difficulty-*-text` へ寄せる。インラインスタイル用途は段階的にクラスまたは CSS 変数参照へ置き換える。

完了条件:

- 難易度色などの直接カラーコードがコンポーネントから減っている。
- 難易度色と称号背景色が、ダークテーマで上書きされない固定トークンとして定義されている。
- ドメインカラーの変更理由と変更箇所が追いやすい。

### Phase 4: ダークテーマを実装する

- `data-theme` の付与処理を追加する。
- `light | dark | system` の設定値を保存する。
- 主要画面で背景、文字、枠線、入力欄、テーブル、ダイアログのコントラストを確認する。

完了条件:

- 主要画面がライト・ダーク両方で読める。
- トークン未移行箇所が残っていても、既知の残課題として列挙されている。

### Phase 5: 通常色ユーティリティの使用制限を強める

移行が進んだら、通常色ユーティリティの新規追加をレビューで制限する。

許可例:

- レイアウト・タイポグラフィ・余白など、色以外の Tailwind ユーティリティ
- 一時的な移行対象として理由が明記された通常色
- トークン定義ファイル内の Tailwind 標準色参照

非推奨例:

- `bg-white`
- `text-gray-700`
- `border-gray-200`
- `bg-green-500`
- `text-red-600`
- 任意カラーの直接指定（例: `bg-[#00ab84]`）

## 置換ルール

| 既存の傾向 | 置換先の例 |
| --- | --- |
| `bg-white` | `bg-surface` |
| `bg-gray-50` | `bg-surface-muted` または `bg-bg` |
| `text-gray-900` | `text-text` |
| `text-gray-600` | `text-text-muted` |
| `text-gray-400` | `text-text-subtle` |
| `border-gray-200` | `border-border` |
| `border-gray-300` | `border-border-strong` |
| `bg-primary-600` | `bg-action-primary` |
| `hover:bg-primary-700` | `hover:bg-action-primary-hover` |
| `text-red-600` | `text-danger` |
| `bg-red-50` | `bg-danger-bg` |
| `border-red-300` | `border-danger-border` |
| `bg-green-50` | `bg-success-bg` |
| `text-green-700` | `text-success` |

置換時は見た目だけで判断せず、その色が「表面」「補助テキスト」「危険操作」「成功通知」「ドメイン色」のどれかを確認する。

## 運用ルール

- 新規コンポーネントでは通常色ユーティリティを直接使わず、既存トークンを使う。
- 必要なトークンがない場合は、近い通常色を直接使う前にトークン追加を検討する。
- 1回しか使わない特殊表現は、即座にコンポーネントトークン化しない。
- 2箇所以上で同じ意味の色指定が出た場合は、セマンティックトークンまたは共通コンポーネントへ寄せる。
- 既存コメントは、色移行だけを目的に変更しない。
- 画面文言や定数と同様に、色の意味もコンポーネント内へ散らさない。

## レビュー観点

- 色名ではなく役割名のトークンを使っているか。
- ライトテーマの見た目が既存から大きく変わっていないか。
- ダークテーマで文字と背景のコントラストが不足しないか。
- hover、focus、disabled、selected などの状態色もトークン化されているか。
- ドメインカラーとUI状態色を混同していないか。
- 任意カラー指定や通常色ユーティリティを追加する理由が明確か。

## リスクと対策

### トークンが増えすぎる

対策:

- まずはセマンティックトークンを少数に絞る。
- コンポーネントトークンは重複が見えてから追加する。

### 置換後の意味が曖昧になる

対策:

- `surface`, `text`, `border`, `action`, `status`, `domain` のどれに属するかを基準に命名する。
- 迷う色は直接置換せず、画面上の役割を確認してから決める。

### ダークテーマでドメインカラーが読みにくくなる

対策:

- 難易度色と称号背景色は、背景・文字を固定ペアとして定義する。
- 読みにくい場合は、固定色そのものではなく周囲の背景、枠線、余白、影を先に調整する。
- それでも読みにくい場合のみ、対象トークンの固定ペア全体を見直す。

### 通常色ユーティリティが残り続ける

対策:

- まず新規追加を減らす。
- 変更頻度の高い画面から置換する。
- `rg -n "bg-(white|gray|green|red|blue|yellow|primary)|text-(gray|green|red|blue|yellow|primary|white)|border-(gray|green|red|blue|yellow|primary)" src` などで色ユーティリティに絞って棚卸しし、移行対象を定期的に確認する。

## 最初に着手する候補

1. `src/styles/tailwind.css` に初期セマンティックトークンを追加する。
2. `App.tsx` と `NavBar.tsx` の背景・文字・枠線をトークンへ置換する。
3. ダイアログとボタンの頻出クラスを共通化する。
4. `difficultyUtils.ts` の難易度色をドメイントークンへ寄せる。
5. 主要画面で通常色ユーティリティの残数を確認し、以降の移行順を決める。
