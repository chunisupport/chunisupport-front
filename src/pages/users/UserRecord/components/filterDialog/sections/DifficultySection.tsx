import { Star } from 'lucide-solid'
import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import { AppButton } from '../../../../../../components/common/AppButton'
import { CheckboxField } from '../../../../../../components/common/CheckboxField'
import type { Difficulty } from '../../../../../../types/recordFilter'

type DifficultySectionProps = {
  /** 表示する難易度候補。 */
  difficulties: Difficulty[]
  /** 選択中の難易度。 */
  selected: Difficulty[]
  /** 現在のOP対象譜面だけに絞るか。 */
  currentOpTargetOnly: boolean
  /** お気に入り楽曲だけに絞るか。 */
  favoriteSongsOnly: boolean
  /** 難易度の選択状態を切り替える。 */
  onToggle: (difficulty: Difficulty) => void
  /** 現在のOP対象譜面フィルターを切り替える。 */
  onCurrentOpTargetOnlyChange: (checked: boolean) => void
  /** お気に入り楽曲フィルターを切り替える。 */
  onFavoriteSongsOnlyChange: (checked: boolean) => void
  /** お気に入り楽曲設定を開く。 */
  onOpenFavoriteSongs?: () => void
  /** お気に入り楽曲設定を無効化するか。 */
  favoriteSongsDisabled?: boolean
}

/** OP対象フィルターのチェックボックスID。 */
const CURRENT_OP_TARGET_ONLY_CHECKBOX_ID = 'filter-current-op-target-only'

/** OP計算対象譜面フィルターのラベル。 */
const CURRENT_OP_TARGET_ONLY_LABEL = 'OP計算対象の譜面のみ表示'

/** お気に入り楽曲フィルターのチェックボックスID。 */
const FAVORITE_SONGS_ONLY_CHECKBOX_ID = 'filter-favorite-songs-only'

/** お気に入り楽曲フィルターのラベル。 */
const FAVORITE_SONGS_ONLY_LABEL = 'お気に入り楽曲のみ表示'

/** お気に入り楽曲設定ボタンのラベル。 */
const FAVORITE_SONGS_SETTINGS_LABEL = 'お気に入り楽曲設定'

/**
 * 通常レコードの難易度条件と現在のOP対象条件を表示する。
 *
 * @param props - 難易度候補、選択状態、OP対象条件、各変更ハンドラ。
 * @returns 難易度フィルターセクションの JSX 要素。
 */
const DifficultySection: Component<DifficultySectionProps> = (props) => (
  <div>
    <span class="block text-sm font-medium mb-1">難易度</span>
    <div class="flex flex-col gap-2">
      <For each={props.difficulties}>
        {(diff, index) => {
          const id = `filter-difficulty-${index()}`
          return (
            <CheckboxField
              id={id}
              checked={props.selected.includes(diff)}
              onChange={() => props.onToggle(diff)}
              class="relative flex items-center gap-2"
              textVariant="large"
              label={diff}
            />
          )
        }}
      </For>
      <CheckboxField
        id={CURRENT_OP_TARGET_ONLY_CHECKBOX_ID}
        checked={props.currentOpTargetOnly}
        onChange={(checked) => props.onCurrentOpTargetOnlyChange(checked)}
        class="relative mt-1 flex items-center gap-2"
        textVariant="large"
        label={CURRENT_OP_TARGET_ONLY_LABEL}
      />
      <div class="-mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <CheckboxField
          id={FAVORITE_SONGS_ONLY_CHECKBOX_ID}
          checked={props.favoriteSongsOnly}
          onChange={(checked) => props.onFavoriteSongsOnlyChange(checked)}
          class="relative flex shrink-0 items-center gap-2"
          labelClass="whitespace-nowrap"
          textVariant="large"
          label={FAVORITE_SONGS_ONLY_LABEL}
        />
        <Show when={props.onOpenFavoriteSongs} keyed>
          {(onOpenFavoriteSongs) => (
            <div class="ml-auto flex shrink-0 justify-end">
              <AppButton
                class="shrink-0 whitespace-nowrap"
                variant="surface"
                size="xs"
                leftIcon={<Star size={20} aria-hidden="true" />}
                onClick={onOpenFavoriteSongs}
                disabled={props.favoriteSongsDisabled}
              >
                {FAVORITE_SONGS_SETTINGS_LABEL}
              </AppButton>
            </div>
          )}
        </Show>
      </div>
    </div>
  </div>
)

export default DifficultySection
