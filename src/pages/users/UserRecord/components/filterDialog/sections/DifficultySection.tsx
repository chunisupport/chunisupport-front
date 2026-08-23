import { Star } from 'lucide-solid'
import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import { AppButton } from '../../../../../../components/common/AppButton'
import { AppSelect } from '../../../../../../components/common/AppSelect'
import { CheckboxField } from '../../../../../../components/common/CheckboxField'
import type { Difficulty, OpTargetType } from '../../../../../../types/recordFilter'

type DifficultySectionProps = {
  /** 表示する難易度候補。 */
  difficulties: Difficulty[]
  /** 選択中の難易度。 */
  selected: Difficulty[]
  /** OP対象譜面だけに絞るか。 */
  opTargetOnly: boolean
  /** OP対象譜面の判定種別。 */
  opTargetType: OpTargetType
  /** お気に入り楽曲だけに絞るか。 */
  favoriteSongsOnly: boolean
  /** 難易度の選択状態を切り替える。 */
  onToggle: (difficulty: Difficulty) => void
  /** OP対象譜面フィルターを切り替える。 */
  onOpTargetOnlyChange: (checked: boolean) => void
  /** OP対象譜面の判定種別を変更する。 */
  onOpTargetTypeChange: (type: OpTargetType) => void
  /** お気に入り楽曲フィルターを切り替える。 */
  onFavoriteSongsOnlyChange: (checked: boolean) => void
  /** お気に入り楽曲設定を開く。 */
  onOpenFavoriteSongs?: () => void
  /** お気に入り楽曲設定を無効化するか。 */
  favoriteSongsDisabled?: boolean
}

/** OP対象フィルターのチェックボックスID。 */
const OP_TARGET_ONLY_CHECKBOX_ID = 'filter-op-target-only'

/** OP対象種別Selectのラベル。 */
const OP_TARGET_TYPE_SELECT_LABEL = 'OP対象の種別'

/** OP対象種別Selectの選択肢。 */
const OP_TARGET_TYPE_OPTIONS: OpTargetType[] = ['current', 'theoretical']

/** OP対象種別の表示ラベル。 */
const OP_TARGET_TYPE_LABELS: Readonly<Record<OpTargetType, string>> = {
  current: '現在のOP対象',
  theoretical: 'OP理論値対象',
}

/** OP対象種別Selectの後ろに表示する文言。 */
const OP_TARGET_ONLY_SUFFIX = 'の譜面のみ表示'

/** OP対象フィルターのスクリーンリーダー用接頭辞。 */
const OP_TARGET_ONLY_SR_PREFIX = 'OP対象'

/** お気に入り楽曲フィルターのチェックボックスID。 */
const FAVORITE_SONGS_ONLY_CHECKBOX_ID = 'filter-favorite-songs-only'

/** お気に入り楽曲フィルターのラベル。 */
const FAVORITE_SONGS_ONLY_LABEL = 'お気に入り楽曲のみ表示'

/** お気に入り楽曲設定ボタンのラベル。 */
const FAVORITE_SONGS_SETTINGS_LABEL = 'お気に入り楽曲設定'

/**
 * OP対象種別をSelectへ表示する文言に変換する。
 *
 * @param type - 表示対象のOP対象種別。
 * @returns OP対象種別の表示ラベル。
 */
const formatOpTargetTypeLabel = (type: OpTargetType): string => OP_TARGET_TYPE_LABELS[type]

/**
 * 通常レコードの難易度条件とOP対象条件を表示する。
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
      <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <CheckboxField
          id={OP_TARGET_ONLY_CHECKBOX_ID}
          checked={props.opTargetOnly}
          onChange={(checked) => props.onOpTargetOnlyChange(checked)}
          class="relative -m-2 shrink-0 p-2"
          textVariant="large"
        />
        <AppSelect<OpTargetType>
          value={props.opTargetType}
          onChange={(type) => type && props.onOpTargetTypeChange(type)}
          options={OP_TARGET_TYPE_OPTIONS}
          formatLabel={formatOpTargetTypeLabel}
          label={OP_TARGET_TYPE_SELECT_LABEL}
          labelVariant="srOnly"
          disabled={!props.opTargetOnly}
          rootClass="w-44 max-w-full"
          triggerClass="py-1.5 text-base"
        />
        <label class="cursor-pointer" for={OP_TARGET_ONLY_CHECKBOX_ID}>
          <span class="sr-only">{OP_TARGET_ONLY_SR_PREFIX}</span>
          {OP_TARGET_ONLY_SUFFIX}
        </label>
      </div>
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
