import { type Accessor, createMemo, createSignal } from 'solid-js'
import type {
  PlayerDataCourseRecordChange,
  PlayerDataRecordChange,
  PlayerDataSongRecordChange,
} from '../../types/api'
import type { SortDirection } from '../../utils/sortingQuery'
import { isLampOnlyRegisterScoreChange } from './registerScoreChangeFilter'
import {
  createRegisterScoreChangeKey,
  isRegisterScoreImageSectionExcluded,
  updateRegisterScoreExcludedChangeKeys,
} from './registerScoreImageVisibility'
import type { RegisterScoreSongSortValuesResolver } from './registerScoreResolvers'
import {
  DEFAULT_REGISTER_SCORE_SORT_SETTINGS,
  type RegisterScorePrimarySortKey,
  type RegisterScoreSortSettings,
  sortRegisterScoreChanges,
} from './registerScoreSorting'

/** 更新差分カードの表示状態を生成するための入力 */
export type RegisterScoreChangeListStateOptions = {
  /** APIが返した楽曲・コースの更新差分 */
  changes: Accessor<readonly PlayerDataRecordChange[]>
  /** 楽曲カードのソート値を解決する関数。楽曲カードの算出中に呼ぶため、内部で読んだSignalも追跡される。 */
  resolveSongSortValues: RegisterScoreSongSortValuesResolver
}

/** 更新差分カードのソート・ランプのみの更新の表示切替・画像除外の状態 */
export type RegisterScoreChangeListState = {
  /** 楽曲カードに適用中のソート設定 */
  sortSettings: Accessor<RegisterScoreSortSettings>
  /** 楽曲カードの主ソートキーを更新する */
  setPrimarySortKey: (primaryKey: RegisterScorePrimarySortKey) => void
  /** 楽曲カードの主ソート方向を更新する */
  setPrimarySortDirection: (primaryDirection: SortDirection) => void
  /** ランプのみの更新を非表示にしているか */
  hideLampOnlyChanges: Accessor<boolean>
  /** ランプのみの更新を非表示にするかを更新する */
  setHideLampOnlyChanges: (hidden: boolean) => void
  /** 表示設定とソートを反映した楽曲差分 */
  songChanges: Accessor<PlayerDataSongRecordChange[]>
  /** 表示設定を反映したコース差分 */
  courseChanges: Accessor<PlayerDataCourseRecordChange[]>
  /** 更新差分を画像から除外しているか判定する */
  isExcludedFromImage: (change: PlayerDataRecordChange) => boolean
  /** 更新差分を画像から除外するかを更新する */
  setExcludedFromImage: (change: PlayerDataRecordChange, excluded: boolean) => void
  /** 表示中の楽曲カードがすべて画像から除外されているか */
  songSectionExcludedFromImage: Accessor<boolean>
  /** 表示中のコースカードがすべて画像から除外されているか */
  courseSectionExcludedFromImage: Accessor<boolean>
}

/**
 * 更新差分レポートの楽曲・コースカードについて、ソート・ランプのみの更新の表示切替・画像除外の状態を管理する。
 *
 * 画像除外は表示切替やソートと独立して保持するため、ランプのみの更新を一時的に非表示にしても
 * 再表示時に除外状態が維持される。セクション単位の画像除外は表示中のカードだけで判定する。
 *
 * @param options - 更新差分と楽曲カードのソート値の解決関数。
 * @returns 表示対象のカード、画像除外状態、および各状態の更新関数。
 */
export const createRegisterScoreChangeListState = (
  options: RegisterScoreChangeListStateOptions
): RegisterScoreChangeListState => {
  const [sortSettings, setSortSettings] = createSignal<RegisterScoreSortSettings>({
    ...DEFAULT_REGISTER_SCORE_SORT_SETTINGS,
  })
  const [hideLampOnlyChanges, setHideLampOnlyChanges] = createSignal(false)
  const [excludedChangeKeys, setExcludedChangeKeys] = createSignal<ReadonlySet<string>>(new Set())

  const visibleChanges = createMemo(() =>
    hideLampOnlyChanges()
      ? options.changes().filter((change) => !isLampOnlyRegisterScoreChange(change))
      : options.changes()
  )
  const songChanges = createMemo(() =>
    sortRegisterScoreChanges(
      visibleChanges().filter(
        (change): change is PlayerDataSongRecordChange => change.record_type !== 'course'
      ),
      sortSettings(),
      options.resolveSongSortValues
    )
  )
  const courseChanges = createMemo(() =>
    visibleChanges().filter(
      (change): change is PlayerDataCourseRecordChange => change.record_type === 'course'
    )
  )
  const songSectionExcludedFromImage = createMemo(() =>
    isRegisterScoreImageSectionExcluded(songChanges(), excludedChangeKeys())
  )
  const courseSectionExcludedFromImage = createMemo(() =>
    isRegisterScoreImageSectionExcluded(courseChanges(), excludedChangeKeys())
  )

  return {
    sortSettings,
    /**
     * 楽曲カードの主ソートキーを更新する。
     *
     * @param primaryKey - レベル、単曲レーティング、または現在順。
     * @returns なし。
     */
    setPrimarySortKey: (primaryKey) => {
      setSortSettings((current) => ({ ...current, primaryKey }))
    },
    /**
     * 楽曲カードの主ソート方向を更新する。
     *
     * @param primaryDirection - 主ソートへ適用する方向。
     * @returns なし。
     */
    setPrimarySortDirection: (primaryDirection) => {
      setSortSettings((current) => ({ ...current, primaryDirection }))
    },
    hideLampOnlyChanges,
    /**
     * ランプのみの更新を非表示にするかを更新する。
     *
     * @param hidden - 非表示にする場合はtrue。
     * @returns なし。
     */
    setHideLampOnlyChanges: (hidden) => {
      setHideLampOnlyChanges(hidden)
    },
    songChanges,
    courseChanges,
    /**
     * 更新差分を画像から除外しているか判定する。
     *
     * @param change - 判定対象の1件分の更新差分。
     * @returns 画像から除外している場合はtrue。
     */
    isExcludedFromImage: (change) => excludedChangeKeys().has(createRegisterScoreChangeKey(change)),
    /**
     * 更新差分を共有・ダウンロード画像へ含めるかを一時的に切り替える。
     *
     * @param change - 対象となる1件分の更新差分。
     * @param excluded - 画像から除外する場合はtrue。
     * @returns なし。
     */
    setExcludedFromImage: (change, excluded) => {
      setExcludedChangeKeys((current) =>
        updateRegisterScoreExcludedChangeKeys(
          current,
          createRegisterScoreChangeKey(change),
          excluded
        )
      )
    },
    songSectionExcludedFromImage,
    courseSectionExcludedFromImage,
  }
}
