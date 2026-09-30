import { TextField } from '@kobalte/core/text-field'
import { createMemo, createSignal, For } from 'solid-js'
import { AppButton } from '../../components/common/AppButton'
import { AppSelect } from '../../components/common/AppSelect'
import { UserNameplate } from '../../components/common/profile/UserNameplate'
import { POSSESSION_NAMES } from '../../constants/possession'
import type { PossessionName } from '../../types/api'
import {
  ADMIN_NAMEPLATE_PREVIEW_COPY,
  NAMEPLATE_PREVIEW_EMBLEM_OPTIONS,
  NAMEPLATE_PREVIEW_NAME_MAX_LENGTH,
  NAMEPLATE_PREVIEW_NAME_PRESETS,
  NAMEPLATE_PREVIEW_WIDTH_OPTIONS,
} from './AdminNameplatePreviewPanel.constants'
import {
  NAMEPLATE_PREVIEW_HONORS,
  NAMEPLATE_PREVIEW_PLAYER,
  NAMEPLATE_PREVIEW_RATING,
} from './adminNameplatePreview'

type EmblemOption = (typeof NAMEPLATE_PREVIEW_EMBLEM_OPTIONS)[number]
type WidthOption = (typeof NAMEPLATE_PREVIEW_WIDTH_OPTIONS)[number]

const SELECT_ITEM_CLASS =
  'hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg'

/**
 * プレイヤー名・エンブレム・ポゼッション・幅を切り替えながらプロフィールカードを確認する。
 *
 * @returns プロフィールカード確認画面。
 */
const AdminNameplatePreviewPanel = () => {
  const [name, setName] = createSignal(NAMEPLATE_PREVIEW_PLAYER.name)
  const [emblem, setEmblem] = createSignal<EmblemOption>(NAMEPLATE_PREVIEW_EMBLEM_OPTIONS[6])
  const [emblemBase, setEmblemBase] = createSignal<EmblemOption>(
    NAMEPLATE_PREVIEW_EMBLEM_OPTIONS[6]
  )
  const [possession, setPossession] = createSignal<PossessionName>('normal')
  const [width, setWidth] = createSignal<WidthOption>(NAMEPLATE_PREVIEW_WIDTH_OPTIONS[0])

  /** 操作中の設定を反映したプレイヤー情報 */
  const player = createMemo(() => ({
    ...NAMEPLATE_PREVIEW_PLAYER,
    name: name(),
    class_emblem: emblem().value,
    class_emblem_base: emblemBase().value,
  }))

  return (
    <div class="mx-auto w-full max-w-3xl">
      <div class="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TextField class="col-span-2 sm:col-span-4" value={name()} onChange={setName}>
          <TextField.Label class="mb-1 block text-sm font-medium text-text-muted">
            {ADMIN_NAMEPLATE_PREVIEW_COPY.nameLabel}
          </TextField.Label>
          <TextField.Input
            maxLength={NAMEPLATE_PREVIEW_NAME_MAX_LENGTH}
            class="h-10 w-full rounded border border-border-strong bg-surface px-3 font-sans text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
          />
        </TextField>
        <AppSelect<EmblemOption>
          options={[...NAMEPLATE_PREVIEW_EMBLEM_OPTIONS]}
          optionValue="label"
          optionTextValue="label"
          value={emblem()}
          onChange={(option) => option && setEmblem(option)}
          label={ADMIN_NAMEPLATE_PREVIEW_COPY.emblemLabel}
          formatLabel={(option) => option.label}
          triggerClass="h-10"
          itemClass={SELECT_ITEM_CLASS}
        />
        <AppSelect<EmblemOption>
          options={[...NAMEPLATE_PREVIEW_EMBLEM_OPTIONS]}
          optionValue="label"
          optionTextValue="label"
          value={emblemBase()}
          onChange={(option) => option && setEmblemBase(option)}
          label={ADMIN_NAMEPLATE_PREVIEW_COPY.emblemBaseLabel}
          formatLabel={(option) => option.label}
          triggerClass="h-10"
          itemClass={SELECT_ITEM_CLASS}
        />
        <AppSelect<PossessionName>
          options={[...POSSESSION_NAMES]}
          value={possession()}
          onChange={(option) => option && setPossession(option)}
          label={ADMIN_NAMEPLATE_PREVIEW_COPY.possessionLabel}
          triggerClass="h-10"
          itemClass={SELECT_ITEM_CLASS}
        />
        <AppSelect<WidthOption>
          options={[...NAMEPLATE_PREVIEW_WIDTH_OPTIONS]}
          optionValue="label"
          optionTextValue="label"
          value={width()}
          onChange={(option) => option && setWidth(option)}
          label={ADMIN_NAMEPLATE_PREVIEW_COPY.widthLabel}
          formatLabel={(option) => option.label}
          triggerClass="h-10"
          itemClass={SELECT_ITEM_CLASS}
        />
      </div>

      <div class="mb-6 flex flex-wrap gap-2">
        <For each={NAMEPLATE_PREVIEW_NAME_PRESETS}>
          {(preset) => (
            <AppButton variant="surface" size="xs" onClick={() => setName(preset.value)}>
              {preset.label}
            </AppButton>
          )}
        </For>
      </div>

      <div class="mb-10 flex justify-center">
        <UserNameplate
          playerInfo={player()}
          honors={NAMEPLATE_PREVIEW_HONORS}
          rating={NAMEPLATE_PREVIEW_RATING}
          historyHref="#"
          possessionName={possession()}
          widthClass={width().value}
        />
      </div>

      <h2 class="mb-4 text-xl font-semibold">{ADMIN_NAMEPLATE_PREVIEW_COPY.emblemListHeading}</h2>
      <div class="mb-10 flex flex-col items-center gap-4">
        <For each={NAMEPLATE_PREVIEW_EMBLEM_OPTIONS.slice(1)}>
          {(option) => (
            <UserNameplate
              playerInfo={{
                ...player(),
                class_emblem: option.value,
                class_emblem_base: option.value,
              }}
              honors={NAMEPLATE_PREVIEW_HONORS}
              rating={NAMEPLATE_PREVIEW_RATING}
              possessionName={possession()}
              widthClass={width().value}
            />
          )}
        </For>
      </div>

      <h2 class="mb-4 text-xl font-semibold">
        {ADMIN_NAMEPLATE_PREVIEW_COPY.possessionListHeading}
      </h2>
      <div class="flex flex-col items-center gap-8">
        <For each={POSSESSION_NAMES}>
          {(possessionName) => (
            <section class="flex flex-col items-center">
              <h3 class="mb-2 text-center font-sans text-sm text-text-muted">{possessionName}</h3>
              <UserNameplate
                playerInfo={player()}
                honors={NAMEPLATE_PREVIEW_HONORS}
                rating={NAMEPLATE_PREVIEW_RATING}
                historyHref="#"
                possessionName={possessionName}
                widthClass={width().value}
              />
            </section>
          )}
        </For>
      </div>
    </div>
  )
}

export default AdminNameplatePreviewPanel
