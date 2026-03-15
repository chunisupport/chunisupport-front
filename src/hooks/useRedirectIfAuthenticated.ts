import { useNavigate } from '@solidjs/router'
import { onMount } from 'solid-js'

import { fetchMe } from '../api/users'
import { clearAuthenticatedUser, setAuthenticatedUser } from '../stores/authSession'

const useRedirectIfAuthenticated = () => {
  const navigate = useNavigate()

  // すでにログインしている場合はユーザーページへリダイレクト
  onMount(async () => {
    try {
      const user = await fetchMe({ redirectOnUnauthorized: false })
      setAuthenticatedUser(user)
      navigate(`/users/${encodeURIComponent(user.username)}`)
    } catch (error) {
      clearAuthenticatedUser()
      console.error('Failed to fetch user info:', error)
    }
  })
}

export default useRedirectIfAuthenticated
