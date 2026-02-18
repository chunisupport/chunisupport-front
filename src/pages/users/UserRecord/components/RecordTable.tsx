import { A } from '@solidjs/router'
import type { Component } from 'solid-js'
import type { PlayerRecordIncludeNoPlay } from '../../../../utils/recordMerger'

interface RecordTableProps {
  records: PlayerRecordIncludeNoPlay[]
}

import { difficultyColor, difficultyShort } from '../../../../utils/difficultyUtils'

const lampBadge = (lamp: string | null) => {
  if (lamp === 'FULL COMBO')
    return (
      <span class="px-2 py-1 rounded-lg bg-orange-200 text-orange-900 text-xs font-bold">FC</span>
    )
  if (lamp === 'ALL JUSTICE')
    return (
      <span class="px-2 py-1 rounded-lg bg-yellow-200 text-yellow-900 text-xs font-bold">AJ</span>
    )
  return <span class="px-2 py-1 text-xs">-</span>
}

const unplayedBadge = () => (
  <span class="px-2 py-1 rounded-lg bg-gray-100 text-gray-400 text-xs">NoPlay</span>
)

export const RecordTable: Component<RecordTableProps> = (props) => {
  return (
    <div class="w-full">
      <table class="min-w-full max-w-full text-xs table-auto">
        {/* <thead>
					<tr class="text-xs">
						<th class="px-2 py-1 text-center w-[40%]">曲名</th>
						<th class="px-2 py-1 text-center w-[10%]">難易度</th>
						<th class="px-2 py-1 text-center w-[15%]">定数</th>
						<th class="px-2 py-1 text-center w-[20%]">スコア</th>
						<th class="px-2 py-1 text-center w-[15%]">ランプ</th>
					</tr>
				</thead> */}
        <tbody>
          {props.records.length === 0 ? (
            <tr>
              <td colSpan={5} class="text-center py-6 text-gray-400">
                データがありません
              </td>
            </tr>
          ) : (
            props.records.map((record) => (
              <tr class="border-t border-gray-200 hover:bg-gray-100">
                <td class="px-2 py-1 truncate max-w-48" title={record.title}>
                  <A
                    href={`/songs/${encodeURIComponent(record.id)}`}
                    class="text-inherit hover:underline"
                  >
                    {record.title}
                  </A>
                </td>
                <td class="px-2 py-1 text-center">
                  <span
                    class={`px-2 py-1 rounded-lg ${difficultyColor(record.difficulty)} text-xs font-bold`}
                  >
                    {difficultyShort(record.difficulty)}
                  </span>
                </td>
                <td class="px-2 py-1 text-right">{record.const.toFixed(1)}</td>
                <td class="px-2 py-1 text-right">
                  {'is_played' in record && !record.is_played
                    ? unplayedBadge()
                    : record.score?.toLocaleString()}
                </td>
                <td class="px-2 py-1 text-center">
                  {'is_played' in record && !record.is_played ? (
                    <span class="px-2 py-1 text-xs">-</span>
                  ) : (
                    lampBadge(record.combo_lamp)
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default RecordTable
