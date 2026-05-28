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
                    <p className="text-sm font-medium leading-none">Demo User</p>
                    <p className="text-xs leading-none text-muted-foreground">demo@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/app/overview/" className="cursor-pointer w-full">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>{locale === "vi" ? "Dashboard của tôi" : "My Dashboard"}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>{locale === "vi" ? "Nâng cấp Pro" : "Upgrade to Pro"}</span>
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
  const { locale, signIn } = useMoneyCoach()
  const [submitted, setSubmitted] = React.useState(false)
  const validMode = [
    "sign-in",
    "sign-up",
    "forgot-password",
    "verify",
  ].includes(mode)
  const currentMode = validMode ? mode : "sign-in"

  function enterDemo() {
    signIn()
    router.push("/app/overview/")
  }

  if (currentMode === "verify") {
    return (
      <AuthFrame>
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "vi" ? "Kiểm tra email của bạn" : "Check your email"}
            </CardTitle>
            <CardDescription>
              {locale === "vi"
                ? "Chúng tôi đã gửi liên kết xác minh. Đây là trạng thái mô phỏng cho tích hợp Supabase Auth sau này."
                : "We sent a verification link. This is a mock state prepared for future Supabase Auth integration."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={enterDemo}>
              {locale === "vi"
                ? "Tiếp tục bằng tài khoản demo"
                : "Continue with demo account"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/sign-in/">
                {locale === "vi" ? "Quay lại đăng nhập" : "Back to sign in"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AuthFrame>
    )
  }

  const isSignup = currentMode === "sign-up"
  const isForgot = currentMode === "forgot-password"

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
              ? "Giao diện xác thực demo. Supabase Auth sẽ được nối ở phase backend."
              : "Authentication UI demo. Supabase Auth will be connected in the backend phase."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <Alert>
              <CheckCircle2Icon />
              <AlertDescription>
                {locale === "vi"
                  ? "Email mô phỏng đã được gửi. Bạn có thể tiếp tục bằng demo."
                  : "Mock email sent. You can continue with the demo account."}
              </AlertDescription>
            </Alert>
          ) : null}
          <form
            className="mt-4"
              onSubmit={async (event) => {
                event.preventDefault()
                if (isForgot) {
                  setSubmitted(true)
                } else if (isSignup) {
                  router.push("/auth/verify/")
                } else {
                  try {
                    const form = event.currentTarget as HTMLFormElement
                    const emailInput = form.elements.namedItem("email") as HTMLInputElement
                    const passwordInput = form.elements.namedItem("password") as HTMLInputElement
                    await signIn(emailInput?.value, passwordInput?.value)
                    router.push("/app/overview/")
                  } catch (e) {
                    alert("Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.")
                  }
                }
              }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="minh@example.com"
                  defaultValue="demo@example.com"
                  required
                />
              </Field>
              {!isForgot ? (
                <Field>
                  <FieldLabel htmlFor="password">
                    {locale === "vi" ? "Mật khẩu" : "Password"}
                  </FieldLabel>
                  <Input id="password" name="password" type="password" defaultValue="password123" minLength={8} required />
                  {isSignup ? (
                    <FieldDescription>
                      {locale === "vi"
                        ? "Tối thiểu 8 ký tự."
                        : "At least 8 characters."}
                    </FieldDescription>
                  ) : null}
                </Field>
              ) : null}
              <Button type="submit">
                {isForgot
                  ? locale === "vi"
                    ? "Gửi liên kết"
                    : "Send reset link"
                  : isSignup
                    ? locale === "vi"
                      ? "Đăng ký"
                      : "Sign up"
                    : locale === "vi"
                      ? "Đăng nhập"
                      : "Sign in"}
              </Button>
              <FieldSeparator>{locale === "vi" ? "hoặc" : "or"}</FieldSeparator>
              <Button type="button" variant="outline" onClick={enterDemo}>
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
