# Turnstileによる認証確認

ログイン・新規登録では、Turnstileウィジェットが発行したトークンをAPIへ `turnstile_token` として送信します。ウィジェットの `action` は次の値を指定します。

| 画面 | action |
| --- | --- |
| 通常ログイン・スタッフログイン（共通の `AuthenticationForm`） | `login` |
| 新規登録 | `signup` |

共通の `Turnstile` コンポーネントは `action` を必須プロパティとして受け取り、ウィジェット生成時に `turnstile.render()` へ渡します。

APIはトークンの検証結果に含まれる `hostname` と `action` を照合します。APIの `cors.allow_origins` には、ログイン・新規登録画面を配信するオリジンを設定してください。`*` のみではTurnstileの許可ホストになりません。actionの未設定・不一致や許可ホストの不一致は `invalid_turnstile_token` として拒否されます。

対応するAPI変更: [chunisupport-api #222](https://github.com/chunisupport/chunisupport-api/pull/222)。API側でaction照合を有効にする前に、このフロントの対応を反映してください。
