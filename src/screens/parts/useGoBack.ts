import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes'

/** react-router stores the history index in history.state.idx (same check as <Header>). */
function hasInAppHistory(): boolean {
  const state: unknown = window.history.state
  if (state && typeof state === 'object' && 'idx' in state) {
    const idx: unknown = state.idx
    return typeof idx === 'number' && idx > 0
  }
  return false
}

/** Back like <Header>: history back inside the app, otherwise Home. For custom header rows. */
export function useGoBack(): () => void {
  const navigate = useNavigate()
  return () => {
    if (hasInAppHistory()) navigate(-1)
    else navigate(ROUTES.home, { replace: true })
  }
}
