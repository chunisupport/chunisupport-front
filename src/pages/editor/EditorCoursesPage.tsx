import CourseManagementPage from '../courses/CourseManagementPage'
import { PAGE_TITLES } from './constants'

/**
 * EDITOR向けのコース編集画面を表示する。
 *
 * @returns 追加と削除を許可しない共通のコース管理UI。
 */
const EditorCoursesPage = () => {
  return (
    <CourseManagementPage title={PAGE_TITLES.editorCourses} canCreate={false} canDelete={false} />
  )
}

export default EditorCoursesPage
