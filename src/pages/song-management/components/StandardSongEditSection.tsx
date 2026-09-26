import { TextField } from '@kobalte/core/text-field'
import { Plus } from 'lucide-solid'
import { Index, Show } from 'solid-js'
import { Loading } from '../../../components'
import { AppButton } from '../../../components/common/AppButton'
import { SONG_EDIT_INPUT_LIMITS } from '../../../constants/songMaster'
import type { MasterItemDTO, VersionSummaryDTO } from '../../../types/api'
import {
  SONG_MANAGEMENT_FIELD_COPY as FIELD,
  SONG_MANAGEMENT_ACTION_COPY,
  SONG_MANAGEMENT_INPUT_LIMITS,
  SONG_MANAGEMENT_SECTION_COPY,
} from '../constants'
import type { StandardSongManagement } from '../hooks/createStandardSongManagement'
import {
  formatUpdatedAt,
  hasNotesDesigner,
  toDateInputValue,
  toOptionalNumberInput,
  toOptionalTextInput,
} from '../utils/songDraftCommon'
import { hasUltimaChart } from '../utils/standardSongDraft'
import ManagedSongEditActions from './ManagedSongEditActions'
import ManagedSongListPanel from './ManagedSongListPanel'
import {
  GenreSelectField,
  MANAGEMENT_READONLY_INPUT_CLASS,
  MANAGEMENT_TEXT_INPUT_CLASS,
  ManagementCheckbox,
  ManagementTextField,
} from './ManagementFields'

type StandardSongEditSectionProps = {
  /** 通常楽曲管理の状態と操作 */
  management: StandardSongManagement
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
 * 通常楽曲の一覧と、選択した楽曲の編集・削除・復活フォームを描画する。
 *
 * @param props 通常楽曲管理の状態、マスターデータ、権限
 * @returns 通常楽曲の編集セクション
 */
const StandardSongEditSection = (props: StandardSongEditSectionProps) => {
  return (
    <section class="rounded-lg border border-border bg-surface p-4">
      <h2 class="text-lg font-semibold">{SONG_MANAGEMENT_SECTION_COPY.standardEdit}</h2>

      <Show
        when={!props.masterDataLoading && props.management.songs().length > 0}
        fallback={
          <div class="mt-3 h-20">
            <Loading />
          </div>
        }
      >
        <div class="mt-3 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div class="min-w-0">
            <ManagedSongListPanel
              idPrefix="managed-songs"
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

          <div class="min-w-0">
            <Show when={props.management.draft()}>
              {(currentDraft) => (
                <div class="min-w-0 space-y-4">
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
                    <ManagementTextField
                      class="col-span-2 text-sm"
                      label={FIELD.reading}
                      value={currentDraft().reading ?? ''}
                      maxLength={SONG_MANAGEMENT_INPUT_LIMITS.reading}
                      inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
                      onInput={(value) =>
                        props.management.updateDraftField('reading', toOptionalTextInput(value))
                      }
                    />
                    <ManagementTextField
                      class="col-span-2 text-sm"
                      label={FIELD.artist}
                      value={currentDraft().artist}
                      inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
                      onInput={(value) => props.management.updateDraftField('artist', value)}
                    />
                    <ManagementTextField
                      class="col-span-2 text-sm"
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
                    <GenreSelectField
                      label={FIELD.genre}
                      value={currentDraft().genre_id}
                      genres={props.genres}
                      placeholder={FIELD.genreEditPlaceholder}
                      onChange={(value) => props.management.updateDraftField('genre_id', value)}
                    />
                    <ManagementTextField
                      label={FIELD.bpm}
                      type="number"
                      value={currentDraft().bpm ?? ''}
                      onInput={(value) =>
                        props.management.updateDraftField('bpm', toOptionalNumberInput(value))
                      }
                    />
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
                  </div>

                  <Show when={!hasUltimaChart(currentDraft())}>
                    <AppButton
                      size="sm"
                      leftIcon={<Plus size={16} aria-hidden="true" />}
                      onClick={props.management.addUltimaChart}
                    >
                      {SONG_MANAGEMENT_ACTION_COPY.addUltimaChart}
                    </AppButton>
                  </Show>

                  <div class="overflow-x-auto rounded border border-border">
                    <table class="min-w-full text-sm">
                      <thead class="bg-surface-muted">
                        <tr>
                          <th class="whitespace-nowrap px-3 py-2 text-left">{FIELD.difficulty}</th>
                          <th class="whitespace-nowrap px-3 py-2 text-left">{FIELD.const}</th>
                          <th class="whitespace-nowrap px-3 py-2 text-left">
                            {FIELD.constUnknown}
                          </th>
                          <th class="whitespace-nowrap px-3 py-2 text-left">{FIELD.notes}</th>
                          <th class="whitespace-nowrap px-3 py-2 text-left">
                            {FIELD.notesDesigner}
                          </th>
                          <th class="whitespace-nowrap px-3 py-2 text-left">{FIELD.updatedAt}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <Index each={currentDraft().charts}>
                          {(chart) => (
                            <tr class="border-t border-border">
                              <td class="px-3 py-2">{chart().difficulty_name}</td>
                              <td class="px-3 py-2">
                                <TextField>
                                  <TextField.Input
                                    type="text"
                                    inputMode="decimal"
                                    value={chart().const}
                                    onInput={(event) =>
                                      props.management.updateDraftChart(
                                        chart().difficulty_id,
                                        'const',
                                        event.currentTarget.value
                                      )
                                    }
                                    class="w-20 rounded border border-border-strong px-2 py-1"
                                  />
                                </TextField>
                              </td>
                              <td class="px-3 py-2">
                                <ManagementCheckbox
                                  checked={chart().is_const_unknown}
                                  ariaLabel={`${chart().difficulty_name}の定数未確定`}
                                  onChange={(checked) =>
                                    props.management.updateDraftChart(
                                      chart().difficulty_id,
                                      'is_const_unknown',
                                      checked
                                    )
                                  }
                                />
                              </td>
                              <td class="px-3 py-2">
                                <TextField>
                                  <TextField.Input
                                    type="number"
                                    value={chart().notes ?? ''}
                                    onInput={(event) =>
                                      props.management.updateDraftChart(
                                        chart().difficulty_id,
                                        'notes',
                                        toOptionalNumberInput(event.currentTarget.value)
                                      )
                                    }
                                    class="w-20 rounded border border-border-strong px-2 py-1"
                                  />
                                </TextField>
                              </td>
                              <td class="px-3 py-2">
                                <TextField disabled={!hasNotesDesigner(chart().difficulty_name)}>
                                  <TextField.Input
                                    value={chart().notes_designer ?? ''}
                                    onInput={(event) =>
                                      props.management.updateDraftChart(
                                        chart().difficulty_id,
                                        'notes_designer',
                                        toOptionalTextInput(event.currentTarget.value)
                                      )
                                    }
                                    class="w-48 rounded border border-border-strong px-2 py-1 font-sans disabled:bg-surface-hover disabled:text-text-muted"
                                  />
                                </TextField>
                              </td>
                              <td class="px-3 py-2">
                                <TextField disabled>
                                  <TextField.Input
                                    value={formatUpdatedAt(chart().updated_at)}
                                    class="w-40 rounded border border-border-strong bg-surface-hover px-2 py-1 text-text-muted"
                                  />
                                </TextField>
                              </td>
                            </tr>
                          )}
                        </Index>
                      </tbody>
                    </table>
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
    </section>
  )
}

export default StandardSongEditSection
