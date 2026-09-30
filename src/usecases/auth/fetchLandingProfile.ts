import type { PlayerDTO, UserProfileDTO, UserRatingDTO } from '../../types/api'

/** トップのプロフィールカードに表示する取得結果。 */
export type LandingProfile =
  | { type: 'empty' }
  | { type: 'loaded'; player: PlayerDTO; rating: UserRatingDTO }
  | { type: 'error' }

type Dependencies = {
  fetchProfile: (username: string) => Promise<UserProfileDTO>
  fetchRating: (username: string) => Promise<UserRatingDTO>
}

/**
 * 未登録と取得失敗を区別し、登録済みユーザーの名札に必要な情報を取得する。
 *
 * @param username - ログイン中の公開ユーザー名。
 * @param dependencies - プロフィールとキャッシュ対応レーティングの取得処理。
 * @returns 未登録、名札表示用データ、または取得失敗。
 */
export const fetchLandingProfile = async (
  username: string,
  dependencies: Dependencies
): Promise<LandingProfile> => {
  try {
    const profile = await dependencies.fetchProfile(username)
    if (profile.player === null) return { type: 'empty' }

    const rating = await dependencies.fetchRating(username)
    return { type: 'loaded', player: profile.player, rating }
  } catch {
    return { type: 'error' }
  }
}
