import { CLIENT_CACHE_SCHEMA_VERSION, db, type ViewSetting } from '../lib/db/cacheDB.ts'
import type { FilterState, RecordColumnId } from '../pages/users/UserRecord/types/types.ts'
import type { WorldsendFilterState } from '../pages/users/WorldsendRecord/types/filterTypes.ts'
import type { WorldsendRecordColumnId } from '../pages/users/WorldsendRecord/utils/columns.ts'

type ViewSettingKey = ViewSetting['key']

/**
 * 画面設定キャッシュから現行スキーマの保存値を読み込む。
 *
 * @param key - 読み込む画面設定キー。
 * @returns 保存済みデータ。存在しない、またはスキーマが古い場合は null。
 */
const readViewSetting = async (key: ViewSettingKey): Promise<unknown | null> => {
  const setting = await db.viewSettings.get(key)
  if (setting?.schemaVersion !== CLIENT_CACHE_SCHEMA_VERSION) {
    return null
  }

  return setting.data
}

/**
 * 画面設定キャッシュへ現在適用中の値を保存する。
 *
 * @param setting - 保存する画面設定。
 * @returns 保存完了後に解決される Promise。
 */
const saveViewSetting = async (
  setting: Omit<ViewSetting, 'schemaVersion' | 'savedAt'>
): Promise<void> => {
  await db.viewSettings.put({
    ...setting,
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
  } as ViewSetting)
}

/**
 * 通常レコードの現在適用中フィルターを読み込む。
 *
 * @returns 保存済みフィルター。存在しない場合は null。
 */
export const readStandardRecordFilterSetting = (): Promise<unknown | null> =>
  readViewSetting('standardRecordFilter')

/**
 * 通常レコードの現在適用中フィルターを保存する。
 *
 * @param data - 保存するフィルター状態。
 * @returns 保存完了後に解決される Promise。
 */
export const saveStandardRecordFilterSetting = (data: FilterState): Promise<void> =>
  saveViewSetting({ key: 'standardRecordFilter', data })

/**
 * 通常レコードの現在適用中列表示設定を読み込む。
 *
 * @returns 保存済み列 ID 配列。存在しない場合は null。
 */
export const readStandardRecordColumnsSetting = (): Promise<unknown | null> =>
  readViewSetting('standardRecordColumns')

/**
 * 通常レコードの現在適用中列表示設定を保存する。
 *
 * @param data - 保存する列 ID 配列。
 * @returns 保存完了後に解決される Promise。
 */
export const saveStandardRecordColumnsSetting = (data: RecordColumnId[]): Promise<void> =>
  saveViewSetting({ key: 'standardRecordColumns', data })

/**
 * WORLD'S END レコードの現在適用中フィルターを読み込む。
 *
 * @returns 保存済みフィルター。存在しない場合は null。
 */
export const readWorldsendRecordFilterSetting = (): Promise<unknown | null> =>
  readViewSetting('worldsendRecordFilter')

/**
 * WORLD'S END レコードの現在適用中フィルターを保存する。
 *
 * @param data - 保存するフィルター状態。
 * @returns 保存完了後に解決される Promise。
 */
export const saveWorldsendRecordFilterSetting = (data: WorldsendFilterState): Promise<void> =>
  saveViewSetting({ key: 'worldsendRecordFilter', data })

/**
 * WORLD'S END レコードの現在適用中列表示設定を読み込む。
 *
 * @returns 保存済み列 ID 配列。存在しない場合は null。
 */
export const readWorldsendRecordColumnsSetting = (): Promise<unknown | null> =>
  readViewSetting('worldsendRecordColumns')

/**
 * WORLD'S END レコードの現在適用中列表示設定を保存する。
 *
 * @param data - 保存する列 ID 配列。
 * @returns 保存完了後に解決される Promise。
 */
export const saveWorldsendRecordColumnsSetting = (data: WorldsendRecordColumnId[]): Promise<void> =>
  saveViewSetting({ key: 'worldsendRecordColumns', data })
