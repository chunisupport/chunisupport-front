# ARCH-001 楽曲管理機能の責務分割計画案

**作成日**: 2026年07月23日  
**対象課題**: `_report/refactor.md` の `ARCH-001`  
**対象画面**: ADMIN向け楽曲管理画面、EDITOR向け楽曲編集画面

## 1. 目的

`src/pages/songs/SongManagementPage.tsx` に集中している通常楽曲・WORLD'S END楽曲の管理責務を分割し、変更影響範囲、テスト容易性、feature境界を改善する。

単純に行数を減らすことを目的とせず、以下の状態を実現する。

- ADMIN／EDITORページが別のpage featureを直接参照しない。
- 通常楽曲とWORLD'S END楽曲の状態・CRUD・フォームが独立している。
- draft生成、入力正規化、検証、API request生成が純粋関数としてテストできる。
- API mutation、再取得、二重送信防止をSolidJS Primitiveとしてテストできる。
- UIコンポーネントがAPI requestの組み立てやキャッシュ更新を担当しない。
- 権限差を画面内の暗黙的な分岐ではなく、ADMIN／EDITORごとのcompositionで表現する。

## 2. 現状

`src/pages/songs/SongManagementPage.tsx` は約1,850行あり、以下の責務が同居している。

| 範囲 | 主な責務 |
| --- | --- |
| 型・helper | 通常楽曲／WORLD'S ENDのdraft型、日付変換、入力正規化 |
| データ取得 | 管理用楽曲一覧、管理用WORLD'S END一覧、マスターデータ |
| 画面状態 | 検索、選択中ID、編集draft、作成draft |
| mutation | 作成、更新、削除、復活、管理一覧と公開一覧の再取得 |
| UI | 通常楽曲／WORLD'S ENDの一覧、編集フォーム、作成フォーム |
| 権限制御 | `canCreate`、`canDelete`による操作表示の切り替え |

さらに、以下のpageから`src/pages/songs`を直接参照している。

- `src/pages/admin/AdminSongsPage.tsx`
- `src/pages/editor/EditorSongsPage.tsx`

APIの権限は以下のとおりであり、現在の画面構成もこの差を前提としている。

| 操作 | ADMIN | EDITOR |
| --- | --- | --- |
| 管理一覧の取得 | 可 | 可 |
| 更新 | 可 | 可 |
| 復活 | 可 | 可 |
| 作成 | 可 | 不可 |
| 削除 | 可 | 不可 |

## 3. 基本方針

### 3.1 共有featureの新設

楽曲管理を公開楽曲一覧のpage featureから分離し、`src/features/song-management`へ移す。

ADMIN／EDITORページは`src/features/song-management/index.ts`だけを参照し、feature内部のコンポーネントやPrimitiveを直接importしない。

### 3.2 通常楽曲とWORLD'S ENDの分離

通常楽曲とWORLD'S ENDではDTO、譜面構造、検証条件、APIが異なる。巨大な汎用モデルへ統合せず、それぞれ専用のusecaseとPrimitiveを定義する。

共通化は以下のように、仕様が同じ箇所だけに限定する。

- 楽曲の基本入力項目
- 管理対象の検索一覧
- mutation中状態とエラー表示の基本規則
- 日付・nullable文字列の正規化

### 3.3 SolidJSのリアクティビティ維持

- resource、signal、memoは対応するPrimitiveが所有する。
- UIへはAccessorと操作関数を渡す。
- propsやモデル内のリアクティブ値を不用意に分割代入しない。
- 検索結果や選択中楽曲などの派生値は`createMemo`で表現する。
- 動的なDOMリストは`Array.prototype.map()`ではなく`<For>`または適切な場合の`<Index>`を使う。

### 3.4 挙動変更との分離

責務分割中に既存の挙動を暗黙に変更しない。現在確認できる作成系・更新系の検証条件差は、純粋関数への抽出後、別コミットで修正する。

これにより、構造変更と仕様変更を個別にレビュー・切り戻しできるようにする。

## 4. 想定ディレクトリ構成

```text
src/features/song-management/
├─ index.ts
├─ SongManagementPage.tsx
├─ constants.ts
├─ types.ts
├─ components/
│  ├─ ManagementFields.tsx
│  ├─ ManagedSongList.tsx
│  ├─ StandardSongManagementSection.tsx
│  ├─ StandardSongEditor.tsx
│  ├─ StandardSongCreateForm.tsx
│  ├─ WorldsendSongManagementSection.tsx
│  ├─ WorldsendSongEditor.tsx
│  └─ WorldsendSongCreateForm.tsx
├─ primitives/
│  ├─ createStandardSongManagement.ts
│  ├─ createStandardSongManagement.test.ts
│  ├─ createWorldsendSongManagement.ts
│  └─ createWorldsendSongManagement.test.ts
└─ usecases/
   ├─ songDraftShared.ts
   ├─ songDraftShared.test.ts
   ├─ standardSongDraft.ts
   ├─ standardSongDraft.test.ts
   ├─ worldsendSongDraft.ts
   └─ worldsendSongDraft.test.ts
```

実装中に責務が小さいと判断したファイルは統合してよい。ファイル数を増やすこと自体を目的にせず、以下の依存方向を守る。

```text
ADMIN／EDITOR page
        ↓
feature public API
        ↓
composition
        ↓
UI components → Primitives → Usecases
                         ↓
                    API／store
```

UsecaseはAPIやtoast、SolidJSのsignalへ依存しない。

## 5. 各層の責務

### 5.1 公開API

`src/features/song-management/index.ts`は、原則として以下だけを公開する。

- `SongManagementPage`
- `SongManagementCapabilities`

feature内部のdraft型、Primitive、入力コンポーネントは公開しない。

### 5.2 Composition

`SongManagementPage.tsx`は以下だけを担当する。

- ドキュメントタイトル
- 画面タイトル
- ジャンル・難易度などの参照データ取得
- 通常楽曲／WORLD'S ENDセクションの配置
- ADMIN権限時の作成フォーム配置
- 削除操作を許可するかどうかの伝達

API payloadの生成、入力検証、個々のフォーム項目は保持しない。

### 5.3 Usecase

通常楽曲とWORLD'S ENDごとに、以下を純粋関数として実装する。

- 空の作成draft生成
- API DTOから編集draftへの変換
- draftの正規化
- draftの検証
- 作成request生成
- 更新request生成

検証はtoastを直接表示せず、識別可能な結果を返す。

```ts
type ValidationResult<TRequest, TErrors> =
  | { ok: true; request: TRequest }
  | { ok: false; errors: TErrors }
```

エラーは可能な限り対象フィールドや譜面行へ紐付ける。API全体に関わるエラーだけをフォーム操作部付近へ表示する。

### 5.4 Primitive

通常楽曲用とWORLD'S END用のPrimitiveは、それぞれ以下を所有する。

- 管理一覧resource
- 検索文字列
- ソート済み・検索済み一覧
- 選択中の楽曲ID
- 選択中DTOから生成した編集draft
- mutation中の操作種別
- APIエラーまたは再取得エラー
- 選択、入力更新、作成、更新、削除、復活の操作関数

API関数と公開楽曲データの再取得処理は依存として注入できる形にし、Node.js上の単体テストでfakeへ置き換えられるようにする。

mutationは以下の順序を統一する。

1. mutation中であれば重複実行を拒否する。
2. draftをusecaseで検証し、requestを生成する。
3. APIを実行する。
4. 管理一覧を`refetch`する。
5. `useSongsData()`の公開楽曲データを再取得する。
6. 成功状態または再取得エラーをUIへ返す。
7. `finally`でmutation中状態を解除する。

API成功後の再取得だけが失敗した場合は、操作失敗として扱わず「操作は完了したが最新データの取得に失敗した」状態を維持する。

### 5.5 UIコンポーネント

UIは以下の規則に従う。

- Kobalteと既存の共通ラッパーを優先する。
- ボタンは`AppButton`を利用する。
- ジャンル選択は`FormSelect`を利用し、`gutter={0}`が共通側で適用されることを確認する。
- 検索欄は`SearchTextField`を利用する。
- チェックボックスは`CheckboxField`を利用する。
- 作成・更新は`<form onSubmit>`として実装する。
- 有効なsubmit開始後は操作ボタンをdisabledにし、二重送信を防止する。
- 入力エラーは対象項目または譜面行の近くに表示し、必要に応じて`aria-describedby`で関連付ける。
- 読み込み表示は共通`Loading`を使用する。
- 文言、入力上限、エラーメッセージ、マジックナンバーは`constants.ts`へ集約する。
- 新規・変更するコンポーネントと関数にはTSDocを付与する。

削除確認は`window.confirm`を新しいfeatureへ持ち込まず、共通`AppAlertDialog`を先行追加して通常楽曲とWORLD'S ENDの両方から利用する。ほかの画面の確認UI移行は`QUAL-003`の範囲とする。

## 6. 実装手順

### フェーズ1: 現行挙動の固定

1. ADMIN／EDITORの操作権限表をテスト・手動確認項目として固定する。
2. 通常楽曲とWORLD'S ENDの有効な作成・更新requestをcharacterization testで固定する。
3. 検索、リリース日順、削除済み表示、ULTIMA追加、CRUD後の再取得を確認項目として記録する。

このフェーズでは本番コードの構造を変更しない。

### フェーズ2: feature境界の作成

1. `git mv`で`src/pages/songs/SongManagementPage.tsx`を`src/features/song-management/SongManagementPage.tsx`へ移動する。
2. import pathを修正する。
3. `src/features/song-management/index.ts`を追加する。
4. ADMIN／EDITORページのimportをfeatureの公開APIへ変更する。
5. `pnpm check:ci`、`pnpm typecheck`、`pnpm build`を実行し、移動だけで挙動が変わっていないことを確認する。

### フェーズ3: draft usecaseの抽出

1. 日付変換、nullable文字列正規化、表示用日時整形をfeature内の適切なファイルへ移す。
2. 通常楽曲のdraft型、初期値、DTO変換、検証、request生成を抽出する。
3. WORLD'S ENDのdraft型、初期値、DTO変換、検証、request生成を抽出する。
4. 難易度の外部入力は`toUpperCase()`で正規化し、draft・request内では大文字のドメイン値だけを扱う。
5. Given-When-Then形式の単体テストを追加する。

### フェーズ4: Primitiveの抽出

1. 通常楽曲のresource、検索、選択、draft、CRUDを`createStandardSongManagement`へ移す。
2. WORLD'S ENDの同等責務を`createWorldsendSongManagement`へ移す。
3. APIと公開データ再取得を依存として注入できるようにする。
4. mutation中状態、二重実行防止、成功後再取得、API失敗、再取得だけが失敗するケースをテストする。
5. CompositionはPrimitiveの戻り値をUIへ渡すだけにする。

### フェーズ5: UIコンポーネントの分割

1. 通常楽曲の検索一覧と編集フォームを分離する。
2. 通常楽曲の作成フォームを分離する。
3. WORLD'S ENDの検索一覧と編集フォームを分離する。
4. WORLD'S ENDの作成フォームを分離する。
5. 基本入力項目、検索一覧、管理画面用入力欄のうち、仕様が同じものだけをfeature内で共通化する。
6. `window.confirm`を共通`AppAlertDialog`へ置き換える。
7. validation errorを対象項目の近くへ表示する。

### フェーズ6: 権限別compositionの確定

ADMINページは以下のcapabilityを渡す。

```ts
{
  canCreate: true,
  canDelete: true,
}
```

EDITORページは以下を渡す。

```ts
{
  canCreate: false,
  canDelete: false,
}
```

更新と復活は両方のcompositionで利用可能とする。EDITORでは作成フォーム自体を生成せず、削除ボタンも描画しない。

### フェーズ7: 検証条件差の修正

構造変更が完了した後、別コミットで作成・更新間の検証条件を統一する。

対象候補は以下のとおり。

- 通常楽曲作成時の譜面定数が数値として解釈できない場合。
- 通常楽曲更新時のBPM。
- WORLD'S END更新時のBPM、レベル、ノーツ。
- 作成・更新における必須文字列とtrim規則。

API仕様を正とし、境界値を単体テストへ追加してから挙動を変更する。

### フェーズ8: 最終確認と文書更新

1. 旧`src/pages/songs/SongManagementPage.tsx`が存在しないことを確認する。
2. `src/pages/admin`、`src/pages/editor`から`src/pages/songs`への楽曲管理目的のimportがないことを確認する。
3. TSXコンポーネント内にAPI request組み立てが残っていないことを確認する。
4. セルフレビューを実施する。
5. すべての受け入れ条件を満たした後、`_report/refactor.md`から`ARCH-001`の行を削除する。

## 7. テスト計画

### 7.1 通常楽曲usecase

- 空の作成draftが5難易度を大文字で持つ。
- DTOからgenre ID、日付、譜面情報を正しく復元する。
- ULTIMAが存在しない楽曲へULTIMA draftを追加できる。
- 有効な作成／更新draftから正しいrequestを生成する。
- 空文字を仕様どおり`null`へ変換する。
- 公式IDの必須・最大長を検証する。
- BPM、譜面定数、ノーツの境界値を検証する。
- 不正な日付を拒否する。
- 難易度を大文字のドメイン値として扱う。

### 7.2 WORLD'S END usecase

- DTOにWORLDSEND譜面がない場合もdraftを生成できる。
- 有効な作成／更新draftから正しいrequestを生成する。
- 譜面入力がすべて空の場合、作成requestの`chart`を省略する。
- レベル1と5を受理し、範囲外を拒否する。
- BPM、ノーツ、日付、nullable文字列を検証・正規化する。

### 7.3 Primitive

- 一覧取得後にリリース日順と検索結果が更新される。
- 楽曲選択時に対応する編集draftが生成される。
- 別の楽曲を選択するとdraftが切り替わる。
- mutation中の同一・別操作を重複実行しない。
- API成功後に管理一覧と公開データを再取得する。
- API失敗時に成功通知や再取得を行わない。
- API成功後の再取得失敗をmutation失敗と区別する。
- 作成成功後に作成draftを初期化する。
- 削除・復活後も選択対象の最新DTOを表示する。

### 7.4 手動確認

開発サーバーは新規起動しない。すでに起動している環境を利用できる場合のみ、以下を確認する。

- ADMINで通常楽曲とWORLD'S ENDの作成・更新・削除・復活ができる。
- EDITORで更新・復活ができ、作成フォームと削除ボタンが表示されない。
- 検索、選択、削除済み表示、空一覧、読み込み、APIエラーが正しく表示される。
- submit連打でAPIが重複実行されない。
- 入力エラーが対象項目の近くに表示される。
- キーボード操作とフォーカス表示が維持される。
- ライト・ダークテーマおよび狭い画面幅で表示が崩れない。

## 8. 品質確認

各フェーズの区切りと最終提出前に、変更内容に応じて以下を実行する。

```text
pnpm check:ci
pnpm typecheck
pnpm test:unit
pnpm build
```

あわせて以下を確認する。

- 未使用の変数・import・引数がない。
- 新規・変更した関数とコンポーネントにTSDocがある。
- SolidJSのAccessorやpropsのリアクティビティを破壊していない。
- UI文字列や設定値がコンポーネントへ散在していない。
- `git diff --check`で空白エラーがない。
- UTF-8 BOMなしで保存され、日本語の文字化けがない。
- 作業用のログファイルを残していない。

## 9. 受け入れ条件

- `SongManagementPage.tsx`に通常楽曲・WORLD'S ENDの全責務が集中していない。
- ADMIN／EDITORページが`src/pages/songs`の管理画面実装を直接importしていない。
- feature外からの参照が`src/features/song-management/index.ts`に限定されている。
- 通常楽曲とWORLD'S ENDのdraft変換・検証・request生成が別々の純粋関数になっている。
- 通常楽曲とWORLD'S ENDのresource・selection・mutation状態が別々のPrimitiveになっている。
- UIコンポーネントがAPI requestを直接組み立てていない。
- ADMIN／EDITORの操作権限が変更前およびAPI仕様と一致する。
- mutationの二重実行が防止される。
- CRUD成功後に管理一覧と公開楽曲データが更新される。
- 入力エラーが操作対象の近くに表示される。
- 通常楽曲とWORLD'S ENDの主要な変換・検証・状態遷移に単体テストがある。
- `pnpm check:ci`、`pnpm typecheck`、`pnpm test:unit`、`pnpm build`が成功する。
- `_report/refactor.md`から`ARCH-001`が削除される。

## 10. 対象外

以下は別課題として扱い、ARCH-001の完了を不必要に拡大しない。

- `ARCH-006`: `/internal/master`の用途別API／accessorへの分割。
- `QUAL-001`: 難易度型・正規順・表示定義の全feature横断での統合。
- `QUAL-003`: 楽曲管理以外の全ダイアログ・破壊的操作UIの移行。
- `TEST-001`: 新しいcomponent test／E2Eテスト基盤の導入。
- 楽曲管理画面のデザイン全面変更。
- API endpointやrequest／response仕様の変更。

ただし、将来の`ARCH-006`に備えて、マスターデータの直接参照はCompositionの1箇所に閉じ込める。`QUAL-001`に備えて、難易度定義をfeature外へ新たに複製しない。

## 11. 実装前の確認事項

本計画では以下を推奨案とする。

1. 新しい共有領域として`src/features/song-management`を導入する。
2. 共通`AppAlertDialog`の追加をARCH-001の先行作業に含めるが、他画面の移行は行わない。
3. 現在の検証条件差は、構造変更後の別コミットで修正する。
4. component test／E2E基盤は追加せず、純粋関数とSolidJS Primitiveの単体テストを追加する。

この4点を実装着手前に確定する。
