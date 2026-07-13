import { createMemo, createSignal, Show } from 'solid-js'

import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type {
  PlayerDataNumberDiff,
  PlayerDataRecordChange,
  PlayerDataResult,
} from '../../types/api'
import {
  REGISTER_SCORE_MESSAGES,
  RegisterScoreResultView,
} from '../register-score/RegisterScoreResultView'

const ZERO_DIFF: PlayerDataNumberDiff = { before: 0, after: 0, delta: 0 }

/**
 * 正差分の PlayerDataNumberDiff を生成する。
 *
 * @param before - 更新前の値。
 * @param delta - 差分値。
 * @returns 差分オブジェクト。
 */
const positiveDiff = (before: number, delta: number): PlayerDataNumberDiff => ({
  before,
  after: before + delta,
  delta,
})

/**
 * 全譜面種別・全難易度の更新差分を網羅したモックデータを生成する。
 *
 * @returns スコア登録結果のモックデータ。
 */
const createMockPlayerDataResult = (): PlayerDataResult => ({
  player_id: 12345,
  app_ver: 'CHUNITHM LUMINOUS PLUS',
  imported_at: '2026-07-10T15:30:00+09:00',
  profile: {
    player_id: 12345,
    name: 'テストプレイヤー',
    level: 99,
    rating: 16.25,
    class_emblem_id: null,
    class_emblem_base_id: null,
    last_played_at: '2026-07-10T14:00:00+09:00',
    overpower_value: 12345,
    overpower_percent: 78.5,
  },
  summary: {
    name: 'テストプレイヤー',
    level: 99,
    rating: 16.25,
    last_played_at: '2026-07-10T14:00:00+09:00',
    overpower_value: 12345,
    overpower_percentage: 78.5,
  },
  statistics: {
    overall: {
      total_high_score: positiveDiff(9800000, 250000),
      record_statistics: {
        aj: positiveDiff(5, 1),
        fc: positiveDiff(25, 3),
        clr: positiveDiff(120, 8),
        fch: ZERO_DIFF,
        max: positiveDiff(3, 0),
        sss_plus: positiveDiff(15, 2),
        sss: positiveDiff(30, 1),
        ss_plus: positiveDiff(20, -1),
        ss: positiveDiff(18, 0),
        s_plus: positiveDiff(10, 0),
        s: positiveDiff(5, 0),
      },
    },
    by_difficulty: {
      BASIC: {
        total_high_score: positiveDiff(2000000, 50000),
        record_statistics: {
          aj: positiveDiff(2, 1),
          fc: positiveDiff(8, 0),
          clr: positiveDiff(30, 2),
          fch: ZERO_DIFF,
          max: positiveDiff(0, 0),
          sss_plus: positiveDiff(3, 0),
          sss: positiveDiff(5, 0),
          ss_plus: positiveDiff(4, 0),
          ss: positiveDiff(3, 0),
          s_plus: positiveDiff(2, 0),
          s: positiveDiff(1, 0),
        },
      },
      ADVANCED: {
        total_high_score: positiveDiff(2200000, 80000),
        record_statistics: {
          aj: positiveDiff(1, 0),
          fc: positiveDiff(6, 1),
          clr: positiveDiff(25, 1),
          fch: ZERO_DIFF,
          max: positiveDiff(1, 0),
          sss_plus: positiveDiff(4, 1),
          sss: positiveDiff(8, 0),
          ss_plus: positiveDiff(6, -1),
          ss: positiveDiff(5, 0),
          s_plus: positiveDiff(3, 0),
          s: positiveDiff(2, 0),
        },
      },
      EXPERT: {
        total_high_score: positiveDiff(2800000, 70000),
        record_statistics: {
          aj: positiveDiff(1, 0),
          fc: positiveDiff(5, 1),
          clr: positiveDiff(28, 3),
          fch: ZERO_DIFF,
          max: positiveDiff(1, 0),
          sss_plus: positiveDiff(4, 0),
          sss: positiveDiff(7, 1),
          ss_plus: positiveDiff(5, 0),
          ss: positiveDiff(4, 0),
          s_plus: positiveDiff(2, 0),
          s: positiveDiff(1, 0),
        },
      },
      MASTER: {
        total_high_score: positiveDiff(2000000, 40000),
        record_statistics: {
          aj: positiveDiff(1, 0),
          fc: positiveDiff(4, 1),
          clr: positiveDiff(25, 2),
          fch: ZERO_DIFF,
          max: positiveDiff(1, 0),
          sss_plus: positiveDiff(3, 1),
          sss: positiveDiff(6, 0),
          ss_plus: positiveDiff(3, 0),
          ss: positiveDiff(4, 0),
          s_plus: positiveDiff(2, 0),
          s: positiveDiff(1, 0),
        },
      },
      ULTIMA: {
        total_high_score: positiveDiff(800000, 10000),
        record_statistics: {
          aj: ZERO_DIFF,
          fc: positiveDiff(2, 0),
          clr: positiveDiff(12, 0),
          fch: ZERO_DIFF,
          max: ZERO_DIFF,
          sss_plus: positiveDiff(1, 0),
          sss: positiveDiff(4, 0),
          ss_plus: positiveDiff(2, 0),
          ss: positiveDiff(2, 0),
          s_plus: positiveDiff(1, 0),
          s: ZERO_DIFF,
        },
      },
    },
  },
  counts: {
    standard_records_upserted: 25,
    worldsend_records_upserted: 3,
    standard_records_skipped: 0,
    worldsend_records_skipped: 0,
    honors_skipped: 0,
    standard_records_actually_changed: 18,
    worldsend_records_actually_changed: 2,
    course_records_upserted: 7,
    course_records_skipped: 0,
    course_records_actually_changed: 7,
  },
  changes: createMockChanges(),
  skipped_records: [],
})

/**
 * 全難易度・全ランプ種別・新規/更新を網羅した更新差分一覧を生成する。
 *
 * @returns 更新差分の配列。
 */
const createMockChanges = (): PlayerDataRecordChange[] => [
  // --- 新規レコード ---
  {
    record_type: 'standard',
    change_type: 'new',
    idx: '1001',
    diff: 'BASIC',
    before: null,
    after: { score: 1007500, clear_lamp: 'CLEAR', combo_lamp: 'FULL COMBO', full_chain: null },
  },
  {
    record_type: 'standard',
    change_type: 'new',
    idx: '2001',
    diff: 'ADVANCED',
    before: null,
    after: { score: 1009000, clear_lamp: 'HARD CLEAR', combo_lamp: null, full_chain: null },
  },
  {
    record_type: 'standard',
    change_type: 'new',
    idx: '3001',
    diff: 'EXPERT',
    before: null,
    after: {
      score: 1010000,
      clear_lamp: 'FULL COMBO',
      combo_lamp: 'ALL JUSTICE',
      full_chain: null,
    },
  },
  {
    record_type: 'standard',
    change_type: 'new',
    idx: '4001',
    diff: 'MASTER',
    before: null,
    after: {
      score: 1009500,
      clear_lamp: 'CLEAR',
      combo_lamp: 'FULL COMBO',
      full_chain: 'FULL CHAIN GOLD',
    },
  },
  {
    record_type: 'standard',
    change_type: 'new',
    idx: '5001',
    diff: 'ULTIMA',
    before: null,
    after: { score: 1008000, clear_lamp: 'FAILED', combo_lamp: null, full_chain: null },
  },
  // --- スコア更新あり ---
  {
    record_type: 'standard',
    change_type: 'updated',
    idx: '1002',
    diff: 'BASIC',
    before: { score: 990000, clear_lamp: 'CLEAR', combo_lamp: null, full_chain: null },
    after: { score: 1005000, clear_lamp: 'CLEAR', combo_lamp: 'FULL COMBO', full_chain: null },
  },
  {
    record_type: 'standard',
    change_type: 'updated',
    idx: '2002',
    diff: 'ADVANCED',
    before: { score: 980000, clear_lamp: 'HARD CLEAR', combo_lamp: null, full_chain: null },
    after: {
      score: 1002000,
      clear_lamp: 'FULL COMBO',
      combo_lamp: 'FULL COMBO',
      full_chain: null,
    },
  },
  {
    record_type: 'standard',
    change_type: 'updated',
    idx: '3002',
    diff: 'EXPERT',
    before: { score: 1000000, clear_lamp: 'FULL COMBO', combo_lamp: null, full_chain: null },
    after: {
      score: 1010000,
      clear_lamp: 'FULL COMBO',
      combo_lamp: 'ALL JUSTICE',
      full_chain: null,
    },
  },
  {
    record_type: 'standard',
    change_type: 'updated',
    idx: '4002',
    diff: 'MASTER',
    before: { score: 950000, clear_lamp: 'CLEAR', combo_lamp: null, full_chain: null },
    after: {
      score: 1008000,
      clear_lamp: 'CLEAR',
      combo_lamp: 'FULL COMBO',
      full_chain: 'FULL CHAIN PLATINUM',
    },
  },
  {
    record_type: 'standard',
    change_type: 'updated',
    idx: '5002',
    diff: 'ULTIMA',
    before: { score: 900000, clear_lamp: 'FAILED', combo_lamp: null, full_chain: null },
    after: { score: 960000, clear_lamp: 'CLEAR', combo_lamp: null, full_chain: null },
  },
  // --- スコア更新なし（ランプのみ） ---
  {
    record_type: 'standard',
    change_type: 'updated',
    idx: '1003',
    diff: 'BASIC',
    before: { score: 1000000, clear_lamp: 'CLEAR', combo_lamp: null, full_chain: null },
    after: { score: 1000000, clear_lamp: 'HARD CLEAR', combo_lamp: 'FULL COMBO', full_chain: null },
  },
  {
    record_type: 'standard',
    change_type: 'updated',
    idx: '3003',
    diff: 'EXPERT',
    before: { score: 1010000, clear_lamp: 'FULL COMBO', combo_lamp: null, full_chain: null },
    after: {
      score: 1010000,
      clear_lamp: 'FULL COMBO',
      combo_lamp: 'ALL JUSTICE',
      full_chain: 'FULL CHAIN GOLD',
    },
  },
  // --- 通常譜面：譜面定数不明（レベルは判明済み） ---
  {
    record_type: 'standard',
    change_type: 'new',
    idx: '9001',
    diff: 'MASTER',
    before: null,
    after: {
      score: 1005000,
      clear_lamp: 'CLEAR',
      combo_lamp: 'FULL COMBO',
      full_chain: 'FULL CHAIN GOLD',
    },
  },
  // --- WORLD'S END ---
  {
    record_type: 'worldsend',
    change_type: 'new',
    idx: 'WE001',
    diff: 'WE',
    before: null,
    after: { score: 500000, clear_lamp: 'CLEAR', combo_lamp: null, full_chain: null },
  },
  {
    record_type: 'worldsend',
    change_type: 'updated',
    idx: 'WE002',
    diff: 'WE',
    before: { score: 400000, clear_lamp: 'FAILED', combo_lamp: null, full_chain: null },
    after: { score: 520000, clear_lamp: 'CLEAR', combo_lamp: null, full_chain: null },
  },
  // --- コース ---
  {
    record_type: 'course',
    change_type: 'new',
    idx: '50020',
    course_class: '1',
    before: null,
    after: { score: 3023238, is_clear: true, combo_lamp: 'FULL COMBO' },
  },
  {
    record_type: 'course',
    change_type: 'updated',
    idx: '50021',
    course_class: '2',
    before: { score: 2865000, is_clear: true, combo_lamp: null },
    after: { score: 2900000, is_clear: true, combo_lamp: 'FULL COMBO' },
  },
  {
    record_type: 'course',
    change_type: 'new',
    idx: '50022',
    course_class: '3',
    before: null,
    after: { score: 2700000, is_clear: true, combo_lamp: null },
  },
  {
    record_type: 'course',
    change_type: 'updated',
    idx: '50023',
    course_class: '4',
    before: { score: 2490000, is_clear: false, combo_lamp: null },
    after: { score: 2600000, is_clear: true, combo_lamp: null },
  },
  {
    record_type: 'course',
    change_type: 'new',
    idx: '50024',
    course_class: '5',
    before: null,
    after: { score: 2550000, is_clear: true, combo_lamp: 'ALL JUSTICE' },
  },
  {
    record_type: 'course',
    change_type: 'updated',
    idx: '50025',
    course_class: 'inf',
    before: { score: 2400000, is_clear: true, combo_lamp: 'FULL COMBO' },
    after: { score: 2500000, is_clear: true, combo_lamp: 'ALL JUSTICE' },
  },
  {
    record_type: 'course',
    change_type: 'updated',
    idx: '50029',
    course_class: 'extra',
    before: { score: 2800000, is_clear: false, combo_lamp: null },
    after: { score: 3000000, is_clear: true, combo_lamp: 'ALL JUSTICE' },
  },
]

/**
 * 楽曲タイトル一覧（idx -> 曲名）。
 */
const MOCK_SONG_TITLES: Record<string, string> = {
  '1001': '新規Basic曲',
  '1002': 'Basic更新曲',
  '1003': 'Basicランプ更新曲',
  '2001': '新規Advanced曲',
  '2002': 'Advanced更新曲',
  '3001': '新規Expert曲 (AJ)',
  '3002': 'Expert更新曲 (FC→AJ)',
  '3003': 'Expertランプ更新曲',
  '4001': '新規Master曲 (FCG)',
  '4002': 'Master更新曲 (FCP)',
  '5001': '新規Ultima曲 (FAILED)',
  '5002': 'Ultima更新曲',
  '9001': '定数不明Master曲',
  WE001: 'WorldSend新規曲',
  WE002: 'WorldSend更新曲',
}

/**
 * 譜面定数一覧（idx -> 譜面レベル）。
 */
const MOCK_CHART_LEVELS: Record<string, string> = {
  '1001': '11',
  '1002': '11+',
  '1003': '11',
  '2001': '12+',
  '2002': '12',
  '3001': '13+',
  '3002': '14',
  '3003': '14+',
  '4001': '14+',
  '4002': '15',
  '5001': '15',
  '5002': '15+',
  '9001': '15',
  WE001: '★3',
  WE002: '★5',
}

/** コースidxとモック表示タイトルの対応表。 */
const MOCK_COURSE_TITLES: Record<string, string> = {
  '50020': 'CLASS I COURSE',
  '50021': 'CLASS II COURSE',
  '50022': 'CLASS III COURSE',
  '50023': 'CLASS IV COURSE',
  '50024': 'CLASS V COURSE',
  '50025': 'INFINITE COURSE',
  '50029': 'EXTRA COURSE',
}

/**
 * idx からモックの楽曲タイトルを解決する。
 *
 * @param change - APIから返却された1譜面分の差分。
 * @returns 楽曲タイトル。
 */
const resolveMockSongTitle = (change: PlayerDataRecordChange): string => {
  return MOCK_SONG_TITLES[change.idx] ?? REGISTER_SCORE_MESSAGES.unknownSongTitle
}

/**
 * idx からモックの譜面レベル文字列を解決する。
 *
 * @param change - APIから返却された1譜面分の差分。
 * @returns 譜面レベル文字列（例: "15+"、"★5"）。譜面情報がない場合はundefined。
 */
const resolveMockChartLevel = (change: PlayerDataRecordChange): string | undefined => {
  return MOCK_CHART_LEVELS[change.idx]
}

/**
 * idxからモックのコースタイトルを解決する。
 *
 * @param change - APIから返却されたコース差分。
 * @returns コースタイトル。
 */
const resolveMockCourseTitle = (
  change: Extract<PlayerDataRecordChange, { record_type: 'course' }>
) => {
  return MOCK_COURSE_TITLES[change.idx] ?? REGISTER_SCORE_MESSAGES.unknownSongTitle
}

/**
 * 更新差分のデザイン・フォントを確認するためのモックページ。
 *
 * @returns RegisterScoreResultView に全パターンのモックデータを流し込んだ画面。
 */
const RegisterScoreMockPage = () => {
  const mockResult = createMemo(() => createMockPlayerDataResult())
  const [showEmptyChanges, setShowEmptyChanges] = createSignal(false)
  const emptyResult = createMemo(
    (): PlayerDataResult => ({
      ...createMockPlayerDataResult(),
      changes: [],
    })
  )

  useDocumentTitle('更新差分 デザイン確認 (モック)')

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold">更新差分 デザイン確認 (モック)</h1>
        <button
          type="button"
          class="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-muted"
          onClick={() => setShowEmptyChanges((prev) => !prev)}
        >
          {showEmptyChanges() ? '差分ありデータに切り替え' : '差分なしデータに切り替え'}
        </button>
      </div>

      <Show
        when={!showEmptyChanges()}
        fallback={
          <div class="flex flex-col gap-4">
            <p class="text-sm text-text-muted">更新差分がない場合の表示を確認します。</p>
            <RegisterScoreResultView
              result={emptyResult()}
              resolveSongTitle={resolveMockSongTitle}
              resolveChartLevel={resolveMockChartLevel}
              resolveCourseTitle={resolveMockCourseTitle}
            />
          </div>
        }
      >
        <RegisterScoreResultView
          result={mockResult()}
          resolveSongTitle={resolveMockSongTitle}
          resolveChartLevel={resolveMockChartLevel}
          resolveCourseTitle={resolveMockCourseTitle}
        />
      </Show>
    </main>
  )
}

export default RegisterScoreMockPage
