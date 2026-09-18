import { ADMIN_COURSES_TITLE } from '../../constants/pageTitles'
import CourseManagementPage from '../courses/CourseManagementPage'

/**
 * ADMIN向けのコース管理画面を表示する。
 *
 * @returns 追加と削除を許可した共通のコース管理UI。
 */
const AdminCoursesPage = () => {
  return <CourseManagementPage title={ADMIN_COURSES_TITLE} canCreate canDelete />
}

export default AdminCoursesPage
