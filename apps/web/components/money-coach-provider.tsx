"use client"

import * as React from "react"

import {
  type Category,
  type MoneyState,
  createSeedState,
} from "@/lib/money-coach"
import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js"

type Locale = "vi" | "en"

interface MoneyCoachContextValue {
  state: MoneyState
  locale: Locale
  hydrated: boolean
  signedIn: boolean
  setLocale: (locale: Locale) => void
  signIn: (email?: string, password?: string) => Promise<void>
  signOut: () => void
  addImport: (filename: string, content: string) => Promise<number>
  reviewTransaction: (
    id: string,
    category: Category,
    rememberRule?: boolean
  ) => Promise<void>
  askCoach: (
    message: string,
    image?: string | null
  ) => Promise<{ answer: string; steps?: string[]; sources?: any[] }>
  toggleRecurring: (id: string) => void
  updateBudget: (category: Category, limit: number) => void
  resetData: () => void
  signUp: (email: string, password: string) => Promise<void>
  confirmSignUp: (email: string, code: string) => Promise<void>
  resendConfirmationCode: (email: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  confirmPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<void>
}

const storageKey = "money-coach-demo-state-v1"
const sessionKey = "money-coach-demo-session-v1"
const localeKey = "money-coach-locale-v1"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
const USER_ID = "demo-user"

function getAuthHeaders(
  customHeaders: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    "x-user-id": USER_ID,
    ...customHeaders,
  }
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("cognito-id-token")
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }
  return headers
}

/** Safely coerce any API shape to a plain array of transactions */
function normalizeTxns(data: unknown): MoneyState["transactions"] {
  if (Array.isArray(data)) return data as MoneyState["transactions"]
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj["transactions"]))
      return obj["transactions"] as MoneyState["transactions"]
  }
  return []
}

const MoneyCoachContext = React.createContext<MoneyCoachContextValue | null>(
  null
)

export function MoneyCoachProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = React.useState<MoneyState>(createSeedState)
  const sessionId = React.useMemo(() => {
    if (
      typeof window !== "undefined" &&
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID()
    }
    return (
      "session-" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    )
  }, [])
  const [locale, setLocaleState] = React.useState<Locale>("vi")
  const [signedIn, setSignedIn] = React.useState(false)
  const [hydrated, setHydrated] = React.useState(false)

  // Initial load
  React.useEffect(() => {
    queueMicrotask(() => {
      // Parse URL hash for Cognito tokens (OAuth2 Implicit Grant Flow)
      let hasCognitoTokens = false
      if (typeof window !== "undefined" && window.location.hash) {
        try {
          const hash = window.location.hash.substring(1)
          const params = new URLSearchParams(hash)
          const idToken = params.get("id_token")
          const accessToken = params.get("access_token")

          if (idToken) {
            window.localStorage.setItem("cognito-id-token", idToken)
            if (accessToken) {
              window.localStorage.setItem("cognito-access-token", accessToken)
            }
            hasCognitoTokens = true
            // Clear hash from URL to keep address bar clean
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search
            )
          }
        } catch (e) {
          console.error("Failed to parse Cognito URL hash:", e)
        }
      }

      const storedLocale = window.localStorage.getItem(localeKey)
      let storedSession = window.localStorage.getItem(sessionKey)

      if (hasCognitoTokens) {
        storedSession = "signed-in"
        window.localStorage.setItem(sessionKey, "signed-in")
      }

      if (storedLocale === "vi" || storedLocale === "en") {
        setLocaleState(storedLocale)
      }

      const isUserSignedIn = storedSession === "signed-in"
      setSignedIn(isUserSignedIn)

      if (!isUserSignedIn) {
        setHydrated(true)
        return
      }

      // Fetch data from backend
      fetch(`${API_BASE_URL}/transactions`, {
        headers: getAuthHeaders(),
      })
        .then((r) => {
          if (!r.ok) throw new Error("Backend failed")
          return r.json()
        })
        .then((data) => {
          const txns = normalizeTxns(data)
          setState((current) => {
            const stored = window.localStorage.getItem(storageKey)
            let localState = current
            if (stored) {
              try {
                const parsed = JSON.parse(stored) as MoneyState
                // Ensure persisted transactions is always an array
                localState = {
                  ...parsed,
                  transactions: normalizeTxns(parsed.transactions),
                }
              } catch {
                localState = current
              }
            }
            return {
              ...localState,
              transactions: txns,
            }
          })
          setHydrated(true)
        })
        .catch((err) => {
          console.error("Fetch transactions failed:", err)
          setHydrated(true)
        })
    })
  }, [])

  React.useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
      window.localStorage.setItem(localeKey, locale)
      window.localStorage.setItem(
        sessionKey,
        signedIn ? "signed-in" : "signed-out"
      )
    }
  }, [hydrated, locale, signedIn, state])

  const setLocale = React.useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
  }, [])

  const signIn = React.useCallback(
    async (email?: string, password?: string) => {
      const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
      const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
      const redirectUri =
        process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ||
        (typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000")

      if (email && password) {
        if (!clientId || !userPoolId) {
          if (email === "demo@example.com" && password === "password123") {
            window.localStorage.setItem(sessionKey, "signed-in")
            setSignedIn(true)
            return Promise.resolve()
          }
          throw new Error(
            locale === "vi"
              ? "AWS Cognito chưa được cấu hình. Vui lòng thiết lập NEXT_PUBLIC_COGNITO_USER_POOL_ID và NEXT_PUBLIC_COGNITO_CLIENT_ID trong file .env hoặc sử dụng nút 'Dùng tài khoản demo'."
              : "AWS Cognito is not configured. Please set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID in your .env file or use the 'Use demo account' button."
          )
        }

        const poolData = { UserPoolId: userPoolId, ClientId: clientId }
        const userPool = new CognitoUserPool(poolData)
        const authenticationDetails = new AuthenticationDetails({
          Username: email,
          Password: password,
        })
        const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })

        return new Promise<void>((resolve, reject) => {
          cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
              window.localStorage.setItem(
                "cognito-id-token",
                result.getIdToken().getJwtToken()
              )
              window.localStorage.setItem(
                "cognito-access-token",
                result.getAccessToken().getJwtToken()
              )
              window.localStorage.setItem(sessionKey, "signed-in")
              setSignedIn(true)
              resolve()
            },
            onFailure: (err) => {
              console.error("Cognito login error:", err)
              reject(err)
            },
          })
        })
      } else if (domain && clientId) {
        // Fallback to Hosted UI if no email/password provided
        window.location.href = `https://${domain}/login?client_id=${clientId}&response_type=token&scope=openid+email&redirect_uri=${encodeURIComponent(
          redirectUri
        )}`
      } else {
        window.localStorage.setItem(sessionKey, "signed-in")
        setSignedIn(true)
        return Promise.resolve()
      }
    },
    [locale]
  )

  const signUp = React.useCallback(
    async (email: string, password: string) => {
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
      const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID

      if (!clientId || !userPoolId) {
        throw new Error(
          locale === "vi"
            ? "AWS Cognito chưa được cấu hình. Vui lòng thiết lập NEXT_PUBLIC_COGNITO_USER_POOL_ID và NEXT_PUBLIC_COGNITO_CLIENT_ID trong file .env"
            : "AWS Cognito is not configured. Please set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID in your .env file"
        )
      }

      const poolData = { UserPoolId: userPoolId, ClientId: clientId }
      const userPool = new CognitoUserPool(poolData)

      const attributeList: CognitoUserAttribute[] = []
      const dataEmail = {
        Name: "email",
        Value: email,
      }
      const attributeEmail = new CognitoUserAttribute(dataEmail)
      attributeList.push(attributeEmail)

      return new Promise<void>((resolve, reject) => {
        userPool.signUp(email, password, attributeList, [], (err) => {
          if (err) {
            console.error("Cognito sign up error:", err)
            reject(err)
            return
          }
          resolve()
        })
      })
    },
    [locale]
  )

  const confirmSignUp = React.useCallback(
    async (email: string, code: string) => {
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
      const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID

      if (!clientId || !userPoolId) {
        throw new Error(
          locale === "vi"
            ? "AWS Cognito chưa được cấu hình."
            : "AWS Cognito is not configured."
        )
      }

      const poolData = { UserPoolId: userPoolId, ClientId: clientId }
      const userPool = new CognitoUserPool(poolData)
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })

      return new Promise<void>((resolve, reject) => {
        cognitoUser.confirmRegistration(code, true, (err) => {
          if (err) {
            console.error("Cognito confirm sign up error:", err)
            reject(err)
            return
          }
          resolve()
        })
      })
    },
    [locale]
  )

  const resendConfirmationCode = React.useCallback(
    async (email: string) => {
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
      const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID

      if (!clientId || !userPoolId) {
        throw new Error(
          locale === "vi"
            ? "AWS Cognito chưa được cấu hình."
            : "AWS Cognito is not configured."
        )
      }

      const poolData = { UserPoolId: userPoolId, ClientId: clientId }
      const userPool = new CognitoUserPool(poolData)
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })

      return new Promise<void>((resolve, reject) => {
        cognitoUser.resendConfirmationCode((err) => {
          if (err) {
            console.error("Cognito resend code error:", err)
            reject(err)
            return
          }
          resolve()
        })
      })
    },
    [locale]
  )

  const forgotPassword = React.useCallback(
    async (email: string) => {
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
      const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID

      if (!clientId || !userPoolId) {
        throw new Error(
          locale === "vi"
            ? "AWS Cognito chưa được cấu hình."
            : "AWS Cognito is not configured."
        )
      }

      const poolData = { UserPoolId: userPoolId, ClientId: clientId }
      const userPool = new CognitoUserPool(poolData)
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })

      return new Promise<void>((resolve, reject) => {
        cognitoUser.forgotPassword({
          onSuccess: () => {
            resolve()
          },
          onFailure: (err) => {
            console.error("Cognito forgot password error:", err)
            reject(err)
          },
        })
      })
    },
    [locale]
  )

  const confirmPassword = React.useCallback(
    async (email: string, code: string, newPassword: string) => {
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
      const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID

      if (!clientId || !userPoolId) {
        throw new Error(
          locale === "vi"
            ? "AWS Cognito chưa được cấu hình."
            : "AWS Cognito is not configured."
        )
      }

      const poolData = { UserPoolId: userPoolId, ClientId: clientId }
      const userPool = new CognitoUserPool(poolData)
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })

      return new Promise<void>((resolve, reject) => {
        cognitoUser.confirmPassword(code, newPassword, {
          onSuccess: () => {
            resolve()
          },
          onFailure: (err) => {
            console.error("Cognito confirm password error:", err)
            reject(err)
          },
        })
      })
    },
    [locale]
  )

  const signOut = React.useCallback(() => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    const redirectUri =
      process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000")

    window.localStorage.removeItem("cognito-id-token")
    window.localStorage.removeItem("cognito-access-token")
    window.localStorage.removeItem(sessionKey)
    setSignedIn(false)
  }, [])

  const fetchTransactions = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/transactions`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return
      const data = await res.json()
      const txns = normalizeTxns(data)
      setState((current) => ({ ...current, transactions: txns }))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const addImport = React.useCallback(
    async (filename: string, content: string) => {
      const file = new File([content], filename, { type: "text/csv" })
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        })
        if (!res.ok) {
          let code = "UPLOAD_FAILED"
          try {
            const payload = (await res.json()) as {
              detail?: { code?: string }
            }
            code = payload.detail?.code ?? code
          } catch {
            code = "UPLOAD_FAILED"
          }
          throw new Error(code)
        }
        const summary = await res.json()

        await fetchTransactions()

        setState((current) => ({
          ...current,
          imports: [summary, ...current.imports],
        }))
        return summary.rows || summary.transactions?.length || 0
      } catch (error) {
        console.error(error)
        if (error instanceof Error) {
          throw error
        }
        throw new Error("UPLOAD_FAILED")
      }
    },
    [fetchTransactions]
  )

  const reviewTransaction = React.useCallback(
    async (id: string, category: Category, rememberRule = false) => {
      // Optimistic update
      setState((current) => {
        const transaction = current.transactions.find((txn) => txn.id === id)
        const newRule =
          rememberRule && transaction
            ? {
                id: `rule-${transaction.id}`,
                contains: transaction.merchant,
                category,
              }
            : null
        return {
          ...current,
          transactions: current.transactions.map((txn) =>
            txn.id === id
              ? {
                  ...txn,
                  category,
                  confidence: 1,
                  status: "MANUAL_APPROVED",
                }
              : txn
          ),
          rules: newRule
            ? [
                newRule,
                ...current.rules.filter(
                  (rule) => rule.contains !== newRule.contains
                ),
              ]
            : current.rules,
        }
      })

      // Backend call
      try {
        await fetch(`${API_BASE_URL}/transactions/${id}`, {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ category, status: "MANUAL_APPROVED" }),
        })
        if (rememberRule) {
          const txn = state.transactions.find((t) => t.id === id)
          if (txn) {
            await fetch(`${API_BASE_URL}/rules`, {
              method: "POST",
              headers: getAuthHeaders({ "Content-Type": "application/json" }),
              body: JSON.stringify({ contains: txn.merchant, category }),
            })
          }
        }
      } catch (err) {
        console.error("Review transaction failed:", err)
      }
    },
    [state.transactions]
  )

  const askCoach = React.useCallback(
    async (
      message: string,
      image?: string | null
    ): Promise<{ answer: string; steps?: string[]; sources?: any[] }> => {
      try {
        const res = await fetch(`${API_BASE_URL}/chat`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            message,
            image: image || undefined,
            session_id: sessionId,
          }),
        })
        if (!res.ok) {
          throw new Error("Chat request failed")
        }
        const data = await res.json()

        // Auto-refresh frontend state if AI modified the database
        if (
          data.steps &&
          (data.steps.includes("create_transaction") ||
            data.steps.includes("parse_text_csv"))
        ) {
          await fetchTransactions()
        }

        return {
          answer: data.answer || "Không có phản hồi từ AI.",
          steps: data.steps || [],
          sources: data.sources || [],
        }
      } catch (err) {
        console.error("Chat failed:", err)
        throw err
      }
    },
    [fetchTransactions, sessionId]
  )

  const toggleRecurring = React.useCallback((id: string) => {
    setState((current) => ({
      ...current,
      transactions: current.transactions.map((txn) =>
        txn.id === id ? { ...txn, recurring: !txn.recurring } : txn
      ),
    }))
  }, [])

  const updateBudget = React.useCallback(
    (category: Category, limit: number) => {
      setState((current) => ({
        ...current,
        budgets: current.budgets.map((budget) =>
          budget.category === category ? { ...budget, limit } : budget
        ),
      }))
    },
    []
  )

  const resetData = React.useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/transactions`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
    } catch (err) {
      console.error("Failed to clear RDS transactions:", err)
    }
    setState(createSeedState())
  }, [])

  const value = React.useMemo(
    () => ({
      state,
      locale,
      hydrated,
      signedIn,
      setLocale,
      signIn,
      signOut,
      addImport,
      reviewTransaction,
      askCoach,
      toggleRecurring,
      updateBudget,
      resetData,
      signUp,
      confirmSignUp,
      resendConfirmationCode,
      forgotPassword,
      confirmPassword,
    }),
    [
      state,
      locale,
      hydrated,
      signedIn,
      setLocale,
      signIn,
      signUp,
      confirmSignUp,
      resendConfirmationCode,
      forgotPassword,
      confirmPassword,
      signOut,
      addImport,
      reviewTransaction,
      askCoach,
      toggleRecurring,
      updateBudget,
      resetData,
    ]
  )

  return (
    <MoneyCoachContext.Provider value={value}>
      {children}
    </MoneyCoachContext.Provider>
  )
}

export function useMoneyCoach() {
  const context = React.useContext(MoneyCoachContext)
  if (!context) {
    throw new Error("useMoneyCoach must be used within MoneyCoachProvider")
  }
  return context
}
