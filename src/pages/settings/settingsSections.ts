import { localizedCopy, withLocalizedLabels } from '../../i18n'
export const SETTINGS_SECTIONS = withLocalizedLabels(
  [
    { id: 'appearance' },
    { id: 'profile' },
    { id: 'api' },
    { id: 'data' },
    { id: 'account' },
  ] as const,
  localizedCopy('settings.sections'),
  'label',
  'id'
)

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id']

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = 'appearance'

/** 旧設定URLのカテゴリIDと現在のカテゴリIDの対応表 */
const LEGACY_SECTION_CATEGORIES = new Map<string, SettingsSectionId>([
  ['privacy', 'profile'],
  ['api-token', 'api'],
  ['data-transfer', 'data'],
  ['player-data', 'data'],
  ['account-delete', 'account'],
])

/**
 * URLから受け取った値を有効な設定カテゴリへ正規化する。
 *
 * @param section - URLで指定されたカテゴリID。
 * @returns 対応するカテゴリID。未知の値の場合は既定カテゴリ。
 */
export const normalizeSettingsSection = (section?: string): SettingsSectionId =>
  SETTINGS_SECTIONS.find((candidate) => candidate.id === section)?.id ??
  (section ? LEGACY_SECTION_CATEGORIES.get(section) : undefined) ??
  DEFAULT_SETTINGS_SECTION
