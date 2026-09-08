import CourseManagementPage from '../courses/CourseManagementPage'
import { EDITOR_COURSES_TITLE } from './constants'

/**
 * EDITOR向けのコース編集画面を表示する。
 *
 * @returns 追加と削除を許可しない共通のコース管理UI。
 */
const EditorCoursesPage = () => {
  return <CourseManagementPage title={EDITOR_COURSES_TITLE} canCreate={false} canDelete={false} />
}

export default EditorCoursesPage
