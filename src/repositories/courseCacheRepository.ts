import {
  type CachedCourse,
  type CachedUserCourseRecord,
  CLIENT_CACHE_SCHEMA_VERSION,
  db,
} from '../lib/db/cacheDB'
import type { CourseDTO, UserCourseRecordsDTO } from '../types/api'
import type { PlayedCourseRecords } from '../types/courseRecord'
import { toPlayedCourseRecords } from '../utils/courseRecordMerger'

/** ユーザー別コースレコードキャッシュの照合条件 */
export type UserCourseRecordCacheMatch = {
  username: string
  userUpdatedAt: string | null
}

/**
 * ユーザー別コースレコードの IndexedDB キーを生成する。
 *
 * @param username - 対象ユーザー名。
 * @param courseId - コース表示ID。
 * @returns IndexedDBで使用する一意なキー。
 */
const createUserCourseRecordKey = (username: string, courseId: string): string =>
  JSON.stringify([username, courseId])

/**
 * コースマスタキャッシュを読み込む。
 *
 * @param coursesUpdatedAt - APIから取得したコースマスタ更新日時。
 * @returns 利用可能なコースマスタ一覧。キャッシュが無効な場合はnull。
 */
export const readCachedCourses = async (
  coursesUpdatedAt: string | null
): Promise<CourseDTO[] | null> => {
  const metadata = await db.cacheMetadata.get('courses')
  if (
    metadata?.schemaVersion !== CLIENT_CACHE_SCHEMA_VERSION ||
    metadata.coursesUpdatedAt !== coursesUpdatedAt
  ) {
    return null
  }

  const cachedCourses = await db.courses.toArray()
  if (!cachedCourses.every((course) => Number.isInteger(course.sortOrder))) {
    return null
  }

  return cachedCourses
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((course) => course.data)
}

/**
 * コースマスタキャッシュを一覧単位で置き換える。
 *
 * @param courses - 保存するコースマスタ一覧。
 * @param coursesUpdatedAt - APIから取得したコースマスタ更新日時。
 * @returns 保存完了後に解決されるPromise。
 */
export const replaceCachedCourses = async (
  courses: CourseDTO[],
  coursesUpdatedAt: string | null
): Promise<void> => {
  const fetchedAt = new Date().toISOString()
  const entries = courses.map(
    (course, sortOrder): CachedCourse => ({
      id: course.display_id,
      sortOrder,
      data: course,
    })
  )

  await db.transaction('rw', db.courses, db.cacheMetadata, async () => {
    await db.courses.clear()
    await db.courses.bulkPut(entries)
    await db.cacheMetadata.put({
      key: 'courses',
      schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
      coursesUpdatedAt,
      fetchedAt,
    })
  })
}

/**
 * プレイ済みコースレコードキャッシュを読み込む。
 *
 * @param match - 対象ユーザー名とユーザー関連データ更新日時。
 * @returns 利用可能なプレイ済みコースレコード。キャッシュが無効な場合はnull。
 */
export const readCachedUserCourseRecords = async (
  match: UserCourseRecordCacheMatch
): Promise<PlayedCourseRecords | null> => {
  const metadata = await db.cacheMetadata.get('userCourseRecords')
  if (
    metadata?.schemaVersion !== CLIENT_CACHE_SCHEMA_VERSION ||
    metadata.username !== match.username ||
    metadata.userUpdatedAt !== match.userUpdatedAt
  ) {
    return null
  }

  const entries = await db.userCourseRecords.where('username').equals(match.username).toArray()
  if (
    !entries.every(
      (entry) =>
        entry.schemaVersion === CLIENT_CACHE_SCHEMA_VERSION &&
        entry.username === match.username &&
        entry.userUpdatedAt === match.userUpdatedAt &&
        Number.isInteger(entry.sortOrder)
    )
  ) {
    return null
  }

  return {
    courses: entries
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((entry) => entry.data),
    meta: { updated_at: metadata.recordUpdatedAt ?? null },
  }
}

/**
 * プレイ済みコースレコードだけをユーザー単位で置き換える。
 *
 * @param username - 対象ユーザー名。
 * @param userUpdatedAt - ユーザー関連データ更新日時。
 * @param response - APIから取得したコースレコードレスポンス。
 * @returns 保存完了後に解決されるPromise。
 */
export const replaceCachedUserCourseRecords = async (
  username: string,
  userUpdatedAt: string | null,
  response: UserCourseRecordsDTO
): Promise<void> => {
  const fetchedAt = new Date().toISOString()
  const playedRecords = toPlayedCourseRecords(response)
  const entries = playedRecords.courses.map(
    (course, sortOrder): CachedUserCourseRecord => ({
      key: createUserCourseRecordKey(username, course.display_id),
      username,
      courseId: course.display_id,
      sortOrder,
      schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
      userUpdatedAt,
      fetchedAt,
      data: course,
    })
  )

  await db.transaction('rw', db.userCourseRecords, db.cacheMetadata, async () => {
    await db.userCourseRecords.clear()
    await db.userCourseRecords.bulkPut(entries)
    await db.cacheMetadata.put({
      key: 'userCourseRecords',
      schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
      username,
      userUpdatedAt,
      fetchedAt,
      recordUpdatedAt: response.meta.updated_at,
    })
  })
}
