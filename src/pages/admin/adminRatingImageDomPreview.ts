import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { RATING_SLOT_COUNT } from '../../constants/rating'
import type {
  AdminUserListResponse,
  HonorDTO,
  PlayerDTO,
  PlayerRecordDTO,
  UserRatingDTO,
} from '../../types/api'
import type { RatingImageVersion } from '../users/UserPage/UserProfileView.constants'

/** 画像化前DOM確認で使うサンプル表示データ */
export type RatingImageDomPreviewModel = {
  /** 画像ファイル名に使うユーザー名 */
  username: string
  /** 画像上部へ表示するプレイヤー情報 */
  player: PlayerDTO
  /** 画像上部へ表示する称号 */
  honors: HonorDTO[]
  /** ベスト枠・新曲枠と集計値 */
  rating: UserRatingDTO
}

/** 省略確認用の長い楽曲名 */
export const RATING_IMAGE_DOM_PREVIEW_LONG_TITLE =
  '超長い楽曲名を省略確認するために用意した日本語タイトルと ABCDEFG 0123456789'

/** 画像化前DOM確認用の最大長プレイヤー名。全角8文字 */
export const RATING_IMAGE_DOM_PREVIEW_PLAYER_NAME = 'プレイヤー名です'

/** サンプル画像のファイル名に使うユーザー名 */
export const RATING_IMAGE_DOM_PREVIEW_SAMPLE_USERNAME = 'sample'

/** ベスト枠サンプルの件数。空き枠を残す */
const SAMPLE_BEST_RECORD_COUNT = RATING_SLOT_COUNT.best - 2

/** 新曲枠サンプルの件数。空き枠を残す */
const SAMPLE_NEW_RECORD_COUNT = RATING_SLOT_COUNT.new - 2

/**
 * 画像化前DOM確認用のレコードを生成する。
 *
 * @param overrides - 上書きするレコード項目。
 * @returns 確認用レコード。
 */
const createPreviewRecord = (overrides: Partial<PlayerRecordDTO>): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: true,
  updated_at: null,
  difficulty: 'MASTER',
  id: 'preview-song',
  title: '曲',
  artist: 'アーティスト',
  const: 15,
  is_const_unknown: false,
  score: 1_009_000,
  rating: 17.25,
  overpower: 0,
  justice_count: null,
  overpower_percent: 0,
  img: '',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

/**
 * 枠内インデックスに応じた確認用レコードを生成する。
 *
 * @param prefix - レコードIDの接頭辞。
 * @param index - 枠内の0始まりインデックス。
 * @returns 難易度・曲名・ランプを変えた確認用レコード。
 */
const createIndexedPreviewRecord = (prefix: string, index: number): PlayerRecordDTO => {
  const difficulty = PLAYER_DATA_DIFFICULTIES[index % PLAYER_DATA_DIFFICULTIES.length]
  const title =
    index === 0
      ? RATING_IMAGE_DOM_PREVIEW_LONG_TITLE
      : index === 1
        ? 'A Very Long English Title That Should Truncate In The Rating Card'
        : index === 2
          ? '空白 を 含む 曲名'
          : `${prefix} ${String(index + 1)}`

  return createPreviewRecord({
    id: `${prefix}-${String(index + 1)}`,
    title,
    difficulty,
    const: 15.4 - index * 0.05,
    is_const_unknown: index === 5,
    score: index === 3 ? 1_010_000 : 1_009_000 - index * 100,
    rating: 17.4 - index * 0.02,
    combo_lamp: index === 3 ? 'ALL JUSTICE' : index === 4 ? 'FULL COMBO' : null,
    justice_count: index === 3 ? 0 : null,
  })
}

/**
 * 画像化前DOM確認用のサンプルデータを組み立てる。
 *
 * @returns 長い曲名・空き枠・各難易度を含む確認用データ。
 */
export const buildRatingImageDomPreviewSample = (): RatingImageDomPreviewModel => {
  const honors: HonorDTO[] = [
    {
      slot: 1,
      name: 'とても長い称号名を省略確認するために用意したテキスト',
      type_name: 'rainbow',
      image_url: null,
    },
    {
      slot: 3,
      name: 'STAFF',
      type_name: 'staff',
      image_url: null,
    },
  ]

  const player: PlayerDTO = {
    name: RATING_IMAGE_DOM_PREVIEW_PLAYER_NAME,
    level: 252,
    rating: 17.32,
    class_emblem_id: null,
    class_emblem_base_id: null,
    last_played_at: null,
    overpower_value: 12_345.678,
    overpower_percent: 12.34567,
    team_name: null,
    team_color: null,
    honors,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  }

  const best = Array.from({ length: SAMPLE_BEST_RECORD_COUNT }, (_, index) =>
    createIndexedPreviewRecord('best', index)
  )
  const newRecords = Array.from({ length: SAMPLE_NEW_RECORD_COUNT }, (_, index) =>
    createIndexedPreviewRecord('new', index)
  )

  const rating: UserRatingDTO = {
    rating: 17.32,
    best_average: 17.21,
    new_average: 16.84,
    best,
    best_candidate: [],
    new: newRecords,
    new_candidate: [],
    meta: { updated_at: null },
  }

  return { username: RATING_IMAGE_DOM_PREVIEW_SAMPLE_USERNAME, player, honors, rating }
}

/** 画像化前DOM確認の初期表示に使うサンプルデータ */
export const RATING_IMAGE_DOM_PREVIEW_SAMPLE = buildRatingImageDomPreviewSample()

/** 画像化前DOM確認の表示倍率（パーセント） */
export const RATING_IMAGE_DOM_PREVIEW_SCALE_PERCENT = {
  min: 10,
  max: 100,
  step: 5,
  defaultValue: 50,
} as const

/**
 * 表示倍率パーセントをCSSのscale値へ変換する。
 *
 * @param percent - 10〜100の表示倍率パーセント。
 * @returns 0.1〜1の縮小倍率。
 */
export const previewScalePercentToFactor = (percent: number): number => percent / 100

/**
 * 管理者ユーザー一覧から、検索語と完全一致するユーザー名を1件に絞る。
 *
 * @param users - 管理者向けユーザー一覧。
 * @param query - ユーザー名またはプレイヤー名。
 * @returns 一意なユーザー名。該当なしはnone、複数はmultiple。
 */
export const resolveExactAdminUsername = (
  users: readonly Pick<AdminUserListResponse, 'username' | 'player_name'>[],
  query: string
): string | 'none' | 'multiple' => {
  const matchedUsernames = [
    ...new Set(
      users
        .filter((user) => user.username === query || user.player_name === query)
        .map((user) => user.username)
    ),
  ]
  if (matchedUsernames.length === 0) return 'none'
  if (matchedUsernames.length > 1) return 'multiple'

  return matchedUsernames[0] ?? 'none'
}

/**
 * 画像化前にデコード完了を待つジャケット件数を返す。
 *
 * @param rating - ベスト枠・新曲枠。
 * @param version - デザインバージョン。
 * @param showJackets - ジャケットを表示するか。
 * @returns 待ち対象のジャケット件数。
 */
export const countRatingImagePreviewJackets = (
  rating: UserRatingDTO,
  version: RatingImageVersion,
  showJackets: boolean
): number => {
  const filledRecords = [
    ...rating.best.slice(0, RATING_SLOT_COUNT.best),
    ...rating.new.slice(0, RATING_SLOT_COUNT.new),
  ]

  if (version === 'v2') return filledRecords.length
  if (!showJackets) return 0

  return filledRecords.filter((record) => record.img.trim() !== '').length
}
