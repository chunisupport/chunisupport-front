import { A } from '@solidjs/router'
import { Wrench } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

import { SYSTEM_STATUS_LABELS } from '../../constants/maintenance'
import { ADMIN_MAINTENANCE_PATH } from '../../constants/routes'
import { authSession } from '../../stores/authSession'
import { availability } from '../../stores/availability'
import { isMaintenanceStaff } from '../../utils/maintenanceRole'

const MAINTENANCE_STATUS_LABEL_CLASS =
  'inline-flex items-center gap-1.5 rounded-full border border-action-primary-border bg-action-primary px-3 py-1 text-sm font-semibold text-text-inverse shadow-sm'

/**
 * メンテナンス状態ラベルのアイコンと文言を表示する。
 *
 * @returns スパナアイコンとメンテナンス中の文言。
 */
const MaintenanceStatusLabelContent = (): JSX.Element => (
  <>
    <Wrench class="h-4 w-4 shrink-0" aria-hidden="true" />
    <span>{SYSTEM_STATUS_LABELS.maintenance}</span>
  </>
)

/**
 * メンテナンス中にスタッフ向けの状態ラベルを表示する。
 * ADMINにはメンテナンス管理画面へのリンクを提供し、EDITORには非インタラクティブな表示だけを行う。
 *
 * @returns スタッフ向けメンテナンス状態ラベル。対象外の状態・権限では何も表示しない。
 */
const MaintenanceStatusLabel = (): JSX.Element => {
  const isMaintenance = (): boolean => availability.state.kind === 'maintenance'
  const isMaintenanceStaffUser = (): boolean => isMaintenanceStaff(authSession.user?.account_type)
  const isAdmin = (): boolean => authSession.user?.account_type === 'ADMIN'

  return (
    <Show when={isMaintenance() && isMaintenanceStaffUser()}>
      <div class="pointer-events-none fixed bottom-16 left-4 z-30 md:bottom-4 md:left-28">
        <Show
          when={isAdmin()}
          fallback={
            <span class={MAINTENANCE_STATUS_LABEL_CLASS}>
              <MaintenanceStatusLabelContent />
            </span>
          }
        >
          <A
            href={ADMIN_MAINTENANCE_PATH}
            class={`${MAINTENANCE_STATUS_LABEL_CLASS} pointer-events-auto hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg`}
          >
            <MaintenanceStatusLabelContent />
          </A>
        </Show>
      </div>
    </Show>
  )
}

export default MaintenanceStatusLabel
