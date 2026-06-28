import type { PlayerRecordDTO, WorldsendRecordDTO } from '../../../types/api.ts'

type FullChainLamp = PlayerRecordDTO['full_chain'] | WorldsendRecordDTO['full_chain']

const FULL_CHAIN_LAMP_LABELS: Record<NonNullable<FullChainLamp>, string> = {
  'FULL CHAIN GOLD': 'FULL CHAIN (GOLD)',
  'FULL CHAIN PLATINUM': 'FULL CHAIN (PLATINUM)',
}

/**
 * FULL CHAINランプのAPI値を表示用ラベルに変換する。
 * @param fullChain - APIから受け取ったFULL CHAINランプ値、またはランプなし
 * @returns 画面表示用のFULL CHAINランプ名
 */
export const formatFullChainLampLabel = (fullChain: FullChainLamp): string => {
  if (fullChain === null) return 'なし'
  return FULL_CHAIN_LAMP_LABELS[fullChain]
}
