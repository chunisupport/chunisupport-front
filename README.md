# ChuniSupport Frontend

ChuniSupport のフロントエンドアプリケーションです。  
Solid.js + Rsbuild をベースに、CHUNITHM プレイデータの閲覧・管理機能を提供します。

## 主な機能

- 認証（ログイン / 新規登録）
- ユーザページ（プレイヤー情報、リザルト、統計）
- 楽曲一覧・楽曲詳細（通常 / WORLD'S END）
- 目標管理
- 設定画面
- 管理者画面（ユーザ管理 / 楽曲管理）

実際のルーティングは `src/App.tsx` を参照してください。

## 技術スタック

- Solid.js
- Rsbuild
- TypeScript
- Tailwind CSS
- Kobalte（UI）
- Lucide（アイコン）
- Firebase
- Biome（Lint / Format）

## 必要要件

- Node.js 20 以上（推奨）
- npm

## セットアップ

```bash
npm install
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# Lint + Format（自動修正あり）
npm run check

# CI 用チェック（自動修正なし）
npm run check:ci

# 単体テスト
npm run test:unit
```

## ディレクトリ構成（抜粋）

```text
src/
  api/          # API 呼び出し
  components/   # 共通 UI コンポーネント
  hooks/        # カスタムフック
  pages/        # 画面
  stores/       # 状態管理
  usecases/     # ユースケース層
  utils/        # 純粋関数・ユーティリティ
```

## 品質チェック

変更時は次のコマンドを実行してください。

```bash
npm run check:ci
npm run build
```

必要に応じて単体テストも実行してください。

```bash
npm run test:unit
```

## OSSライセンス

本プロジェクトで使用しているサードパーティ製ソフトウェアのライセンス情報は、
リポジトリルートの `THIRD-PARTY-NOTICES.txt` に集約されています。
依存関係を更新した場合は必ず `npm run licenses:generate` を実行し、
ファイルを更新した上でコミットしてください（CIで差分チェックを行っています）。

## 関連資料

- Rsbuild Documentation: https://rsbuild.rs/
- Rspack Documentation: https://rspack.rs/
- API 管理リポジトリ: https://github.com/chunisupport/chunisupport-api
- API 仕様書（develop）: https://github.com/chunisupport/chunisupport-api/blob/develop/docs/API.md
