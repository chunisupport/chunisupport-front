import Music from 'lucide-solid/icons/music'
import { For } from 'solid-js'
import { COURSE_TRACK_COUNT } from '../../../../utils/courseScoreRank'
import { COURSE_PAGE_COPY } from '../../constants'

/** コースを構成する3曲分のトラック番号一覧 */
const COURSE_TRACK_NUMBERS = Array.from({ length: COURSE_TRACK_COUNT }, (_, index) => index + 1)

/**
 * コースを構成する3曲分の配置スペースを縦並びで表示する。
 * 収録曲マスタが未連携の間は、ジャケットと楽曲情報が入るプレースホルダーカードを3枠並べる。
 *
 * @returns 3曲分のトラックカード領域。
 */
const CourseTracksSection = () => (
  <section aria-label={COURSE_PAGE_COPY.tracks.heading}>
    <h2 class="mb-3 text-lg font-semibold">{COURSE_PAGE_COPY.tracks.heading}</h2>
    <ol class="grid grid-cols-1 gap-3">
      <For each={COURSE_TRACK_NUMBERS}>
        {(trackNumber) => (
          <li class="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface p-3">
            <div
              class="flex size-16 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-surface-muted text-text-subtle"
              aria-hidden="true"
            >
              <Music class="size-6" />
            </div>
            <div class="min-w-0 flex-1 space-y-1">
              <p class="font-oswald text-xs font-semibold tracking-wider text-text-subtle">
                {COURSE_PAGE_COPY.tracks.trackPrefix} {trackNumber}
              </p>
              <p class="font-sans text-sm text-text-muted">
                {COURSE_PAGE_COPY.tracks.unregistered}
              </p>
            </div>
          </li>
        )}
      </For>
    </ol>
  </section>
)

export default CourseTracksSection
