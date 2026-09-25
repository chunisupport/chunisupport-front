import { Show } from 'solid-js'
import { Loading } from '../../../components'
import CopyFromStandardField from '../../../components/common/CopyFromStandardField'
import { WORLDSEND_LEVEL_STAR_MAX, WORLDSEND_LEVEL_STAR_MIN } from '../../../constants/chart'
import { SONG_EDIT_INPUT_LIMITS } from '../../../constants/songMaster'
import type { MasterItemDTO, VersionSummaryDTO } from '../../../types/api'
import type { StandardSongLookupItem } from '../../../utils/standardSongLookup'
import {
  SONG_MANAGEMENT_FIELD_COPY as FIELD,
  SONG_MANAGEMENT_INPUT_LIMITS,
  SONG_MANAGEMENT_SECTION_COPY,
} from '../constants'
import type { WorldsendSongManagement } from '../hooks/createWorldsendSongManagement'
import {
  formatUpdatedAt,
  toDateInputValue,
  toOptionalNumberInput,
  toOptionalTextInput,
} from '../utils/songDraftCommon'
import ManagedSongEditActions from './ManagedSongEditActions'
import ManagedSongListPanel from './ManagedSongListPanel'
import {
  GenreSelectField,
  MANAGEMENT_READONLY_INPUT_CLASS,
  MANAGEMENT_TEXT_INPUT_CLASS,
  ManagementCheckbox,
  ManagementTextField,
} from './ManagementFields'

type WorldsendSongEditSectionProps = {
  /** WORLD'S END 楽曲管理の状態と操作 */
  management: WorldsendSongManagement
  /** 読み・BPMなどの取り込み元になる通常楽曲 */
  standardSongs: readonly StandardSongLookupItem[]
  /** 通常楽曲の読み込み中か */
  standardSongsLoading: boolean
  /** マスターデータの読み込み中か */
  masterDataLoading: boolean
  /** ジャンルマスタ */
  genres: MasterItemDTO[]
  /** バージョン一覧 */
  versions: readonly VersionSummaryDTO[]
  /** 削除操作を許可するか */
  canDelete: boolean
  /** 管理用の属性・欠落フィルターを表示するか */
  showAdvancedFilters: boolean
}

/**
 * WORLD'S END 楽曲の一覧と、選択した楽曲の編集・削除・復活フォームを描画する。
 *
 * @param props WORLD'S END 楽曲管理の状態、取り込み元の通常楽曲、マスターデータ、権限
 * @returns WORLD'S END 楽曲の編集セクション
 */
const WorldsendSongEditSection = (props: WorldsendSongEditSectionProps) => {
  return (
    <section class="rounded-lg border border-border bg-surface p-4">
      <h2 class="text-lg font-semibold">{SONG_MANAGEMENT_SECTION_COPY.worldsendEdit}</h2>

      <Show
        when={!props.masterDataLoading && props.management.songs().length > 0}
        fallback={
          <div class="mt-3 h-20">
            <Loading />
          </div>
        }
      >
        <div class="mt-3 grid gap-4 lg:grid-cols-[300px_1fr]">
          <div>
            <ManagedSongListPanel
              idPrefix="managed-worldsend-songs"
              songs={props.management.filteredSongs()}
              selectedSongId={props.management.selectedSongId()}
              onSelect={props.management.selectSong}
              searchQuery={props.management.searchQuery()}
              onSearchQueryChange={props.management.setSearchQuery}
              showAdvancedFilters={props.showAdvancedFilters}
              filters={props.management.filters()}
              onFiltersChange={props.management.setFilters}
              genres={props.genres.map((genre) => genre.name)}
              versions={props.versions}
            />
          </div>

          <div>
            <Show when={props.management.draft()}>
              {(currentDraft) => (
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <ManagementTextField
                      class="col-span-2 text-sm"
                      label={FIELD.updatedAt}
                      value={formatUpdatedAt(currentDraft().updated_at)}
                      inputClass={MANAGEMENT_READONLY_INPUT_CLASS}
                      disabled
                    />
                    <ManagementTextField
                      class="col-span-2 text-sm"
                      label={FIELD.title}
                      value={currentDraft().title}
                      inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
                      onInput={(value) => props.management.updateDraftField('title', value)}
                    />
                    <CopyFromStandardField
                      class="col-span-2"
                      field="reading"
                      songs={props.standardSongs}
                      title={currentDraft().title}
                      artist={currentDraft().artist}
                      songsLoading={props.standardSongsLoading}
                      onCopied={(reading) => props.management.updateDraftField('reading', reading)}
                    >
                      <ManagementTextField
                        class="text-sm"
                        label={FIELD.reading}
                        value={currentDraft().reading ?? ''}
                        maxLength={SONG_MANAGEMENT_INPUT_LIMITS.reading}
                        inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
                        onInput={(value) =>
                          props.management.updateDraftField('reading', toOptionalTextInput(value))
                        }
                      />
                    </CopyFromStandardField>
                    <ManagementTextField
                      class="col-span-2 text-sm"
                      label={FIELD.artist}
                      value={currentDraft().artist}
                      inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
                      onInput={(value) => props.management.updateDraftField('artist', value)}
                    />
                    <CopyFromStandardField
                      class="col-span-2"
                      field="wikiPageTitle"
                      songs={props.standardSongs}
                      title={currentDraft().title}
                      artist={currentDraft().artist}
                      songsLoading={props.standardSongsLoading}
                      onCopied={(wikiPageTitle) =>
                        props.management.updateDraftField('wiki_page_title', wikiPageTitle)
                      }
                    >
                      <ManagementTextField
                        class="text-sm"
                        label={FIELD.wikiPageTitle}
                        value={currentDraft().wiki_page_title ?? ''}
                        maxLength={SONG_EDIT_INPUT_LIMITS.wikiPageTitle}
                        inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
                        onInput={(value) =>
                          props.management.updateDraftField(
                            'wiki_page_title',
                            toOptionalTextInput(value)
                          )
                        }
                      />
                    </CopyFromStandardField>
                    <GenreSelectField
                      label={FIELD.genre}
                      value={currentDraft().genre_id}
                      genres={props.genres}
                      placeholder={FIELD.genreEditPlaceholder}
                      onChange={(value) => props.management.updateDraftField('genre_id', value)}
                    />
                    <CopyFromStandardField
                      field="bpm"
                      songs={props.standardSongs}
                      title={currentDraft().title}
                      artist={currentDraft().artist}
                      songsLoading={props.standardSongsLoading}
                      onCopied={(bpm) => props.management.updateDraftField('bpm', bpm)}
                    >
                      <ManagementTextField
                        label={FIELD.bpm}
                        type="number"
                        value={currentDraft().bpm ?? ''}
                        onInput={(value) =>
                          props.management.updateDraftField('bpm', toOptionalNumberInput(value))
                        }
                      />
                    </CopyFromStandardField>
                    <ManagementTextField
                      label={FIELD.releasedAt}
                      type="date"
                      value={toDateInputValue(currentDraft().released_at)}
                      onInput={(value) =>
                        props.management.updateDraftField('released_at', toOptionalTextInput(value))
                      }
                    />
                    <ManagementTextField
                      label={FIELD.jacket}
                      value={currentDraft().jacket ?? ''}
                      onInput={(value) =>
                        props.management.updateDraftField('jacket', toOptionalTextInput(value))
                      }
                    />
                    <div class="flex items-end py-2">
                      <ManagementCheckbox
                        checked={currentDraft().is_new === true}
                        ariaLabel={FIELD.isNew}
                        label={FIELD.isNew}
                        onChange={(checked) => props.management.updateDraftField('is_new', checked)}
                      />
                    </div>
                    <ManagementTextField
                      class="col-span-1 text-sm"
                      label={FIELD.attribute}
                      value={currentDraft().attribute ?? ''}
                      inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
                      onInput={(value) =>
                        props.management.updateDraftField('attribute', toOptionalTextInput(value))
                      }
                    />
                    <ManagementTextField
                      class="col-span-1 text-sm"
                      label={FIELD.level}
                      type="number"
                      min={String(WORLDSEND_LEVEL_STAR_MIN)}
                      max={String(WORLDSEND_LEVEL_STAR_MAX)}
                      value={currentDraft().level_star ?? ''}
                      onInput={(value) =>
                        props.management.updateDraftField(
                          'level_star',
                          toOptionalNumberInput(value)
                        )
                      }
                    />
                    <ManagementTextField
                      class="col-span-1 text-sm"
                      label={FIELD.notes}
                      type="number"
                      min="0"
                      value={currentDraft().notes ?? ''}
                      onInput={(value) =>
                        props.management.updateDraftField('notes', toOptionalNumberInput(value))
                      }
                    />
                    <ManagementTextField
                      class="col-span-1 text-sm"
                      label={FIELD.notesDesigner}
                      value={currentDraft().notes_designer ?? ''}
                      inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
                      onInput={(value) =>
                        props.management.updateDraftField(
                          'notes_designer',
                          toOptionalTextInput(value)
                        )
                      }
                    />
                    <ManagementTextField
                      class="col-span-2 text-sm"
                      label={FIELD.chartUpdatedAt}
                      value={formatUpdatedAt(currentDraft().chart_updated_at)}
                      inputClass={MANAGEMENT_READONLY_INPUT_CLASS}
                      disabled
                    />
                  </div>

                  <ManagedSongEditActions
                    changed={props.management.changed()}
                    saving={props.management.saving()}
                    deleted={Boolean(props.management.selectedSong()?.is_deleted)}
                    canDelete={props.canDelete}
                    onSave={props.management.save}
                    onDelete={() => props.management.remove(currentDraft().id)}
                    onRestore={() => props.management.restore(currentDraft().id)}
                  />
                </div>
              )}
            </Show>
          </div>
        </div>
      </Show>

      <Show when={props.management.loaded() && props.management.songs().length === 0}>
        <p class="mt-3 text-sm text-text-subtle">{SONG_MANAGEMENT_SECTION_COPY.worldsendEmpty}</p>
      </Show>
    </section>
  )
}

export default WorldsendSongEditSection
