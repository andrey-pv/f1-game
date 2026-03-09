import { useEffect } from 'react'
import useLeaderboardStore from '../store/useLeaderboardStore'
import useAuthStore from '../store/useAuthStore'

export default function useUserRank() {
  const { myRank, fetchMyRank } = useLeaderboardStore()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user) fetchMyRank()
  }, [user])

  return myRank
}
