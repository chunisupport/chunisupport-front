import { useLocation } from '@solidjs/router'
import type { JSX } from 'solid-js'
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  Match,
  onCleanup,
  onMount,
  Switch,
} from 'solid-js'
import { fetchMe } from '../../api/users'
import { Loading } from '../../components'
import { API_UNAVAILABLE_PAGE_COPY, AVAILABILITY_CHECKING_LABEL } from '../../constants/maintenance'
import { auth } from '../../lib/firebase'
import ApiUnavailablePage from '../../pages/maintenance/ApiUnavailablePage'
import MaintenancePage from '../../pages/maintenance/MaintenancePage'
import {
  clearAuthenticatedUser,
  getAuthenticatedUser,
  getAuthStatus,
  setAuthSessionError,
} from '../../stores/authSession'
import { availability, subscribeMaintenanceDetected } from '../../stores/availability'
import { resolveAuthSession } from '../../usecases/auth/resolveAuthSession'
import { getApplicationAvailabilityPollingDelayMs } from '../../usecases/availability/applicationPollingPolicy'
import {
  type AvailabilityPollingController,
  createAvailabilityPolling,
} from '../../usecases/availability/availabilityPolling'
import {
  type AvailabilityRefreshResult,
  abortAvailabilityRefresh,
  refreshAvailability,
} from '../../usecases/availability/refreshAvailability'
import { isMaintenanceSessionResolved, resolveAvailabilityView } from './availabilityView'

type ApplicationAvailabilityGateProps = {
  children?: JSX.Element
}

/**
 * メンテナンス中も利用可能なスタッフセッションだけを復元する。
 *
 * @returns 復元処理が完了した時点で解決されるPromise。
 */
const restoreMaintenanceStaffSession = async (): Promise<void> => {
  await auth.authStateReady()
  if (!auth.currentUser) {
    clearAuthenticatedUser()
    return
  }

  await resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }), {
    forceRefresh: true,
  })
}

/**
 * アプリ全体をAPI可用性で制御し、メンテナンスと接続不能を専用画面へ切り替える。
 *
 * @param props - ルーターが解決したアプリ本体。
 * @returns 現在の可用性とスタッフ認証に対応する画面。
 */
const ApplicationAvailabilityGate = (props: ApplicationAvailabilityGateProps) => {
  const location = useLocation()
  const [isBootstrapping, setIsBootstrapping] = createSignal(true)
  const [hasRestoredMaintenanceSession, setHasRestoredMaintenanceSession] = createSignal(false)
  const [isRefreshing, setIsRefreshing] = createSignal(false)
  const [announcement, setAnnouncement] = createSignal('')
  let polling: AvailabilityPollingController<AvailabilityRefreshResult> | null = null
  let maintenanceSessionRestoration: Promise<void> | null = null
  let disposed = false

  const hasKnownAuthenticatedUser = createMemo(
    () => getAuthStatus() === 'authenticated' && getAuthenticatedUser() !== null
  )
  const maintenanceSessionResolved = createMemo(() =>
    isMaintenanceSessionResolved({
      authStatus: getAuthStatus(),
      hasAuthenticatedUser: getAuthenticatedUser() !== null,
      hasRestored: hasRestoredMaintenanceSession(),
    })
  )
  const view = createMemo(() =>
    resolveAvailabilityView({
      pathname: location.pathname,
      state: availability.state,
      isBootstrapping:
        isBootstrapping() ||
        (availability.state.kind === 'maintenance' && !maintenanceSessionResolved()),
      accountType: hasKnownAuthenticatedUser() ? getAuthenticatedUser()?.account_type : undefined,
    })
  )

  /**
   * 現在のメンテナンス期間についてスタッフセッションを重複なく復元する。
   *
   * @returns 復元済み、または進行中の復元処理を表すPromise。
   */
  const ensureMaintenanceStaffSessionRestored = (): Promise<void> => {
    if (hasRestoredMaintenanceSession()) {
      return Promise.resolve()
    }
    if (maintenanceSessionRestoration) {
      return maintenanceSessionRestoration
    }

    const restoration = restoreMaintenanceStaffSession()
      .catch(() => {
        clearAuthenticatedUser()
      })
      .finally(() => {
        if (maintenanceSessionRestoration === restoration) {
          maintenanceSessionRestoration = null
        }
        if (!disposed && availability.state.kind === 'maintenance') {
          setHasRestoredMaintenanceSession(true)
        }
      })
    maintenanceSessionRestoration = restoration
    return restoration
  }

  /**
   * API接続不能画面から状態を再確認し、結果を単一ライブリージョンへ通知する。
   *
   * @returns 状態確認と通知更新が完了した時点で解決されるPromise。
   */
  const refreshNow = async (): Promise<void> => {
    if (isRefreshing()) {
      return
    }

    setAnnouncement('')
    setIsRefreshing(true)
    try {
      if (polling) {
        await polling.refreshNow()
      } else {
        await refreshAvailability()
      }

      const state = availability.state
      if (state.kind === 'unavailable') {
        setAnnouncement(API_UNAVAILABLE_PAGE_COPY.unchanged)
      } else if (state.kind === 'operational') {
        setAnnouncement(API_UNAVAILABLE_PAGE_COPY.recovered)
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  onMount(() => {
    polling = createAvailabilityPolling({
      refresh: refreshAvailability,
      abort: abortAvailabilityRefresh,
      getPollingDelayMs: (state) =>
        getApplicationAvailabilityPollingDelayMs(state, location.pathname),
    })
    const unsubscribeMaintenanceDetected = subscribeMaintenanceDetected(() => {
      if (getAuthStatus() === 'authenticated') {
        batch(() => {
          setAuthSessionError()
          setHasRestoredMaintenanceSession(false)
        })
      }
      void polling?.refreshNow()
    })

    void (async () => {
      await refreshAvailability()
      if (disposed) {
        return
      }

      setIsBootstrapping(false)
      polling?.start()
    })()

    onCleanup(() => {
      disposed = true
      unsubscribeMaintenanceDetected()
      polling?.dispose()
      abortAvailabilityRefresh()
    })
  })

  createEffect(() => {
    if (availability.state.kind !== 'maintenance') {
      setHasRestoredMaintenanceSession(false)
      return
    }

    if (hasKnownAuthenticatedUser()) {
      setHasRestoredMaintenanceSession(true)
      return
    }

    if (!hasRestoredMaintenanceSession()) {
      void ensureMaintenanceStaffSessionRestored()
    }
  })

  createEffect(() => {
    const state = availability.state
    location.pathname
    state.kind
    if (state.kind === 'maintenance') {
      state.retryAfterSeconds
      state.checkedAt
    } else if (state.kind === 'unavailable') {
      state.retryCount
      state.checkedAt
    } else if (state.kind === 'operational') {
      state.checkedAt
    }
    polling?.sync()
  })

  return (
    <Switch>
      <Match when={view() === 'application'}>{props.children}</Match>
      <Match when={view() === 'maintenance'}>
        <MaintenancePage />
      </Match>
      <Match when={view() === 'unavailable'}>
        <ApiUnavailablePage
          isRefreshing={isRefreshing()}
          announcement={announcement()}
          onRetry={() => void refreshNow()}
        />
      </Match>
      <Match when={view() === 'loading'}>
        <main
          class="flex min-h-dvh items-center justify-center"
          aria-busy="true"
          aria-label={AVAILABILITY_CHECKING_LABEL}
        >
          <Loading />
        </main>
      </Match>
    </Switch>
  )
}

export default ApplicationAvailabilityGate
