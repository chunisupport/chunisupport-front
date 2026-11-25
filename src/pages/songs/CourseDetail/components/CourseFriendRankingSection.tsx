import { createQuery } from '@tanstack/solid-query'
import FriendRankingSection from '../../../../components/common/ranking/FriendRankingSection'
import { courseFriendRankingQueryOptions } from '../../../../queries/friendRankings'

/**
 * コースのフレンドランキングを認証ユーザー単位で取得して表示する。
 *
 * @param props - 現在のユーザー名とコースの公開ID。
 * @returns コースのフレンドランキングセクション。
 */
const CourseFriendRankingSection = (props: { username: string; displayId: string }) => {
  const ranking = createQuery(() =>
    courseFriendRankingQueryOptions(props.username, props.displayId)
  )

  return (
    <FriendRankingSection
      entries={ranking.data?.ranking ?? []}
      isLoading={ranking.isPending}
      error={ranking.isError ? ranking.error : undefined}
    />
  )
}

export default CourseFriendRankingSection
