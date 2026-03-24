export const decodeWorldsendDisplayIdParam = (displayIdParam: string) =>
  decodeURIComponent(displayIdParam)

export const getWorldsendDisplayIdSource = (displayIdParam: string): string | false => {
  const decodedDisplayId = decodeWorldsendDisplayIdParam(displayIdParam)
  return decodedDisplayId ? decodedDisplayId : false
}
