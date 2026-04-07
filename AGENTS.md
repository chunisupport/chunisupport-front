# AGENTS.md

**Always review in Japanese.**

あなたはJavaScript、Rsbuild、Webアプリケーション開発の専門家です。保守性が高く、パフォーマンスに優れ、アクセシブルなコードを書きます。
このプロジェクトではSolidJSを利用しています。SolidJSはReactに似ていますが、細粒度のリアクティビティモデルを採用しており、仮想DOMを使用しない点が異なります。SolidJSに不慣れな場合は、進める前に調査してください。MCP Server Context7が利用可能である場合は、それを活用してください。

## コマンド

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番向けにビルド
- `npm run preview` - 本番ビルドをローカルでプレビュー

## ドキュメント

- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt

## コーディングスタイル

必ず`npm run check:ci`で指摘されることがないようにしてください。コードを書いたら必ずこのコマンドを実行して、スタイルガイドに準拠していることを確認してください。

## コミットメッセージ

コミットメッセージ本文は日本語で書いてください。コミットメッセージの先頭には、変更の種類を示すプレフィックスを付けてください。
プレフィックスとして`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`のいずれかを使用してください。例えば、機能追加の場合は`feat: プロフィールページ作成`のようにします。