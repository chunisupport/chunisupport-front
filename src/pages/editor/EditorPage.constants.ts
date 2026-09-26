import { localizedCopy } from '../../i18n'
import {
  ADMIN_DATA_COVERAGE_PATH,
  EDITOR_COURSES_PATH,
  EDITOR_SONGS_PATH,
} from '../../constants/routes'

/** 編集メニューの表示文言 */
const EDITOR_TEXT = localizedCopy('editor')

/** 編集メニュー画面に表示する文言 */
export const EDITOR_PAGE_COPY = localizedCopy('editor.editorPageCopy')

/** 編集メニューに表示する各画面へのリンク */
export const EDITOR_PAGE_LINKS = [
  {
    href: ADMIN_DATA_COVERAGE_PATH,
    title: EDITOR_TEXT.dataCoverageTitle,
    description: EDITOR_TEXT.dataCoverageDescription,
    icon: 'coverage',
  },
  {
    href: EDITOR_SONGS_PATH,
    title: EDITOR_TEXT.songsTitle,
    description: EDITOR_TEXT.songsDescription,
    icon: 'songs',
  },
  {
    href: EDITOR_COURSES_PATH,
    title: EDITOR_TEXT.coursesTitle,
    description: EDITOR_TEXT.coursesDescription,
    icon: 'courses',
  },
] as const
