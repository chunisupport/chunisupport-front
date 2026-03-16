import { useNavigate } from '@solidjs/router'
import { onMount } from 'solid-js'

import { clearAuthenticatedUser } from '../stores/authSession'
import { redirectAfterAuthentication } from '../utils/postAuthRedirect'

const useRedirectIfAuthenticated = () => {
  const navigate = useNavigate()

  // 縺吶〒縺ｫ繝ｭ繧ｰ繧､繝ｳ縺励※縺・ｋ蝣ｴ蜷医・繝ｦ繝ｼ繧ｶ繝ｼ繝壹・繧ｸ縺ｸ繝ｪ繝繧､繝ｬ繧ｯ繝・
  onMount(async () => {
    try {
      await redirectAfterAuthentication(navigate)
    } catch (error) {
      clearAuthenticatedUser()
      console.error('Failed to fetch user info:', error)
    }
  })
}

export default useRedirectIfAuthenticated
