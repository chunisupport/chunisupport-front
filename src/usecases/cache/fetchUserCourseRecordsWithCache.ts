import { fetchUserCourseRecords, fetchUserUpdatedAt } from '../../api/users'
import {
  readCachedUserCourseRecords,
  replaceCachedUserCourseRecords,
} from '../../repositories/courseCacheRepository'
import type { UserCourseRecordsDTO } from '../../types/api'
import type { PlayedCourseRecords } from '../../types/courseRecord'
import {
  mergeCourseRecords,
  newerCourseUpdatedAt,
  toPlayedCourseRecords,
} from '../../utils/courseRecordMerger'
import { fetchCoursesWithCache } from './fetchCoursesWithCache'
import { isAuthenticatedOwnUser } from './userApiCache'

/**
 * プレイ済みコースレコードを本人だけIndexedDBキャッシュ判定付きで取得する。
 *
 * @param username - レコード取得対象のユーザー名。
 * @returns APIまたはキャッシュから取得したプレイ済みコースレコード。
 */
const fetchPlayedCourseRecordsWithCache = async (
  username: string
): Promise<PlayedCourseRecords> => {
  if (!(await isAuthenticatedOwnUser(username))) {
    return toPlayedCourseRecords(await fetchUserCourseRecords(username))
  }

  let userUpdatedAt: string | null
  try {
    userUpdatedAt = (await fetchUserUpdatedAt(username)).updated_at
  } catch {
    return toPlayedCourseRecords(await fetchUserCourseRecords(username))
  }

  try {
    const cachedRecords = await readCachedUserCourseRecords({ username, userUpdatedAt })
    if (cachedRecords) {
      return cachedRecords
    }
  } catch {
    return toPlayedCourseRecords(await fetchUserCourseRecords(username))
  }

  const response = await fetchUserCourseRecords(username)
  try {
    await replaceCachedUserCourseRecords(username, userUpdatedAt, response)
  } catch {
    // IndexedDBへの保存失敗は画面表示を止めない。
  }

  return toPlayedCourseRecords(response)
}

/**
 * コースマスタとプレイ済みレコードを別々に取得・キャッシュし、表示用一覧へ結合する。
 *
 * @param username - レコード取得対象のユーザー名。
 * @returns 未プレイコースを含むコースレコード一覧。
 */
export const fetchUserCourseRecordsWithCache = async (
  username: string
): Promise<UserCourseRecordsDTO> => {
  const [courseMaster, records] = await Promise.all([
    fetchCoursesWithCache(),
    fetchPlayedCourseRecordsWithCache(username),
  ])

  return mergeCourseRecords(
    courseMaster.courses,
    records.courses,
    newerCourseUpdatedAt(courseMaster.updatedAt, records.meta.updated_at)
  )
}
