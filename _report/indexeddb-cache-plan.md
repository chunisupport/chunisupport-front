# IndexedDB キャッシュ導入計画

## 目的

API サーバーと DB の負荷が高くなった場合でも、画面表示の体感速度を落としにくくするため、フロントエンド側に IndexedDB ベースのキャッシュ基盤を用意する。

主な対象は以下とする。

- 通常楽曲一覧 API（`GET /internal/songs`）
- WORLD'S END 楽曲一覧 API（`GET /internal/worldsend-songs`）
- ログインユーザー本人のレーティング API（`GET /internal/users/{username}/rating`）
- ログインユーザー本人のレコード API（`GET /internal/users/{username}/record?include_noplay=true`）
- 通常レコード画面・WORLD'S END レコード画面の現在適用中フィルター
- 通常レコード画面・WORLD'S END レコード画面の現在適用中列表示設定

## 背景

現在は楽曲一覧、レーティング、ユーザーレコードを API から毎回直接取得している。ステージングでは 1 コア 1GB のサーバーに API と DB を同居させているため、重い API の読み込みが遅く感じられることがある。

本番でも利用者が増えた場合、同様の負荷問題が起きる可能性がある。データが変わっていない場合は IndexedDB のローカルデータを使い、変わっている場合だけサーバーから取り直す構成を導入する。

レーティング API は、ホームやマイページ初期表示で高速に読み込むためにレコード API と分離されている。IndexedDB キャッシュ導入後も、レーティング表示のために重いレコード API から導出することはしない。

## 基本方針

- **Dexie** を IndexedDB ラッパーとして採用する。
- localStorage は使わない。容量・構造化・将来の拡張性の観点で IndexedDB に寄せる。
- IndexedDB 操作は `src/lib/db/`（DB 定義）と `src/repositories/`（IndexedDB 操作）に閉じ込める。
- API 呼び出しとキャッシュ判定は `src/usecases/` に置く。コンポーネントや `createResource` の fetcher から IndexedDB を直接触らない。
- **SWR（Stale-While-Revalidate）パターンは採用しない。** キャッシュが有効なら API 本体を呼ばずにキャッシュを返す。キャッシュが無効なら API 本体を呼んで最新データを返す。古いデータを先に表示して後から差し替える挙動は入れない。
- キャッシュ判定には、既存 API の `updated-at` を使う。
- `updated-at` 取得に失敗した場合、古いキャッシュは表示せず、通常どおり本 API を呼ぶ。
- キャッシュデータにはアプリ内の `schemaVersion` を持たせ、フロント側のデータ構造変更時に古いキャッシュを破棄できるようにする。
- `schemaVersion` 不一致時や Dexie の DB スキーマ移行で整合性が取りにくい場合は、IndexedDB 全体をクリアしてよい。
- IndexedDB の読み込みや保存に失敗しても画面操作自体は壊さない。常に API 直呼び出しにフォールバックする。
- ユーザー系キャッシュはログインユーザー本人のみ保存する。他人のユーザーページは API 直呼び出しにする。
- ログアウト時は IndexedDB の全データを削除する。
- `updated-at` 以外の明示的なキャッシュ無効化ロジックは初回実装では持たない。

## 採用ライブラリ: Dexie

IndexedDB をローカル DB として扱いやすくするラッパー。テーブル定義、インデックス、マイグレーション、検索が読みやすくなる。

楽曲・ユーザー API レスポンス・画面設定など保存対象が複数種類にわたるため、idb のような薄いラッパーではなく Dexie を選択する。Dexie への依存は `src/lib/db/` と `src/repositories/` に閉じ込め、アプリ全体には広げない。

テスト時は `fake-indexeddb` を併用する。

## 既存 API の前提

API 側にはキャッシュ判定用の `updated-at` エンドポイントが既に存在する。

| 用途 | エンドポイント | レスポンス |
| ---- | -------------- | ---------- |
| 楽曲更新判定 | `GET /internal/songs/updated-at` | `{ updated_at: string \| null }` |
| ユーザー更新判定 | `GET /internal/users/{username}/updated-at` | `{ updated_at: string \| null }` |

`GET /internal/songs/updated-at` は `songs`, `charts`, `worldsend_charts` の `updated_at` 最大値を返す。そのため、通常楽曲と WORLD'S END 楽曲の共通更新判定として使う。

`GET /internal/users/{username}/updated-at` は、プロフィール更新日時と通常/WORLD'S END レコード更新日時の最大値を返す。レコード専用の更新判定ではないが、初回実装では複雑さを減らすためこの API を使う。

## キャッシュ対象と保存粒度

| 対象 | 保存粒度 | 更新判定 |
| ---- | -------- | -------- |
| 通常楽曲一覧 | 1曲単位（`display_id -> SongDTO`） | `songsUpdatedAt` |
| WORLD'S END 楽曲一覧 | 1曲単位（`display_id -> WorldsendSongDTO`） | `songsUpdatedAt` |
| ログインユーザー本人のレーティング | `UserRatingDTO` 丸ごと | `userUpdatedAt` + `songsUpdatedAt` |
| ログインユーザー本人のレコード | `UserRecordDTO` 丸ごと | `userUpdatedAt` + `songsUpdatedAt` |
| 現在適用中の通常レコードフィルター | `FilterState` 丸ごと | `schemaVersion` |
| 現在適用中の通常レコード列表示設定 | `RecordColumnId[]` 丸ごと | `schemaVersion` |
| 現在適用中の WORLD'S END フィルター | `WorldsendFilterState` 丸ごと | `schemaVersion` |
| 現在適用中の WORLD'S END 列表示設定 | `WorldsendRecordColumnId[]` 丸ごと | `schemaVersion` |

楽曲は、楽曲一覧だけでなく楽曲詳細でも個別参照する場面があるため、1曲単位で保存する。ただし初回実装では差分取得 API は使わず、キャッシュミス時は全件 API を取得して IndexedDB 内の対象 store を入れ替える。

レーティングとレコードは、画面側で全体レスポンスとして利用するため DTO 丸ごと保存する。レコード画面、OVER POWER、目標画面はいずれもレコード全体を使うため、レコードを譜面単位に分割するメリットは初回実装では小さい。

## IndexedDB の DB 設計

### DB 名

```txt
ChuniSupportCache
```

ログアウト時、またはスキーマ不整合時はこの DB の全データを削除してよい。

### ストア一覧

| ストア名 | 主キー | 役割 |
| -------- | ------ | ---- |
| `cacheMetadata` | `key` | キャッシュ種別ごとの更新日時・schemaVersion を保存する |
| `songs` | `id` | 通常楽曲を1曲単位で保存する |
| `worldsendSongs` | `id` | WORLD'S END 楽曲を1曲単位で保存する |
| `userApiResponses` | `key` | ログインユーザー本人の rating / record API レスポンスを丸ごと保存する |
| `viewSettings` | `key` | 現在適用中フィルター・現在適用中列表示設定を保存する |

### TypeScript 型イメージ

```ts
import Dexie, { type EntityTable } from 'dexie'
import type {
  SongDTO,
  UserRatingDTO,
  UserRecordDTO,
  WorldsendSongDTO,
} from '../../types/api'
import type { RecordColumnId } from '../../pages/users/UserRecord/types/types'
import type { FilterState } from '../../pages/users/UserRecord/types/types'
import type { WorldsendFilterState } from '../../pages/users/WorldsendRecord/types/filterTypes'
import type { WorldsendRecordColumnId } from '../../pages/users/WorldsendRecord/utils/columns'

type CacheMetadataKey =
  | 'songs'
  | 'worldsendSongs'
  | 'userRating'
  | 'userRecord'
  | 'standardRecordFilter'
  | 'standardRecordColumns'
  | 'worldsendRecordFilter'
  | 'worldsendRecordColumns'

type CacheMetadata = {
  key: CacheMetadataKey
  schemaVersion: number
  songsUpdatedAt?: string | null
  userUpdatedAt?: string | null
  fetchedAt?: string
  savedAt?: string
}

type CachedSong = {
  id: string
  data: SongDTO
}

type CachedWorldsendSong = {
  id: string
  data: WorldsendSongDTO
}

type UserApiResponse =
  | {
      key: 'userRating'
      schemaVersion: number
      userUpdatedAt: string | null
      songsUpdatedAt: string | null
      fetchedAt: string
      data: UserRatingDTO
    }
  | {
      key: 'userRecord'
      schemaVersion: number
      userUpdatedAt: string | null
      songsUpdatedAt: string | null
      fetchedAt: string
      data: UserRecordDTO
    }

type ViewSetting =
  | {
      key: 'standardRecordFilter'
      schemaVersion: number
      savedAt: string
      data: FilterState
    }
  | {
      key: 'standardRecordColumns'
      schemaVersion: number
      savedAt: string
      data: RecordColumnId[]
    }
  | {
      key: 'worldsendRecordFilter'
      schemaVersion: number
      savedAt: string
      data: WorldsendFilterState
    }
  | {
      key: 'worldsendRecordColumns'
      schemaVersion: number
      savedAt: string
      data: WorldsendRecordColumnId[]
    }

const db = new Dexie('ChuniSupportCache') as Dexie & {
  cacheMetadata: EntityTable<CacheMetadata, 'key'>
  songs: EntityTable<CachedSong, 'id'>
  worldsendSongs: EntityTable<CachedWorldsendSong, 'id'>
  userApiResponses: EntityTable<UserApiResponse, 'key'>
  viewSettings: EntityTable<ViewSetting, 'key'>
}

db.version(1).stores({
  cacheMetadata: 'key, schemaVersion, songsUpdatedAt, userUpdatedAt, fetchedAt, savedAt',
  songs: 'id',
  worldsendSongs: 'id',
  userApiResponses: 'key, schemaVersion, userUpdatedAt, songsUpdatedAt, fetchedAt',
  viewSettings: 'key, schemaVersion, savedAt',
})

export { db }
export type {
  CachedSong,
  CachedWorldsendSong,
  CacheMetadata,
  UserApiResponse,
  ViewSetting,
}
```

### IndexedDB に保存されるデータ例

通常楽曲は `songs` store に1曲ずつ保存される。

```ts
{
  id: 'song_display_id',
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

レーティングは `userApiResponses` store に DTO 丸ごと保存される。

```ts
{
  key: 'userRating',
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

レコードも `userApiResponses` store に DTO 丸ごと保存される。

```ts
{
  key: 'userRecord',
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

画面設定は `viewSettings` store に、現在適用中の値として保存される。

```ts
{
  key: 'standardRecordColumns',
  schemaVersion: 1,
  savedAt: '2026-06-16T12:01:00Z',
  data: ['title', 'difficulty', 'score', 'rating', 'overpower']
}
```

## キャッシュ判定の流れ

### 楽曲データ

通常楽曲と WORLD'S END 楽曲は、共通で `GET /internal/songs/updated-at` を使う。

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
5. userUpdatedAt, songsUpdatedAt, schemaVersion がすべて一致すればキャッシュを返す。
6. 不一致なら GET /internal/users/{username}/rating を呼ぶ。
7. API レスポンスを userApiResponses.userRating に丸ごと保存し、API 結果を返す。
8. updated-at 取得または IndexedDB 操作に失敗した場合は、本 API を呼ぶ。
```

`songsUpdatedAt` も見る理由は、レーティングレスポンスに楽曲タイトルや譜面定数など楽曲メタ情報が含まれるため。

### レコード

```
1. ログインユーザー本人のページか判定する。本人以外なら API 直呼び出し。
2. GET /internal/users/{username}/updated-at を呼び、userUpdatedAt を取得する。
3. GET /internal/songs/updated-at を呼び、songsUpdatedAt を取得する。
4. userApiResponses.userRecord を読む。
5. userUpdatedAt, songsUpdatedAt, schemaVersion がすべて一致すればキャッシュを返す。
6. 不一致なら GET /internal/users/{username}/record?include_noplay=true を呼ぶ。
7. API レスポンスを userApiResponses.userRecord に丸ごと保存し、API 結果を返す。
8. updated-at 取得または IndexedDB 操作に失敗した場合は、本 API を呼ぶ。
```

`songsUpdatedAt` も見る理由は、`include_noplay=true` の未プレイ補完が楽曲・譜面一覧に依存するため。ユーザーレコード自体が変わらなくても、新曲追加や譜面更新でレスポンス内容が変わる。

## viewSettings の永続化

通常レコード画面と WORLD'S END レコード画面の以下を IndexedDB に保存し、画面リロード後も復元できるようにする。

| 保存対象 | 保存タイミング | 保存先 |
| -------- | -------------- | ------ |
| 現在適用中の通常レコードフィルター | ダイアログ適用時 | `viewSettings.standardRecordFilter` |
| 現在適用中の通常レコード列表示設定 | ダイアログ適用時 | `viewSettings.standardRecordColumns` |
| 現在適用中の WORLD'S END フィルター | ダイアログ適用時 | `viewSettings.worldsendRecordFilter` |
| 現在適用中の WORLD'S END 列表示設定 | ダイアログ適用時 | `viewSettings.worldsendRecordColumns` |

> 注意: `src/api/recordFilters.ts` の「保存済みフィルター」はサーバー側の名前付きプリセット機能であり、これとは別物。本計画で永続化するのは、画面に現在適用中のフィルター状態と列表示設定である。サーバー側の保存済みフィルター機能は今後も維持する。

### 保存・復元のルール

- 保存はダイアログの「適用」時に行う。
- 初期表示時、IndexedDB に保存があればそれを復元する。
- 保存がない、または `schemaVersion` 不一致の場合はデフォルト値を使用する。
- 壊れた保存値は安全に破棄し、デフォルト値にフォールバックする。
- 初期化直後にデフォルト値で保存済み設定を上書きしないよう、復元処理と保存処理を分離する。
- URL クエリのソート条件は初回対象外とする。URL クエリ周りは今後作り直す可能性があるため、IndexedDB 設定とは連動させない。

## ディレクトリ構成（追加分）

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
        └── clearClientCache.ts
```

責務は以下のように分ける。

- `src/lib/db/cacheDB.ts`: Dexie インスタンス、ストア定義、DB バージョン管理。
- `src/repositories/*`: IndexedDB の読み書きのみ。
- `src/usecases/cache/*`: `updated-at` 判定、API 呼び出し、フォールバック制御。
- コンポーネント: `createResource` の fetcher を usecase に差し替えるだけにする。

## 既存コードとの統合方針

### 楽曲ストア

`src/stores/songsData.ts` の `fetchAllSongs` / `fetchWorldsendSongs` を、キャッシュ対応 usecase に差し替える。

```ts
import { fetchAllSongsWithCache } from '../usecases/cache/fetchAllSongsWithCache'
import { fetchWorldsendSongsWithCache } from '../usecases/cache/fetchWorldsendSongsWithCache'
```

### ユーザーページ

`src/pages/users/UserPage/UserPage.tsx` では、以下をキャッシュ対応 usecase に差し替える。

- `fetchUserRating(username)` → `fetchUserRatingWithCache(username)`
- `fetchUserRecord(username, { includeNoPlay: true })` → `fetchUserRecordWithCache(username)`

ただし、ログインユーザー本人以外の username が指定された場合、usecase 内で API 直呼び出しにする。

### レコード画面・OVER POWER・目標画面

既存の `UserRecordDTO` を受け取る構造は変えない。キャッシュヒット時も API レスポンスと同じ DTO を返すため、コンポーネント側のデータ構造変更は不要。

## ログアウト時の削除

ログアウト時は IndexedDB 全体を削除する。

```ts
await db.delete()
```

または、Dexie インスタンスを開いたまま扱う都合があれば、全 store を `clear()` する。どちらを採用するかは実装時に Dexie のライフサイクルとテストしやすさで決める。

## 実装の優先順位

1. Dexie 導入 + DB 定義（`src/lib/db/cacheDB.ts`）
2. viewSettings repository + 通常/WORLD'S END の現在適用中設定保存
3. 楽曲キャッシュ（通常楽曲・WORLD'S END 楽曲）
4. userRating キャッシュ
5. userRecord キャッシュ
6. ログアウト時の IndexedDB 全削除

viewSettings を最初に実装する理由:

- API 側の改修が不要で、フロントエンド単独で完結する。
- Dexie の導入と repository / usecase 分離の検証に適している。
- 現在まったく永続化されていない列表示設定の改善効果が大きい。

## 実装時の注意

- キャッシュ読み込み・保存処理は TDD で進める。テストには `fake-indexeddb` を使用する。
- IndexedDB の実装詳細は `src/lib/db/` と `src/repositories/` に閉じ込める。
- キャッシュ判定のロジックはコンポーネントに置かない。
- API レスポンスの型変更に備えて `schemaVersion` を必ず持たせる。
- `include_noplay=true` を前提にするユーザーレコードキャッシュは、`userRecord` として固定キーにする。初回実装では `include_noplay=false` のレコードキャッシュは持たない。
- private browsing、容量不足、IndexedDB 破損などで保存に失敗しても画面を止めず、API 直呼び出しにフォールバックする。
- Dexie のバージョンアップ（マイグレーション）は `db.version(n).stores()` で管理する。古いスキーマのデータは破棄してよい。
- 難易度文字列は既存ルールどおり `BASIC`, `ADVANCED`, `EXPERT`, `MASTER`, `ULTIMA` の大文字を維持する。

## 将来検討

- `GET /internal/users/{username}/record/updated-at` を追加し、プロフィール更新だけでレコードキャッシュが無効化されないようにする。
- `GET /internal/cache-manifest` のような manifest API を追加し、`songsUpdatedAt` と `userUpdatedAt` を 1 リクエストで取得する。
- 楽曲差分取得 API を追加し、`songs` / `worldsendSongs` store を差分更新できるようにする。
- 楽曲詳細 API を `songs` / `worldsendSongs` store から返せるようにする。
- `fetchMasterData` や `fetchVersions` を IndexedDB キャッシュ対象に含める。
- rating API の DB 負荷が十分下がらない場合、rating 専用のより軽量な更新判定 API を検討する。
