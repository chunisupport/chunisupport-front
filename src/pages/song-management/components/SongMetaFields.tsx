import type { JSX } from 'solid-js'
import CopyFromStandardField from '../../../components/common/CopyFromStandardField'
import WikiPageTitleField from '../../../components/common/WikiPageTitleField'
import type { MasterItemDTO } from '../../../types/api'
import type { StandardSongLookupItem } from '../../../utils/standardSongLookup'
import { SONG_MANAGEMENT_FIELD_COPY as FIELD, SONG_MANAGEMENT_INPUT_LIMITS } from '../constants'
import {
  toSongMetaBpmDraftValue,
  toSongMetaBpmInputValue,
  toSongMetaOptionalTextDraftValue,
  toSongMetaOptionalTextInputValue,
  toSongMetaReleasedAtInputValue,
} from '../utils/songMetaInput'
import {
  GenreSelectField,
  MANAGEMENT_TEXT_INPUT_CLASS,
  ManagementCheckbox,
  ManagementTextField,
} from './ManagementFields'

/** 作成フォームと編集フォームで異なるグリッド配置 */
export type SongMetaFieldsLayout = 'create' | 'edit'

/** 作成フォームの外側グリッド */
const SONG_META_CREATE_GRID_CLASS = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'

/** 編集フォームのグリッド */
const SONG_META_EDIT_GRID_CLASS = 'grid grid-cols-2 gap-3 lg:grid-cols-4'

/** 作成フォームでジャンル以降を全幅の4列にするグリッド */
const SONG_META_CREATE_DETAIL_GRID_CLASS =
  'grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-3 lg:grid-cols-4'

/** 取り込み元の通常楽曲が未指定のときに渡す空一覧 */
const EMPTY_STANDARD_SONGS: readonly StandardSongLookupItem[] = []

type SongMetaFieldsProps = {
  /** 作成は3列、編集は4列でタイトル系を広く取る */
  layout: SongMetaFieldsLayout
  /** ルートのグリッドへ追加するクラス */
  class?: string
  /** 公式IDや更新日時など、共通項目の前に同じグリッドへ置く固有項目 */
  leading?: JSX.Element
  /** 属性や星数など、共通項目の後に同じグリッドへ置く固有項目 */
  trailing?: JSX.Element
  /** 曲名 */
  title: string
  /** 読み。未設定は null */
  reading: string | null
  /** アーティスト */
  artist: string
  /** Wikiページタイトル。未設定は null */
  wikiPageTitle: string | null
  /** ジャンルID。未選択は null */
  genreId: number | null
  /** BPM。未入力は null */
  bpm: number | null
  /** 配信日。未入力は null */
  releasedAt: string | null
  /** ジャケットID。未入力は null */
  jacket: string | null
  /** 新曲フラグ */
  isNew: boolean
  /** 要解禁 */
  unlockRequired: boolean
  /** ジャンルマスタ */
  genres: MasterItemDTO[]
  /** ジャンル未選択時の表示 */
  genrePlaceholder: string
  /** 曲名の変更。入力値をそのまま渡す */
  onTitleChange: (value: string) => void
  /** 読みの変更。空白のみは null */
  onReadingChange: (value: string | null) => void
  /** アーティストの変更。入力値をそのまま渡す */
  onArtistChange: (value: string) => void
  /** Wikiページタイトルの変更。空白のみは null */
  onWikiPageTitleChange: (value: string | null) => void
  /** ジャンルIDの変更 */
  onGenreIdChange: (value: number | null) => void
  /** BPMの変更。空文字は null */
  onBpmChange: (value: number | null) => void
  /** 配信日の変更。空白のみは null で、日付への丸めはしない */
  onReleasedAtChange: (value: string | null) => void
  /** ジャケットIDの変更。空白のみは null */
  onJacketChange: (value: string | null) => void
  /** 新曲フラグの変更 */
  onIsNewChange: (value: boolean) => void
  /** 要解禁の変更 */
  onUnlockRequiredChange: (value: boolean) => void
  /**
   * 通常曲から読み・Wikiページタイトル・BPMを取り込むときに渡す楽曲一覧。
   * 3つの取り込みハンドラとセットで指定する。省略時は取り込みボタンを出さない。
   */
  standardSongs?: readonly StandardSongLookupItem[]
  /** 通常楽曲一覧の読み込み中か */
  standardSongsLoading?: boolean
  /**
   * 取り込んだ読みをドラフトへ入れる。
   * 手入力と違い、空白除去などの変換はせず取得値をそのまま渡す。
   */
  onReadingCopied?: (value: string) => void
  /**
   * 取り込んだWikiページタイトルをドラフトへ入れる。
   * 手入力と違い、空白除去などの変換はせず取得値をそのまま渡す。
   */
  onWikiPageTitleCopied?: (value: string) => void
  /**
   * 取り込んだBPMをドラフトへ入れる。
   * 手入力と違い、文字列からの数値変換はせず取得値をそのまま渡す。
   */
  onBpmCopied?: (value: number) => void
}

type SongMetaFieldsViewProps = SongMetaFieldsProps & {
  /** 読み・Wiki・BPMの取り込みハンドラがすべて指定されている */
  copyEnabled: boolean
}

/**
 * 追加クラスがあるときだけ後ろへ連結する。
 *
 * @param base 基準のクラス
 * @param extra 追加クラス。未指定なら連結しない
 * @returns 連結したクラス
 */
const appendClass = (base: string, extra: string | undefined): string =>
  extra ? `${base} ${extra}` : base

/**
 * 編集フォームでタイトル系の入力欄を2列分にする。
 * 取り込みボタンで包む入力欄は、列幅を包む側へ譲って text-sm だけにする。
 *
 * @param layout 作成か編集か
 * @param wrapped 通常曲からの取り込みで包むか
 * @returns 入力欄の class。作成フォームでは未指定
 */
const songMetaWideClass = (layout: SongMetaFieldsLayout, wrapped: boolean): string | undefined => {
  if (layout !== 'edit') return undefined
  return wrapped ? 'text-sm' : 'col-span-2 text-sm'
}

/**
 * 編集フォームで取り込みボタンのラッパーを2列分にする。
 *
 * @param layout 作成か編集か
 * @returns ラッパーの class。作成フォームでは未指定
 */
const songMetaCopyClass = (layout: SongMetaFieldsLayout): string | undefined =>
  layout === 'edit' ? 'col-span-2' : undefined

/**
 * 読みの入力欄を描画する。WORLD'S END では通常曲からの取り込みボタンで包む。
 *
 * @param props 読みの値、変更ハンドラ、取り込み設定
 * @returns 読みの入力欄
 */
const SongMetaReadingField = (props: SongMetaFieldsViewProps) => {
  const onCopied = props.onReadingCopied
  const wrapped = Boolean(props.copyEnabled && onCopied)

  if (!wrapped || !onCopied) {
    return (
      <ManagementTextField
        class={songMetaWideClass(props.layout, false)}
        label={FIELD.reading}
        value={toSongMetaOptionalTextInputValue(props.reading)}
        maxLength={SONG_MANAGEMENT_INPUT_LIMITS.reading}
        inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
        onInput={(value) => props.onReadingChange(toSongMetaOptionalTextDraftValue(value))}
      />
    )
  }

  return (
    <CopyFromStandardField
      class={songMetaCopyClass(props.layout)}
      field="reading"
      songs={props.standardSongs ?? EMPTY_STANDARD_SONGS}
      title={props.title}
      artist={props.artist}
      songsLoading={props.standardSongsLoading}
      onCopied={onCopied}
    >
      <ManagementTextField
        class={songMetaWideClass(props.layout, true)}
        label={FIELD.reading}
        value={toSongMetaOptionalTextInputValue(props.reading)}
        maxLength={SONG_MANAGEMENT_INPUT_LIMITS.reading}
        inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
        onInput={(value) => props.onReadingChange(toSongMetaOptionalTextDraftValue(value))}
      />
    </CopyFromStandardField>
  )
}

/**
 * Wikiページタイトルの入力欄を描画する。
 * WORLD'S END では曲名生成ボタンの前に、通常曲からの取り込みボタンを差し込む。
 *
 * @param props Wikiページタイトルの値、曲名、変更ハンドラ、取り込み設定
 * @returns Wikiページタイトルの入力欄
 */
const SongMetaWikiField = (props: SongMetaFieldsViewProps) => {
  const onCopied = props.onWikiPageTitleCopied
  const wrapped = Boolean(props.copyEnabled && onCopied)
  const field = (leadingAction?: JSX.Element) => (
    <WikiPageTitleField
      class={songMetaWideClass(props.layout, wrapped)}
      title={props.title}
      label={FIELD.wikiPageTitle}
      value={toSongMetaOptionalTextInputValue(props.wikiPageTitle)}
      inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
      onInput={(value) => props.onWikiPageTitleChange(toSongMetaOptionalTextDraftValue(value))}
      leadingAction={leadingAction}
    />
  )

  if (!wrapped || !onCopied) return field()

  return (
    <CopyFromStandardField
      class={songMetaCopyClass(props.layout)}
      field="wikiPageTitle"
      songs={props.standardSongs ?? EMPTY_STANDARD_SONGS}
      title={props.title}
      artist={props.artist}
      songsLoading={props.standardSongsLoading}
      onCopied={onCopied}
    >
      {(copyButton) => field(copyButton)}
    </CopyFromStandardField>
  )
}

/**
 * 曲名・読み・アーティスト・Wikiページタイトルを描画する。
 *
 * @param props 共通メタ情報の値と変更ハンドラ
 * @returns タイトル系の入力欄
 */
const SongMetaIdentityFields = (props: SongMetaFieldsViewProps) => {
  return (
    <>
      <ManagementTextField
        class={songMetaWideClass(props.layout, false)}
        label={FIELD.title}
        value={props.title}
        inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
        onInput={(value) => props.onTitleChange(value)}
      />
      <SongMetaReadingField {...props} />
      <ManagementTextField
        class={songMetaWideClass(props.layout, false)}
        label={FIELD.artist}
        value={props.artist}
        inputClass={MANAGEMENT_TEXT_INPUT_CLASS}
        onInput={(value) => props.onArtistChange(value)}
      />
      <SongMetaWikiField {...props} />
    </>
  )
}

/**
 * BPMの入力欄を描画する。WORLD'S END では通常曲からの取り込みボタンで包む。
 *
 * @param props BPMの値、変更ハンドラ、取り込み設定
 * @returns BPMの入力欄
 */
const SongMetaBpmField = (props: SongMetaFieldsViewProps) => {
  const onCopied = props.onBpmCopied
  const wrapped = Boolean(props.copyEnabled && onCopied)

  if (!wrapped || !onCopied) {
    return (
      <ManagementTextField
        label={FIELD.bpm}
        type="number"
        value={toSongMetaBpmInputValue(props.bpm)}
        onInput={(value) => props.onBpmChange(toSongMetaBpmDraftValue(value))}
      />
    )
  }

  return (
    <CopyFromStandardField
      field="bpm"
      songs={props.standardSongs ?? EMPTY_STANDARD_SONGS}
      title={props.title}
      artist={props.artist}
      songsLoading={props.standardSongsLoading}
      onCopied={onCopied}
    >
      <ManagementTextField
        label={FIELD.bpm}
        type="number"
        value={toSongMetaBpmInputValue(props.bpm)}
        onInput={(value) => props.onBpmChange(toSongMetaBpmDraftValue(value))}
      />
    </CopyFromStandardField>
  )
}

/**
 * ジャンル・BPM・配信日・ジャケット・新曲フラグ・要解禁を描画する。
 *
 * @param props 共通メタ情報の値、ジャンルマスタ、変更ハンドラ
 * @returns 詳細項目の入力欄
 */
const SongMetaDetailFields = (props: SongMetaFieldsViewProps) => {
  return (
    <>
      <GenreSelectField
        label={FIELD.genre}
        value={props.genreId}
        genres={props.genres}
        placeholder={props.genrePlaceholder}
        onChange={props.onGenreIdChange}
      />
      <SongMetaBpmField {...props} />
      <ManagementTextField
        label={FIELD.releasedAt}
        type="date"
        value={toSongMetaReleasedAtInputValue(props.releasedAt)}
        onInput={(value) => props.onReleasedAtChange(toSongMetaOptionalTextDraftValue(value))}
      />
      <ManagementTextField
        label={FIELD.jacket}
        value={toSongMetaOptionalTextInputValue(props.jacket)}
        onInput={(value) => props.onJacketChange(toSongMetaOptionalTextDraftValue(value))}
      />
      <div class="flex flex-wrap items-end gap-x-4 gap-y-2 py-2">
        <ManagementCheckbox
          checked={props.isNew === true}
          ariaLabel={FIELD.isNew}
          label={FIELD.isNew}
          onChange={props.onIsNewChange}
        />
        <ManagementCheckbox
          checked={props.unlockRequired === true}
          ariaLabel={FIELD.unlockRequired}
          label={FIELD.unlockRequired}
          onChange={props.onUnlockRequiredChange}
        />
      </div>
    </>
  )
}

/**
 * 通常楽曲と WORLD'S END の作成・編集で共通なメタ情報の入力欄を描画する。
 * 公式ID、更新日時、譜面、WORLD'S END の属性・星数は leading / trailing として各フォームが渡す。
 *
 * @param props 共通メタ情報の値、配置、ジャンルマスタ、変更ハンドラ、通常曲からの取り込み設定
 * @returns 共通メタ情報の入力グリッド
 */
const SongMetaFields = (props: SongMetaFieldsProps): JSX.Element => {
  const copyEnabled =
    props.onReadingCopied !== undefined &&
    props.onWikiPageTitleCopied !== undefined &&
    props.onBpmCopied !== undefined
  const identity = <SongMetaIdentityFields {...props} copyEnabled={copyEnabled} />
  const details = <SongMetaDetailFields {...props} copyEnabled={copyEnabled} />

  if (props.layout === 'edit') {
    return (
      <div class={appendClass(SONG_META_EDIT_GRID_CLASS, props.class)}>
        {props.leading}
        {identity}
        {details}
        {props.trailing}
      </div>
    )
  }

  return (
    <div class={appendClass(SONG_META_CREATE_GRID_CLASS, props.class)}>
      {props.leading}
      {identity}
      <div class={SONG_META_CREATE_DETAIL_GRID_CLASS}>{details}</div>
      {props.trailing}
    </div>
  )
}

export default SongMetaFields
