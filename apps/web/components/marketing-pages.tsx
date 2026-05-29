"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  LanguagesIcon,
  LockKeyholeIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  UploadIcon,
  LogOut,
  Sparkles,
  UserIcon,
} from "lucide-react"

import { useMoneyCoach } from "@/components/money-coach-provider"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

function Copy({ vi, en }: { vi: string; en: string }) {
  const { locale } = useMoneyCoach()
  return <>{locale === "vi" ? vi : en}</>
}

export function LandingPage() {
  const { locale, setLocale, signedIn, signOut } = useMoneyCoach()
  const router = useRouter()

  return (
    <div className="min-h-svh bg-background">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BanknoteIcon />
          </span>
          <span className="font-semibold tracking-tight">Money Coach</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
          >
            <LanguagesIcon data-icon="inline-start" />
            {locale === "vi" ? "EN" : "VI"}
          </Button>

          {signedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">MC</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">Demo User</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm leading-none font-medium">
                      Demo User
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      demo@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/app/overview"
                      className="w-full cursor-pointer"
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>
                        {locale === "vi" ? "Dashboard của tôi" : "My Dashboard"}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>
                      {locale === "vi" ? "Nâng cấp Pro" : "Upgrade to Pro"}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    signOut()
                    router.push("/")
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{locale === "vi" ? "Đăng xuất" : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/auth/sign-in/">
                  <Copy vi="Đăng nhập" en="Sign in" />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-in/">
                  <Copy vi="Dùng bản demo" en="Try demo" />
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-12 pb-20 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:pt-20">
          <div className="flex flex-col items-start gap-7">
            <Badge variant="secondary">
              <ShieldCheckIcon data-icon="inline-start" />
              <Copy
                vi="AI phân loại có bước xác nhận"
                en="Reviewable AI classification"
              />
            </Badge>
            <div className="flex max-w-2xl flex-col gap-5">
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                <Copy
                  vi="Hiểu tiền của bạn đã đi đâu."
                  en="Know exactly where your money went."
                />
              </h1>
              <p className="max-w-xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg">
                <Copy
                  vi="Tải sao kê ngân hàng, nhận phân tích chi tiêu rõ ràng và duyệt những giao dịch AI chưa chắc chắn trước khi tin vào số liệu."
                  en="Upload a bank statement, see clear spending insights, and approve uncertain AI categories before trusting the numbers."
                />
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/auth/sign-in">
                  <UploadIcon data-icon="inline-start" />
                  <Copy vi="Thử sao kê mẫu" en="Try sample statement" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/app/overview/">
                  <Copy vi="Xem dashboard" en="View dashboard" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-5 pt-3 text-sm text-muted-foreground sm:grid-cols-3">
              {[
                ["CSV an toàn", "Private CSV"],
                ["Phân loại lai", "Hybrid classify"],
                ["Duyệt thủ công", "Human review"],
              ].map(([vi, en]) => (
                <div key={en} className="flex items-center gap-2">
                  <CheckCircle2Icon className="text-primary" />
                  {locale === "vi" ? vi : en}
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-card/90 shadow-2xl shadow-primary/5">
            <CardHeader className="border-b">
              <CardDescription>
                <Copy vi="Tháng 05 / 2026" en="May 2026" />
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                16.465.000 VND
              </CardTitle>
              <Badge variant="outline">
                <Copy vi="Còn có thể chi" en="Available to spend" />
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Metric
                  label={locale === "vi" ? "Thu nhập" : "Income"}
                  value="28.000.000"
                />
                <Metric
                  label={locale === "vi" ? "Chi tiêu" : "Spending"}
                  value="11.535.000"
                />
              </div>
              <div className="flex flex-col gap-3">
                <SpendBar label="Shopping" value="3.728.000" width="72%" />
                <SpendBar label="Transfer" value="3.200.000" width="60%" />
                <SpendBar label="Food" value="1.246.000" width="32%" />
              </div>
              <Alert>
                <ScanSearchIcon />
                <AlertDescription>
                  <Copy
                    vi="2 giao dịch chuyển khoản đang chờ bạn xác nhận."
                    en="2 transfers are waiting for your confirmation."
                  />
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </section>

        <section className="border-y bg-muted/40">
          <div className="mx-auto grid max-w-7xl gap-5 px-5 py-14 md:grid-cols-3 md:px-8">
            <Feature
              icon={UploadIcon}
              title={locale === "vi" ? "1. Nhập sao kê" : "1. Import"}
              text={
                locale === "vi"
                  ? "Dùng CSV từ ngân hàng hoặc file mẫu để bắt đầu."
                  : "Start with a bank CSV or the included sample data."
              }
            />
            <Feature
              icon={ScanSearchIcon}
              title={locale === "vi" ? "2. AI phân loại" : "2. Classify"}
              text={
                locale === "vi"
                  ? "Rules xử lý giao dịch rõ; AI hỗ trợ mô tả khó."
                  : "Rules handle clear items; AI addresses unclear descriptions."
              }
            />
            <Feature
              icon={ShieldCheckIcon}
              title={locale === "vi" ? "3. Xác nhận & hiểu" : "3. Review"}
              text={
                locale === "vi"
                  ? "Sửa mục chưa chắc chắn trước khi xem insight."
                  : "Correct uncertain entries before acting on insights."
              }
            />
          </div>
        </section>
      </main>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
        {value}
      </p>
    </div>
  )
}

function SpendBar({
  label,
  value,
  width,
}: {
  label: string
  value: string
  width: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground tabular-nums">
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width }} />
      </div>
    </div>
  )
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card ring-1 ring-border">
        <Icon />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

export function AuthPage({ mode }: { mode: string }) {
  const router = useRouter()
  const {
    locale,
    signIn,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    confirmPassword,
  } = useMoneyCoach()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [code, setCode] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("")

  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")
  const [successMsg, setSuccessMsg] = React.useState("")
  const [forgotStep, setForgotStep] = React.useState(1) // 1 = request code, 2 = reset password

  const validMode = [
    "sign-in",
    "sign-up",
    "forgot-password",
    "verify",
  ].includes(mode)
  const currentMode = validMode ? mode : "sign-in"

  // Pull query parameters safely on the client to avoid Next.js static pre-rendering Suspense issues
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const emailParam = params.get("email") || ""
      if (emailParam) {
        setEmail(emailParam)
      }

      if (params.get("verified") === "true") {
        setSuccessMsg(
          locale === "vi"
            ? "Xác minh tài khoản thành công! Bạn đã có thể đăng nhập."
            : "Account verified successfully! You can now sign in."
        )
      } else if (params.get("resetSuccess") === "true") {
        setSuccessMsg(
          locale === "vi"
            ? "Đặt lại mật khẩu thành công! Hãy đăng nhập với mật khẩu mới."
            : "Password reset successful! Please sign in with your new password."
        )
      }
    }
  }, [locale])

  function enterDemo() {
    signIn()
    router.push("/app/overview/")
  }

  // Handle Verify Mode
  if (currentMode === "verify") {
    return (
      <AuthFrame>
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "vi" ? "Xác minh tài khoản" : "Verify account"}
            </CardTitle>
            <CardDescription>
              {locale === "vi"
                ? "Nhập mã xác thực gồm 6 chữ số gửi đến email của bạn."
                : "Enter the 6-digit verification code sent to your email."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            {successMsg && (
              <Alert className="mb-4">
                <CheckCircle2Icon className="text-primary" />
                <AlertDescription>{successMsg}</AlertDescription>
              </Alert>
            )}
            <form
              onSubmit={async (event) => {
                event.preventDefault()
                setLoading(true)
                setErrorMsg("")
                setSuccessMsg("")
                try {
                  await confirmSignUp(email, code)
                  router.push(
                    `/auth/sign-in?verified=true&email=${encodeURIComponent(email)}`
                  )
                } catch (err: any) {
                  setErrorMsg(
                    err.message ||
                      (locale === "vi"
                        ? "Xác minh thất bại. Vui lòng kiểm tra lại mã."
                        : "Verification failed. Please check your code.")
                  )
                } finally {
                  setLoading(false)
                }
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="minh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="code">
                    {locale === "vi" ? "Mã xác thực" : "Verification Code"}
                  </FieldLabel>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </Field>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? locale === "vi"
                      ? "Đang xác thực..."
                      : "Verifying..."
                    : locale === "vi"
                      ? "Xác thực"
                      : "Verify"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={async () => {
                    if (!email) {
                      setErrorMsg(
                        locale === "vi"
                          ? "Vui lòng nhập email trước khi yêu cầu gửi lại mã."
                          : "Please enter your email before requesting a code resend."
                      )
                      return
                    }
                    setLoading(true)
                    setErrorMsg("")
                    setSuccessMsg("")
                    try {
                      await resendConfirmationCode(email)
                      setSuccessMsg(
                        locale === "vi"
                          ? "Đã gửi lại mã xác thực thành công!"
                          : "Verification code resent successfully!"
                      )
                    } catch (err: any) {
                      setErrorMsg(
                        err.message ||
                          (locale === "vi"
                            ? "Không thể gửi lại mã."
                            : "Failed to resend code.")
                      )
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  {locale === "vi"
                    ? "Gửi lại mã xác thực"
                    : "Resend Verification Code"}
                </Button>
                <FieldSeparator>
                  {locale === "vi" ? "hoặc" : "or"}
                </FieldSeparator>
                <Button type="button" variant="outline" onClick={enterDemo}>
                  {locale === "vi" ? "Dùng tài khoản demo" : "Use demo account"}
                </Button>
              </FieldGroup>
            </form>
            <div className="mt-5 text-center text-sm">
              <Link
                href="/auth/sign-in"
                className="text-muted-foreground hover:text-foreground"
              >
                {locale === "vi" ? "Quay lại đăng nhập" : "Back to sign in"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </AuthFrame>
    )
  }

  const isSignup = currentMode === "sign-up"
  const isForgot = currentMode === "forgot-password"

  // Handle Sign In, Sign Up, and Forgot Password Forms
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      if (isForgot) {
        if (forgotStep === 1) {
          await forgotPassword(email)
          setSuccessMsg(
            locale === "vi"
              ? "Mã đặt lại mật khẩu đã được gửi đến email của bạn."
              : "A password reset code has been sent to your email."
          )
          setForgotStep(2)
        } else {
          if (newPassword !== confirmNewPassword) {
            setErrorMsg(
              locale === "vi"
                ? "Mật khẩu xác nhận không khớp."
                : "Confirm password does not match."
            )
            return
          }
          await confirmPassword(email, code, newPassword)
          setSuccessMsg(
            locale === "vi"
              ? "Đặt lại mật khẩu thành công! Đang chuyển hướng..."
              : "Password reset successful! Redirecting..."
          )
          setTimeout(() => {
            router.push("/auth/sign-in?resetSuccess=true")
          }, 1500)
        }
      } else if (isSignup) {
        await signUp(email, password)
        setSuccessMsg(
          locale === "vi"
            ? "Đăng ký thành công! Đang chuyển đến trang xác thực..."
            : "Sign up successful! Redirecting to verification page..."
        )
        setTimeout(() => {
          router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
        }, 1500)
      } else {
        await signIn(email, password)
        router.push("/app/overview")
      }
    } catch (err: any) {
      console.error(err)
      if (err.code === "UserNotConfirmedException") {
        setErrorMsg(
          locale === "vi"
            ? "Tài khoản của bạn chưa được xác thực. Đang chuyển hướng đến trang xác thực..."
            : "Your account is not confirmed yet. Redirecting to verification page..."
        )
        setTimeout(() => {
          router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
        }, 1500)
      } else {
        setErrorMsg(
          err.message ||
            (locale === "vi"
              ? "Đã xảy ra lỗi. Vui lòng kiểm tra lại thông tin."
              : "An error occurred. Please verify your details.")
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame>
      <Card>
        <CardHeader>
          <CardTitle>
            {isForgot
              ? locale === "vi"
                ? "Khôi phục mật khẩu"
                : "Reset password"
              : isSignup
                ? locale === "vi"
                  ? "Tạo tài khoản"
                  : "Create account"
                : locale === "vi"
                  ? "Chào mừng trở lại"
                  : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {locale === "vi"
              ? "Hệ thống bảo mật bởi AWS Cognito."
              : "Secured by AWS Cognito authentication."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
          {successMsg && (
            <Alert className="mb-4">
              <CheckCircle2Icon className="text-primary" />
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
          )}

          <form className="mt-4" onSubmit={handleSubmit}>
            <FieldGroup>
              {/* Step 1 for Forgot Password, or standard for Sign In / Sign Up */}
              {(!isForgot || forgotStep === 1) && (
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="minh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
              )}

              {/* Standard Password Field for Sign In / Sign Up */}
              {!isForgot && (
                <Field>
                  <FieldLabel htmlFor="password">
                    {locale === "vi" ? "Mật khẩu" : "Password"}
                  </FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                  {isSignup && (
                    <FieldDescription>
                      {locale === "vi"
                        ? "Tối thiểu 8 ký tự."
                        : "At least 8 characters."}
                    </FieldDescription>
                  )}
                </Field>
              )}

              {/* Step 2 for Forgot Password (Enter Code & New Password) */}
              {isForgot && forgotStep === 2 && (
                <>
                  <Field>
                    <FieldLabel htmlFor="reset-code">
                      {locale === "vi" ? "Mã khôi phục" : "Reset Code"}
                    </FieldLabel>
                    <Input
                      id="reset-code"
                      type="text"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="new-password">
                      {locale === "vi" ? "Mật khẩu mới" : "New Password"}
                    </FieldLabel>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-new-password">
                      {locale === "vi"
                        ? "Xác nhận mật khẩu mới"
                        : "Confirm New Password"}
                    </FieldLabel>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </Field>
                </>
              )}

              <Button type="submit" disabled={loading}>
                {loading
                  ? locale === "vi"
                    ? "Đang xử lý..."
                    : "Processing..."
                  : isForgot
                    ? forgotStep === 1
                      ? locale === "vi"
                        ? "Gửi mã khôi phục"
                        : "Send reset code"
                      : locale === "vi"
                        ? "Đặt lại mật khẩu"
                        : "Reset password"
                    : isSignup
                      ? locale === "vi"
                        ? "Đăng ký"
                        : "Sign up"
                      : locale === "vi"
                        ? "Đăng nhập"
                        : "Sign in"}
              </Button>

              <FieldSeparator>{locale === "vi" ? "hoặc" : "or"}</FieldSeparator>

              <Button
                type="button"
                variant="outline"
                onClick={enterDemo}
                disabled={loading}
              >
                {locale === "vi" ? "Dùng tài khoản demo" : "Use demo account"}
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-5 flex justify-between gap-4 text-sm text-muted-foreground">
            {!isSignup && !isForgot ? (
              <>
                <Link href="/auth/sign-up/" className="hover:text-foreground">
                  {locale === "vi" ? "Tạo tài khoản" : "Create account"}
                </Link>
                <Link
                  href="/auth/forgot-password/"
                  className="hover:text-foreground"
                >
                  {locale === "vi" ? "Quên mật khẩu?" : "Forgot password?"}
                </Link>
              </>
            ) : (
              <Link href="/auth/sign-in/" className="hover:text-foreground">
                {locale === "vi" ? "Quay lại đăng nhập" : "Back to sign in"}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </AuthFrame>
  )
}

function AuthFrame({ children }: { children: React.ReactNode }) {
  const { locale } = useMoneyCoach()
  return (
    <main className="grid min-h-svh bg-muted/30 lg:grid-cols-[1fr_520px]">
      <section className="hidden flex-col justify-between p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BanknoteIcon />
          </span>
          Money Coach
        </Link>
        <div className="max-w-lg">
          <LockKeyholeIcon className="mb-6 text-primary" />
          <h1 className="text-4xl font-semibold tracking-tight">
            {locale === "vi"
              ? "Dữ liệu tài chính cần rõ ràng và có kiểm soát."
              : "Financial clarity with human control."}
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            {locale === "vi"
              ? "AI phân loại giao dịch; bạn duyệt các kết quả chưa chắc chắn trước khi chúng ảnh hưởng insight."
              : "AI categorizes transactions; you review uncertain results before they shape your insights."}
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2 font-semibold lg:hidden"
          >
            <BanknoteIcon />
            Money Coach
          </Link>
          {children}
        </div>
      </section>
    </main>
  )
}
