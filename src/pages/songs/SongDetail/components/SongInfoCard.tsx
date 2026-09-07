import { createSignal, For, Show } from 'solid-js'
import { updateSongs } from '../../../../api/songs'
import { showSuccessToast } from '../../../../components/common/AppToast'
import { DifficultyBadge } from '../../../../components/common/DifficultyBadge'
import { authSession } from '../../../../stores/authSession'
import type { MasterItemDTO, SongDTO, UpdateChartRequestDTO } from '../../../../types/api'
import { formatChartConst } from '../../../../utils/chartConstFormat'
import { toUserFriendlyErrorMessage } from '../../../../utils/errorMessage'
import { canEditSongMaster } from '../../../../utils/songEditorRole'
import ChartMetaEditDialog from '../../components/ChartMetaEditDialog'
import SongMasterEditButton from '../../components/SongMasterEditButton'
import SongMetaCardLayout, { type SongMetaInfoItem } from '../../components/SongMetaCardLayout'
import SongMetaEditDialog from '../../components/SongMetaEditDialog'
import { SONG_EDIT_COPY } from '../../songEditConstants'
import {
  buildChartMetaUpdateRequest,
  buildSongMetaUpdateRequest,
  type SongMetaEditValues,
} from '../../utils/songMetaEdit'

const fixedColumnClass = 'w-px whitespace-nowrap'
const fixedCellClass = 'px-3 py-2 text-text whitespace-nowrap'

type DifficultyOption = {
  label: string
  value: string
}

type Props = {
  song: SongDTO
  availableDifficulties: DifficultyOption[]
  versionName: string
  genres: MasterItemDTO[]
  onUpdated: () => Promise<void>
}

/**
 * 通常楽曲の基本情報と譜面情報を表示し、EDITOR / ADMIN 向けの編集導線を提供する。
 *
 * @param props - 表示対象の楽曲、難易度、バージョン名、ジャンル候補、更新後処理。
 * @returns 楽曲情報カードUI。
 */
const SongInfoCard = (props: Props) => {
  const [songDialogOpen, setSongDialogOpen] = createSignal(false)
  const [chartDialogOpen, setChartDialogOpen] = createSignal(false)
  const [savingSong, setSavingSong] = createSignal(false)
  const [savingChart, setSavingChart] = createSignal(false)
  const [songFormError, setSongFormError] = createSignal('')
  const [chartFormError, setChartFormError] = createSignal('')

  const canEdit = () =>
    authSession.status === 'authenticated' && canEditSongMaster(authSession.user?.account_type)

  const getNotesDesignerLabel = (notesDesigner: string | null | undefined) => {
    const trimmed = notesDesigner?.trim()
    return trimmed ? trimmed : '-'
  }

  const songInfoItems = (): SongMetaInfoItem[] => [
    { label: 'GENRE', value: props.song.genre },
    { label: 'BPM', value: props.song.bpm ?? '-' },
    { label: 'RELEASE', value: props.song.release ?? '-' },
    { label: 'VERSION', value: props.versionName },
  ]

  /**
   * 楽曲情報の編集結果を保存する。
   *
   * @param values - 編集後のジャンル、BPM、リリース日。
   * @returns なし。
   */
  const handleSongMetaSubmit = async (values: SongMetaEditValues): Promise<void> => {
    setSavingSong(true)
    setSongFormError('')
    try {
      await updateSongs([buildSongMetaUpdateRequest(props.song, values)])
      showSuccessToast(SONG_EDIT_COPY.songUpdateSuccess)
      setSongDialogOpen(false)
      await props.onUpdated()
    } catch (error) {
      setSongFormError(toUserFriendlyErrorMessage(error, SONG_EDIT_COPY.songUpdateError))
    } finally {
      setSavingSong(false)
    }
  }

  /**
   * 譜面情報の編集結果を保存する。
   *
   * @param charts - 編集後の譜面マップ。
   * @returns なし。
   */
  const handleChartMetaSubmit = async (
    charts: Record<string, UpdateChartRequestDTO>
  ): Promise<void> => {
    setSavingChart(true)
    setChartFormError('')
    try {
      await updateSongs([buildChartMetaUpdateRequest(props.song, charts)])
      showSuccessToast(SONG_EDIT_COPY.chartUpdateSuccess)
      setChartDialogOpen(false)
      await props.onUpdated()
    } catch (error) {
      setChartFormError(toUserFriendlyErrorMessage(error, SONG_EDIT_COPY.chartUpdateError))
    } finally {
      setSavingChart(false)
    }
  }

  return (
    <>
      <SongMetaCardLayout
        title={props.song.title}
        jacket={props.song.jacket}
        infoItems={songInfoItems()}
        infoAction={
          canEdit() ? (
            <SongMasterEditButton
              ariaLabel={SONG_EDIT_COPY.editSongAriaLabel}
              onClick={() => {
                setSongFormError('')
                setSongDialogOpen(true)
              }}
            />
          ) : undefined
        }
      >
        <div class="relative rounded-md border border-border bg-surface p-4">
          <Show when={canEdit()}>
            <SongMasterEditButton
              ariaLabel={SONG_EDIT_COPY.editChartAriaLabel}
              onClick={() => {
                setChartFormError('')
                setChartDialogOpen(true)
              }}
            />
          </Show>
          <div class="overflow-x-auto">
            <table class="min-w-full table-auto text-sm">
              <thead class="bg-surface-muted text-left">
                <tr>
                  <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}></th>
                  <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}>CONST</th>
                  <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}>NOTES</th>
                  <th class="px-3 py-2 font-medium text-text-muted whitespace-nowrap">
                    NOTES DESIGNER
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={props.availableDifficulties}>
                  {(difficulty) => {
                    const key = difficulty.label as keyof typeof props.song.charts
                    const chart = props.song.charts[key]
                    return (
                      <tr class="border-t border-border">
                        <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                          <DifficultyBadge
                            difficulty={difficulty.label as keyof typeof props.song.charts}
                          />
                        </td>
                        <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                          <span
                            class={`block whitespace-nowrap ${chart?.is_const_unknown ? 'opacity-50' : ''}`}
                          >
                            {chart ? (
                              <>
                                {formatChartConst(chart.const)}
                                {chart.is_const_unknown ? (
                                  <sup class="text-[0.65em] leading-none">?</sup>
                                ) : null}
                              </>
                            ) : (
                              '-'
                            )}
                          </span>
                        </td>
                        <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                          <span class="block whitespace-nowrap">{chart?.notes ?? '-'}</span>
                        </td>
                        <td class="px-3 py-2 text-text">
                          <span class="font-sans block whitespace-nowrap">
                            {getNotesDesignerLabel(chart?.notes_designer)}
                          </span>
                        </td>
                      </tr>
                    )
                  }}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </SongMetaCardLayout>

      <SongMetaEditDialog
        open={songDialogOpen()}
        genres={props.genres}
        initialGenre={props.song.genre}
        initialBpm={props.song.bpm}
        initialRelease={props.song.release}
        requireGenre
        saving={savingSong()}
        apiErrorMessage={songFormError()}
        onOpenChange={setSongDialogOpen}
        onSubmit={handleSongMetaSubmit}
      />
      <ChartMetaEditDialog
        open={chartDialogOpen()}
        song={props.song}
        saving={savingChart()}
        apiErrorMessage={chartFormError()}
        onOpenChange={setChartDialogOpen}
        onSubmit={handleChartMetaSubmit}
      />
    </>
  )
}

export default SongInfoCard
