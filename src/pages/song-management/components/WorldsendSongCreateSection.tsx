import { Plus } from 'lucide-solid'
import { AppButton } from '../../../components/common/AppButton'
import CopyFromStandardField from '../../../components/common/CopyFromStandardField'
import { WORLDSEND_LEVEL_STAR_MAX, WORLDSEND_LEVEL_STAR_MIN } from '../../../constants/chart'
import { SONG_EDIT_INPUT_LIMITS } from '../../../constants/songMaster'
import type { MasterItemDTO } from '../../../types/api'
import type { StandardSongLookupItem } from '../../../utils/standardSongLookup'
import {
  SONG_MANAGEMENT_FIELD_COPY as FIELD,
  SONG_MANAGEMENT_ACTION_COPY,
  SONG_MANAGEMENT_INPUT_LIMITS,
  SONG_MANAGEMENT_SECTION_COPY,
} from '../constants'
import type { WorldsendSongManagement } from '../hooks/createWorldsendSongManagement'
import {
  toDateInputValue,
  toOptionalNumberInput,
  toOptionalTextInput,
} from '../utils/songDraftCommon'
import {
  GenreSelectField,
  MANAGEMENT_TEXT_INPUT_CLASS,
  ManagementCheckbox,
  ManagementTextField,
} from './ManagementFields'

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
      <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ManagementTextField
          label={FIELD.officialIdx}
          value={draft().official_idx}
          maxLength={SONG_MANAGEMENT_INPUT_LIMITS.officialIdx}
          placeholder={FIELD.officialIdxPlaceholder}
          onInput={(value) => props.management.updateCreateDraftField('official_idx', value)}
        />
        <ManagementTextField
          label={FIELD.title}
          value={draft().title}
          inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
          onInput={(value) => props.management.updateCreateDraftField('title', value)}
        />
        <CopyFromStandardField
          field="reading"
          songs={props.standardSongs}
          title={draft().title}
          artist={draft().artist}
          songsLoading={props.standardSongsLoading}
          onCopied={(reading) => props.management.updateCreateDraftField('reading', reading)}
        >
          <ManagementTextField
            label={FIELD.reading}
            value={draft().reading ?? ''}
            maxLength={SONG_MANAGEMENT_INPUT_LIMITS.reading}
            inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
            onInput={(value) =>
              props.management.updateCreateDraftField('reading', toOptionalTextInput(value))
            }
          />
        </CopyFromStandardField>
        <ManagementTextField
          label={FIELD.artist}
          value={draft().artist}
          inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
          onInput={(value) => props.management.updateCreateDraftField('artist', value)}
        />
        <CopyFromStandardField
          field="wikiPageTitle"
          songs={props.standardSongs}
          title={draft().title}
          artist={draft().artist}
          songsLoading={props.standardSongsLoading}
          onCopied={(wikiPageTitle) =>
            props.management.updateCreateDraftField('wiki_page_title', wikiPageTitle)
          }
        >
          <ManagementTextField
            label={FIELD.wikiPageTitle}
            value={draft().wiki_page_title ?? ''}
            maxLength={SONG_EDIT_INPUT_LIMITS.wikiPageTitle}
            inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
            onInput={(value) =>
              props.management.updateCreateDraftField('wiki_page_title', toOptionalTextInput(value))
            }
          />
        </CopyFromStandardField>
        <div class="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-3 lg:grid-cols-4">
          <GenreSelectField
            label={FIELD.genre}
            value={draft().genre_id}
            genres={props.genres}
            placeholder={FIELD.genreCreatePlaceholder}
            onChange={(value) => props.management.updateCreateDraftField('genre_id', value)}
          />
          <CopyFromStandardField
            field="bpm"
            songs={props.standardSongs}
            title={draft().title}
            artist={draft().artist}
            songsLoading={props.standardSongsLoading}
            onCopied={(bpm) => props.management.updateCreateDraftField('bpm', bpm)}
          >
            <ManagementTextField
              label={FIELD.bpm}
              type="number"
              value={draft().bpm ?? ''}
              onInput={(value) =>
                props.management.updateCreateDraftField('bpm', toOptionalNumberInput(value))
              }
            />
          </CopyFromStandardField>
          <ManagementTextField
            label={FIELD.releasedAt}
            type="date"
            value={toDateInputValue(draft().released_at)}
            onInput={(value) =>
              props.management.updateCreateDraftField('released_at', toOptionalTextInput(value))
            }
          />
          <ManagementTextField
            label={FIELD.jacket}
            value={draft().jacket ?? ''}
            onInput={(value) =>
              props.management.updateCreateDraftField('jacket', toOptionalTextInput(value))
            }
          />
          <div class="flex items-end py-2">
            <ManagementCheckbox
              checked={draft().is_new === true}
              ariaLabel={FIELD.isNew}
              label={FIELD.isNew}
              onChange={(checked) => props.management.updateCreateDraftField('is_new', checked)}
            />
          </div>
        </div>
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
            props.management.updateCreateDraftField('notes_designer', toOptionalTextInput(value))
          }
        />
      </div>

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
