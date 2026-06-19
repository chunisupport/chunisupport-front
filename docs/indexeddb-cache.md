# IndexedDB キャッシュ

このドキュメントは、フロントエンドが IndexedDB を使って API レスポンスをローカルキャッシュする仕組みをまとめたものです。
基準実装は `src/lib/db/cacheDB.ts`、`src/repositories/`、`src/usecases/cache/` です。

画面設定（現在適用中のフィルター・列表示設定）の永続化も同じ IndexedDB に保存しますが、仕様の詳細は [レコードフィルター・列表示設定](./record-filter-and-columns.md) を参照してください。

## 目的

API サーバーと DB の負荷が高くなった場合でも、画面表示の体感速度を落としにくくするため、フロントエンド側に IndexedDB ベースのキャッシュ基盤を用意しています。

主な対象は以下です。

- 通常楽曲一覧 API（`GET /internal/songs`）
- WORLD'S END 楽曲一覧 API（`GET /internal/worldsend-songs`）
- ログインユーザー本人のレーティング API（`GET /internal/users/{username}/rating`）
- ログインユーザー本人のレコード API（`GET /internal/users/{username}/record?include_noplay=true`）

## 基本方針

- **Dexie** を IndexedDB ラッパーとして採用する。
- localStorage は API キャッシュには使わない。容量・構造化・将来の拡張性の観点で IndexedDB に寄せる。
- IndexedDB 操作は `src/lib/db/`（DB 定義）と `src/repositories/`（IndexedDB 操作）に閉じ込める。
- API 呼び出しとキャッシュ判定は `src/usecases/cache/` に置く。コンポーネントや `createResource` の fetcher から IndexedDB を直接触らない。
- **SWR（Stale-While-Revalidate）パターンは採用しない。** キャッシュが有効なら API 本体を呼ばずにキャッシュを返す。キャッシュが無効なら API 本体を呼んで最新データを返す。古いデータを先に表示して後から差し替える挙動は入れない。
- キャッシュ判定には、既存 API の `updated-at` を使う。
- `updated-at` 取得に失敗した場合、古いキャッシュは表示せず、通常どおり本 API を呼ぶ。
- キャッシュデータにはアプリ内の `schemaVersion`（`CLIENT_CACHE_SCHEMA_VERSION`）を持たせ、フロント側のデータ構造変更時に古いキャッシュを破棄できるようにする。
- `schemaVersion` 不一致時や Dexie の DB スキーマ移行で整合性が取りにくい場合は、IndexedDB 全体をクリアしてよい。
- IndexedDB の読み込みや保存に失敗しても画面操作自体は壊さない。常に API 直呼び出しにフォールバックする。
- ユーザー系キャッシュはログインユーザー本人のみ保存する。他人のユーザーページは API 直呼び出しにする。
- ログアウト時・退会時は IndexedDB の全データを削除する。
- `updated-at` 以外の明示的なキャッシュ無効化ロジックは現時点では持たない。

## 採用ライブラリ: Dexie

IndexedDB をローカル DB として扱いやすくするラッパーです。テーブル定義、インデックス、マイグレーション、検索が読みやすくなります。

楽曲・ユーザー API レスポンス・画面設定など保存対象が複数種類にわたるため、idb のような薄いラッパーではなく Dexie を選択しています。Dexie への依存は `src/lib/db/` と `src/repositories/` に閉じ込め、アプリ全体には広げません。

テスト時は `fake-indexeddb` を併用します。

## 既存 API の前提

API 側にはキャッシュ判定用の `updated-at` エンドポイントが存在します。

| 用途 | エンドポイント | レスポンス |
| ---- | -------------- | ---------- |
| 楽曲更新判定 | `GET /internal/songs/updated-at` | `{ updated_at: string \| null }` |
| ユーザー更新判定 | `GET /internal/users/{username}/updated-at` | `{ updated_at: string \| null }` |

`GET /internal/songs/updated-at` は `songs`, `charts`, `worldsend_charts` の `updated_at` 最大値を返します。そのため、通常楽曲と WORLD'S END 楽曲の共通更新判定として使います。

`GET /internal/users/{username}/updated-at` は、プロフィール更新日時と通常/WORLD'S END レコード更新日時の最大値を返します。レコード専用の更新判定ではないが、現行実装では複雑さを減らすためこの API を使います。

レーティング API は、ホームやマイページ初期表示で高速に読み込むためにレコード API と分離されています。IndexedDB キャッシュ導入後も、レーティング表示のために重いレコード API から導出することはしません。

## キャッシュ対象と保存粒度

| 対象 | 保存粒度 | 更新判定 |
| ---- | -------- | -------- |
| 通常楽曲一覧 | 1曲単位（`display_id -> SongDTO`） | `songsUpdatedAt` |
| WORLD'S END 楽曲一覧 | 1曲単位（`display_id -> WorldsendSongDTO`） | `songsUpdatedAt` |
| ログインユーザー本人のレーティング | `UserRatingDTO` 丸ごと | `userUpdatedAt` + `songsUpdatedAt` |
| ログインユーザー本人のレコード | `UserRecordDTO` 丸ごと | `userUpdatedAt` + `songsUpdatedAt` |

楽曲は、楽曲一覧だけでなく楽曲詳細でも個別参照する場面があるため、1曲単位で保存します。ただし現行実装では差分取得 API は使わず、キャッシュミス時は全件 API を取得して IndexedDB 内の対象 store を入れ替えます。API レスポンスの配列順を復元するため、各エントリに `sortOrder` を付与して保存します。

レーティングとレコードは、画面側で全体レスポンスとして利用するため DTO 丸ごと保存します。レコード画面、OVER POWER、目標画面はいずれもレコード全体を使うため、レコードを譜面単位に分割するメリットは現時点では小さいです。

ユーザーレコードキャッシュは `include_noplay=true` を前提とし、`userRecord` として固定キーに保存します。`include_noplay=false` のレコードキャッシュは持ちません。

## IndexedDB の DB 設計

### DB 名

```txt
ChuniSupportCache
```

定数 `CLIENT_CACHE_DB_NAME` として定義されています。ログアウト時、またはスキーマ不整合時はこの DB の全データを削除してよいです。

### ストア一覧

| ストア名 | 主キー | 役割 |
| -------- | ------ | ---- |
| `cacheMetadata` | `key` | キャッシュ種別ごとの更新日時・schemaVersion を保存する |
| `songs` | `id` | 通常楽曲を1曲単位で保存する |
| `worldsendSongs` | `id` | WORLD'S END 楽曲を1曲単位で保存する |
| `userApiResponses` | `key` | ログインユーザー本人の rating / record API レスポンスを丸ごと保存する |
| `viewSettings` | `key` | 現在適用中フィルター・現在適用中列表示設定を保存する（詳細は別ドキュメント） |

### TypeScript 型

`src/lib/db/cacheDB.ts` で以下の型を定義しています。

- `CacheMetadata` — 楽曲キャッシュのメタデータ（`songs`, `worldsendSongs`）
- `CachedSong` / `CachedWorldsendSong` — `id`, `sortOrder`, `data` を持つ楽曲エントリ
- `UserApiResponse` — `userRating` / `userRecord` の API レスポンス（`username` フィールドを含む）
- `ViewSetting` — 画面設定（フィルター・列表示）

現行の `CLIENT_CACHE_SCHEMA_VERSION` は `1` です。

### IndexedDB に保存されるデータ例

通常楽曲は `songs` store に1曲ずつ保存されます。

```ts
{
  id: 'song_display_id',
  sortOrder: 0,
  data: {
    id: 'song_display_id',
    title: '曲名',
    artist: 'アーティスト名',
    genre: 'POPS & ANIME',
    bpm: 180,
    release: '2026-01-01',
    jacket: '...',
    charts: {
      BASIC: { const: 3, is_const_unknown: false, notes: 300, notes_designer: null },
      ADVANCED: { const: 7, is_const_unknown: false, notes: 600, notes_designer: null },
      EXPERT: { const: 10, is_const_unknown: false, notes: 900, notes_designer: null },
      MASTER: { const: 13.5, is_const_unknown: false, notes: 1200, notes_designer: null }
    }
  }
}
```

レーティングは `userApiResponses` store に DTO 丸ごと保存されます。

```ts
{
  key: 'userRating',
  username: 'example_user',
  schemaVersion: 1,
  userUpdatedAt: '2026-06-16T12:00:00Z',
  songsUpdatedAt: '2026-06-16T11:30:00Z',
  fetchedAt: '2026-06-16T12:01:00Z',
  data: {
    best: [],
    best_candidate: [],
    new: [],
    new_candidate: [],
    meta: {
      updated_at: '2026-06-16T12:00:00Z'
    }
  }
}
```

レコードも `userApiResponses` store に DTO 丸ごと保存されます。

```ts
{
  key: 'userRecord',
  username: 'example_user',
  schemaVersion: 1,
  userUpdatedAt: '2026-06-16T12:00:00Z',
  songsUpdatedAt: '2026-06-16T11:30:00Z',
  fetchedAt: '2026-06-16T12:01:00Z',
  data: {
    standard: [],
    worldsend: [],
    meta: {
      updated_at: '2026-06-16T12:00:00Z'
    }
  }
}
```

## キャッシュ判定の流れ

### 楽曲データ

通常楽曲と WORLD'S END 楽曲は、共通で `GET /internal/songs/updated-at` を使います。

```
1. GET /internal/songs/updated-at を呼び、songsUpdatedAt を取得する。
2. cacheMetadata.songs または cacheMetadata.worldsendSongs を読む。
3. songsUpdatedAt と schemaVersion が一致し、対象 store にデータがあればキャッシュを返す。
4. 不一致なら本 API を呼ぶ。
5. 本 API の取得結果で対象 store を入れ替え、metadata を保存し、API 結果を返す。
6. IndexedDB 操作に失敗した場合は、本 API の結果だけを返す。
```

通常楽曲:

- 判定 API: `GET /internal/songs/updated-at`
- 本 API: `GET /internal/songs`
- 保存先: `songs`
- metadata key: `songs`

WORLD'S END 楽曲:

- 判定 API: `GET /internal/songs/updated-at`
- 本 API: `GET /internal/worldsend-songs`
- 保存先: `worldsendSongs`
- metadata key: `worldsendSongs`

### レーティング

```
1. ログインユーザー本人のページか判定する。本人以外なら API 直呼び出し。
2. GET /internal/users/{username}/updated-at を呼び、userUpdatedAt を取得する。
3. GET /internal/songs/updated-at を呼び、songsUpdatedAt を取得する。
4. userApiResponses.userRating を読む。
5. username, userUpdatedAt, songsUpdatedAt, schemaVersion がすべて一致すればキャッシュを返す。
6. 不一致なら GET /internal/users/{username}/rating を呼ぶ。
7. API レスポンスを userApiResponses.userRating に丸ごと保存し、API 結果を返す。
8. updated-at 取得または IndexedDB 操作に失敗した場合は、本 API を呼ぶ。
```

`songsUpdatedAt` も見る理由は、レーティングレスポンスに楽曲タイトルや譜面定数など楽曲メタ情報が含まれるためです。

### レコード

```
1. ログインユーザー本人のページか判定する。本人以外なら API 直呼び出し。
2. GET /internal/users/{username}/updated-at を呼び、userUpdatedAt を取得する。
3. GET /internal/songs/updated-at を呼び、songsUpdatedAt を取得する。
4. userApiResponses.userRecord を読む。
5. username, userUpdatedAt, songsUpdatedAt, schemaVersion がすべて一致すればキャッシュを返す。
6. 不一致なら GET /internal/users/{username}/record?include_noplay=true を呼ぶ。
7. API レスポンスを userApiResponses.userRecord に丸ごと保存し、API 結果を返す。
8. updated-at 取得または IndexedDB 操作に失敗した場合は、本 API を呼ぶ。
```

`songsUpdatedAt` も見る理由は、`include_noplay=true` の未プレイ補完が楽曲・譜面一覧に依存するためです。ユーザーレコード自体が変わらなくても、新曲追加や譜面更新でレスポンス内容が変わります。

## ディレクトリ構成

```txt
src/
├── lib/
│   └── db/
│       └── cacheDB.ts
├── repositories/
│   ├── songCacheRepository.ts
│   ├── userApiCacheRepository.ts
│   └── viewSettingsRepository.ts
└── usecases/
    └── cache/
        ├── fetchAllSongsWithCache.ts
        ├── fetchWorldsendSongsWithCache.ts
        ├── fetchUserRatingWithCache.ts
        ├── fetchUserRecordWithCache.ts
        ├── userApiCache.ts
        └── clearClientCache.ts
```

責務は以下のように分けています。

- `src/lib/db/cacheDB.ts`: Dexie インスタンス、ストア定義、DB バージョン管理。
- `src/repositories/*`: IndexedDB の読み書きのみ。
- `src/usecases/cache/*`: `updated-at` 判定、API 呼び出し、フォールバック制御。
- コンポーネント: `createResource` の fetcher を usecase に差し替えるだけにする。

## 既存コードとの統合

### 楽曲ストア

`src/stores/songsData.ts` の `fetchAllSongs` / `fetchWorldsendSongs` を、キャッシュ対応 usecase に差し替えています。

### ユーザーページ

`src/pages/users/UserPage/UserPage.tsx` では、以下をキャッシュ対応 usecase に差し替えています。

- `fetchUserRating(username)` → `fetchUserRatingWithCache(username)`
- `fetchUserRecord(username, { includeNoPlay: true })` → `fetchUserRecordWithCache(username)`

ログインユーザー本人以外の username が指定された場合、usecase 内で API 直呼び出しにします。

### レコード画面・OVER POWER・目標画面

既存の `UserRecordDTO` を受け取る構造は変えていません。キャッシュヒット時も API レスポンスと同じ DTO を返すため、コンポーネント側のデータ構造変更は不要です。

目標画面（`src/pages/goals/GoalsList/GoalsList.tsx`）でも `fetchAllSongsWithCache` と `fetchUserRecordWithCache` を利用しています。

## ログアウト時の削除

ログアウト時・退会時は `clearClientCache()` で IndexedDB の全 store をクリアします。

```ts
await clearClientCache()
```

呼び出し元は `src/components/NavBar/NavBar.tsx`（ログアウト）と `src/pages/settings/Settings.tsx`（退会）です。`viewSettings` を含むすべての store が対象です。

## 実装時の注意

- キャッシュ読み込み・保存処理は TDD で進めています。テストには `fake-indexeddb` を使用します。
- IndexedDB の実装詳細は `src/lib/db/` と `src/repositories/` に閉じ込めます。
- キャッシュ判定のロジックはコンポーネントに置きません。
- API レスポンスの型変更に備えて `schemaVersion` を必ず持たせます。
- private browsing、容量不足、IndexedDB 破損などで保存に失敗しても画面を止めず、API 直呼び出しにフォールバックします。
- Dexie のバージョンアップ（マイグレーション）は `db.version(n).stores()` で管理します。古いスキーマのデータは破棄してよいです。
- 難易度文字列は既存ルールどおり `BASIC`, `ADVANCED`, `EXPERT`, `MASTER`, `ULTIMA` の大文字を維持します。

## 将来検討

- `GET /internal/users/{username}/record/updated-at` を追加し、プロフィール更新だけでレコードキャッシュが無効化されないようにする。
- `GET /internal/cache-manifest` のような manifest API を追加し、`songsUpdatedAt` と `userUpdatedAt` を 1 リクエストで取得する。
- 楽曲差分取得 API を追加し、`songs` / `worldsendSongs` store を差分更新できるようにする。
- 楽曲詳細 API を `songs` / `worldsendSongs` store から返せるようにする。
- `fetchMasterData` や `fetchVersions` を IndexedDB キャッシュ対象に含める。
- rating API の DB 負荷が十分下がらない場合、rating 専用のより軽量な更新判定 API を検討する。