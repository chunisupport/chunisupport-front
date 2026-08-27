export const SETTINGS_SECTIONS = [
  { id: 'appearance', label: '外観' },
  { id: 'profile', label: 'プロフィール' },
  { id: 'api', label: 'API・外部連携' },
  { id: 'data', label: 'データ管理' },
  { id: 'account', label: 'アカウント' },
] as const

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id']

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = 'appearance'

const LEGACY_SECTION_CATEGORIES: Readonly<Record<string, SettingsSectionId>> = {
  privacy: 'profile',
  'api-token': 'api',
  'data-transfer': 'data',
  'player-data': 'data',
  'account-delete': 'account',
}

/**
 * URLから受け取った値を有効な設定カテゴリへ正規化する。
 *
 * @param section - URLで指定されたカテゴリID。
 * @returns 対応するカテゴリID。未知の値の場合は既定カテゴリ。
 */
export const normalizeSettingsSection = (section?: string): SettingsSectionId =>
  SETTINGS_SECTIONS.find((candidate) => candidate.id === section)?.id ??
  (section && Object.hasOwn(LEGACY_SECTION_CATEGORIES, section)
    ? LEGACY_SECTION_CATEGORIES[section]
    : undefined) ??
  DEFAULT_SETTINGS_SECTION
