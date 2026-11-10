# カラーテーマ追加 調査レポート

再検証日: 2026-10-08
調査対象: `develop`（`src/styles/tailwind.css`、`src/utils/themePreference.ts`、`src/components/common/AppearanceSettings.constants.ts`）

## 1. 現在のテーマ構成

外観は「背景テーマ」と「アクセントカラー」の2軸で、それぞれルート要素の `data-theme` / `data-accent` 属性で切り替える。

### 背景テーマ（`data-theme`）

| テーマ値 | 表示名 | CSS セレクタ | 構成 |
|---|---|---|---|
| `light` | ホワイト | `:root, [data-theme="light"]` | 白背景。全テーマの基準値 |
| `pastel-orange` | パステルオレンジ | `[data-theme="pastel-orange"]` | Light 調。背景・枠線・入力欄を暖色の手作り hex で全変数定義 |
| `dark` | ダークグリーン | `:is([data-theme="dark"], [data-theme="black"])` | 濃緑背景。Dark 調の基準値 |
| `dark-blue` | ダークブルー | `[data-theme="dark-blue"]` | Dark 調。全変数を独自に定義（info は teal ではなく blue） |
| `black` | ブラック | `[data-theme="black"]` | dark の定義を継承し、背景・枠線・状態色背景など背景依存の変数だけ上書き |
| 共通 | — | `:root` と全 `[data-theme]` の列挙 | ページ背景模様、レーティング画像、ゲーム固有トークン（難易度バッジ、ランプ、スコアランク等） |

- テーマ値の型は `ThemePreference`（`src/utils/themePreference.ts`）、選択肢は `THEME_OPTIONS`（`AppearanceSettings.constants.ts`）で定義している。
- 保存値は localStorage の `chunisupport-theme`。未設定・旧 `system` 設定は OS 配色から `light` / `dark` へ移行する。
- `color-scheme` は dark / black / dark-blue で `dark`、pastel-orange で `light` を指定している。

### アクセントカラー（`data-accent`）

- `@theme` で `--color-primary-*` を `--cs-color-accent-*` に接続し、`[data-accent="..."]` ブロックで Tailwind パレットを差し替える。
- 選択肢は `green`（既定）/ `orange` / `sky-blue` / `blue` / `violet` / `yellow` / `red`。保存値は localStorage の `chunisupport-accent`。
- 明るい背景（light / pastel-orange）× `sky-blue` のみ、コントラスト確保のためアクション・リンク・フォーカスリングを1段濃くする上書きがある。

## 2. 新しい背景テーマを追加するときの作業

CSS だけでは完結せず、以下をすべて更新する必要がある。

1. `src/styles/tailwind.css`
   - `[data-theme="新テーマ"]` ブロック（既存テーマを丸ごと継承するなら `black` のように `:is(...)` へ追加して差分だけ定義）
   - 共通トークンブロック（`:root, [data-theme="light"], ...`）のセレクタ列挙
   - Dark 調なら、テーマ名を列挙している個別ルール（例: `.goal-card-progress-secondary`）
   - Light 調なら、`sky-blue` アクセントのコントラスト上書きセレクタ
2. `src/utils/themePreference.ts` の `ThemePreference` 型と、`resolveAppliedTheme` / `readThemePreference` の値チェック
3. `src/components/common/AppearanceSettings.constants.ts` の `THEME_OPTIONS`
4. `src/utils/themePreference.test.ts` のテスト

アクセントカラーを追加する場合は、`[data-accent="..."]` ブロック、`AccentPreference` 型、`readAccentPreference`、`ACCENT_OPTIONS` を更新する。

## 3. 機械的に決まる部分 / デザイン判断が必要な部分

### 機械的（公式化可能）

| 関係 | 内容 |
|---|---|
| **アクセントカラー派生** | `--color-primary-*` は `data-accent` から決まるため、テーマ側では primary の段数（50〜900）を選ぶだけでよい |
| **hover offset** | Light 調: base +1 step（`primary-600 → primary-700`）、Dark 調: base -1 step（`primary-500 → primary-400`） |
| **Dark 調の淡色背景** | `color-mix(in oklab, <パレット色> N%, var(--cs-color-surface))` で surface に混ぜる。dark / dark-blue は 35%（success-bg-hover は 45%）、black は 45%（同 55%） |
| **border offset (Light→Dark)** | danger/success/warning で +5 step 暗く（`red-300 → red-800`） |
| **text-inverse** | bg 色と同じ値 |
| **overlay** | 同じ色(rgb(0 0 0))、opacity のみ変更（Light 調: 30%, dark / dark-blue: 60%, black: 65%） |
| **input-bg** | surface と同じ値 |
| **disabled-bg** | Dark 調・pastel-orange では surface-muted と同じ値 |
| **link** | action-primary と同じ値 |

### デザイン判断が必要

| 箇所 | 理由 |
|---|---|
| **surface 5色** | dark / dark-blue / black / pastel-orange はすべて手作り hex、非線形な階調 |
| **border / action-secondary / input-border** | テーマごとの手作り hex（surface との組み合わせで決める） |
| **info 色相** | Light 調は `blue`、dark / black は `teal`、dark-blue は `blue` |
| **text-subtle** | 全テーマで `gray-500` 固定（反転ルール非遵守） |
| **row-highlight 系の混色率** | Light 調 22% / 32%、dark / dark-blue 42% / 55%、black 48% / 60% |
| **weak-chart** | opacity 処理が独立、他と連動しない |

## 4. テーマごとに決める変数一覧（52変数）

以下は light（ホワイト）と dark（ダークグリーン）の現在値。dark-blue / pastel-orange は全変数、black は背景依存の変数のみを独自に定義している。

### 背景・サーフェス（5変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 1 | `--cs-color-bg` | `var(--color-white)` | `#03150f` |
| 2 | `--cs-color-surface` | `var(--color-white)` | `#082018` |
| 3 | `--cs-color-surface-muted` | `var(--color-gray-100)` | `#0d2a20` |
| 4 | `--cs-color-surface-raised` | `var(--color-white)` | `#0b241b` |
| 5 | `--cs-color-surface-hover` | `var(--color-gray-200)` | `#123528` |

### テキスト（6変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 6 | `--cs-color-text` | `var(--color-gray-900)` | `var(--color-gray-50)` |
| 7 | `--cs-color-text-muted` | `var(--color-gray-600)` | `var(--color-gray-300)` |
| 8 | `--cs-color-text-subtle` | `var(--color-gray-500)` | `var(--color-gray-500)` |
| 9 | `--cs-color-text-inverse` | `var(--color-white)` | `#03150f` |
| 10 | `--cs-color-text-placeholder` | `var(--color-gray-400)` | `var(--color-gray-500)` |
| 11 | `--cs-color-nav-text` | `var(--color-gray-700)` | `var(--color-gray-100)` |

### 枠線・フォーカスリング（3変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 12 | `--cs-color-border` | `var(--color-gray-300)` | `#1d4a39` |
| 13 | `--cs-color-border-strong` | `var(--color-gray-400)` | `#2f6b53` |
| 14 | `--cs-color-focus-ring` | `var(--color-primary-500)` | `var(--color-primary-400)` |

### アクション・選択状態（11変数）

`mix(色 N%)` は `color-mix(in oklab, 色 N%, var(--cs-color-surface))` の省略表記。

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 15 | `--cs-color-action-primary` | `var(--color-primary-600)` | `var(--color-primary-500)` |
| 16 | `--cs-color-action-primary-hover` | `var(--color-primary-700)` | `var(--color-primary-400)` |
| 17 | `--cs-color-action-primary-muted` | `var(--color-primary-50)` | `mix(primary-700 35%)` |
| 18 | `--cs-color-action-primary-border` | `var(--color-primary-200)` | `var(--color-primary-700)` |
| 19 | `--cs-color-select-selected-hover-bg` | `var(--color-primary-100)` | `mix(primary-600 42%)` |
| 20 | `--cs-color-interactive-row-hover` | `var(--color-primary-100)` | `mix(primary-900 28%)` |
| 21 | `--cs-color-new-song-bg` | `var(--color-primary-100)` | `mix(primary-700 16%)` |
| 22 | `--cs-color-row-highlight` | `mix(primary-500 22%)` | `mix(primary-500 42%)` |
| 23 | `--cs-color-row-highlight-hover` | `mix(primary-500 32%)` | `mix(primary-500 55%)` |
| 24 | `--cs-color-action-secondary` | `var(--color-gray-300)` | `#1d4a39` |
| 25 | `--cs-color-action-secondary-hover` | `var(--color-gray-400)` | `#2f6b53` |

### 危険（エラー）（4変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 26 | `--cs-color-danger` | `var(--color-red-600)` | `var(--color-red-400)` |
| 27 | `--cs-color-danger-hover` | `var(--color-red-700)` | `var(--color-red-300)` |
| 28 | `--cs-color-danger-bg` | `var(--color-red-50)` | `mix(red-900 35%)` |
| 29 | `--cs-color-danger-border` | `var(--color-red-300)` | `var(--color-red-800)` |

### 成功（4変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 30 | `--cs-color-success` | `var(--color-green-700)` | `var(--color-green-300)` |
| 31 | `--cs-color-success-bg` | `var(--color-green-50)` | `mix(green-900 35%)` |
| 32 | `--cs-color-success-bg-hover` | `var(--color-green-100)` | `mix(green-800 45%)` |
| 33 | `--cs-color-success-border` | `var(--color-green-300)` | `var(--color-green-800)` |

### 警告（3変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 34 | `--cs-color-warning` | `var(--color-yellow-700)` | `var(--color-yellow-300)` |
| 35 | `--cs-color-warning-bg` | `var(--color-yellow-50)` | `mix(yellow-900 35%)` |
| 36 | `--cs-color-warning-border` | `var(--color-yellow-300)` | `var(--color-yellow-800)` |

### 情報（5変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 37 | `--cs-color-info` | `var(--color-blue-700)` | `var(--color-teal-300)` |
| 38 | `--cs-color-info-bg` | `var(--color-blue-50)` | `mix(teal-900 35%)` |
| 39 | `--cs-color-info-border` | `var(--color-blue-300)` | `var(--color-teal-800)` |
| 40 | `--cs-color-rating-candidate-gap` | `var(--color-blue-700)` | `var(--color-blue-300)` |
| 41 | `--cs-color-score-difference-negative` | `var(--color-blue-700)` | `var(--color-blue-400)` |

### 苦手譜面インスペクター（2変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 42 | `--cs-color-weak-chart-point` | `rgb(22 163 74 / 45%)` | `rgb(134 239 172 / 45%)` |
| 43 | `--cs-color-weak-chart-outlier` | `var(--color-blue-600)` | `var(--color-blue-400)` |

### その他（9変数 + color-scheme）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 44 | `--cs-color-overlay` | `rgb(0 0 0 / 30%)` | `rgb(0 0 0 / 60%)` |
| 45 | `--cs-color-disabled-bg` | `var(--color-gray-200)` | `#0d2a20` |
| 46 | `--cs-color-disabled-text` | `var(--color-gray-400)` | `var(--color-gray-600)` |
| 47 | `--cs-color-input-bg` | `var(--color-white)` | `#082018` |
| 48 | `--cs-color-input-border` | `var(--color-gray-400)` | `#2f6b53` |
| 49 | `--cs-color-input-border-hover` | `var(--color-gray-500)` | `#3f8a6b` |
| 50 | `--cs-color-link` | `var(--color-primary-600)` | `var(--color-primary-400)` |
| 51 | `--cs-color-link-hover` | `var(--color-primary-700)` | `var(--color-primary-300)` |
| 52 | `--cs-color-song-list-title` | `var(--color-primary-600)` | `var(--color-primary-300)` |

**追加で**: `color-scheme` プロパティ（Dark 調は `dark`、pastel-orange は `light`。light は未指定）

## 5. 注意点

- アクセントカラーは背景テーマから独立しているため、新テーマでも `--color-primary-*` を直接上書きしない。テーマ側は primary の何段目を使うかだけを決める。
- Dark 調の淡色背景は `color-mix` で surface に混ぜているため、surface を変えれば自動で追従する。black はこの性質を利用し、背景依存の変数と混色率だけを上書きしている。
- ゲーム固有トークン（難易度バッジ、ランプ、スコアランク等）は共通ブロックにあり、テーマごとの再定義は不要。ただし共通ブロックのセレクタ列挙へのテーマ追加は必要。
- 新しいテーマが Light 調か Dark 調かで、参照すべき既存パターンが異なる（Light 調: light / pastel-orange、Dark 調: dark / dark-blue / black）。
- 画像化用の要素など、テーマに関係なく明るい配色で描画する箇所は `data-theme="light"` を直接指定している（例: `RegisterScoreResultView.tsx`）。
