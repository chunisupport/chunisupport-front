import { StaffMenuPage } from '../../components/common/StaffMenuPage'
import { EDITOR_PAGE_COPY, EDITOR_PAGE_LINKS } from './EditorPage.constants'

/**
 * 編集者向けメニュー画面を表示する。
 *
 * @returns データ充足状況と楽曲管理へのリンクを含む編集メニュー。
 */
const EditorPage = () => (
  <StaffMenuPage
    pageTitle={EDITOR_PAGE_COPY.pageTitle}
    heading={EDITOR_PAGE_COPY.heading}
    description={EDITOR_PAGE_COPY.description}
    links={EDITOR_PAGE_LINKS}
  />
)

export default EditorPage
