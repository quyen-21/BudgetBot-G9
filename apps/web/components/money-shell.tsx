"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LanguagesIcon, MoonStarIcon, SunIcon, UploadIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { AppSidebar } from "@/components/app-sidebar"
import { useMoneyCoach } from "@/components/money-coach-provider"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

const defaultPageName: [string, string] = ["Tổng quan", "Overview"]

const pageNames: Record<string, [string, string]> = {
  overview: ["Tổng quan", "Overview"],
  import: ["Nhập sao kê", "Import statement"],
  transactions: ["Giao dịch", "Transactions"],
  review: ["Chờ duyệt", "Review queue"],
  imports: ["Lịch sử nhập", "Import history"],
  spending: ["Phân tích chi tiêu", "Spending analysis"],
  budgets: ["Ngân sách", "Budgets"],
  recurring: ["Thanh toán định kỳ", "Recurring payments"],
  coach: ["Trợ lý tài chính", "Money coach"],
  settings: ["Cài đặt & quyền riêng tư", "Settings & privacy"],
}

export function MoneyShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { hydrated, signedIn, locale, setLocale } = useMoneyCoach()
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    if (hydrated && !signedIn) {
      router.replace("/auth/sign-in/")
    }
  }, [hydrated, router, signedIn])

  if (!hydrated || !signedIn) {
    return <div className="min-h-svh bg-background" />
  }

  const section = pathname.split("/").filter(Boolean).at(-1) ?? "overview"
  const pageName = pageNames[section] ?? defaultPageName

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <div className="min-w-0 flex-1 flex items-center">
            <p className="truncate text-sm font-medium mr-4">
              {pageName[locale === "vi" ? 0 : 1]}
            </p>
            <div className="hidden lg:flex items-center justify-center flex-1 mx-4">
              <Link href="/app/import/" className="flex items-center gap-2 px-6 py-1.5 border-2 border-dashed rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors w-full max-w-md justify-center">
                <UploadIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {locale === "vi" ? "[ Kéo thả sao kê CSV vào đây ] 🗂️" : "[ Drag and drop CSV statement here ] 🗂️"}
                </span>
              </Link>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            Demo data
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            aria-label={locale === "vi" ? "Use English" : "Dùng tiếng Việt"}
            onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
          >
            <LanguagesIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={locale === "vi" ? "Đổi giao diện màu" : "Toggle theme"}
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {resolvedTheme === "dark" ? <SunIcon /> : <MoonStarIcon />}
          </Button>
          <Button asChild className="hidden sm:inline-flex lg:hidden">
            <Link href="/app/import/">
              <UploadIcon data-icon="inline-start" />
              {locale === "vi" ? "Nhập CSV" : "Import CSV"}
            </Link>
          </Button>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
