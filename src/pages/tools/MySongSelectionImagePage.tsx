import { Button } from '@kobalte/core/button'
import { Select } from '@kobalte/core/select'
import { TextField } from '@kobalte/core/text-field'
import { Check, ChevronDown, Download, ImagePlus } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js'
import { LoadError, Loading } from '../../components'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { buildSearchableItems, filterSearchableItems } from '../../pages/songs/searchHelpers'
import { sortSongsByTitle, useSongsData } from '../../stores/songsData'
import type { PlayerDataDifficulty, SongDTO } from '../../types/api'
import { difficultyBorderColor } from '../../utils/difficultyUtils'
import { buildChunithmJacketUrl } from '../../utils/jacket'
import {
  formatMySongSelectionChartConstant,
  limitMySongSelectionCandidates,
  resolveMySongSelectionChart,
} from '../../utils/mySongSelectionImage'
import {
  MY_SONG_SELECTION_IMAGE_CANVAS,
  MY_SONG_SELECTION_IMAGE_COPY,
  MY_SONG_SELECTION_IMAGE_DEFAULTS,
  MY_SONG_SELECTION_IMAGE_DIFFICULTIES,
} from './mySongSelectionImage.constants'

const FIELD_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-input-bg px-3 py-2 text-sm text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50'
const SELECT_ITEM_CLASS =
  'grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 rounded px-3 py-2 text-sm text-text outline-none hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg'
const CANDIDATE_LIMIT = 12
const DOWNLOAD_FILE_NAME = 'my-song-selection.png'
const FALLBACK_BACKGROUND_COLORS = {
  base: '#10261f',
  accent: '#2c6f5d',
  shadow: '#07130f',
} as const

type CanvasColorSet = {
  base: string
  accent: string
  shadow: string
}

type SongDifficultySelectProps = {
  value: PlayerDataDifficulty
  onChange: (value: PlayerDataDifficulty) => void
}

type CanvasTextOptions = {
  x: number
  y: number
  maxWidth: number
  maxLines: number
  fontFamily: string
  fontWeight: number
  maxFontSize: number
  minFontSize: number
  lineHeightRatio: number
  align?: CanvasTextAlign
}

/**
 * canvasへ描画する画像を読み込む。
 *
 * @param src - 画像URL。
 * @returns 読み込み済みのHTMLImageElement。
 */
const loadCanvasImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(MY_SONG_SELECTION_IMAGE_COPY.generationErrorMessage))
    image.src = src
  })

/**
 * canvasで扱いやすいCSS RGB文字列へ変換する。
 *
 * @param red - 赤成分。
 * @param green - 緑成分。
 * @param blue - 青成分。
 * @returns rgb() 形式のCSS色。
 */
const toRgb = (red: number, green: number, blue: number): string =>
  `rgb(${Math.round(red)} ${Math.round(green)} ${Math.round(blue)})`

/**
 * ジャケット画像の代表色を抽出し、背景や装飾で使う色へ整える。
 *
 * @param image - 読み込み済みジャケット画像。
 * @returns 背景、アクセント、影色。
 */
const extractJacketColors = (image: HTMLImageElement): CanvasColorSet => {
  const sampleCanvas = document.createElement('canvas')
  sampleCanvas.width = 80
  sampleCanvas.height = 80
  const context = sampleCanvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    return {
      base: FALLBACK_BACKGROUND_COLORS.base,
      accent: FALLBACK_BACKGROUND_COLORS.accent,
      shadow: FALLBACK_BACKGROUND_COLORS.shadow,
    }
  }

  context.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height)
  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data
  let redTotal = 0
  let greenTotal = 0
  let blueTotal = 0
  let count = 0
  let accent = { red: 44, green: 111, blue: 93, score: 0 }

  for (let index = 0; index < pixels.length; index += 16) {
    const alpha = pixels[index + 3] ?? 0
    if (alpha < 128) continue

    const red = pixels[index] ?? 0
    const green = pixels[index + 1] ?? 0
    const blue = pixels[index + 2] ?? 0
    const brightness = (red + green + blue) / 3
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue)
    const score = saturation + Math.abs(brightness - 150) * 0.35

    redTotal += red
    greenTotal += green
    blueTotal += blue
    count += 1

    if (score > accent.score) {
      accent = { red, green, blue, score }
    }
  }

  if (count === 0) {
    return {
      base: FALLBACK_BACKGROUND_COLORS.base,
      accent: FALLBACK_BACKGROUND_COLORS.accent,
      shadow: FALLBACK_BACKGROUND_COLORS.shadow,
    }
  }

  const baseRed = redTotal / count
  const baseGreen = greenTotal / count
  const baseBlue = blueTotal / count

  return {
    base: toRgb(baseRed * 0.58, baseGreen * 0.58, baseBlue * 0.58),
    accent: toRgb(
      Math.min(accent.red * 1.18, 255),
      Math.min(accent.green * 1.18, 255),
      Math.min(accent.blue * 1.18, 255)
    ),
    shadow: toRgb(baseRed * 0.2, baseGreen * 0.2, baseBlue * 0.2),
  }
}

/**
 * 長い文字列を指定幅に収まる行へ分割する。
 *
 * @param context - 描画先canvasコンテキスト。
 * @param text - 分割対象テキスト。
 * @param maxWidth - 1行の最大幅。
 * @param maxLines - 最大行数。
 * @returns 幅内に収めた行配列。
 */
const wrapCanvasText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] => {
  const characters = Array.from(text)
  const lines: string[] = []
  let currentLine = ''

  for (const character of characters) {
    const nextLine = `${currentLine}${character}`
    if (currentLine && context.measureText(nextLine).width > maxWidth) {
      lines.push(currentLine)
      currentLine = character
      if (lines.length === maxLines) break
      continue
    }
    currentLine = nextLine
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine)
  }

  if (lines.length === maxLines && characters.join('').length > lines.join('').length) {
    const lastIndex = lines.length - 1
    let lastLine = lines[lastIndex] ?? ''
    while (lastLine.length > 0 && context.measureText(`${lastLine}…`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1)
    }
    lines[lastIndex] = `${lastLine}…`
  }

  return lines
}

/**
 * 表示領域に合わせてフォントサイズを自動調整しながら文字列を描画する。
 *
 * @param context - 描画先canvasコンテキスト。
 * @param text - 描画する文字列。
 * @param options - 位置、最大幅、行数、フォント設定。
 * @returns 実際に描画した領域の高さ。
 */
const drawFittedText = (
  context: CanvasRenderingContext2D,
  text: string,
  options: CanvasTextOptions
): number => {
  let fontSize = options.maxFontSize
  let lines: string[] = []

  while (fontSize >= options.minFontSize) {
    context.font = `${options.fontWeight} ${fontSize}px ${options.fontFamily}`
    lines = wrapCanvasText(context, text, options.maxWidth, options.maxLines)
    const overflows = lines.some((line) => context.measureText(line).width > options.maxWidth)
    if (!overflows) break
    fontSize -= 2
  }

  context.font = `${options.fontWeight} ${fontSize}px ${options.fontFamily}`
  context.textAlign = options.align ?? 'left'
  context.textBaseline = 'top'
  const lineHeight = fontSize * options.lineHeightRatio
  lines.forEach((line, index) => {
    context.fillText(line, options.x, options.y + lineHeight * index)
  })

  return lines.length * lineHeight
}

/**
 * 角丸矩形を塗りつぶす。
 *
 * @param context - 描画先canvasコンテキスト。
 * @param x - 左上X座標。
 * @param y - 左上Y座標。
 * @param width - 幅。
 * @param height - 高さ。
 * @param radius - 角丸半径。
 */
const fillRoundRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void => {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fill()
}

/**
 * canvasをPNG Blobへ変換する。
 *
 * @param canvas - 変換対象のcanvas。
 * @returns PNG Blob。
 */
const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
          return
        }
        reject(new Error(MY_SONG_SELECTION_IMAGE_COPY.generationErrorMessage))
      }, 'image/png')
    } catch {
      reject(new Error(MY_SONG_SELECTION_IMAGE_COPY.generationErrorMessage))
    }
  })

/**
 * 曲・難易度・見出しから自選曲画像を生成する。
 *
 * @param song - 選択中の楽曲。
 * @param difficulty - 選択中の難易度。
 * @param heading - 画像上部に表示する見出し。
 * @returns 生成したPNG Blob。
 */
const generateMySongSelectionImage = async (
  song: SongDTO,
  difficulty: PlayerDataDifficulty,
  heading: string
): Promise<Blob> => {
  const chart = resolveMySongSelectionChart(song, difficulty)
  if (!chart) throw new Error(MY_SONG_SELECTION_IMAGE_COPY.noChartMessage)

  await document.fonts?.ready

  const jacketUrl = buildChunithmJacketUrl(song.jacket)
  const jacketImage = jacketUrl ? await loadCanvasImage(jacketUrl) : null
  const colors = jacketImage ? extractJacketColors(jacketImage) : null
  const canvas = document.createElement('canvas')
  canvas.width = MY_SONG_SELECTION_IMAGE_CANVAS.width
  canvas.height = MY_SONG_SELECTION_IMAGE_CANVAS.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error(MY_SONG_SELECTION_IMAGE_COPY.generationErrorMessage)

  context.fillStyle = colors?.base ?? FALLBACK_BACKGROUND_COLORS.base
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = 'rgb(0 0 0 / 0.18)'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.save()
  context.shadowColor = 'rgb(0 0 0 / 0.35)'
  context.shadowBlur = 48
  context.fillStyle = 'rgb(255 255 255 / 0.12)'
  fillRoundRect(
    context,
    MY_SONG_SELECTION_IMAGE_CANVAS.panelX,
    MY_SONG_SELECTION_IMAGE_CANVAS.panelY,
    MY_SONG_SELECTION_IMAGE_CANVAS.panelWidth,
    MY_SONG_SELECTION_IMAGE_CANVAS.panelHeight,
    44
  )
  context.restore()

  context.fillStyle = 'rgb(255 255 255)'
  drawFittedText(context, heading.trim() || MY_SONG_SELECTION_IMAGE_DEFAULTS.heading, {
    x: canvas.width / 2,
    y: MY_SONG_SELECTION_IMAGE_CANVAS.headingY,
    maxWidth: 1580,
    maxLines: 1,
    fontFamily: 'Inter, "Noto Sans JP", sans-serif',
    fontWeight: 800,
    maxFontSize: 74,
    minFontSize: 42,
    lineHeightRatio: 1.15,
    align: 'center',
  })

  context.save()
  context.shadowColor = 'rgb(0 0 0 / 0.45)'
  context.shadowBlur = 42
  context.fillStyle = 'rgb(255 255 255 / 0.92)'
  fillRoundRect(
    context,
    MY_SONG_SELECTION_IMAGE_CANVAS.jacketX - 22,
    MY_SONG_SELECTION_IMAGE_CANVAS.jacketY - 22,
    MY_SONG_SELECTION_IMAGE_CANVAS.jacketSize + 44,
    MY_SONG_SELECTION_IMAGE_CANVAS.jacketSize + 44,
    36
  )
  context.restore()

  if (jacketImage) {
    context.drawImage(
      jacketImage,
      MY_SONG_SELECTION_IMAGE_CANVAS.jacketX,
      MY_SONG_SELECTION_IMAGE_CANVAS.jacketY,
      MY_SONG_SELECTION_IMAGE_CANVAS.jacketSize,
      MY_SONG_SELECTION_IMAGE_CANVAS.jacketSize
    )
  } else {
    context.fillStyle = 'rgb(17 24 39)'
    fillRoundRect(
      context,
      MY_SONG_SELECTION_IMAGE_CANVAS.jacketX,
      MY_SONG_SELECTION_IMAGE_CANVAS.jacketY,
      MY_SONG_SELECTION_IMAGE_CANVAS.jacketSize,
      MY_SONG_SELECTION_IMAGE_CANVAS.jacketSize,
      18
    )
  }

  const infoX = MY_SONG_SELECTION_IMAGE_CANVAS.infoX
  context.fillStyle = 'rgb(255 255 255 / 0.9)'
  context.font = '700 34px Inter, "Noto Sans JP", sans-serif'
  context.fillText('TITLE', infoX, 330)

  context.fillStyle = 'rgb(255 255 255)'
  const titleHeight = drawFittedText(context, song.title, {
    x: infoX,
    y: 382,
    maxWidth: 790,
    maxLines: 3,
    fontFamily: 'Inter, "Noto Sans JP", sans-serif',
    fontWeight: 900,
    maxFontSize: 76,
    minFontSize: 40,
    lineHeightRatio: 1.12,
  })

  context.fillStyle = 'rgb(255 255 255 / 0.72)'
  drawFittedText(context, song.artist, {
    x: infoX,
    y: 402 + titleHeight,
    maxWidth: 790,
    maxLines: 2,
    fontFamily: 'Inter, "Noto Sans JP", sans-serif',
    fontWeight: 600,
    maxFontSize: 34,
    minFontSize: 24,
    lineHeightRatio: 1.2,
  })

  const badgeY = 700
  context.fillStyle = difficultyBorderColor(difficulty)
  fillRoundRect(context, infoX, badgeY, 285, 82, 20)
  context.fillStyle = 'rgb(255 255 255)'
  context.font = '900 42px Inter, "Noto Sans JP", sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(difficulty, infoX + 142.5, badgeY + 41)

  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.fillStyle = 'rgb(255 255 255 / 0.72)'
  context.font = '700 30px Inter, "Noto Sans JP", sans-serif'
  context.fillText('CONST', infoX, 860)
  context.fillStyle = 'rgb(255 255 255)'
  context.font = '900 92px Inter, "Noto Sans JP", sans-serif'
  context.fillText(
    formatMySongSelectionChartConstant(chart.chart, MY_SONG_SELECTION_IMAGE_COPY.constUnknownLabel),
    infoX,
    945
  )

  context.textAlign = 'right'
  context.textBaseline = 'bottom'
  context.fillStyle = 'rgb(255 255 255 / 0.62)'
  context.font = '600 24px Inter, "Noto Sans JP", sans-serif'
  context.fillText(
    MY_SONG_SELECTION_IMAGE_COPY.generatedByLabel,
    MY_SONG_SELECTION_IMAGE_CANVAS.width - 88,
    MY_SONG_SELECTION_IMAGE_CANVAS.height - 44
  )

  return canvasToPngBlob(canvas)
}

/**
 * 自選曲カードメーカー用の難易度セレクトを表示する。
 *
 * @param props - 現在値と変更ハンドラ。
 * @returns 難易度セレクト。
 */
const SongDifficultySelect: Component<SongDifficultySelectProps> = (props) => (
  <Select<PlayerDataDifficulty>
    value={props.value}
    onChange={(value) => {
      if (value) props.onChange(value)
    }}
    options={[...MY_SONG_SELECTION_IMAGE_DIFFICULTIES]}
    itemComponent={(itemProps) => (
      <Select.Item item={itemProps.item} class={SELECT_ITEM_CLASS}>
        <Select.ItemLabel>{itemProps.item.rawValue}</Select.ItemLabel>
        <Select.ItemIndicator class="inline-flex h-4 w-4 items-center justify-center text-success">
          <Check class="h-4 w-4" aria-hidden="true" />
        </Select.ItemIndicator>
      </Select.Item>
    )}
    gutter={0}
  >
    <Select.Label class="mb-1 block text-sm font-medium text-text-muted">
      {MY_SONG_SELECTION_IMAGE_COPY.difficultyLabel}
    </Select.Label>
    <Select.Trigger class="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring">
      <Select.Value<PlayerDataDifficulty> class="truncate">
        {(state) => state.selectedOption()}
      </Select.Value>
      <Select.Icon class="text-text-subtle">
        <ChevronDown class="h-4 w-4" aria-hidden="true" />
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content class="z-50 max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-border bg-surface shadow-md">
        <Select.Listbox />
      </Select.Content>
    </Select.Portal>
  </Select>
)

/**
 * 自選曲カードメーカーを表示する。
 *
 * @returns 曲選択フォームと生成画像プレビュー。
 */
const MySongSelectionImagePage = (): JSX.Element => {
  const songsData = useSongsData()
  const [heading, setHeading] = createSignal<string>(MY_SONG_SELECTION_IMAGE_DEFAULTS.heading)
  const [query, setQuery] = createSignal('')
  const [selectedSong, setSelectedSong] = createSignal<SongDTO | null>(null)
  const [difficulty, setDifficulty] = createSignal<PlayerDataDifficulty>(
    MY_SONG_SELECTION_IMAGE_DEFAULTS.difficulty
  )
  const [generatedUrl, setGeneratedUrl] = createSignal<string | null>(null)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [isGenerating, setIsGenerating] = createSignal(false)

  useDocumentTitle(MY_SONG_SELECTION_IMAGE_COPY.title)

  createEffect(() => {
    songsData.ensureSongsLoaded()
  })

  onCleanup(() => {
    const currentUrl = generatedUrl()
    if (currentUrl) URL.revokeObjectURL(currentUrl)
  })

  const sortedSongs = createMemo(() => sortSongsByTitle(songsData.songsResponse()?.songs ?? []))
  const searchableSongs = createMemo(() => buildSearchableItems(sortedSongs()))
  const candidateSongs = createMemo(() => {
    const searchedSongs = query().trim()
      ? filterSearchableItems(searchableSongs(), query())
      : sortedSongs()
    return limitMySongSelectionCandidates(searchedSongs, CANDIDATE_LIMIT)
  })
  const selectedChart = createMemo(() => resolveMySongSelectionChart(selectedSong(), difficulty()))
  const selectedConstLabel = createMemo(() => {
    const chart = selectedChart()
    return chart
      ? formatMySongSelectionChartConstant(
          chart.chart,
          MY_SONG_SELECTION_IMAGE_COPY.constUnknownLabel
        )
      : MY_SONG_SELECTION_IMAGE_COPY.constUnknownLabel
  })

  /**
   * 生成済み画像URLを破棄し、現在の入力に対して未生成の状態へ戻す。
   *
   * @returns なし。
   */
  const clearGeneratedImage = (): void => {
    const currentUrl = generatedUrl()
    setGeneratedUrl(null)
    if (currentUrl) URL.revokeObjectURL(currentUrl)
  }

  /**
   * 見出しを更新し、入力変更前に作った画像を破棄する。
   *
   * @param value - 新しい見出し。
   * @returns なし。
   */
  const handleHeadingChange = (value: string): void => {
    setHeading(value)
    clearGeneratedImage()
  }

  /**
   * 検索文字列を更新し、選択中の曲と一致しなくなった場合は選択を解除する。
   *
   * @param value - 新しい検索文字列。
   * @returns なし。
   */
  const handleQueryChange = (value: string): void => {
    setQuery(value)
    if (selectedSong()?.title !== value) {
      setSelectedSong(null)
    }
    clearGeneratedImage()
    setErrorMessage(null)
  }

  /**
   * 難易度を更新し、入力変更前に作った画像を破棄する。
   *
   * @param value - 新しい難易度。
   * @returns なし。
   */
  const handleDifficultyChange = (value: PlayerDataDifficulty): void => {
    setDifficulty(value)
    clearGeneratedImage()
    setErrorMessage(null)
  }

  /**
   * 楽曲を選択し、検索欄を選択楽曲名へ同期する。
   *
   * @param song - 選択した楽曲。
   * @returns なし。
   */
  const handleSongSelect = (song: SongDTO): void => {
    setSelectedSong(song)
    setQuery(song.title)
    clearGeneratedImage()
    setErrorMessage(null)
  }

  /**
   * 現在の入力内容からPNG画像を生成する。
   *
   * @returns なし。
   */
  const handleGenerate = async (): Promise<void> => {
    const song = selectedSong()
    if (!song) {
      setErrorMessage(MY_SONG_SELECTION_IMAGE_COPY.noSongSelectedMessage)
      return
    }
    if (!selectedChart()) {
      setErrorMessage(MY_SONG_SELECTION_IMAGE_COPY.noChartMessage)
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)
    try {
      const blob = await generateMySongSelectionImage(song, difficulty(), heading())
      const nextUrl = URL.createObjectURL(blob)
      const currentUrl = generatedUrl()
      setGeneratedUrl(nextUrl)
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : MY_SONG_SELECTION_IMAGE_COPY.generationErrorMessage
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <ImagePlus class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{MY_SONG_SELECTION_IMAGE_COPY.title}</h1>
          <p class="mt-1 text-sm text-text-muted">{MY_SONG_SELECTION_IMAGE_COPY.description}</p>
        </div>
      </header>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
        <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <form class="space-y-4" onSubmit={(event) => event.preventDefault()}>
            <TextField class="block text-sm" value={heading()} onChange={handleHeadingChange}>
              <TextField.Label
                class="mb-1 block font-medium text-text-muted"
                for="my-song-selection-heading"
              >
                {MY_SONG_SELECTION_IMAGE_COPY.headingLabel}
              </TextField.Label>
              <TextField.Input
                id="my-song-selection-heading"
                name="my-song-selection-heading"
                type="text"
                class={FIELD_INPUT_CLASS}
                autocomplete="off"
                placeholder={MY_SONG_SELECTION_IMAGE_COPY.placeholderHeading}
              />
            </TextField>

            <TextField class="block text-sm" value={query()} onChange={handleQueryChange}>
              <TextField.Label
                class="mb-1 block font-medium text-text-muted"
                for="my-song-selection-search"
              >
                {MY_SONG_SELECTION_IMAGE_COPY.songSearchLabel}
              </TextField.Label>
              <TextField.Input
                id="my-song-selection-search"
                name="my-song-selection-search"
                type="search"
                class={FIELD_INPUT_CLASS}
                autocomplete="off"
                placeholder={MY_SONG_SELECTION_IMAGE_COPY.searchPlaceholder}
              />
            </TextField>

            <div class="max-h-72 overflow-y-auto rounded border border-border bg-surface-muted p-2">
              <Show
                when={candidateSongs().length > 0}
                fallback={
                  <p class="px-2 py-3 text-sm text-text-muted">
                    {MY_SONG_SELECTION_IMAGE_COPY.emptyResultMessage}
                  </p>
                }
              >
                <div class="space-y-1">
                  <For each={candidateSongs()}>
                    {(song) => (
                      <Button
                        type="button"
                        class={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition-colors hover:bg-surface ${
                          selectedSong()?.id === song.id
                            ? 'bg-surface text-text'
                            : 'text-text-muted'
                        }`}
                        onClick={() => handleSongSelect(song)}
                      >
                        <span class="min-w-0 flex-1 truncate">{song.title}</span>
                        <span class="shrink-0 text-xs text-text-subtle">{song.artist}</span>
                      </Button>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            <SongDifficultySelect value={difficulty()} onChange={handleDifficultyChange} />

            <Show when={selectedSong()}>
              {(song) => (
                <div class="rounded border border-border bg-surface-muted p-3 text-sm">
                  <p class="text-xs font-medium text-text-muted">
                    {MY_SONG_SELECTION_IMAGE_COPY.selectedSongLabel}
                  </p>
                  <p class="mt-1 font-semibold text-text">{song().title}</p>
                  <div class="mt-2 flex items-center gap-2">
                    <DifficultyBadge difficulty={difficulty()} compact />
                    <span class="text-text-muted">const {selectedConstLabel()}</span>
                  </div>
                </div>
              )}
            </Show>

            <Button
              type="button"
              class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-action-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isGenerating()}
              onClick={handleGenerate}
            >
              <ImagePlus class="h-4 w-4" aria-hidden="true" />
              {MY_SONG_SELECTION_IMAGE_COPY.generateButtonLabel}
            </Button>
          </form>
        </section>

        <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <Show when={songsData.songsResponse.error}>
            {(error) => <LoadError error={error()} />}
          </Show>
          <Show when={!songsData.songsResponse.error}>
            <Show when={!songsData.isSongsLoading()} fallback={<Loading />}>
              <div class="space-y-4">
                <Show when={errorMessage()}>
                  {(message) => <p class="text-sm text-danger">{message()}</p>}
                </Show>
                <Show
                  when={generatedUrl()}
                  fallback={
                    <div class="grid aspect-video place-items-center rounded-md border border-dashed border-border-strong bg-surface-muted text-sm text-text-muted">
                      {isGenerating() ? (
                        <Loading />
                      ) : (
                        MY_SONG_SELECTION_IMAGE_COPY.generateButtonLabel
                      )}
                    </div>
                  }
                >
                  {(url) => (
                    <>
                      <img
                        src={url()}
                        alt={MY_SONG_SELECTION_IMAGE_COPY.jacketAlt}
                        class="aspect-video w-full rounded-md border border-border object-cover"
                      />
                      <a
                        href={url()}
                        download={DOWNLOAD_FILE_NAME}
                        class="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-text hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        <Download class="h-4 w-4" aria-hidden="true" />
                        {MY_SONG_SELECTION_IMAGE_COPY.downloadButtonLabel}
                      </a>
                    </>
                  )}
                </Show>
              </div>
            </Show>
          </Show>
        </section>
      </div>
    </main>
  )
}

export default MySongSelectionImagePage
