# IndexedDB キャッシュ導入のざっくり案

## 目的

ステージング環境や将来の本番環境で、API サーバーと DB の負荷が高くなった場合でも、画面表示の体感速度を落としにくくするため、フロントエンド側に IndexedDB ベースのキャッシュ基盤を用意する。

特に、レスポンスサイズや処理負荷が大きくなりやすい以下を優先候補とする。

- 楽曲全取得 API
- ユーザーレコード API
- プロフィール系データ
- 通常レコード画面のフィルター・列設定などのユーザー設定

## 背景

現在は、楽曲一覧やユーザーレコードを API から直接取得している。ステージングでは 1 コア 1GB のサーバーに API と DB を同居させているため、重い API の読み込みが遅く感じられることがある。

本番でも利用者が増えた場合、同様の負荷問題が起きる可能性がある。そのため、データが変わっていない場合は IndexedDB に保存したローカルデータを使い、変わっている場合だけサーバーから取り直す構成を検討する。

## 基本方針

- localStorage ではなく IndexedDB を使う。
- IndexedDB への直接アクセスはコンポーネントへ持ち込まない。
- IndexedDB 操作は repository / infra 層へ閉じ込める。
- 画面や API 呼び出し側からは、原則として「最新データを取得する」ユースケースだけを呼ぶ。
- キャッシュ判定には、サーバー側の最終更新日時を使う。
- キャッシュデータには、サーバーデータの最終更新日時とは別に、フロント側の schemaVersion も持たせる。
- キャッシュの読み込みや保存に失敗しても、画面操作自体は壊さない。

## ライブラリ候補

### Dexie

IndexedDB をローカル DB として扱いやすくするラッパー。テーブル定義、インデックス、マイグレーション、検索、メタデータ管理が読みやすくなる。

今回のように、楽曲・ユーザーレコード・プロフィール・画面設定など、保存対象が増える見込みがある場合は Dexie が有力候補。

### idb

IndexedDB に近い薄い Promise ベースのラッパー。API レスポンスを key-value 的に丸ごと保存するだけなら十分。

保存対象が少なく、IndexedDB を単なる永続キャッシュ置き場として扱うなら idb でもよい。

### 現時点の推奨

現時点では Dexie 寄りで検討する。

理由は、単なる「最新の一件の設定保存」ではなく、楽曲データやユーザーレコードを含むキャッシュ基盤として育てる可能性が高いため。Dexie を使う場合でも、アプリ全体に Dexie 依存を広げず、repository 層へ閉じ込める。

## キャッシュ判定の考え方

### 楽曲データ

1. IndexedDB から楽曲キャッシュのメタデータを読む。
2. サーバーから楽曲データの最終更新日時だけを取得する。
3. ローカルの `dataUpdatedAt` とサーバーの `updatedAt` が一致すれば IndexedDB の楽曲データを返す。
4. 一致しなければ楽曲全取得 API を呼ぶ。
5. 取得した楽曲データとメタデータを IndexedDB に保存する。
6. API から取得したデータを返す。

### ユーザーレコード

1. `username`、`includeNoPlay`、schemaVersion などから cacheKey を作る。
2. IndexedDB からユーザーレコードキャッシュのメタデータを読む。
3. サーバーから対象ユーザーのレコード最終更新日時だけを取得する。
4. ローカルの `dataUpdatedAt` とサーバーの `updatedAt` が一致すれば IndexedDB のレコードを返す。
5. 一致しなければユーザーレコード API を呼ぶ。
6. 取得したレコードとメタデータを IndexedDB に保存する。
7. API から取得したデータを返す。

## API 側に欲しいもの

### 最小案

- `GET /internal/songs/last-modified`
- `GET /internal/users/{username}/record/last-modified?include_noplay=true`

### まとめて取得する案

画面表示時のリクエスト数を減らすため、将来的には cache manifest API も検討する。

例:

```txt
GET /internal/cache-manifest?username={username}&include_noplay=true
```

返却イメージ:

```json
{
  "songs": {
    "updated_at": "2026-06-16T10:00:00Z"
  },
  "user_record": {
    "username": "example",
    "include_noplay": true,
    "updated_at": "2026-06-16T10:03:00Z"
  }
}
```

## Dexie を使う場合の保存構造案

### 最小構成

まずは `cacheEntries` のような汎用 store を使い、API レスポンス単位で丸ごと保存する。

```ts
type CacheEntry<T> = {
  key: string
  kind: 'songs' | 'userRecord' | 'userProfile' | 'userRecordViewSettings'
  dataUpdatedAt: string
  fetchedAt: string
  schemaVersion: number
  data: T
}
```

Dexie schema のイメージ:

```ts
db.version(1).stores({
  cacheEntries: '&key, kind, dataUpdatedAt, fetchedAt',
})
```

### store 分割案

保存対象や検索要件が増えたら、以下のような store 分割も検討する。

```txt
songs
songCacheMetadata
userRecords
userProfiles
viewSettings
cacheMetadata
```

ただし、最初から 1 曲単位・1 レコード単位に分割しすぎると既存コードへの影響が大きくなる。楽曲全取得 API やユーザーレコード API は、まず API レスポンスを丸ごと保存する方が導入しやすい。

## fetch 処理との接続案

既存の API 呼び出し箇所を大きく変えないため、外部から見える関数名は維持しつつ、内部でキャッシュ付きユースケースへ委譲する。

例:

```ts
export const fetchAllSongs = async (): Promise<{ songs: SongDTO[] }> => {
  return getAllSongsWithCache()
}
```

内部構成のイメージ:

```txt
UI / createResource
  ↓
getAllSongsWithCache
  ↓
remote API repository
  ↓
local IndexedDB repository
```

API 通信、キャッシュ判定、IndexedDB 操作を 1 つの関数に詰め込まない。

## ユーザー設定の保存

通常レコード画面のフィルターと列設定も IndexedDB に保存する候補とする。

保存対象の例:

```ts
type UserRecordViewSettings = {
  schemaVersion: number
  filter: FilterState
  visibleColumnIds: RecordColumnId[]
  savedAt: string
}
```

復元時には以下を必ず行う。

- フィルターは現行スキーマへ正規化する。
- 列 ID は存在する列だけに補正する。
- 壊れた保存値や schemaVersion の不一致は安全に破棄する。

## 未確定事項

- Dexie を採用するか、idb に留めるか。
- cache manifest API を作るか、種別ごとの last-modified API にするか。
- ユーザーレコードのキャッシュ対象を自分のデータだけにするか、他人のデータも対象にするか。
- ログアウト時に自分のレコードキャッシュを削除するか。
- API の最終更新日時取得に失敗した場合、古いキャッシュを表示してよいか。
- 古いキャッシュを表示する場合、画面上に警告を出すか。
- 楽曲データを API レスポンス丸ごとで保存し続けるか、将来的に 1 曲単位の store に分けるか。
- ユーザーレコードを丸ごと保存するか、譜面単位で分割するか。
- キャッシュ容量の上限や削除ポリシーをどうするか。
- 管理者向け・編集者向け API の結果をキャッシュ対象に含めるか。
- IndexedDB が使えない環境での fallback をどうするか。

## 実装時の注意

- キャッシュ読み込み・保存処理は TDD で進める。
- IndexedDB の実装詳細は repository 層に閉じ込める。
- キャッシュ判定のロジックはコンポーネントに置かない。
- API レスポンスの型変更に備えて schemaVersion を必ず持たせる。
- `includeNoPlay` など、API レスポンスに影響する条件は cacheKey に含める。
- private browsing、容量不足、IndexedDB 破損などで保存に失敗しても画面を止めない。
- キャッシュが古い可能性がある状態を内部的に表現できるようにする。
- 画面設定の保存では、初期化直後にデフォルト値で保存済み設定を上書きしないようにする。

## 最初に作る候補

1. IndexedDB / Dexie の DB 定義。
2. `cacheEntries` repository。
3. 通常レコード画面のフィルター・列設定保存。
4. 楽曲全取得 API のキャッシュ。
5. ユーザーレコード API のキャッシュ。
6. last-modified API または cache manifest API との接続。

