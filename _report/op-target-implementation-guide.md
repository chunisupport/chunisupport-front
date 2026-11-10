# OP対象 実装ガイド

## 1. このドキュメントの目的

このドキュメントは、chunisupport-front が扱う「OP対象」の仕様を、別システムへ実装する人向けに整理したものです。

対象範囲は次のとおりです。

- OP対象とは何か
- 「現在OP対象」と「理論値OP対象」の違い
- 現在値と理論値で採用される譜面が異なる理由
- フロントエンドが利用するAPIフィールド
- OVER POWER画面、レコード画面、目標、各種ツールでの使い分け
- 移植用のTypeScriptコード例
- 未プレイ、同値、未解禁、データ欠損時の扱い

単曲OVER POWERそのものの計算式は、既存の
[`_report/overpower_calculation.md`](./overpower_calculation.md)
も参照してください。

本書は2026年7月30日時点のフロントエンド実装を基準にしています。

---

## 2. 最初に押さえるべき結論

このアプリで「OP対象」と呼ばれるものには、次の2種類があります。

| 区分 | 意味 | プレイヤーごとに変わるか | 主なデータ |
|---|---|---:|---|
| 現在OP対象 | 同じ曲の譜面のうち、現在の単曲OPが楽曲OPとして採用される譜面 | 変わる | `PlayerRecordDTO.is_op_target`、`PlayerRecordDTO.overpower` |
| 理論値OP対象 | 同じ曲の譜面のうち、AJC時の最大OPが最も高い譜面 | 変わらない | `SongDTO.op_target_difficulty`、`SongDTO.maxop` |

したがって、「OP対象」という名前だけで判定方法を決めてはいけません。

- プレイヤーの現在のトータルOPを求めるなら、**現在OP対象**を使います。
- OPの上限、理論値、将来伸ばすべき譜面、楽曲マスタ基準の絞り込みなら、**理論値OP対象**を使います。

同じ曲でも、現在OP対象と理論値OP対象は異なる場合があります。

---

## 3. OP対象の集約単位

単曲OPは譜面単位で計算されますが、通常のトータルOPは楽曲単位で集約します。

```text
譜面ごとのスコア・譜面定数・ランプ
                │
                ▼
          譜面ごとの単曲OP
                │
       同じ曲の中から1譜面を採用
                │
                ▼
             楽曲OP
                │
      全対象楽曲の楽曲OPを合計
                │
                ▼
            トータルOP
```

重要なのは、同じ曲のMASTERとULTIMAを通常のトータルOPへ両方加算しないことです。曲ごとに採用する単曲OPは1件です。

一方、このアプリのOVER POWER画面で選べる「MASTER + ULTIMA」や「全難易度」は分析用の譜面単位集計です。同じ曲の複数譜面を加算するため、通常のトータルOPとは別の集計です。

---

## 4. 現在OP対象

### 4.1 定義

現在OP対象は、同一楽曲内でプレイヤーの現在の単曲OPが採用される譜面です。

このアプリでは、APIが各プレイヤーレコードへ付与する `is_op_target` を正とします。

```ts
interface PlayerRecord {
  /** 楽曲ID。 */
  id: string
  /** 大文字で管理する難易度。 */
  difficulty: 'BASIC' | 'ADVANCED' | 'EXPERT' | 'MASTER' | 'ULTIMA'
  /** 現在の単曲OVER POWER。未プレイ補完データは0。 */
  overpower: number
  /** 現在の楽曲OPとして採用されるレコードか。 */
  is_op_target: boolean
  /** プレイ済みか。 */
  is_played: boolean
}
```

現在OP対象はプレイヤーの成績に依存します。より高定数の譜面が存在しても、その譜面の現在OPが低ければ、別の難易度が現在OP対象になります。

### 4.2 フロントエンドの選択規則

フロントエンド内で曲ごとの現在OPを再構成するときは、次の順序で処理します。

1. レコードを曲IDでグループ化する。
2. `is_op_target === true` のレコードが1件以上あれば、そのレコードだけを候補にする。
3. フラグ付きレコードがなければ、その曲の全レコードへフォールバックする。
4. 候補のうち `overpower` が最大の値を現在の楽曲OPにする。

フォールバックは、旧キャッシュや不完全なデータに対して集計値を0にしないための防御です。通常系ではAPIの `is_op_target` を優先します。

### 4.3 移植用コード例

```ts
/**
 * プレイヤーレコードから曲ごとの現在OPを作る。
 *
 * @param records - 全通常譜面のプレイヤーレコード。
 * @returns 曲IDをキー、現在の楽曲OPを値にしたMap。
 */
export const buildCurrentOverPowerBySongId = (
  records: readonly PlayerRecord[]
): Map<string, number> => {
  const recordsBySongId = new Map<string, PlayerRecord[]>()

  for (const record of records) {
    const songRecords = recordsBySongId.get(record.id) ?? []
    songRecords.push(record)
    recordsBySongId.set(record.id, songRecords)
  }

  const result = new Map<string, number>()

  for (const [songId, songRecords] of recordsBySongId) {
    const flaggedRecords = songRecords.filter((record) => record.is_op_target)
    const candidates = flaggedRecords.length > 0 ? flaggedRecords : songRecords
    const current = candidates.reduce(
      (highest, record) => Math.max(highest, record.overpower),
      0
    )

    result.set(songId, current)
  }

  return result
}
```

レコード一覧画面で「現在のOP対象だけ」を表示する場合は、再計算やフォールバックを行わず、APIフラグを直接使います。

```ts
/**
 * レコードが現在OP対象か判定する。
 *
 * @param record - 判定対象のプレイヤーレコード。
 * @returns APIが現在OP対象として返した場合はtrue。
 */
export const isCurrentOpTarget = (record: PlayerRecord): boolean => record.is_op_target
```

---

## 5. 理論値OP対象

### 5.1 定義

理論値OP対象は、各譜面で理論値スコアのAJCを達成したと仮定したとき、楽曲内で最大OPになる譜面です。

譜面定数を `C` とすると、AJC時の最大OPは次の式になります。

```text
譜面最大OP = (C + 3) × 5
```

例:

| 難易度 | 譜面定数 | 現在OP | 譜面最大OP |
|---|---:|---:|---:|
| MASTER | 14.5 | 87.0 | 87.5 |
| ULTIMA | 15.0 | 80.0 | 90.0 |

この例では次のようになります。

- 現在OP対象: MASTER（`87.0 > 80.0`）
- 理論値OP対象: ULTIMA（`90.0 > 87.5`）
- 現在の楽曲OP: `87.0`
- 楽曲最大OP: `90.0`
- この曲のOP達成率: `87.0 ÷ 90.0 × 100 = 96.666...%`

プレイヤーがULTIMAを伸ばして、その現在OPがMASTERを超えると、現在OP対象もULTIMAへ切り替わります。理論値OP対象は楽曲マスタが変わらない限りULTIMAのままです。

### 5.2 APIを正とする

このアプリは理論値OP対象をフロントエンドで決定せず、楽曲マスタの次の値を使います。

```ts
interface Song {
  /** 楽曲ID。 */
  id: string
  /** その曲の最大OVER POWER。 */
  maxop: number
  /** maxopが暫定値である可能性があるか。 */
  is_maxop_unknown: boolean
  /** maxopの算出対象となった難易度。譜面がなければnull。 */
  op_target_difficulty:
    | 'BASIC'
    | 'ADVANCED'
    | 'EXPERT'
    | 'MASTER'
    | 'ULTIMA'
    | null
}
```

`op_target_difficulty` と対象レコードの `difficulty` が一致すれば、理論値OP対象です。

```ts
/**
 * 難易度が楽曲の理論値OP対象か判定する。
 *
 * @param song - 楽曲マスタ。
 * @param difficulty - 判定対象の難易度。
 * @returns 理論値対象難易度と一致する場合はtrue。
 */
export const isTheoreticalOpTarget = (
  song: Song,
  difficulty: PlayerRecord['difficulty']
): boolean => song.op_target_difficulty === difficulty
```

`op_target_difficulty` が `null`、楽曲マスタがない、または対象譜面がない場合は、理論値OP対象なしとして扱います。別難易度への暗黙のフォールバックは行いません。

### 5.3 他システム側で算出する場合

APIで `maxop` と `op_target_difficulty` を返せない場合は、楽曲マスタ作成時に一度だけ算出し、配信する設計を推奨します。

```ts
type Difficulty = PlayerRecord['difficulty']

interface Chart {
  difficulty: Difficulty
  chartConst: number
}

interface TheoreticalOpTarget {
  difficulty: Difficulty
  maxOverPower: number
}

/**
 * 楽曲内の理論値OP対象を求める。
 *
 * @param charts - 楽曲に存在する通常譜面。
 * @returns 最大理論OPの難易度と値。譜面がなければnull。
 */
export const resolveTheoreticalOpTarget = (
  charts: readonly Chart[]
): TheoreticalOpTarget | null => {
  if (charts.length === 0) return null

  return charts
    .map((chart) => ({
      difficulty: chart.difficulty,
      maxOverPower: (chart.chartConst + 3) * 5,
    }))
    .reduce((highest, current) =>
      current.maxOverPower > highest.maxOverPower ? current : highest
    )
}
```

この例では同値時に先に現れた譜面を採用します。実システムでは入力順へ依存させず、難易度優先順などのタイブレーク規則をバックエンドで定義してください。chunisupport-front は同値時の理論値対象を独自決定せず、APIの `op_target_difficulty` を信頼します。

---

## 6. 現在値と理論値を同時に集計する

トータルOP表示では、分子と分母で参照する譜面の考え方が異なります。

| 表示値 | 集計内容 |
|---|---|
| 現在値 | 曲ごとの現在OP対象レコードの `overpower` を合計 |
| 理論値 | 曲ごとの `SongDTO.maxop` を合計 |
| 達成率 | `現在値 ÷ 理論値 × 100` |
| 件数 | 対象楽曲数 |

```ts
interface OpSummary {
  current: number
  max: number
  percent: number
  songCount: number
}

/**
 * 曲ごとの現在値と理論値からOPサマリーを作る。
 *
 * @param songs - 集計対象の楽曲マスタ。
 * @param records - 集計対象プレイヤーの通常譜面レコード。
 * @returns 現在値、理論値、達成率、対象楽曲数。
 */
export const buildOpTargetSummary = (
  songs: readonly Song[],
  records: readonly PlayerRecord[]
): OpSummary => {
  const currentBySongId = buildCurrentOverPowerBySongId(records)
  const current = songs.reduce(
    (total, song) => total + (currentBySongId.get(song.id) ?? 0),
    0
  )
  const max = songs.reduce((total, song) => total + song.maxop, 0)

  return {
    current,
    max,
    percent: max > 0 ? (current / max) * 100 : 0,
    songCount: songs.length,
  }
}
```

実際のOVER POWER画面では、集計エントリを楽曲マスタ基準で作るため、レコードがない未プレイ曲も現在値0、理論値 `song.maxop` として残ります。

---

## 7. OVER POWER画面の選択アルゴリズム

OVER POWER画面の「OVER POWER対象」は、1曲につき1譜面を選び、現在値と理論値を同じ行へ載せます。

処理順は次のとおりです。

1. 楽曲マスタを基準に、未プレイを含む全譜面エントリを作る。
2. 曲ごとに譜面をまとめる。
3. `record.is_op_target === true` の譜面があれば、その譜面だけを現在値候補にする。
4. フラグがなければ、曲内の全譜面を現在値候補にする。
5. 候補の `record.overpower` が最大の譜面を選ぶ。
6. 現在OPが同値なら、`song.op_target_difficulty` と一致する譜面を優先する。
7. それでも同値なら、譜面最大OPが高い譜面を優先する。
8. 現在値には選んだレコードの `overpower`、理論値には原則 `song.maxop` を使う。

同値時の優先規則は表示する難易度・レベル・グラフ分類を安定させるためのものです。現在OPの数値自体は同じなので、トータル現在値には影響しません。

### 未解禁設定

OVER POWER画面ではユーザーが未解禁曲・未解禁ULTIMAを除外できます。

- 通常の未解禁指定: その曲の全譜面を除外
- ULTIMA未解禁指定: その曲のULTIMAだけを除外

ULTIMAだけを除外した結果、楽曲本来の最大譜面を利用できなくなった場合、分母には残っている譜面の最大理論OPを使います。利用可能な譜面集合と分母を一致させるためです。

---

## 8. 画面・機能ごとの使い分け

同じ `OP_TARGET` という識別子でも、機能の目的に応じて扱いが異なります。

| 機能 | 採用する意味 | 実装上の基準 |
|---|---|---|
| OVER POWER画面の「OVER POWER対象」 | 現在値は現在OP対象、理論値は楽曲最大OP | `is_op_target` + `overpower` / `maxop` |
| レコード画面の「現在のOP対象」 | 現在OP対象 | `record.is_op_target` |
| ランダム選曲の「OP対象」 | 理論値OP対象 | `song.op_target_difficulty` |
| 苦手譜面インスペクターの「OP対象（MAS+ULT）」 | 理論値OP対象 | `song.op_target_difficulty` |
| 目標の `attributes.chart_target: "OP_TARGET"` | 対象曲・対象譜面の条件は理論値OP対象 | `song.op_target_difficulty` |
| OP合計・OP達成率目標の現在進捗 | 曲ごとの現在OP対象 | `record.is_op_target` + `record.overpower` |
| OP合計・OP達成率目標の上限 | 曲ごとの理論値 | `song.maxop` |

### 8.1 目標機能が二つの意味を使う理由

目標の対象条件としての `chart_target: "OP_TARGET"` は、楽曲マスタ基準の理論値OP対象を表します。

ただし、OP合計・OP達成率の進捗を計算するとき、理論値対象譜面の現在OPだけを足すと、実際のトータルOPと一致しません。現在は別難易度が楽曲OPとして採用されている可能性があるためです。

そのためOP系目標では次のように分けています。

```text
対象曲の決定
  └─ 理論値OP対象譜面の定数・ジャンル・バージョンで絞り込む

現在進捗
  └─ 対象曲内の現在OP対象レコードを曲ごとに1件採用

到達可能上限
  └─ 対象曲の song.maxop を曲ごとに1回加算
```

件数、スコア、ランプなど譜面そのものを評価する目標では、`op_target_difficulty` と一致する理論値対象譜面だけを評価します。

---

## 9. API設計の推奨形

別システムへ実装する場合は、現在値由来の情報とマスタ由来の情報を明確に分けてください。

### 9.1 楽曲マスタ

```json
{
  "id": "song-a",
  "maxop": 90,
  "is_maxop_unknown": false,
  "op_target_difficulty": "ULTIMA",
  "charts": {
    "MASTER": {
      "const": 14.5,
      "is_const_unknown": false
    },
    "ULTIMA": {
      "const": 15.0,
      "is_const_unknown": false
    }
  }
}
```

### 9.2 プレイヤーレコード

```json
[
  {
    "id": "song-a",
    "difficulty": "MASTER",
    "is_played": true,
    "overpower": 87.0,
    "is_op_target": true
  },
  {
    "id": "song-a",
    "difficulty": "ULTIMA",
    "is_played": true,
    "overpower": 80.0,
    "is_op_target": false
  }
]
```

この例では、楽曲マスタはULTIMAを理論値対象として返し、プレイヤーレコードはMASTERを現在対象として返します。両方が同時に正しい状態です。

### 9.3 命名上の注意

可能であれば、他システムでは曖昧な `op_target` 単独ではなく、次のように意味を名前へ含めてください。

```ts
type OpTargetKind = 'CURRENT' | 'THEORETICAL'

interface RecommendedPlayerRecordFields {
  is_current_op_target: boolean
}

interface RecommendedSongFields {
  theoretical_op_target_difficulty: Difficulty | null
  theoretical_max_op: number
}
```

既存APIとの互換性が必要な場合は、DTO境界で `is_op_target` と `op_target_difficulty` を上記の内部モデルへ変換すると、取り違えを防げます。

---

## 10. 実装時の境界条件

### 10.1 未プレイ

- APIの未プレイ補完レコードは `is_played: false`、`overpower: 0`、`is_op_target: false`。
- OVER POWER全体集計では、楽曲マスタを基準にすることで未プレイ曲も理論値分母へ含める。
- 苦手譜面分析など現在成績が必要な機能では未プレイを除外する。

### 10.2 `is_op_target` が全件 `false`

- 集計では曲内最大 `overpower` へフォールバックする。
- レコード一覧の「現在のOP対象」フィルターでは、APIフラグをそのまま使うため該当なしになる。
- この違いは、集計継続と厳密な一覧表示という目的の違いによる。

### 10.3 現在OPが同値

- 数値だけが必要なら最大値を1回採用すればよい。
- 代表譜面も必要なら、理論値対象難易度、次に譜面最大OPをタイブレークに使う。
- バックエンドが複数譜面へ `is_op_target: true` を付ける可能性を考慮し、合算せず最大1件にする。

### 10.4 理論値対象が解決できない

- `op_target_difficulty: null` は対象なし。
- ランダム選曲や分析では他難易度へフォールバックしない。
- `maxop` が暫定値の場合は `is_maxop_unknown` を利用者へ伝えられるようにする。

### 10.5 難易度文字列

難易度のドメイン値は、コード、API、保存データのすべてで大文字に統一します。

```text
BASIC / ADVANCED / EXPERT / MASTER / ULTIMA
```

### 10.6 浮動小数

OPは小数を含むため、表示用の丸めと比較・保存用の値を分離してください。

- 内部計算: API値または計算値を保持
- 表示: 画面仕様に従って切り捨て・桁数調整
- 等値判定: 必要なら最小単位へ整数化して比較

画面表示用に丸めた文字列を再び集計へ使わないでください。

---

## 11. 最低限用意したいテスト

移植先では、少なくとも次のケースを固定してください。

1. 現在値最大譜面と理論値最大譜面が同じ。
2. 現在値最大譜面と理論値最大譜面が異なる。
3. 理論値対象譜面が未プレイでも、別譜面の現在OPを維持する。
4. 全 `is_op_target` が `false` のとき、集計だけ曲内最大値へフォールバックする。
5. 同じ曲の複数譜面をトータルOPへ重複加算しない。
6. 未プレイ曲を現在値0、理論値 `maxop` として扱う。
7. `op_target_difficulty: null` を理論値対象なしとして扱う。
8. ULTIMAだけ未解禁の場合、MASTERを残し、利用可能な理論値へ分母を変更する。
9. 通常のOP対象集計と「MASTER + ULTIMA」の譜面単位合算を混同しない。
10. 難易度値を大文字で比較・保存する。

代表的なGiven-When-Thenテスト例です。

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

test('現在OP対象と理論値OP対象が異なる曲を正しく集計する', () => {
  // Given: MASTERが現在対象、ULTIMAが理論値対象の曲。
  const songs: Song[] = [
    {
      id: 'song-a',
      maxop: 90,
      is_maxop_unknown: false,
      op_target_difficulty: 'ULTIMA',
    },
  ]
  const records: PlayerRecord[] = [
    {
      id: 'song-a',
      difficulty: 'MASTER',
      overpower: 87,
      is_op_target: true,
      is_played: true,
    },
    {
      id: 'song-a',
      difficulty: 'ULTIMA',
      overpower: 80,
      is_op_target: false,
      is_played: true,
    },
  ]

  // When: OP対象サマリーを構築する。
  const result = buildOpTargetSummary(songs, records)

  // Then: 現在値はMASTER、理論値はULTIMA由来になる。
  assert.equal(result.current, 87)
  assert.equal(result.max, 90)
  assert.equal(result.percent, (87 / 90) * 100)
  assert.equal(result.songCount, 1)
})
```

---

## 12. このリポジトリでの参照先

| 関心事 | 主な実装 |
|---|---|
| API DTO | `src/types/api.ts` |
| 現在OPの曲単位集約 | `src/usecases/overpower/currentOpTarget.ts` |
| 未プレイを含む譜面エントリ生成 | `src/usecases/overpower/aggregation.ts` |
| OVER POWER対象譜面の選択 | `src/usecases/overpower/aggregation.ts` |
| サマリーの現在値・理論値・達成率 | `src/usecases/overpower/overpowerSummary.ts` |
| 理論値対象難易度の共通判定 | `src/utils/theoreticalOverPowerTarget.ts` |
| ランダム選曲のOP対象 | `src/utils/randomSongSelector.ts` |
| 苦手譜面インスペクターのOP対象 | `src/utils/weakChartInspector.ts` |
| レコード画面の現在OP対象フィルター | `src/pages/users/UserRecord/utils/filtering.ts` |
| 目標の対象譜面抽出・OP進捗 | `src/pages/goals/utils/goalProgress.ts` |
| 目標の理論OP上限 | `src/pages/goals/utils/goalOverPower.ts` |

---

## 13. 実装チェックリスト

- [ ] 現在OP対象と理論値OP対象を別の概念としてモデル化した。
- [ ] 現在値はプレイヤーレコード、理論値は楽曲マスタを正としている。
- [ ] トータルOPで同じ曲の複数譜面を加算していない。
- [ ] 理論値対象譜面が未プレイでも、別譜面の現在OPを失っていない。
- [ ] `OP_TARGET` の意味をAPI・画面・集計ごとに明記した。
- [ ] 未プレイ、欠損フラグ、同値、未解禁の規則を定義した。
- [ ] 難易度文字列を大文字に統一した。
- [ ] 内部計算値と表示丸めを分離した。
- [ ] 理論値対象の同値タイブレークをバックエンドで決定した。
- [ ] 通常トータルOPと譜面単位の分析集計を区別した。
