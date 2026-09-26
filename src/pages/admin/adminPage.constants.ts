import {
  ADMIN_COURSES_PATH,
  ADMIN_DATA_COVERAGE_PATH,
  ADMIN_MAINTENANCE_PATH,
  ADMIN_RATING_IMAGE_DOM_PREVIEW_PATH,
  ADMIN_SONG_BATCH_PATH,
  ADMIN_VERSIONS_PATH,
} from '../../constants/routes'
import { localizedCopy } from '../../i18n'

/** 管理メニューの表示文言 */
const ADMIN_MENU_TEXT = localizedCopy('admin.menu')

/** 管理メニュー画面に表示する文言 */
export const ADMIN_PAGE_COPY = localizedCopy('admin.menu.adminPageCopy')

/** 管理メニューに表示する各管理画面へのリンク */
export const ADMIN_PAGE_LINKS = [
  {
    href: ADMIN_DATA_COVERAGE_PATH,
    title: ADMIN_MENU_TEXT.dataCoverageTitle,
    description: ADMIN_MENU_TEXT.dataCoverageDescription,
    icon: 'coverage',
  },
  {
    href: ADMIN_MAINTENANCE_PATH,
    title: ADMIN_MENU_TEXT.maintenanceTitle,
    description: ADMIN_MENU_TEXT.maintenanceDescription,
    icon: 'maintenance',
  },
  {
    href: '/admin/users',
    title: ADMIN_MENU_TEXT.usersTitle,
    description: ADMIN_MENU_TEXT.usersDescription,
    icon: 'users',
  },
  {
    href: '/admin/songs',
    title: ADMIN_MENU_TEXT.songsTitle,
    description: ADMIN_MENU_TEXT.songsDescription,
    icon: 'songs',
  },
  {
    href: ADMIN_COURSES_PATH,
    title: ADMIN_MENU_TEXT.coursesTitle,
    description: ADMIN_MENU_TEXT.coursesDescription,
    icon: 'courses',
  },
  {
    href: '/admin/honors',
    title: ADMIN_MENU_TEXT.honorsTitle,
    description: ADMIN_MENU_TEXT.honorsDescription,
    icon: 'honors',
  },
  {
    href: ADMIN_VERSIONS_PATH,
    title: ADMIN_MENU_TEXT.versionsTitle,
    description: ADMIN_MENU_TEXT.versionsDescription,
    icon: 'versions',
  },
  {
    href: ADMIN_SONG_BATCH_PATH,
    title: ADMIN_MENU_TEXT.songBatchTitle,
    description: ADMIN_MENU_TEXT.songBatchDescription,
    icon: 'songBatch',
  },
  {
    href: ADMIN_RATING_IMAGE_DOM_PREVIEW_PATH,
    title: ADMIN_MENU_TEXT.ratingImageDomTitle,
    description: ADMIN_MENU_TEXT.ratingImageDomDescription,
    icon: 'ratingImage',
  },
] as const
