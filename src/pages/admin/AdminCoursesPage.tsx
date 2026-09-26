import { PAGE_TITLES } from '../../constants/pageTitles'
import CourseManagementPage from '../courses/CourseManagementPage'

/**
 * ADMIN向けのコース管理画面を表示する。
 *
 * @returns 追加と削除を許可した共通のコース管理UI。
 */
const AdminCoursesPage = () => {
  return <CourseManagementPage title={PAGE_TITLES.adminCourses} canCreate canDelete />
}

export default AdminCoursesPage
