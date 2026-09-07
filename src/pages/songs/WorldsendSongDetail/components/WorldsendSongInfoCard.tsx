import { createSignal, For, Show } from 'solid-js'
import { updateWorldsendSongs } from '../../../../api/songs'
import { showSuccessToast } from '../../../../components/common/AppToast'
import { authSession } from '../../../../stores/authSession'
import type {
  MasterItemDTO,
  UpdateWorldsendChartRequestDTO,
  WorldsendSongDTO,
} from '../../../../types/api'
import { toUserFriendlyErrorMessage } from '../../../../utils/errorMessage'
import { canEditSongMaster } from '../../../../utils/songEditorRole'
import SongMasterEditButton from '../../components/SongMasterEditButton'
import SongMetaCardLayout from '../../components/SongMetaCardLayout'
import SongMetaEditDialog from '../../components/SongMetaEditDialog'
import WorldsendChartMetaEditDialog from '../../components/WorldsendChartMetaEditDialog'
import { SONG_EDIT_COPY } from '../../songEditConstants'
import {
  buildWorldsendChartMetaUpdateRequest,
  buildWorldsendSongMetaUpdateRequest,
  type SongMetaEditValues,
} from '../../utils/songMetaEdit'
import { getWorldsendChartRows, getWorldsendSongInfoItems } from '../../worldsendDetailModel'

const badgeClass = '[background:var(--cs-color-worldsend-label-bg)] text-worldsend-label-text'
const fixedColumnClass = 'w-px whitespace-nowrap'
const fixedCellClass = 'px-3 py-2 text-text whitespace-nowrap'

type Props = {
  song: WorldsendSongDTO
  versionName: string
  genres: MasterItemDTO[]
  onUpdated: () => Promise<void>
}

/**
 * WORLD'S END楽曲の基本情報と譜面情報を表示し、EDITOR / ADMIN 向けの編集導線を提供する。
 *
 * @param props - 表示対象の楽曲、バージョン名、ジャンル候補、更新後処理。
 * @returns 楽曲情報カードUI。
 */
const WorldsendSongInfoCard = (props: Props) => {
  const [songDialogOpen, setSongDialogOpen] = createSignal(false)
  const [chartDialogOpen, setChartDialogOpen] = createSignal(false)
  const [savingSong, setSavingSong] = createSignal(false)
  const [savingChart, setSavingChart] = createSignal(false)
  const [songFormError, setSongFormError] = createSignal('')
  const [chartFormError, setChartFormError] = createSignal('')

  const canEdit = () =>
    authSession.status === 'authenticated' && canEditSongMaster(authSession.user?.account_type)

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
      await updateWorldsendSongs([buildWorldsendSongMetaUpdateRequest(props.song, values)])
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
   * @param chart - 編集後の WORLD'S END 譜面。
   * @returns なし。
   */
  const handleChartMetaSubmit = async (chart: UpdateWorldsendChartRequestDTO): Promise<void> => {
    setSavingChart(true)
    setChartFormError('')
    try {
      await updateWorldsendSongs([buildWorldsendChartMetaUpdateRequest(props.song, chart)])
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
        infoItems={getWorldsendSongInfoItems(props.song, props.versionName)}
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
                  <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}></th>
                  <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}>LEVEL</th>
                  <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}>NOTES</th>
                  <th class="px-3 py-2 font-medium text-text-muted whitespace-nowrap">
                    NOTES DESIGNER
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={getWorldsendChartRows(props.song)}>
                  {(chart) => (
                    <tr class="border-t border-border">
                      <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                        <div
                          class={`rounded px-3 py-1 text-center text-xs font-semibold tracking-wide whitespace-nowrap ${badgeClass}`}
                        >
                          {chart.label}
                        </div>
                      </td>
                      <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                        <span class="block whitespace-nowrap font-bold">{chart.attribute}</span>
                      </td>
                      <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                        <span class="block whitespace-nowrap">{chart.level}</span>
                      </td>
                      <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                        <span class="block whitespace-nowrap">{chart.notes}</span>
                      </td>
                      <td class="px-3 py-2 text-text">
                        <span class="font-sans block whitespace-nowrap">{chart.notesDesigner}</span>
                      </td>
                    </tr>
                  )}
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
        requireGenre={false}
        saving={savingSong()}
        apiErrorMessage={songFormError()}
        onOpenChange={setSongDialogOpen}
        onSubmit={handleSongMetaSubmit}
      />
      <WorldsendChartMetaEditDialog
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

export default WorldsendSongInfoCard
