export type ConstDisplay = {
  text: string
  className: string
  isUnknown: boolean
}

export const getConstDisplay = (value: number, isConstUnknown: boolean): ConstDisplay => {
  const formattedValue = value.toFixed(1)

  if (isConstUnknown) {
    return {
      text: `${formattedValue}?`,
      className: 'text-red-600 italic',
      isUnknown: true,
    }
  }

  return {
    text: formattedValue,
    className: 'text-gray-900',
    isUnknown: false,
  }
}
