import Plus from 'lucide-solid/icons/plus'
import { AppButton } from '../../../components/common/AppButton'
import { WORLDSEND_LEVEL_STAR_MAX, WORLDSEND_LEVEL_STAR_MIN } from '../../../constants/chart'
import type { MasterItemDTO } from '../../../types/api'
import type { StandardSongLookupItem } from '../../../utils/standardSongLookup'
import {
  SONG_MANAGEMENT_FIELD_COPY as FIELD,
  SONG_MANAGEMENT_ACTION_COPY,
  SONG_MANAGEMENT_INPUT_LIMITS,
  SONG_MANAGEMENT_SECTION_COPY,
} from '../constants'
import type { WorldsendSongManagement } from '../hooks/createWorldsendSongManagement'
import { toOptionalNumberInput, toOptionalTextInput } from '../utils/songDraftCommon'
import { MANAGEMENT_TEXT_INPUT_CLASS, ManagementTextField } from './ManagementFields'
import SongMetaFields from './SongMetaFields'

type WorldsendSongCreateSectionProps = {
  /** WORLD'S END 楽曲管理の状態と操作 */
  management: WorldsendSongManagement
  /** 読み・BPMなどの取り込み元になる通常楽曲 */
  standardSongs: readonly StandardSongLookupItem[]
  /** 通常楽曲の読み込み中か */
  standardSongsLoading: boolean
  /** ジャンルマスタ */
  genres: MasterItemDTO[]
}

/**
 * WORLD'S END 楽曲の追加フォームを描画する。
 *
 * @param props WORLD'S END 楽曲管理の状態、取り込み元の通常楽曲、ジャンルマスタ
 * @returns WORLD'S END 楽曲の追加セクション
 */
const WorldsendSongCreateSection = (props: WorldsendSongCreateSectionProps) => {
  const draft = () => props.management.createDraft()

  return (
    <section class="rounded-lg border border-border bg-surface p-4">
      <h2 class="text-lg font-semibold">{SONG_MANAGEMENT_SECTION_COPY.worldsendCreate}</h2>
      <SongMetaFields
        class="mt-3"
        layout="create"
        genres={props.genres}
        genrePlaceholder={FIELD.genreCreatePlaceholder}
        title={draft().title}
        reading={draft().reading}
        artist={draft().artist}
        wikiPageTitle={draft().wiki_page_title}
        genreId={draft().genre_id}
        bpm={draft().bpm}
        releasedAt={draft().released_at}
        jacket={draft().jacket}
        isNew={draft().is_new}
        unlockRequired={draft().unlock_required}
        standardSongs={props.standardSongs}
        standardSongsLoading={props.standardSongsLoading}
        onTitleChange={(value) => props.management.updateCreateDraftField('title', value)}
        onReadingChange={(value) => props.management.updateCreateDraftField('reading', value)}
        onArtistChange={(value) => props.management.updateCreateDraftField('artist', value)}
        onWikiPageTitleChange={(value) =>
          props.management.updateCreateDraftField('wiki_page_title', value)
        }
        onGenreIdChange={(value) => props.management.updateCreateDraftField('genre_id', value)}
        onBpmChange={(value) => props.management.updateCreateDraftField('bpm', value)}
        onReleasedAtChange={(value) =>
          props.management.updateCreateDraftField('released_at', value)
        }
        onJacketChange={(value) => props.management.updateCreateDraftField('jacket', value)}
        onIsNewChange={(value) => props.management.updateCreateDraftField('is_new', value)}
        onUnlockRequiredChange={(value) =>
          props.management.updateCreateDraftField('unlock_required', value)
        }
        onReadingCopied={(reading) => props.management.updateCreateDraftField('reading', reading)}
        onWikiPageTitleCopied={(wikiPageTitle) =>
          props.management.updateCreateDraftField('wiki_page_title', wikiPageTitle)
        }
        onBpmCopied={(bpm) => props.management.updateCreateDraftField('bpm', bpm)}
        leading={
          <ManagementTextField
            label={FIELD.officialIdx}
            value={draft().official_idx}
            maxLength={SONG_MANAGEMENT_INPUT_LIMITS.officialIdx}
            placeholder={FIELD.officialIdxPlaceholder}
            onInput={(value) => props.management.updateCreateDraftField('official_idx', value)}
          />
        }
        trailing={
          <>
            <ManagementTextField
              label={FIELD.attribute}
              value={draft().attribute ?? ''}
              inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
              onInput={(value) =>
                props.management.updateCreateDraftField('attribute', toOptionalTextInput(value))
              }
            />
            <ManagementTextField
              label={FIELD.level}
              type="number"
              min={String(WORLDSEND_LEVEL_STAR_MIN)}
              max={String(WORLDSEND_LEVEL_STAR_MAX)}
              value={draft().level_star ?? ''}
              onInput={(value) =>
                props.management.updateCreateDraftField('level_star', toOptionalNumberInput(value))
              }
            />
            <ManagementTextField
              label={FIELD.notes}
              type="number"
              min="0"
              value={draft().notes ?? ''}
              onInput={(value) =>
                props.management.updateCreateDraftField('notes', toOptionalNumberInput(value))
              }
            />
            <ManagementTextField
              class="text-sm sm:col-span-2 lg:col-span-1"
              label={FIELD.notesDesigner}
              value={draft().notes_designer ?? ''}
              inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
              onInput={(value) =>
                props.management.updateCreateDraftField(
                  'notes_designer',
                  toOptionalTextInput(value)
                )
              }
            />
          </>
        }
      />

      <AppButton
        variant="primary"
        class="mt-4"
        leftIcon={<Plus size={16} aria-hidden="true" />}
        onClick={props.management.create}
      >
        {SONG_MANAGEMENT_ACTION_COPY.addWorldsend}
      </AppButton>
    </section>
  )
}

export default WorldsendSongCreateSection
