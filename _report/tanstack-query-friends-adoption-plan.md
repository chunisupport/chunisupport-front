# フレンド関連 TanStack Query 導入計画

## 1. 文書の位置付け

本書は、フレンド一覧、フレンド申請、受信申請通知、楽曲別フレンドランキングへ `@tanstack/solid-query` v5 を導入するための実装計画である。

導入の目的は、既存の API 契約や画面仕様を変更することではなく、サーバー状態の取得、キャッシュ、再取得、操作後の同期を共通の仕組みへ集約することである。

## 2. 結論

フレンド関連処理は TanStack Query の適用対象とする。

最終構成では、フレンド一覧、受信申請、送信申請を別々の query として管理する。mutation 成功後は、操作の影響を受ける query だけを無効化する。

受信申請通知の IndexedDB 永続化は維持する。TanStack Query のメモリキャッシュだけへ置き換えず、保存済み通知を初期表示に利用しながら、API 更新には受信申請 query を利用する。

楽曲別フレンドランキングも TanStack Query へ移行し、フレンドの承認または解除後にランキング query を無効化する。

## 3. 導入目的

- 同じ query key に対する同時リクエストを共有し、重複取得を減らす。
- mutation と関連データの再取得規則を明示する。
- 画面を離れて戻った場合に、利用可能なキャッシュを再利用する。
- フレンド構成変更後のランキング更新漏れを防ぐ。
- loading、error、refetching、mutation pending の管理方法を統一する。
- 認証ユーザーごとにサーバー状態を分離する。
- query のキャンセルを実際の HTTP リクエストへ伝播できるようにする。

## 4. 対象範囲

### 4.1 対象

- 承認済みフレンド一覧
- 受信済みフレンド申請一覧
- 送信済みフレンド申請一覧
- フレンド申請の作成
- フレンド申請の承認、拒否、取消
- フレンド関係の解除
- 受信済みフレンド申請の通知ドット
- 通常譜面のフレンドランキング
- WORLD'S END 譜面のフレンドランキング
- 認証主体変更時の query キャンセルとキャッシュ破棄
- query 関連の単体テストと結合確認
- 依存関係およびライセンス文書の更新

### 4.2 対象外

- WebSocket、Server-Sent Events、push 通知によるリアルタイム更新
- TanStack Query のキャッシュ全体の永続化
- オフライン中の mutation キュー
- フレンド申請 API の契約変更
- 楽観的更新の初回導入
- フレンド以外の `createResource` の一括移行

## 5. 現状

### 5.1 フレンド画面

`src/pages/friends/FriendsPage.tsx` は、次の3 APIを `Promise.all` で取得し、1つの `createResource` へ格納している。

- `fetchFriends`
- `fetchReceivedFriendRequests`
- `fetchSentFriendRequests`

申請作成、承認、拒否、取消、解除のどの操作でも、成功後に3 APIをすべて再取得する。

この構成では初期表示を一括で扱いやすい一方、変更されていない一覧も再取得される。また、操作の影響範囲がコード上で区別されていない。

### 5.2 受信申請通知

`src/stores/friendRequestNotification.ts` は以下を担当している。

- 認証ユーザー別の通知状態
- IndexedDB からの hydration
- 10分の再取得間隔
- 同一ユーザーに対する重複更新の抑止
- 遅延したレスポンスを別ユーザーへ反映しないための判定
- フレンド画面で取得済みの受信申請件数との同期

この状態はサーバー状態だけでなく、再読み込み直後の通知表示を支える永続化仕様を含む。そのため、初回導入では削除しない。

### 5.3 フレンドランキング

通常譜面と WORLD'S END 譜面のフレンドランキングは、それぞれ画面内の `createResource` で取得されている。

フレンド構成を変更した後にランキング画面へ戻った場合、TanStack Query 導入後はキャッシュが残る可能性がある。承認と解除の mutation からランキング query を明示的に無効化する必要がある。

## 6. 基本設計

### 6.1 QueryClient

アプリケーション全体で1つの `QueryClient` を共有し、ルーターより外側またはアプリケーションルートの最上位に `QueryClientProvider` を配置する。

QueryClient の生成と既定値は `src/lib/queryClient.ts` に集約する。画面コンポーネント内では QueryClient を生成しない。

初期設定は次を基準とする。

| 項目 | 方針 |
| --- | --- |
| query retry | HTTP 4xx は再試行しない。それ以外は最大1回とする |
| mutation retry | `false` とする |
| staleTime | query 単位で明示する |
| gcTime | 既定の5分を基準とし、必要になるまで変更しない |
| refetchOnMount | stale な場合に再取得する既定動作を利用する |
| refetchOnWindowFocus | stale な場合に再取得する既定動作を利用する |
| refetchOnReconnect | stale な場合に再取得する既定動作を利用する |

API エラーには `status` が付与されているため、retry 判定はその値を利用する。認証エラー、入力エラー、権限エラーを再試行しない。

### 6.2 Query key

query key は `src/queries/friends.ts` と `src/queries/friendRankings.ts` の各query moduleに集約し、画面側で配列を直接組み立てない。key factory と対応するquery optionsは同じmoduleへ配置する。

認証によりレスポンスが変わる query には、必ず現在の `username` を含める。API URLに `username` が含まれなくても省略しない。

想定する query key は次のとおりである。

```text
['friendships', username, 'friends']
['friendships', username, 'requests', 'received']
['friendships', username, 'requests', 'sent']

['friend-rankings', username, 'song', displayId, difficulty]
['friend-rankings', username, 'worldsend', displayId]
```

通常譜面の `difficulty` は既存のドメイン規則に従い、`BASIC`、`ADVANCED`、`EXPERT`、`MASTER`、`ULTIMA` の大文字で格納する。

### 6.3 Query options

query options も query key と同じ共通領域に定義し、フレンド画面、ナビゲーション、ランキング画面から再利用する。

Solid Query の options は accessor 関数として渡し、`username`、`displayId`、`difficulty` のリアクティビティを維持する。props や signal の値をコンポーネント初期化時に固定しない。

認証依存 query は `enabled: Boolean(username)` とし、未認証状態では実行しない。

### 6.4 APIキャンセル

query function が受け取る `AbortSignal` を API 関数へ渡し、最終的に `fetchWithAuth` が呼び出す `fetch` へ伝播させる。

対象 API 関数は `signal?: AbortSignal` を受け取れる形に変更する。

- `fetchFriends`
- `fetchReceivedFriendRequests`
- `fetchSentFriendRequests`
- `fetchSongFriendRanking`
- `fetchWorldsendFriendRanking`

mutation API は初回導入ではキャンセル対象にしない。

## 7. フレンド画面のquery設計

### 7.1 一覧query

フレンド一覧、受信申請、送信申請は3つの独立した query とする。各queryの正規データ形は `FriendshipUserDTO[]` とし、APIレスポンスの `items` はquery function内で取り出す。画面と命令的な `fetchQuery` の双方で同じデータ形を利用する。

画面の初期表示は現行仕様を維持し、3 query がすべて初回解決するまで共通の `Loading` を表示する。いずれかが初回取得に失敗した場合は、取得済みの一覧だけを部分表示せず、現行と同等の再試行導線を表示する。

認証状態が `authenticated` になるまではフレンド画面自体の認証guardを優先する。query側の初回loadingは、`enabled: false` でも成立し得る `isPending` だけで判定せず、`isLoading` または `data === undefined && fetchStatus === 'fetching'` を利用する。初回errorは `data === undefined && isError`、保持データがある再取得errorは `data !== undefined && isRefetchError` として区別する。

初回取得後のバックグラウンド再取得では既存データを維持し、画面全体をローディング表示へ戻さない。

手動更新ボタンは3 queryの `refetch` を並列実行する。操作後の自動更新とは分離する。

### 7.2 staleTime

フレンド画面の3一覧には短い有限値を設定する。初期値は30秒を候補とし、実装前に確定する。

有限値とする理由は、別端末や相手ユーザーの操作による申請状態の変化をクライアント側だけでは検知できないためである。

### 7.3 エラー表示

- 初回取得エラーは現在の画面全体エラーとして扱う。
- 手動更新またはバックグラウンド更新の失敗では、保持済み一覧を消さずにトーストを表示する。
- mutation の入力エラーは、現在と同様にフレンド申請入力欄の近くへ表示する。
- mutation のその他のエラーは、操作対象の近くで表現できない現在のUIではトーストを継続利用する。
- 同じエラーに対する effect の再評価でトーストが重複しないことを確認する。

## 8. Mutation設計

### 8.1 共通方針

各 API 操作は `useMutation` で管理する。mutation key はフレンド操作の共通 prefix と操作種別を持たせる。

mutation 完了まで現在と同様にフレンド操作全体を無効化する。初回導入では操作ごとの並列実行を許可しない。

成功トーストは API 成功後に表示する。関連 query の invalidation Promise を待機し、再取得完了まで操作中表示を維持する。

初回導入では楽観的更新を行わない。各 mutation API がレスポンス本文を返さず、承認日時などの確定値をクライアントだけで構築できないためである。

### 8.2 無効化規則

| 操作 | 無効化するquery |
| --- | --- |
| フレンド申請作成 | フレンド一覧、受信申請、送信申請、認証ユーザーの全フレンドランキング |
| 受信申請承認 | 受信申請、フレンド一覧、認証ユーザーの全フレンドランキング |
| 受信申請拒否 | 受信申請 |
| 送信申請取消 | 送信申請 |
| フレンド解除 | フレンド一覧、認証ユーザーの全フレンドランキング |

ランキングは `['friend-rankings', username]` の prefix で無効化する。表示中のランキングは再取得し、非表示のランキングは stale として扱い、次回表示時に再取得する。

フレンド申請作成は、相手からの申請が既に存在する場合に即時承認される。成功レスポンスは `204 No Content` で結果種別を判別できないため、送信申請だけでなく、受信申請、フレンド一覧、ランキングも無効化する。

受信申請 query の更新後は、取得件数と `dataUpdatedAt` を通知同期処理へ渡し、通知ドットと IndexedDB を同期する。

## 9. 受信申請通知との統合

### 9.1 維持する責務

`friendRequestNotification` は次の責務に限定して維持する。

- IndexedDB に保存された通知状態の hydration
- query データが存在しない初期表示での通知ドット
- 最終取得日時の永続化
- 認証ユーザー切替時の反映先判定

受信申請一覧のメモリキャッシュとリクエスト重複排除は TanStack Query を正とする。

### 9.2 期限切れ更新

ナビゲーションが保存済み通知を hydration した後、10分の期限を過ぎている場合は、直接 `fetchReceivedFriendRequests` を呼ばず、`queryClient.fetchQuery` で受信申請 query を取得する。この呼び出しでは `staleTime: 0` を指定し、通知TTLを過ぎた場合にネットワーク取得を確実に行う。同じquery keyで進行中のリクエストがある場合は、そのPromiseを共有する。

`fetchQuery` の解決後は、返された `FriendshipUserDTO[]` の件数と `queryClient.getQueryState(queryKey)?.dataUpdatedAt` を通知同期処理へ渡す。query stateを取得できない場合は保存日時を推測せず、通知ストアへの同期を行わない。

フレンド画面が同時に表示されている場合は同じ query key と query function が利用されるため、リクエストを共有できる。

保存済み通知が期限内で、フレンド画面も表示されていない場合は、従来どおり追加取得を行わない。

### 9.3 同期方向

同期方向は次の一方向とする。

```text
受信申請queryの成功データ
  -> 受信申請件数の判定
  -> friendRequestNotification
  -> IndexedDB
```

IndexedDB に保存された真偽値から受信申請一覧の query data は生成しない。保存済み状態には一覧内容が含まれず、完全な query data として扱えないためである。

`useQuery` には通知永続化の副作用をquery functionとして含めない。フレンド画面では `data` と `dataUpdatedAt` を監視するeffectから同期する。保存する `fetchedAt` はeffect実行時刻ではなく `new Date(dataUpdatedAt).toISOString()` とする。

キャッシュ済みデータの再利用では過去の `dataUpdatedAt` が再利用されるため、通知TTLが現在時刻まで延長されない。バックグラウンド再取得に失敗した場合も `dataUpdatedAt` は更新されないため、既存の通知状態と取得日時を維持する。同期処理は、同じusernameと `dataUpdatedAt` の組み合わせを重複保存しない。

## 10. フレンドランキングのquery設計

### 10.1 通常譜面

query key に認証ユーザー、楽曲表示ID、難易度を含める。難易度変更時は新しい query key へ切り替える。

### 10.2 WORLD'S END

query key に認証ユーザーと楽曲表示IDを含める。

### 10.3 鮮度

ランキングには有限の staleTime を設定する。初期値は30秒を候補とし、フレンド画面と同じ定数を共用するかは実装時に利用目的を確認して決定する。

フレンド自身によるスコア更新を即時検知する仕組みはないため、window focus、再接続、stale な状態での再マウントによる再取得を有効にする。

フレンドの承認または解除時は、対象認証ユーザーのランキングをすべて無効化する。

自分のスコア登録、データ取込など、ランキング内容を変化させる既存処理もランキング query の無効化対象にする。該当処理を調査し、登録成功後の共通更新処理へ invalidation を追加する。

## 11. 認証境界とキャッシュ破棄

### 11.1 ユーザー分離

認証依存 query key に `username` を含めることを第一の分離策とする。

### 11.2 認証主体変更

次の場合は、実行中の認証依存 query をキャンセルし、以前の認証ユーザーに属する query cache を破棄する。

- ログアウト
- 401または認証トークン失効によるセッション解除
- アカウント削除
- メンテナンス用ログインへの切替
- 別ユーザーとしてのログイン成功

NavBar のログアウト処理だけへキャッシュ破棄を実装しない。`fetchWithAuth`、`resolveAuthSession`、アカウント削除など複数のセッション変更経路が存在するため、`QueryClientProvider` が存続するアプリケーション共通領域で認証状態の変更を監視する。

監視処理は直前の認証 `username` を保持する。現在の認証状態が未認証へ変わった場合、または別の `username` へ変わった場合は、保持していた旧 `username` を使って `friendships` と `friend-rankings` の両prefixをキャンセルして削除する。新しいユーザーのqueryは削除対象に含めない。

処理順は次を基準とする。

1. 以前のユーザーに属するqueryをキャンセルする。
2. 以前のユーザーに属するqueryを削除する。
3. 通知ストアを新しい認証ユーザーへ切り替える、または未認証状態へ戻す。
4. 新しい認証ユーザーのqueryを必要な画面で開始する。

無条件の `queryClient.clear()` は将来追加される未認証queryまで削除するため、初回実装では旧 `username` に一致する認証依存prefixだけを削除する。認証queryの種類が増えた場合は、ユーザー依存queryを一括識別できるquery metaまたは共通root keyへの拡張を別途検討する。

## 12. 想定ファイル構成

```text
src/
  lib/
    queryClient.ts
  queries/
    friends.ts
    friendRankings.ts
  api/
    friends.ts
    songs.ts
  pages/
    friends/
      FriendsPage.tsx
    songs/
      SongScoreHistory/
        SongScoreHistory.tsx
      WorldsendScoreHistory/
        WorldsendScoreHistory.tsx
  stores/
    friendRequestNotification.ts
  components/
    NavBar/
      NavBar.tsx
```

`pages/friends` の実装を楽曲画面から直接参照しない。複数featureで利用する query key、query options、同期処理は共通領域へ配置する。

## 13. 実装フェーズ

### フェーズ1: 基盤導入

1. `@tanstack/solid-query` v5 を依存関係へ追加する。
2. `QueryClient` と既定オプションを定義する。
3. `QueryClientProvider` をアプリケーションルートへ追加する。
4. HTTP status に基づく query retry 判定を追加する。
5. query key factory を追加する。
6. QueryClient 単体テスト用の生成関数を用意する。
7. ライセンス文書を更新する。

### フェーズ2: 認証ライフサイクル統合

1. 認証主体の変更を検知する共通処理を追加する。
2. 直前の認証 `username` を保持する。
3. 旧ユーザーの `friendships` と `friend-rankings` queryをキャンセルして削除する。
4. 明示ログアウト以外のセッション解除経路を確認する。
5. 別ユーザーで再ログインした場合のキャッシュ分離を確認する。

最初の認証依存queryを移行する前に本フェーズを完了し、中間状態でも旧ユーザーのキャッシュが残らないようにする。

### フェーズ3: ランキング移行と更新処理の接続

1. ランキング API が `AbortSignal` を受け取れるようにする。
2. 通常譜面ランキング用 query options を追加する。
3. WORLD'S END ランキング用 query options を追加する。
4. 2画面の `createResource` を `useQuery` へ置き換える。
5. スコア登録成功後に通常譜面ランキングを無効化する。
6. WORLD'S END のスコア更新経路が存在する場合は該当ランキングを無効化する。
7. データ取込後に全ランキングを無効化する。
8. 他にフレンドランキングへ影響する処理がないか検索する。
9. loading、error、空状態の表示が変更されていないことを確認する。

読み取り専用queryから開始し、Provider、認証key、Solidのリアクティビティ、画面境界を局所的に検証する。ランキングcacheを導入するフェーズ内で既存の書き込み経路も接続し、staleなランキングを残さない。

### フェーズ4: フレンド一覧移行

1. フレンド一覧 API が `AbortSignal` を受け取れるようにする。
2. 3一覧の query options を追加する。
3. `FriendsPage` の一括 `createResource` を3 queryへ置き換える。
4. 初回loading、初回error、バックグラウンドrefetchの合成状態を追加する。
5. 手動更新を3 queryの並列refetchへ変更する。
6. `dataUpdatedAt` を使った受信申請通知の同期を追加する。

### フェーズ5: Mutation移行

1. 5種類の操作を `useMutation` へ移行する。
2. 操作中の全体無効化を維持する。
3. 操作別の invalidation を追加する。
4. 申請作成、承認、解除からランキングを無効化する。
5. 入力エラー、トースト、確認ダイアログの挙動を維持する。
6. invalidation 完了まで pending 状態を維持する。

### フェーズ6: 通知更新の共有

1. 通知の期限切れ更新を `queryClient.fetchQuery` へ変更する。
2. フレンド画面との同時取得が1リクエストへ集約されることを確認する。
3. IndexedDB hydration と10分TTLを維持する。
4. queryの `dataUpdatedAt` から通知ストアへの一方向同期を確認する。
5. バックグラウンド再取得失敗時に通知TTLが延長されないことを確認する。
6. ユーザー切替中の遅延レスポンスが別ユーザーへ反映されないことを確認する。

### フェーズ7: 最終整理

1. 不要になった `createResource`、`refetch`、操作用signalを削除する。
2. 重複したfetch helperと通知更新処理を削除する。
3. query設定値と画面文言を既存方針に従って定数化する。
4. TSDoc、文字化け、未使用importを確認する。
5. 依存関係とライセンス文書を確定する。

## 14. テスト計画

現行の `pnpm test:unit` は Node.js 標準テストランナーを利用する。query key、retry判定、invalidation対象、通知同期、QueryClientのキャッシュ操作は、DOMを必要としない関数へ分離して自動テストする。

画面上のloading、error、disabled、トースト、ダイアログは手動確認対象とする。primitiveを描画して状態遷移を自動テストする場合は、DOMテスト環境とテストライブラリの追加を別途決定し、依存関係とライセンスも確認する。

### 14.1 Query key

- 認証ユーザーが異なる場合にkeyが一致しないこと。
- 通常譜面の難易度が大文字でkeyに格納されること。
- 通常譜面と WORLD'S END のkeyが衝突しないこと。
- prefix invalidationで指定した認証ユーザーのランキングだけが一致すること。

### 14.2 Retry

- 400、401、403、404などの4xxを再試行しないこと。
- 再試行対象エラーでも設定回数を超えないこと。
- mutationを自動再試行しないこと。

### 14.3 一覧取得

- 3一覧の初回取得中に共通 `Loading` が表示されること。
- 1つでも初回取得に失敗した場合に再試行導線が表示されること。
- 再取得中に既存一覧が維持されること。
- 手動更新が3一覧を更新すること。
- 同じ受信申請queryの同時要求が重複実行されないこと。
- 保持データがある再取得errorで既存一覧が削除されないこと。

### 14.4 Mutation

- 各操作で指定されたqueryだけが無効化されること。
- 申請作成、承認、解除でランキングqueryが無効化されること。
- mutation失敗時に成功トーストとinvalidationが実行されないこと。
- 申請のvalidation errorが入力欄の近くへ表示されること。
- mutation中に別のフレンド操作を開始できないこと。
- `onSuccess` が返すinvalidation Promiseの完了までmutationのpending状態が維持されること。
- 非表示のランキングqueryは無効化時に即時再取得されず、次回利用時に再取得されること。

### 14.5 通知

- IndexedDB の保存値が初期通知ドットへ反映されること。
- 期限内の保存値がある場合、ナビゲーションだけではAPI取得しないこと。
- 期限切れ時に受信申請queryから通知が更新されること。
- フレンド画面の受信申請取得後に通知とIndexedDBが同期されること。
- キャッシュ済みデータの再利用だけでは通知の `fetchedAt` が現在時刻へ更新されないこと。
- バックグラウンド再取得失敗時に通知の `fetchedAt` が更新されないこと。
- 通知の期限切れ `fetchQuery` とフレンド画面の取得が同じPromiseを共有すること。
- 別ユーザーへ切り替えた後、旧ユーザーのレスポンスが反映されないこと。

### 14.6 認証境界

- ログアウト時に旧ユーザーのqueryが残らないこと。
- 401によるセッション解除でも旧ユーザーのqueryが残らないこと。
- ユーザーAからユーザーBへ切り替えた場合にAの一覧やランキングが表示されないこと。
- queryキャンセル時に `AbortSignal` がHTTPリクエストへ伝播すること。
- キャンセル後に旧ユーザーのリクエストが解決してもキャッシュへ再登録されないこと。

### 14.7 手動確認

- フレンド画面の各タブとURLが従来どおり連動すること。
- 申請作成、承認、拒否、取消、解除の表示と確認ダイアログが変わらないこと。
- 操作後に必要な一覧だけが更新されること。
- 受信申請件数とナビゲーションの通知ドットが一致すること。
- 承認直後に表示中のフレンドランキングが更新されること。
- 解除したユーザーがランキングから除外されること。
- invalidationの再取得完了まで操作中表示が維持されること。
- window focusとネットワーク再接続後にstaleなデータが更新されること。
- ライトテーマとダークテーマでloading、error、disabled状態が崩れないこと。

## 15. 品質確認

各フェーズの完了時と最終完了時に以下を実行する。

```text
pnpm check:ci
pnpm typecheck
pnpm test:unit
pnpm build
```

依存関係追加後は以下も実行する。

```text
pnpm licenses:generate
pnpm licenses:check
```

確認用に作成した一時ファイルやコマンド出力は残さない。

## 16. 受け入れ条件

- `@tanstack/solid-query` v5 がアプリケーションルートへ正しく設定されている。
- フレンド関連queryが認証ユーザー単位で分離されている。
- 未認証状態では認証依存queryが実行されない。
- フレンド画面の初期loading、初回error、空状態、手動更新が従来どおり利用できる。
- 各mutation後に影響を受ける一覧だけが再取得される。
- 申請作成による即時承認、明示的な承認、解除の後にフレンドランキングがstaleとなり、表示中なら再取得される。
- 通知ドットのIndexedDB hydrationと10分TTLが維持されている。
- 受信申請の同時取得が同じquery keyで共有される。
- 認証主体変更時に旧ユーザーのデータが表示されない。
- queryキャンセルがHTTPリクエストへ伝播する。
- API契約と画面上の文言が変更されていない。
- 必須の品質確認とライセンス確認がすべて成功する。

## 17. 実装開始前の確認事項

以下は複数の妥当な選択肢があるため、実装開始前に確定する。

1. フレンド一覧とランキングの `staleTime` を同じ30秒とするか、用途別に分けるか。
2. 408と429をほかの4xxと同様に再試行しないか、`Retry-After` などの条件に基づき例外扱いするか。本計画の既定案は全4xxを再試行しないものとする。
3. 初回取得で1 queryだけ失敗した場合も画面全体をエラーにする現行仕様を維持するか、取得できたタブを部分表示するか。本計画の既定案は現行仕様維持とする。
4. スコア登録やデータ取込後のランキング無効化を各画面から行うか、成功後の共通usecaseへ集約するか。本計画の推奨は共通usecaseへの集約とする。
5. primitiveの画面状態遷移を自動テストするためにDOMテスト環境を追加するか、初回導入ではNode.js単体テストと手動確認へ分けるか。本計画の既定案は新しいテスト依存を追加しないものとする。

## 18. 参照

- TanStack Query Solid Quick Start: <https://tanstack.com/query/latest/docs/framework/solid/quick-start>
- Solid `useQuery` reference: <https://tanstack.com/query/latest/docs/framework/solid/reference/useQuery>
- Query invalidation: <https://tanstack.com/query/latest/docs/framework/solid/guides/query-invalidation>
- Query cancellation: <https://tanstack.com/query/latest/docs/framework/solid/guides/query-cancellation>
- Mutation invalidation: <https://tanstack.com/query/latest/docs/framework/solid/guides/invalidations-from-mutations>
