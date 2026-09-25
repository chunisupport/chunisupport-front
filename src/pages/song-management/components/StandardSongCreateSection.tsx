import { TextField } from '@kobalte/core/text-field'
import { Plus } from 'lucide-solid'
import { Index } from 'solid-js'
import { AppButton } from '../../../components/common/AppButton'
import { SONG_EDIT_INPUT_LIMITS } from '../../../constants/songMaster'
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
  const updateField = props.management.updateCreateDraftField
  const updateChart = props.management.updateCreateChart

  return (
    <section class="rounded-lg border border-border bg-surface p-4">
      <h2 class="text-lg font-semibold">{SONG_MANAGEMENT_SECTION_COPY.standardCreate}</h2>
      <div class="mt-3 space-y-4">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ManagementTextField
            label={FIELD.officialIdx}
            value={draft().official_idx}
            maxLength={SONG_MANAGEMENT_INPUT_LIMITS.officialIdx}
            placeholder={FIELD.officialIdxPlaceholder}
            onInput={(value) => updateField('official_idx', value)}
          />
          <ManagementTextField
            label={FIELD.title}
            value={draft().title}
            inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
            onInput={(value) => updateField('title', value)}
          />
          <ManagementTextField
            label={FIELD.reading}
            value={draft().reading ?? ''}
            maxLength={SONG_MANAGEMENT_INPUT_LIMITS.reading}
            inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
            onInput={(value) => updateField('reading', toOptionalTextInput(value))}
          />
          <ManagementTextField
            label={FIELD.artist}
            value={draft().artist}
            inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
            onInput={(value) => updateField('artist', value)}
          />
          <ManagementTextField
            label={FIELD.wikiPageTitle}
            value={draft().wiki_page_title ?? ''}
            maxLength={SONG_EDIT_INPUT_LIMITS.wikiPageTitle}
            inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
            onInput={(value) => updateField('wiki_page_title', toOptionalTextInput(value))}
          />
          <div class="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-3 lg:grid-cols-4">
            <GenreSelectField
              label={FIELD.genre}
              value={draft().genre_id}
              genres={props.genres}
              placeholder={FIELD.genreCreatePlaceholder}
              onChange={(value) => updateField('genre_id', value)}
            />
            <ManagementTextField
              label={FIELD.bpm}
              type="number"
              value={draft().bpm ?? ''}
              onInput={(value) => updateField('bpm', toOptionalNumberInput(value))}
            />
            <ManagementTextField
              label={FIELD.releasedAt}
              type="date"
              value={toDateInputValue(draft().released_at)}
              onInput={(value) => updateField('released_at', toOptionalTextInput(value))}
            />
            <ManagementTextField
              label={FIELD.jacket}
              value={draft().jacket ?? ''}
              onInput={(value) => updateField('jacket', toOptionalTextInput(value))}
            />
            <div class="flex items-end py-2">
              <ManagementCheckbox
                checked={draft().is_new === true}
                ariaLabel={FIELD.isNew}
                label={FIELD.isNew}
                onChange={(checked) => updateField('is_new', checked)}
              />
            </div>
          </div>
        </div>

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
                        onChange={(checked) => updateChart(chartIndex, 'enabled', checked)}
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
                            updateChart(chartIndex, 'const', event.currentTarget.value)
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
                        onChange={(checked) => updateChart(chartIndex, 'is_const_unknown', checked)}
                      />
                    </td>
                    <td class="px-3 py-2">
                      <TextField disabled={!chart().enabled}>
                        <TextField.Input
                          type="number"
                          value={chart().notes ?? ''}
                          onInput={(event) =>
                            updateChart(
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
                            updateChart(
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
