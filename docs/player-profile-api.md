# プレイヤープロフィールのAPI契約

内部APIのプロフィールは `PlayerDTO` で扱います。`GET /internal/users/:username/profile` および `GET /internal/users/:username` の各表示形式で共通です。

| フィールド | 型 | 内容 |
| --- | --- | --- |
| `class_emblem` | `string \| null` | 解決済みのクラスエンブレムのマスタ名 |
| `class_emblem_base` | `string \| null` | 解決済みのクラスエンブレムベースのマスタ名 |
| `possession` | `PossessionName` | ポゼッション名（`"normal"` / `"silver"` / `"gold"` / `"platina"` / `"rainbow"`） |

エンブレムの値は `"1"`〜`"5"`、`"inf"` の文字列です。未設定または解決不能の場合は `null` です。内部APIはDBの数値IDを公開しないため、`class_emblem_id`、`class_emblem_base_id`、`possession_id` は含まれません。

プロフィール取得結果はマスタで再解決せず、そのまま扱います。プロフィールは永続キャッシュに保存しません。

スコア登録結果および保存済み更新結果の `profile` は別契約の `PlayerDataProfile` です。こちらも `class_emblem`、`class_emblem_base`、`possession` の名称を返し、プレイヤーIDを含みません。

フレンド一覧の `possession` もポゼッション名で、プレイヤー由来の項目を返さない場合は `null` です。ポゼッション色はマスタを取得せず、これらの名称から決めます。

外部API v1のプロフィールも同じ名称を返します。ただし後方互換のため、`class_emblem_id`、`class_emblem_base_id`、`possession_id` の数値IDも返します。フロントエンドの `PlayerDTO` は内部API専用です。
