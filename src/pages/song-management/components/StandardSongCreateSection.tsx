import { TextField } from '@kobalte/core/text-field'
import Plus from 'lucide-solid/icons/plus'
import { Index } from 'solid-js'
import { AppButton } from '../../../components/common/AppButton'
import type { MasterItemDTO } from '../../../types/api'
import {
  SONG_MANAGEMENT_FIELD_COPY as FIELD,
  SONG_MANAGEMENT_ACTION_COPY,
  SONG_MANAGEMENT_INPUT_LIMITS,
  SONG_MANAGEMENT_SECTION_COPY,
} from '../constants'
import type { StandardSongManagement } from '../hooks/createStandardSongManagement'
import {
  hasNotesDesigner,
  toOptionalNumberInput,
  toOptionalTextInput,
} from '../utils/songDraftCommon'
import { ManagementCheckbox, ManagementTextField } from './ManagementFields'
import SongMetaFields from './SongMetaFields'

type StandardSongCreateSectionProps = {
  /** 通常楽曲管理の状態と操作 */
  management: StandardSongManagement
  /** ジャンルマスタ */
  genres: MasterItemDTO[]
}

/**
 * 通常楽曲の追加フォームを描画する。
 *
 * @param props 通常楽曲管理の状態とジャンルマスタ
 * @returns 通常楽曲の追加セクション
 */
const StandardSongCreateSection = (props: StandardSongCreateSectionProps) => {
  const draft = () => props.management.createDraft()

  return (
    <section class="rounded-lg border border-border bg-surface p-4">
      <h2 class="text-lg font-semibold">{SONG_MANAGEMENT_SECTION_COPY.standardCreate}</h2>
      <div class="mt-3 space-y-4">
        <SongMetaFields
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
          leading={
            <ManagementTextField
              label={FIELD.officialIdx}
              value={draft().official_idx}
              maxLength={SONG_MANAGEMENT_INPUT_LIMITS.officialIdx}
              placeholder={FIELD.officialIdxPlaceholder}
              onInput={(value) => props.management.updateCreateDraftField('official_idx', value)}
            />
          }
        />

        <div class="overflow-x-auto rounded border border-border">
          <table class="min-w-full text-sm">
            <thead class="bg-surface-muted">
              <tr>
                <th class="whitespace-nowrap px-3 py-2 text-left">{FIELD.chartEnabled}</th>
                <th class="whitespace-nowrap px-3 py-2 text-left">{FIELD.difficulty}</th>
                <th class="whitespace-nowrap px-3 py-2 text-left">{FIELD.const}</th>
                <th class="whitespace-nowrap px-3 py-2 text-left">{FIELD.constUnknown}</th>
                <th class="whitespace-nowrap px-3 py-2 text-left">{FIELD.notes}</th>
                <th class="whitespace-nowrap px-3 py-2 text-left">{FIELD.notesDesigner}</th>
              </tr>
            </thead>
            <tbody>
              <Index each={draft().charts}>
                {(chart, chartIndex) => (
                  <tr class="border-t border-border">
                    <td class="px-3 py-2">
                      <ManagementCheckbox
                        checked={chart().enabled}
                        ariaLabel={`${chart().difficulty_name}を追加対象にする`}
                        onChange={(checked) =>
                          props.management.updateCreateChart(chartIndex, 'enabled', checked)
                        }
                      />
                    </td>
                    <td class="px-3 py-2">{chart().difficulty_name}</td>
                    <td class="px-3 py-2">
                      <TextField disabled={!chart().enabled}>
                        <TextField.Input
                          type="text"
                          inputMode="decimal"
                          value={chart().const}
                          onInput={(event) =>
                            props.management.updateCreateChart(
                              chartIndex,
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
                        disabled={!chart().enabled}
                        ariaLabel={`${chart().difficulty_name}の定数未確定`}
                        onChange={(checked) =>
                          props.management.updateCreateChart(
                            chartIndex,
                            'is_const_unknown',
                            checked
                          )
                        }
                      />
                    </td>
                    <td class="px-3 py-2">
                      <TextField disabled={!chart().enabled}>
                        <TextField.Input
                          type="number"
                          value={chart().notes ?? ''}
                          onInput={(event) =>
                            props.management.updateCreateChart(
                              chartIndex,
                              'notes',
                              toOptionalNumberInput(event.currentTarget.value)
                            )
                          }
                          class="w-24 rounded border border-border-strong px-2 py-1"
                        />
                      </TextField>
                    </td>
                    <td class="px-3 py-2">
                      <TextField
                        disabled={!chart().enabled || !hasNotesDesigner(chart().difficulty_name)}
                      >
                        <TextField.Input
                          value={chart().notes_designer ?? ''}
                          onInput={(event) =>
                            props.management.updateCreateChart(
                              chartIndex,
                              'notes_designer',
                              toOptionalTextInput(event.currentTarget.value)
                            )
                          }
                          class="w-56 rounded border border-border-strong px-2 py-1 font-sans disabled:bg-surface-hover disabled:text-text-muted"
                        />
                      </TextField>
                    </td>
                  </tr>
                )}
              </Index>
            </tbody>
          </table>
        </div>

        <AppButton
          variant="primary"
          leftIcon={<Plus size={16} aria-hidden="true" />}
          onClick={props.management.create}
        >
          {SONG_MANAGEMENT_ACTION_COPY.addStandard}
        </AppButton>
      </div>
    </section>
  )
}

export default StandardSongCreateSection
