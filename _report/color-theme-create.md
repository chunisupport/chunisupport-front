# カラーテーマ追加 調査レポート

## 1. 現在のテーマ構成

`data-theme` 属性による CSS 駆動のテーマ切り替え。

| テーマ | CSS セレクタ | 役割 |
|---|---|---|
| Light | `[data-theme="light"]` | 白背景、ダークテキスト |
| Dark | `[data-theme="dark"]` | 濃緑背景、ライトテキスト |
| 共通 | `:root, [data-theme="light"], [data-theme="dark"]` | ゲーム固有トークン（難易度バッジ、ランプ、スコアランク等） |

テーマ切り替えは `document.documentElement.dataset.theme` に値をセットするだけで動作する。3つ目のテーマを追加する場合も `[data-theme="任意の名前"]` ブロックを増やすだけで良く、**JS/TS のロジック変更は不要**（ただし UI の選択肢追加は必要）。

## 2. 機械的に決まる部分 / デザイン判断が必要な部分

### 機械的（公式化可能）

| 関係 | 内容 |
|---|---|
| **アクセントカラー派生** | `--color-primary-*` を差し替えれば `action-primary`, `link`, `focus-ring` は自動追従 |
| **hover offset** | Light: base +1 step（`primary-600 → primary-700`） |
| **muted offset** | Light: base -550 step（`primary-600 → primary-50`） |
| **border offset (Light→Dark)** | danger/success/warning で +5 step 暗く（`red-300 → red-800`） |
| **text-inverse** | bg 色と入れ替え |
| **overlay** | 同じ色(rgb(0 0 0))、opacity のみ変更（Light: 30%, Dark: 60%） |
| **input-bg** | surface と同じ値 |
| **link** | action-primary と同じ値 |

### デザイン判断が必要

| 箇所 | 理由 |
|---|---|
| **Dark の surface 5色** | すべて手作り hex、非線形な階調 |
| **Dark の muted/bg** | `rgb(X / 35%)` のハードコード、Tailwind palette と非対応 |
| **Dark の info 色相** | Light は `blue` / Dark は `teal` と色相が変わる（意図的） |
| **text-subtle** | Light/Dark 両方で `gray-500` 固定（反転ルール非遵守） |
| **disabled-bg** | surface-muted との一致が Light/Dark で異なる |
| **weak-chart** | opacity 処理が独立、他と連動しない |
| **Dark の hover step 幅** | グループによって -2〜-4 step と異なる |

## 3. 決定が必要な変数一覧（44変数）

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

### アクション（ボタン）（6変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 15 | `--cs-color-action-primary` | `var(--color-primary-600)` | `var(--color-primary-500)` |
| 16 | `--cs-color-action-primary-hover` | `var(--color-primary-700)` | `var(--color-primary-400)` |
| 17 | `--cs-color-action-primary-muted` | `var(--color-primary-50)` | `rgb(20 83 45 / 35%)` |
| 18 | `--cs-color-action-primary-border` | `var(--color-primary-200)` | `var(--color-primary-700)` |
| 19 | `--cs-color-action-secondary` | `var(--color-gray-300)` | `#1d4a39` |
| 20 | `--cs-color-action-secondary-hover` | `var(--color-gray-400)` | `#2f6b53` |

### 危険（エラー）（4変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 21 | `--cs-color-danger` | `var(--color-red-600)` | `var(--color-red-400)` |
| 22 | `--cs-color-danger-hover` | `var(--color-red-700)` | `var(--color-red-300)` |
| 23 | `--cs-color-danger-bg` | `var(--color-red-50)` | `rgb(127 29 29 / 35%)` |
| 24 | `--cs-color-danger-border` | `var(--color-red-300)` | `var(--color-red-800)` |

### 成功（4変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 25 | `--cs-color-success` | `var(--color-green-700)` | `var(--color-green-300)` |
| 26 | `--cs-color-success-bg` | `var(--color-green-50)` | `rgb(20 83 45 / 35%)` |
| 27 | `--cs-color-success-bg-hover` | `var(--color-green-100)` | `rgb(22 101 52 / 45%)` |
| 28 | `--cs-color-success-border` | `var(--color-green-300)` | `var(--color-green-800)` |

### 警告（3変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 29 | `--cs-color-warning` | `var(--color-yellow-700)` | `var(--color-yellow-300)` |
| 30 | `--cs-color-warning-bg` | `var(--color-yellow-50)` | `rgb(113 63 18 / 35%)` |
| 31 | `--cs-color-warning-border` | `var(--color-yellow-300)` | `var(--color-yellow-800)` |

### 情報（3変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 32 | `--cs-color-info` | `var(--color-blue-700)` | `var(--color-teal-300)` |
| 33 | `--cs-color-info-bg` | `var(--color-blue-50)` | `rgb(19 78 74 / 35%)` |
| 34 | `--cs-color-info-border` | `var(--color-blue-300)` | `var(--color-teal-800)` |

### 苦手譜面インスペクター（2変数）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 35 | `--cs-color-weak-chart-point` | `rgb(22 163 74 / 45%)` | `rgb(134 239 172 / 45%)` |
| 36 | `--cs-color-weak-chart-outlier` | `var(--color-blue-600)` | `var(--color-blue-400)` |

### その他（8変数 + color-scheme）

| # | 変数 | Light (現在値) | Dark (現在値) |
|---|---|---|---|
| 37 | `--cs-color-overlay` | `rgb(0 0 0 / 30%)` | `rgb(0 0 0 / 60%)` |
| 38 | `--cs-color-disabled-bg` | `var(--color-gray-200)` | `#0d2a20` |
| 39 | `--cs-color-disabled-text` | `var(--color-gray-400)` | `var(--color-gray-600)` |
| 40 | `--cs-color-input-bg` | `var(--color-white)` | `#082018` |
| 41 | `--cs-color-input-border` | `var(--color-gray-400)` | `#2f6b53` |
| 42 | `--cs-color-input-border-hover` | `var(--color-gray-500)` | `#3f8a6b` |
| 43 | `--cs-color-link` | `var(--color-primary-600)` | `var(--color-primary-400)` |
| 44 | `--cs-color-link-hover` | `var(--color-primary-700)` | `var(--color-primary-300)` |

**追加で**: `color-scheme: dark` プロパティ（Dark テーマのみ設定）

## 4. 注意点

- 現状、`--color-primary-*` は `@theme` ブロックで `--color-green-*` を指している。新しいテーマでアクセントカラーを変える場合、`[data-theme="blue"]` ブロック内で `--color-primary-*` を `--color-blue-*` に上書きすれば、`var(--color-primary-*)` を参照している全変数が追従する。
- ゲーム固有トークン（難易度バッジ、ランプ、スコアランク等）は共通ブロックにあり、全テーマ共通で再定義不要。
- 新しいテーマが Light 調か Dark 調かで、参照すべき既存パターンが異なる。
