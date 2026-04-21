import type { PlayerRecordDTO } from '../../../../types/api'
import { getScoreRank } from '../../../../utils/scoreRank'

type Props = {
  record: PlayerRecordDTO
  difficultyLabel: string
}

const PersonalScoreCard = (props: Props) => {
  const score = () => (typeof props.record.score === 'number' ? props.record.score : 0)
  const rank = () => getScoreRank(score())

  return (
    <section
      class="rounded-xl border border-primary-200 bg-gradient-to-r from-slate-900 via-slate-800 to-primary-900 px-5 py-4 text-white shadow-md"
      aria-label="あなたのスコア"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wider text-primary-100/90">Your Best Play</p>
          <p class="mt-1 text-sm text-primary-50">{props.difficultyLabel}</p>
        </div>
        <div class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold">
          RANK {rank()}
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
        <p class="text-3xl font-bold tabular-nums">{score().toLocaleString()}</p>
        <p class="text-sm text-primary-100">
          CLEAR: {props.record.clear_lamp ?? '未記録'} / COMBO:{' '}
          {props.record.combo_lamp ?? '未記録'}
        </p>
      </div>
    </section>
  )
}

export default PersonalScoreCard
