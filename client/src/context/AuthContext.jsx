import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, loginRequest, logoutRequest, registerApplicantRequest, registerEmployerRequest } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const bootstrapAuth = useCallback(async () => {
    try {
      const response = await getCurrentUser()
      setUser(response.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrapAuth()
  }, [bootstrapAuth])

  const login = useCallback(async (payload) => {
    const response = await loginRequest(payload)
    setUser(response.user)
    return response
  }, [])

  const registerApplicant = useCallback(async (payload) => {
    const response = await registerApplicantRequest(payload)
    setUser(response.user)
    return response
  }, [])

  const registerEmployer = useCallback(async (payload) => {
    const response = await registerEmployerRequest(payload)
    setUser(response.user)
    return response
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      registerApplicant,
      registerEmployer,
      refreshCurrentUser: bootstrapAuth,
    }),
    [user, loading, login, logout, registerApplicant, registerEmployer, bootstrapAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
