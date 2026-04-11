import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDashboardPath } from '../utils/roleRoutes'

export function DashboardIndexRedirect() {
  const { user } = useAuth()
  return <Navigate to={getDashboardPath(user?.role)} replace />
}
