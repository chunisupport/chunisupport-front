import {
  captureElementAsImage,
  createImageCaptureClone,
  waitForElementImages,
} from '../../utils/domImageCapture'
import { paginateImageBlocks } from '../../utils/imagePagination'
import {
  REGISTER_SCORE_IMAGE_JPEG_QUALITY,
  REGISTER_SCORE_IMAGE_MAX_HEIGHT,
  REGISTER_SCORE_IMAGE_PAGE_NUMBER_CLASS,
  REGISTER_SCORE_IMAGE_PIXEL_RATIO,
} from './constants'

const BODY_SELECTOR = '[data-score-image-body]'
const SECTION_SELECTOR = '[data-score-image-section]'
const CARDS_SELECTOR = '[data-score-image-cards]'

/** 更新差分画像の出力形式 */
export type RegisterScoreImageLayout = 'split' | 'single'

/** 生成した画像と自動分割時のページ数 */
export type RegisterScoreImageCaptureResult = {
  blobs: Blob[]
  splitPageCount: number | undefined
}

/** 見出しと最初のカードを同じページへ配置するための表示単位 */
type ImageBlock = {
  section: HTMLElement
  content: HTMLElement
  first: boolean
}

/**
 * 固定幅のレポートを自動分割または1枚のJPEGとして生成する。
 *
 * @param source - 現在の表示設定を反映したレポート。
 * @param layout - 高さ上限で分割するか、全内容を1枚へまとめるか。
 * @returns 選択した形式のJPEGと自動分割時の枚数。
 */
export const captureRegisterScoreReportImages = async (
  source: HTMLElement,
  layout: RegisterScoreImageLayout
): Promise<RegisterScoreImageCaptureResult> => {
  const snapshot = createImageCaptureClone(source)
  let page: HTMLElement | undefined
  try {
    await Promise.all([document.fonts.ready, waitForElementImages(snapshot.element)])
    const report = snapshot.element
    const body = report.querySelector<HTMLElement>(BODY_SELECTOR)
    if (!body) throw new Error('Image report body is missing')

    const blocks: ImageBlock[] = []
    for (const section of body.querySelectorAll<HTMLElement>(SECTION_SELECTOR)) {
      const cards = section.querySelector<HTMLElement>(CARDS_SELECTOR)
      const contents = cards ? Array.from(cards.children) : Array.from(section.children).slice(1)
      contents.forEach((content, index) => {
        blocks.push({ section, content: content as HTMLElement, first: index === 0 })
      })
    }

    /**
     * 指定したカードを、測定と画像化で共通のページDOMへ配置する。
     *
     * @param items - ページへ含める表示単位。
     * @param pageIndex - 0から始まるページ番号。
     * @param pageCount - 全ページ数。
     * @param includePageNumber - ページ番号を画像へ含めるか。
     * @returns 接続済みのページDOM。
     */
    const renderPage = (
      items: readonly ImageBlock[],
      pageIndex: number,
      pageCount: number,
      includePageNumber = true
    ): HTMLElement => {
      page?.remove()
      page = report.cloneNode(false) as HTMLElement
      report.after(page)
      if (pageIndex === 0) {
        for (const child of report.children) {
          if (child !== body) page.appendChild(child.cloneNode(true))
        }
      }
      const pageBody = body.cloneNode(false) as HTMLElement
      page.appendChild(pageBody)
      if (pageIndex === 0) {
        for (const child of body.children) {
          if (!child.matches(SECTION_SELECTOR)) pageBody.appendChild(child.cloneNode(true))
        }
      }

      let currentSection: HTMLElement | undefined
      let contentContainer: HTMLElement = pageBody
      for (const item of items) {
        if (item.section !== currentSection) {
          currentSection = item.section
          const section = item.section.cloneNode(false) as HTMLElement
          pageBody.appendChild(section)
          const heading = item.section.firstElementChild
          if (item.first && heading) section.appendChild(heading.cloneNode(true))
          const cards = item.section.querySelector<HTMLElement>(CARDS_SELECTOR)
          contentContainer = cards ? (cards.cloneNode(false) as HTMLElement) : section
          if (cards) section.appendChild(contentContainer)
        }
        contentContainer.appendChild(item.content.cloneNode(true))
      }
      if (includePageNumber) {
        const footer = document.createElement('div')
        footer.className = REGISTER_SCORE_IMAGE_PAGE_NUMBER_CLASS
        footer.textContent = `${pageIndex + 1} / ${pageCount}`
        page.appendChild(footer)
      }
      return page
    }

    let splitPages: ImageBlock[][] | undefined
    try {
      splitPages = paginateImageBlocks(
        blocks,
        REGISTER_SCORE_IMAGE_MAX_HEIGHT,
        (items, index) => renderPage(items, index, 1).offsetHeight
      )
    } catch (error) {
      // 単体要素が分割上限を超えても、1枚出力では共通の縮小処理を利用できる。
      if (layout === 'split') throw error
    }
    const pages = layout === 'single' ? [blocks] : (splitPages ?? [])
    const blobs: Blob[] = []
    for (const [index, items] of pages.entries()) {
      const target = renderPage(items, index, pages.length, layout === 'split')
      if (layout === 'split' && target.offsetHeight > REGISTER_SCORE_IMAGE_MAX_HEIGHT) {
        throw new Error('Image page exceeds page height')
      }
      blobs.push(
        await captureElementAsImage(target, {
          format: 'jpeg',
          pixelRatio: REGISTER_SCORE_IMAGE_PIXEL_RATIO,
          quality: REGISTER_SCORE_IMAGE_JPEG_QUALITY,
        })
      )
    }
    return { blobs, splitPageCount: splitPages?.length }
  } finally {
    page?.remove()
    snapshot.dispose()
  }
}
