# プレイヤープロフィールのAPI契約

内部APIのプロフィールは `PlayerDTO` で扱います。`GET /internal/users/:username/profile` および `GET /internal/users/:username` の各表示形式で共通です。

| フィールド | 型 | 内容 |
| --- | --- | --- |
| `class_emblem` | `string \| null` | 解決済みのクラスエンブレムのマスタ名 |
| `class_emblem_base` | `string \| null` | 解決済みのクラスエンブレムベースのマスタ名 |

値は `"1"`〜`"5"`、`"inf"` の文字列です。未設定または解決不能の場合は `null` です。内部APIの `PlayerDTO` に `class_emblem_id` と `class_emblem_base_id` は含まれません。

プロフィール取得結果はマスタで再解決せず、そのまま扱います。プロフィールは永続キャッシュに保存しません。

スコア登録結果および保存済み更新結果の `profile` は別契約の `PlayerDataProfile` です。こちらは `class_emblem_id` と `class_emblem_base_id` を数値または `null` で返します。

外部API v1のプロフィールには、解決済みの2項目に加えて数値IDも含まれます。フロントエンドの `PlayerDTO` は内部API専用です。
