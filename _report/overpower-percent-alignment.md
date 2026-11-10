# OVER POWER 達成率の表示ズレ — 原因とフロント修正方針

**作成日**: 2026年06月30日  
**対象**: ユーザーページ（ネームプレート vs OVER POWER タブ）  
**ステータス**: 調査完了・修正方針策定（未実装）

---

## 概要

同一ユーザーページ内で、ネームプレートの OVER POWER 達成率（%）と OVER POWER タブの TOTAL 行の % が一致しないことがある。  
実数値（TOTAL OVER POWER）は同じように見えても、パーセンテージだけ第4位でずれるケースが報告されている。

**結論**: 誤差の原因はバックエンドではなく、**フロントエンドの OVER POWER タブが API 公式値を使わずクライアント再計算していること**にある。正とする値は API の `player.overpower_value` / `player.overpower_percent` である。

---

## 表示箇所ごとのデータソース（現状）

| 箇所 | 実数値 | パーセンテージ |
| --- | --- | --- |
| **ネームプレート** | API `player.overpower_value`（DB 保存値） | API `player.overpower_percent`（レスポンス時に計算） |
| **OVER POWER タブ（TOTAL）** | フロントでレコードから再集計した `summary.all.current` | フロントで `(current / max) * 100` を再計算 |

### ネームプレート（API 値をそのまま表示）

- `src/pages/users/UserPage/components/UserNameplate.tsx`
- `formatOverPowerValue` / `formatOverPowerPercent` で整形

### OVER POWER タブ（ローカル集計結果を表示）

- `src/usecases/overpower/overpowerSummary.ts` → `buildOverPowerSummary` → `summary.all`
- `src/pages/users/UserOverPower/components/OverPowerAllSummary.tsx` で TOTAL 行を描画

### データ受け渡しの分離（構造上の原因）

`UserProfileView` はネームプレートに `props.profile.player` を渡す一方、`UserOverPower` には `record` のみを渡している。

```
UserPage
  └─ UserProfileView
       ├─ UserNameplate          ← profile.player（API 公式値）
       └─ UserOverPower          ← record のみ（player 未渡し）
            └─ buildOverPowerSummary（クライアント再集計）
```

`linkedRecordProfile`（`UserPage.tsx`）には既に `player: PlayerDTO` が含まれているが、OVER POWER タブまで伝播していない。

---

## API 側の計算（参考・正とする仕様）

### 実数値 `overpower_value`

- プレイヤーデータ登録時に再集計され、**小数第3位で四捨五入**して DB に保存される。
- 参照: `chunisupport-api/internal/domain/service/overpower_summary_service.go`

### パーセンテージ `overpower_percent`

- プロフィール取得時に、保存済み実数値と**その時点の分母**から動的計算される（DB には保存しない）。
- 分母: `OverpowerDenominatorProvider` が DB マスタから構築した全曲理論値合計から未解禁設定を差し引いた値（10分 TTL スナップショット）。
- 計算: `overpowerValue / maxOverpowerTotal * 100` を **小数第4位で四捨五入**（`math.Round`）、0〜100 にクランプ。
- 参照: `CalcOverpowerPercent`（`overpower_summary_service.go`）、`user_usecase_impl.go`

API ドキュメントでも、トータル OP は保存値、達成割合はレスポンス時点の最新マスタから随時計算すると明記されている。

---

## フロント側の計算（OVER POWER タブ）

### 実数値 `summary.all.current`

- 各レコードの `overpower` を曲ごとに最大値を取り、全曲分を合算（DB 保存値は使わない）。
- 参照: `src/usecases/overpower/currentOpTarget.ts` → `buildCurrentOverPowerBySongId`

### 分母 `summary.all.max`

- IndexedDB 等にキャッシュした楽曲マスタの `song.maxop` を合算（API のスナップショットは使わない）。
- 未解禁曲・ULTIMA 未解禁は `overpowerSummary.ts` 内で差し引き。

### パーセンテージ `summary.all.percent`

- `(current / max) * 100` を計算し、表示時に **小数第4位で切り捨て**（`Math.trunc`）。
- 参照: `calcPercent`（`overpowerSummary.ts`）、`formatOverPowerPercent`（`overPowerFormat.ts`）

---

## ズレが生じる3つの要因

### 1. 分子の精度差（最も影響が大きい）

| | 分子 |
| --- | --- |
| API | `round(生の合計, 3)` を保存した値 |
| タブ | 各レコード `overpower` の合計（丸め前に近い値） |

実数値の表示は `toFixed(3)`（四捨五入）のため、丸め前の値が異なっても表示は同じになり得る。  
一方、パーセンテージは丸め後の値を分子に使うかどうかで第4位までずれる。

**例**（分母 1500 の場合）:

| 項目 | 値 |
| --- | --- |
| 生の合計 | 999.9995 |
| DB 保存値 / 表示 | 1000.000 |
| タブの合計 | 999.9995 |
| API の % | `round(1000/1500*100, 4)` = **66.6667** |
| タブの % | `trunc(999.9995/1500*100, 4)` = **66.6666** |

### 2. 丸め方式の違い

| | 丸め |
| --- | --- |
| API | 第4位で**四捨五入**（`math.Round`） |
| タブ | 生計算 → 表示時に第4位で**切り捨て**（`Math.trunc`） |

境界値（例: `99.99995%`）では API が `100.0000`、タブが `99.9999` になる可能性がある。

### 3. 分母の算出元の違い

| | 分母のソース |
| --- | --- |
| API | DB から直接構築するスナップショット（10分キャッシュ） |
| タブ | フロントの楽曲マスタキャッシュ（`song.maxop` 合計） |

ロジックは同等だが、マスタキャッシュの鮮度や `float64` / `number` の累積誤差で微妙にずれる可能性がある。

---

## 修正の目的

| 優先度 | 目的 |
| --- | --- |
| **必須** | ネームプレートと OVER POWER タブの TOTAL 行で、実数値・達成率が一致する |
| **推奨** | 公式値の定義（API 仕様）に沿った表示に統一する |
| **任意** | ジャンル・難易度・レベル等の内訳行も API と同じ丸め規則に揃える |

内訳行は API が個別に返さないため、完全な API 一致は TOTAL 行の公式値利用が最も現実的である。

---

## 修正方針

### 方針 A（推奨）: TOTAL 行だけ API 公式値を使う

**概要**: OVER POWER タブの TOTAL 表示（`OverPowerAllSummary`）に限り、`player.overpower_value` / `player.overpower_percent` を表示する。内訳（ジャンル・難易度・レベル・バージョン）は従来どおりローカル集計を維持する。

**メリット**

- 変更範囲が小さい
- API 追加・マスタ同期の完全一致が不要
- ネームプレートとの一致が確実

**デメリット**

- `current / max` の分母（`summary.all.max`）はローカル計算のままのため、理論上 `current / max` の比率と `percent` が厳密には一致しない場合がある（公式 % は API 分母ベース）

**実装ステップ**

1. **`UserOverPower` に `player` を渡す**
   - `UserProfileView.tsx`: `recordProfile().player` を `UserOverPower` の props に追加
   - `UserOverPower.tsx`: `Props` に `player: PlayerDTO`（または `overpower_value` / `overpower_percent` のみ）を追加

2. **`OverPowerAllSummary` の表示ソースを分岐**
   - TOTAL の実数値: `player.overpower_value ?? summary.current`（null 時はフォールバック）
   - TOTAL の %: `player.overpower_percent` が非 null ならそれを使用、否则は `summary.percent`
   - 曲数 `count`・分母 `max` は従来どおり `summary` から表示（参考情報として維持）

3. **表示整形は既存ユーティリティを共用**
   - `formatOverPowerValue` / `formatOverPowerPercent` をネームプレートと同じく使用

4. **テスト**
   - `OverPowerAllSummary` 相当の表示ロジック、または props 組み立ての単体テストを追加
   - 手動確認: ネームプレートと TOTAL 行の値・% が一致すること

**変更対象ファイル（想定）**

| ファイル | 変更内容 |
| --- | --- |
| `src/pages/users/UserPage/UserProfileView.tsx` | `player` を `UserOverPower` に渡す |
| `src/pages/users/UserOverPower/UserOverPower.tsx` | props 拡張、`OverPowerAllSummary` へ公式値を渡す |
| `src/pages/users/UserOverPower/components/OverPowerAllSummary.tsx` | 公式値優先の表示ロジック |
| `src/pages/users/UserOverPower/components/OverPowerAllSummary.test.ts`（新規） | 公式値優先・フォールバックのテスト |

---

### 方針 B: フロント計算を API と同じ規則に揃える

**概要**: `calcOverpowerPercent` 相当のユーティリティを `src/utils` に追加し、`buildOverPowerSummary` の `percent` 計算を API の `CalcOverpowerPercent` に合わせる。TOTAL の `current` も 3 桁四捨五入済み値を分子に使う。

**API 同等ロジック（参考実装）**

```typescript
/** 指定桁数で四捨五入する（API の roundToScale 相当）。 */
const roundToScale = (value: number, decimalPlaces: number): number => {
  const factor = 10 ** decimalPlaces
  return Math.round(value * factor) / factor
}

/**
 * OVER POWER 達成率を API と同じ規則で計算する。
 * - 分母 <= 0 のとき 0
 * - (value / max) * 100 を小数第4位で四捨五入
 * - 0〜100 にクランプ
 */
export const calcOverpowerPercent = (overpowerValue: number, maxOverpowerTotal: number): number => {
  if (maxOverpowerTotal <= 0) return 0
  const raw = (overpowerValue / maxOverpowerTotal) * 100
  return Math.min(Math.max(roundToScale(raw, 4), 0), 100)
}
```

**追加で必要な変更**

- `buildAllSummary` の `current` を `roundToScale(rawSum, 3)` で丸めてから `calcOverpowerPercent` に渡す
- 分母は引き続きフロントの楽曲キャッシュ由来のため、API と完全一致は保証されない
- `formatOverPowerPercent` の切り捨て表示は、API 値利用時とローカル計算時で挙動を揃える必要がある（方針 A と併用するなら TOTAL は API 値で問題なし）

**メリット**

- 内訳行（ジャンル・難易度など）にも同じ丸め規則を適用できる
- API 仕様への理解がコードに明示される

**デメリット**

- 分母のソース差は残るため、TOTAL 行の完全一致は方針 A より不確実
- 目標機能（`goalProgress.ts`）など他の OP % 計算箇所との整合も検討が必要

**変更対象ファイル（想定）**

| ファイル | 変更内容 |
| --- | --- |
| `src/utils/overpowerPercent.ts`（新規） | `calcOverpowerPercent` |
| `src/utils/overpowerPercent.test.ts`（新規） | API テストケースと同等の Given-When-Then |
| `src/usecases/overpower/overpowerSummary.ts` | `calcPercent` を置き換え、`current` の 3 桁丸め |
| `src/pages/goals/utils/goalProgress.ts`（任意） | `overpower_percent` 目標の進捗計算を同ユーティリティに統一 |

---

### 方針 C（非推奨・単独では不十分）: 表示丸めのみ統一

**概要**: `formatOverPowerPercent` を四捨五入に変更する。

**問題点**: 分子・分母の経路差は解消されない。ネームプレートとタブの一致にはならない。単独採用は非推奨。

---

## 推奨する進め方

```
Phase 1（必須）: 方針 A を実装
  → ネームプレートと TOTAL 行の一致を最優先で解消

Phase 2（任意）: 方針 B を内訳行に段階適用
  → ジャンル・難易度・レベル等の % 表示を API 規則に近づける
  → goalProgress 等の関連ロジックも同ユーティリティへ集約
```

方針 A だけでユーザーが気づく不一致（ネームプレート vs TOTAL）は解消できる。

---

## 影響範囲の整理

### 今回の修正対象

| コンポーネント / モジュール | 関与 |
| --- | --- |
| `UserNameplate` | 変更不要（既に API 公式値） |
| `OverPowerAllSummary` | **修正対象（方針 A）** |
| `UserOverPower` / `UserProfileView` | props 伝播 |
| `overpowerSummary.ts` | 方針 B 実施時に修正 |
| `overPowerFormat.ts` | 方針 A では変更不要 |

### 関連するが別判断が必要な箇所

| 箇所 | 備考 |
| --- | --- |
| `src/pages/goals/utils/goalProgress.ts` | `overpower_percent` 目標はローカル再計算。方針 B 適用時に要検討 |
| `src/pages/register-score/RegisterScoreResultView.tsx` | 登録結果は API 返却値（`overpower_percentage`）を表示。今回のズレとは別経路 |
| `src/pages/users/UserRecord/utils/columnRenderers.tsx` | 譜面ごとの `record.overpower_percent`（2桁表示）。TOTAL とは別 |

---

## 検証観点（実装後）

### 手動確認

- [ ] 同一ユーザーでネームプレートの OVER POWER 実数値・% と TOTAL 行が一致する
- [ ] `overpower_value` / `overpower_percent` が null のユーザーでフォールバック表示が崩れない
- [ ] 未解禁曲設定変更後、内訳行は変化するが TOTAL 公式値は API 再取得後に更新されること

### 自動テスト

- [ ] `calcOverpowerPercent`（方針 B 時）: API テスト `小数第4位に丸める`（1/3 → 33.3333）と同等
- [ ] `OverPowerAllSummary`: API 公式値が渡されたときネームプレートと同じ整形結果になること
- [ ] 既存 `overpowerSummary.test.ts` が方針 B 適用後も意図どおり（丸め規則変更を反映）

### CI

- [ ] `pnpm check:ci`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] 変更した `src/utils` / `src/usecases` にテストを追加した場合は `pnpm test:unit`

---

## まとめ

| 項目 | ネームプレート | OVER POWER タブ（現状） |
| --- | --- | --- |
| 分子 | DB 保存値（3桁四捨五入済み） | レコード合計（丸め前に近い） |
| 分母 | API DB スナップショット | フロント楽曲キャッシュ |
| % の丸め | API: 4桁四捨五入 → 表示時切り捨て | 生計算 → 4桁切り捨て |
| 正しさ | **公式値** | 近似値（参考表示） |

「フロントエンドに誤差の原因がある」と言われた場合の意味は、**API の計算が誤っているのではなく、タブが公式値を使わない実装になっている**ことである。

**推奨修正**: 方針 A で TOTAL 行に `player.overpower_value` / `player.overpower_percent` を渡し、ネームプレートと一致させる。内訳の精度統一が必要になった段階で方針 B を検討する。