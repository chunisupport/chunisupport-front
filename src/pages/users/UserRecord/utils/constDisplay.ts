export type ConstDisplay = {
  valueText: string
  markerText: string | null
  className: string
}

export type RatingDisplay = {
  text: string
  className: string
}

const UNKNOWN_STYLE = 'text-danger italic'
const NORMAL_STYLE = 'text-text'

export const getConstDisplay = (value: number, isConstUnknown: boolean): ConstDisplay => {
  const valueText = value.toFixed(1)

  if (isConstUnknown) {
    return {
      valueText,
      markerText: '?',
      className: UNKNOWN_STYLE,
    }
  }

  return {
    valueText,
    markerText: null,
    className: NORMAL_STYLE,
  }
}

export const getRatingDisplay = (
  value: number,
  isPlayed: boolean,
  isConstUnknown: boolean
): RatingDisplay => {
  if (!isPlayed) {
    return {
      text: '',
      className: NORMAL_STYLE,
    }
  }

  return {
    text: value.toFixed(2),
    className: isConstUnknown ? UNKNOWN_STYLE : NORMAL_STYLE,
  }
}
