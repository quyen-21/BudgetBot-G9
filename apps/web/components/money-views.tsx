"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BotIcon,
  CheckIcon,
  CircleCheckIcon,
  FileSpreadsheetIcon,
  FolderClockIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UploadIcon,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { useTheme } from "next-themes"

import { useMoneyCoach } from "@/components/money-coach-provider"
import {
  type Category,
  type Transaction,
  categories,
  formatCurrency,
  sampleStatement,
  summarize,
} from "@/lib/money-coach"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Progress } from "@workspace/ui/components/progress"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Switch } from "@workspace/ui/components/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"

function text(locale: "vi" | "en", vi: string, en: string) {
  return locale === "vi" ? vi : en
}

const maxCsvBytes = 2 * 1024 * 1024
const maxCsvRows = 5000
const csvMimeTypes = new Set([
  "",
  "text/csv",
  "text/plain",
  "application/csv",
  "application/octet-stream",
  "application/vnd.ms-excel",
])

type CoachMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  steps?: string[]
  sources?: CoachSource[]
}

type CoachSource = {
  label: string
  detail: string
}

type CoachResponse = {
  answer: string
  steps: string[]
  sources: CoachSource[]
}

function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function describeTransactions(
  transactions: Transaction[],
  locale: "vi" | "en",
  limit = 3
) {
  if (transactions.length === 0) {
    return text(locale, "chưa có giao dịch nào", "no transactions yet")
  }

  return transactions
    .slice(0, limit)
    .map(
      (transaction) =>
        `${transaction.merchant}: ${formatCurrency(Math.abs(transaction.amount), locale)} (${transaction.category})`
    )
    .join("; ")
}

function buildCoachAnswer(
  question: string,
  transactions: Transaction[],
  locale: "vi" | "en"
) {
  return buildCoachResponse(question, transactions, locale).answer
}

function buildCoachResponse(
  question: string,
  transactions: Transaction[],
  locale: "vi" | "en"
): CoachResponse {
  const summary = summarize(transactions)
  const normalized = normalizeQuestion(question)
  const expenses = transactions.filter((transaction) => transaction.amount < 0)
  const recurring = transactions.filter((transaction) => transaction.recurring)
  const pending = transactions.filter(
    (transaction) => transaction.status === "NEEDS_REVIEW"
  )
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
  const largestExpenses = [...expenses]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 5)
  const recurringTotal = recurring.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0
  )
  const topCategory = summary.byCategory[0]
  const sources: CoachSource[] = [
    {
      label: text(locale, "W4 learner guide", "W4 learner guide"),
      detail:
        "docs/W4/W4_learner_guide_vi.md - RAG levels, source citation, tool use, memory, observability",
    },
    {
      label: text(locale, "W4 project announcement", "W4 project announcement"),
      detail:
        "docs/W4/W4_project_announcement_vi.md - L1-L4 requirements and source/tool evaluation criteria",
    },
    {
      label: text(locale, "Money Coach summary", "Money Coach summary"),
      detail: text(
        locale,
        `Tổng hợp ${transactions.length} giao dịch đã lưu trong trình duyệt`,
        `Aggregated ${transactions.length} transactions stored in the browser`
      ),
    },
    {
      label: text(locale, "Stored transactions", "Stored transactions"),
      detail: text(
        locale,
        "Dữ liệu giao dịch local từ CSV đã import, không gọi Bedrock trong v1",
        "Local transaction data from imported CSV, no Bedrock call in v1"
      ),
    },
  ]
  const baseSteps = [
    text(
      locale,
      "Xác định intent câu hỏi và map vào nhóm insight phù hợp.",
      "Identify the question intent and map it to the relevant insight type."
    ),
    text(
      locale,
      "Đọc summary và các giao dịch local cần thiết thay vì gửi toàn bộ dữ liệu đi nơi khác.",
      "Read the local summary and relevant transactions instead of sending the full dataset elsewhere."
    ),
    text(
      locale,
      "Áp dụng nguyên tắc W4: trả lời dựa trên nguồn cụ thể và hiển thị nguồn đã dùng.",
      "Apply the W4 principle: answer from explicit sources and show which sources were used."
    ),
  ]

  function response(answer: string, extraStep: string): CoachResponse {
    return {
      answer,
      steps: [...baseSteps, extraStep],
      sources,
    }
  }

  if (transactions.length === 0) {
    return response(
      text(
        locale,
        "Mình chưa thấy giao dịch nào để phân tích. Hãy import CSV sao kê trước, sau đó mình có thể tóm tắt chi tiêu, khoản định kỳ và giao dịch cần review.",
        "I do not see any transactions to analyze yet. Import a statement CSV first, then I can summarize spending, recurring payments, and transactions that need review."
      ),
      text(
        locale,
        "Không có giao dịch nên chỉ trả về hướng dẫn bước tiếp theo.",
        "No transactions were available, so return the next actionable step."
      )
    )
  }

  if (
    normalized.includes("subscription") ||
    normalized.includes("dang ky") ||
    normalized.includes("dinh ky") ||
    normalized.includes("recurring")
  ) {
    return response(
      text(
        locale,
        `Bạn có ${formatCurrency(recurringTotal, locale)} khoản định kỳ được đánh dấu. Các khoản nổi bật: ${describeTransactions(recurring, locale)}.`,
        `You have ${formatCurrency(recurringTotal, locale)} in marked recurring payments. Notable items: ${describeTransactions(recurring, locale)}.`
      ),
      text(
        locale,
        "Lọc các giao dịch recurring và cộng tổng giá trị tuyệt đối.",
        "Filter recurring transactions and sum their absolute value."
      )
    )
  }

  if (
    normalized.includes("review") ||
    normalized.includes("kiem tra") ||
    normalized.includes("xac nhan")
  ) {
    return response(
      text(
        locale,
        `${pending.length} giao dịch đang chờ xác nhận. Ưu tiên kiểm tra: ${describeTransactions(pending, locale)}.`,
        `${pending.length} transactions are pending confirmation. Review these first: ${describeTransactions(pending, locale)}.`
      ),
      text(
        locale,
        "Lọc các giao dịch có trạng thái NEEDS_REVIEW để ưu tiên human review.",
        "Filter transactions with NEEDS_REVIEW status to prioritize human review."
      )
    )
  }

  if (
    normalized.includes("gan day") ||
    normalized.includes("recent") ||
    normalized.includes("moi nhat")
  ) {
    return response(
      text(
        locale,
        `Các giao dịch gần đây nhất: ${describeTransactions(recent, locale, 5)}.`,
        `Your most recent transactions are: ${describeTransactions(recent, locale, 5)}.`
      ),
      text(
        locale,
        "Sắp xếp giao dịch theo ngày giảm dần và lấy các dòng mới nhất.",
        "Sort transactions by date descending and select the newest rows."
      )
    )
  }

  if (
    normalized.includes("lon nhat") ||
    normalized.includes("nhieu nhat") ||
    normalized.includes("top") ||
    normalized.includes("largest") ||
    normalized.includes("most")
  ) {
    return response(
      text(
        locale,
        `Danh mục chi tiêu lớn nhất là ${topCategory?.category ?? "N/A"} với ${formatCurrency(topCategory?.amount ?? 0, locale)}. Giao dịch chi lớn nhất: ${describeTransactions(largestExpenses, locale, 5)}.`,
        `Your largest spending category is ${topCategory?.category ?? "N/A"} at ${formatCurrency(topCategory?.amount ?? 0, locale)}. Largest expense transactions: ${describeTransactions(largestExpenses, locale, 5)}.`
      ),
      text(
        locale,
        "Xếp hạng danh mục và giao dịch chi tiêu theo số tiền tuyệt đối.",
        "Rank categories and expense transactions by absolute amount."
      )
    )
  }

  if (
    normalized.includes("cashflow") ||
    normalized.includes("net") ||
    normalized.includes("thu nhap") ||
    normalized.includes("income") ||
    normalized.includes("tong quan") ||
    normalized.includes("overview")
  ) {
    return response(
      text(
        locale,
        `Tổng quan hiện tại: thu nhập ${formatCurrency(summary.income, locale)}, chi tiêu ${formatCurrency(summary.spend, locale)}, net ${formatCurrency(summary.net, locale)}. Có ${summary.reviewCount} giao dịch cần review.`,
        `Current overview: income ${formatCurrency(summary.income, locale)}, spend ${formatCurrency(summary.spend, locale)}, net ${formatCurrency(summary.net, locale)}. ${summary.reviewCount} transactions need review.`
      ),
      text(
        locale,
        "Tính income, spend, net và review count từ summary local.",
        "Compute income, spend, net, and review count from the local summary."
      )
    )
  }

  return response(
    text(
      locale,
      `Mình thấy tổng chi tiêu là ${formatCurrency(summary.spend, locale)}. Danh mục lớn nhất là ${topCategory?.category ?? "N/A"} với ${formatCurrency(topCategory?.amount ?? 0, locale)}. Có ${summary.reviewCount} giao dịch cần review để insight chính xác hơn.`,
      `I see total spending of ${formatCurrency(summary.spend, locale)}. Your largest category is ${topCategory?.category ?? "N/A"} at ${formatCurrency(topCategory?.amount ?? 0, locale)}. ${summary.reviewCount} transactions need review for more accurate insights.`
    ),
    text(
      locale,
      "Không match intent chuyên biệt nên trả về tóm tắt tài chính an toàn.",
      "No specialized intent matched, so return a safe financial summary."
    )
  )
}

export function MoneySection({ section }: { section: string }) {
  switch (section) {
    case "overview":
      return <Overview />
    case "import":
      return <ImportStatement />
    case "transactions":
      return <Transactions />
    case "review":
      return <ReviewQueue />
    case "imports":
      return <ImportHistory />
    case "spending":
      return <Spending />
    case "budgets":
      return <Budgets />
    case "recurring":
      return <Recurring />
    case "coach":
      return <Coach />
    case "settings":
      return <Settings />
    default:
      return null
  }
}

function Content({
  title,
  description,
  children,
  action,
}: {
  title: string
  description: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function Overview() {
  const { state, locale } = useMoneyCoach()
  const summary = summarize(state.transactions)
  const spendingConfig = {
    amount: {
      label: text(locale, "Chi tiêu", "Spending"),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig
  const cashflowConfig = {
    income: {
      label: text(locale, "Thu nhập", "Income"),
      color: "var(--chart-2)",
    },
    spending: {
      label: text(locale, "Chi tiêu", "Spending"),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig
  const cashflow = [
    { month: "Mar", income: 25500000, spending: 12350000 },
    { month: "Apr", income: 27000000, spending: 14980000 },
    { month: "May", income: summary.income, spending: summary.spend },
  ]
  const pending = state.transactions
    .filter((transaction) => transaction.status === "NEEDS_REVIEW")
    .slice(0, 3)

  return (
    <Content
      title={text(locale, "Tổng quan tài chính", "Financial overview")}
      description={text(
        locale,
        "Nhìn nhanh dòng tiền tháng này và những giao dịch cần bạn xác nhận.",
        "See this month's cash flow and transactions that need your confirmation."
      )}
      action={
        <Button asChild>
          <Link href="/app/import">
            <UploadIcon data-icon="inline-start" />
            {text(locale, "Nhập sao kê mới", "Import statement")}
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* CỘT TRÁI + GIỮA (Main Content) */}
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={text(locale, "Thu nhập", "Income")}
              value={formatCurrency(summary.income, locale)}
              hint={text(locale, "Lương và hoàn tiền", "Salary and refunds")}
              positive
            />
            <StatCard
              label={text(locale, "Chi tiêu", "Spending")}
              value={formatCurrency(summary.spend, locale)}
              hint={text(locale, "Tổng khoản ra", "Total outflow")}
            />
            <StatCard
              label={text(locale, "Còn có thể chi", "Available to spend")}
              value={formatCurrency(summary.net, locale)}
              hint={text(
                locale,
                "Thu nhập trừ chi tiêu",
                "Income minus spending"
              )}
              positive
            />
            <StatCard
              label={text(locale, "Cần xác nhận", "Needs review")}
              value={`${summary.reviewCount}`}
              hint={text(
                locale,
                "Phân loại AI chưa chắc chắn",
                "Uncertain AI classifications"
              )}
              warning={summary.reviewCount > 0}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>{text(locale, "Dòng tiền", "Cash flow")}</CardTitle>
                <CardDescription>
                  {text(locale, "Ba tháng gần nhất", "Last three months")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={cashflowConfig}
                  className="h-[260px] w-full"
                >
                  <AreaChart data={cashflow}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="var(--color-income)"
                      fill="var(--color-income)"
                      fillOpacity={0.16}
                    />
                    <Area
                      type="monotone"
                      dataKey="spending"
                      stroke="var(--color-spending)"
                      fill="var(--color-spending)"
                      fillOpacity={0.12}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {text(locale, "Chi tiêu theo nhóm", "Spend by category")}
                </CardTitle>
                <CardDescription>
                  {text(
                    locale,
                    "Các khoản lớn nhất tháng này",
                    "Largest categories this month"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={spendingConfig}
                  className="h-[260px] w-full"
                >
                  <BarChart
                    data={summary.byCategory.slice(0, 5)}
                    layout="vertical"
                  >
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="category"
                      axisLine={false}
                      tickLine={false}
                      width={84}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="amount"
                      fill="var(--color-amount)"
                      radius={6}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {text(locale, "Ưu tiên xem lại", "Review first")}
              </CardTitle>
              <CardDescription>
                {text(
                  locale,
                  "Sửa các phân loại mơ hồ để insight chính xác hơn.",
                  "Correct unclear classifications to improve your insights."
                )}
              </CardDescription>
              <CardAction>
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/review">
                    {text(locale, "Mở hàng chờ", "Open queue")}
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {pending.length ? (
                <TransactionTable transactions={pending} compact />
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CircleCheckIcon />
                    </EmptyMedia>
                    <EmptyTitle>
                      {text(locale, "Đã duyệt hết", "All reviewed")}
                    </EmptyTitle>
                    <EmptyDescription>
                      {text(
                        locale,
                        "Không còn giao dịch cần xác nhận.",
                        "No transactions await review."
                      )}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
        {/* CỘT PHẢI (AI Coach) */}
        <div className="hidden flex-col gap-6 xl:flex">
          <CoachWidget />
        </div>
      </div>
    </Content>
  )
}

function StatCard({
  label,
  value,
  hint,
  positive,
  warning,
}: {
  label: string
  value: string
  hint: string
  positive?: boolean
  warning?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle title={value} className="text-2xl font-semibold tabular-nums truncate">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
        {warning ? (
          <AlertTriangleIcon className="text-destructive" />
        ) : positive ? (
          <TrendingUpIcon className="text-primary" />
        ) : (
          <TrendingDownIcon />
        )}
        {hint}
      </CardContent>
    </Card>
  )
}

function ImportStatement() {
  const router = useRouter()
  const { addImport, locale } = useMoneyCoach()
  const [progress, setProgress] = React.useState(0)
  const [stage, setStage] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [processing, setProcessing] = React.useState(false)

  function validationMessage(code: string) {
    switch (code) {
      case "INVALID_FILE_TYPE":
        return text(
          locale,
          "Chỉ chấp nhận file CSV có đuôi .csv.",
          "Only CSV files with a .csv extension are accepted."
        )
      case "INVALID_FILENAME":
        return text(
          locale,
          "Tên file không hợp lệ. Hãy đổi tên file CSV rồi tải lại.",
          "Filename is invalid. Rename the CSV file and upload it again."
        )
      case "FILE_TOO_LARGE":
        return text(
          locale,
          "File CSV phải nhỏ hơn 2 MB.",
          "CSV file must be smaller than 2 MB."
        )
      case "EMPTY_FILE":
      case "EMPTY_CSV":
      case "NO_VALID_ROWS":
        return text(
          locale,
          "File CSV không có giao dịch hợp lệ.",
          "CSV file has no valid transaction rows."
        )
      case "INVALID_ENCODING":
        return text(
          locale,
          "File CSV phải dùng mã hóa UTF-8.",
          "CSV file must use UTF-8 encoding."
        )
      case "MALFORMED_CSV":
        return text(
          locale,
          "CSV bị lỗi cú pháp, thường do dấu ngoặc kép hoặc dấu phẩy không đúng.",
          "CSV syntax is malformed, usually because quotes or commas are not escaped correctly."
        )
      case "EMPTY_HEADER":
        return text(
          locale,
          "Dòng header của CSV đang rỗng.",
          "CSV header row is empty."
        )
      case "DUPLICATE_COLUMNS":
        return text(
          locale,
          "CSV có tên cột bị trùng. Hãy giữ mỗi cột một lần.",
          "CSV has duplicate column names. Keep each column only once."
        )
      case "INVALID_COLUMNS":
        return text(
          locale,
          "CSV phải có ba cột: date, description, amount.",
          "CSV must include date, description, and amount columns."
        )
      case "INVALID_ROW":
        return text(
          locale,
          "Mỗi dòng phải có ngày dạng YYYY-MM-DD, mô tả không rỗng và số tiền hợp lệ.",
          "Each row must have a YYYY-MM-DD date, non-empty description, and numeric amount."
        )
      case "TOO_MANY_ROWS":
        return text(
          locale,
          "CSV demo chỉ xử lý tối đa 5.000 dòng mỗi lần.",
          "Demo CSV import supports up to 5,000 rows at a time."
        )
      default:
        return text(
          locale,
          "Không thể xử lý file này.",
          "This file could not be processed."
        )
    }
  }

  function validateCsvFile(file: File) {
    if (
      !file.name.toLowerCase().endsWith(".csv") ||
      !csvMimeTypes.has(file.type)
    ) {
      return "INVALID_FILE_TYPE"
    }
    if (file.size > maxCsvBytes) {
      return "FILE_TOO_LARGE"
    }
    if (file.size === 0) {
      return "EMPTY_FILE"
    }
    return null
  }

  function validateCsvContent(content: string) {
    const rows = content
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((row) => row.trim().length > 0)
    if (rows.length === 0) return "EMPTY_CSV"
    if (rows.length - 1 > maxCsvRows) return "TOO_MANY_ROWS"

    const headerRow = rows[0]
    if (!headerRow) return "EMPTY_HEADER"
    const header = headerRow
      .split(",")
      .map((column) => column.trim().toLowerCase())
      .filter(Boolean)
    if (header.length === 0) return "EMPTY_HEADER"
    if (new Set(header).size !== header.length) return "DUPLICATE_COLUMNS"
    if (
      !header.includes("date") ||
      !header.includes("description") ||
      !header.includes("amount")
    ) {
      return "INVALID_COLUMNS"
    }
    return null
  }

  async function process(filename: string, content: string) {
    setProcessing(true)
    setError(null)
    setResult(null)
    const stages = [
      [18, text(locale, "Đang tải file", "Uploading file")],
      [38, text(locale, "Đang kiểm tra định dạng", "Validating format")],
      [
        68,
        text(locale, "Đang phân loại giao dịch", "Classifying transactions"),
      ],
      [88, text(locale, "Đang lưu kết quả", "Saving results")],
    ] as const
    try {
      const contentValidationCode = validateCsvContent(content)
      if (contentValidationCode) {
        throw new Error(contentValidationCode)
      }
      for (const [value, label] of stages) {
        setProgress(value)
        setStage(label)
        await new Promise((resolve) => window.setTimeout(resolve, 260))
      }
      const rowCount = await addImport(filename, content)
      setProgress(100)
      setStage(text(locale, "Hoàn tất", "Complete"))
      setResult(rowCount)
    } catch (caught) {
      setError(
        validationMessage(
          caught instanceof Error ? caught.message : "UPLOAD_FAILED"
        )
      )
      setProgress(0)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Content
      title={text(locale, "Nhập sao kê", "Import statement")}
      description={text(
        locale,
        "Tải CSV ngân hàng; dữ liệu demo được phân loại tại trình duyệt.",
        "Upload a bank CSV; demo data is classified in your browser."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>{text(locale, "Tải file CSV", "Upload CSV")}</CardTitle>
            <CardDescription>date, description, amount</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FieldGroup>
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="statement">
                  {text(locale, "Sao kê ngân hàng", "Bank statement")}
                </FieldLabel>
                <Input
                  id="statement"
                  type="file"
                  accept=".csv,text/csv"
                  aria-invalid={!!error}
                  disabled={processing}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      const validationCode = validateCsvFile(file)
                      if (validationCode) {
                        setError(validationMessage(validationCode))
                        setResult(null)
                        setStage(null)
                        setProgress(0)
                        event.target.value = ""
                        return
                      }
                      void file
                        .text()
                        .then((content) => process(file.name, content))
                    }
                  }}
                />
                <FieldDescription>
                  {text(
                    locale,
                    "Chỉ dùng CSV UTF-8 dưới 2 MB, tối đa 5.000 dòng; cần cột date, description, amount.",
                    "CSV only, UTF-8, under 2 MB, up to 5,000 rows; requires date, description, and amount columns."
                  )}
                </FieldDescription>
              </Field>
            </FieldGroup>
            {error ? (
              <Alert variant="destructive">
                <AlertTriangleIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {stage ? (
              <div className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex justify-between text-sm">
                  <span>{stage}</span>
                  <span className="font-mono tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            ) : null}
            {result !== null ? (
              <Alert>
                <CircleCheckIcon />
                <AlertTitle>
                  {text(locale, "Phân loại xong", "Classification complete")}
                </AlertTitle>
                <AlertDescription>
                  {text(
                    locale,
                    `${result} giao dịch đã được thêm vào dashboard.`,
                    `${result} transactions were added to your dashboard.`
                  )}
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <Button
              variant="outline"
              disabled={processing}
              onClick={() =>
                void process("sample_statement_may_2026.csv", sampleStatement)
              }
            >
              <FileSpreadsheetIcon data-icon="inline-start" />
              {text(locale, "Dùng CSV mẫu", "Use sample CSV")}
            </Button>
            {result !== null ? (
              <Button onClick={() => router.push("/app/review")}>
                {text(locale, "Xem mục cần duyệt", "Review uncertain items")}
              </Button>
            ) : null}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {text(locale, "Pipeline phân loại", "Classification pipeline")}
            </CardTitle>
            <CardDescription>
              {text(locale, "Luồng backend dự kiến", "Planned backend flow")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[
              ["1", "CSV -> S3", "Private statement storage"],
              ["2", "Rule matching", "Known merchants, no AI call"],
              ["3", "Bedrock", "Unclear descriptions only"],
              ["4", "Review queue", "Confidence below threshold"],
            ].map(([step, title, detail]) => (
              <div key={step} className="flex gap-3">
                <Badge variant="secondary">{step}</Badge>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Content>
  )
}

function statusBadge(transaction: Transaction, locale: "vi" | "en") {
  if (transaction.status === "NEEDS_REVIEW") {
    return (
      <Badge variant="destructive">
        {text(locale, "Cần duyệt", "Needs review")}
      </Badge>
    )
  }
  if (transaction.status === "MANUAL_APPROVED") {
    return (
      <Badge variant="outline">
        <CheckIcon data-icon="inline-start" />
        {text(locale, "Đã sửa", "Corrected")}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">{text(locale, "Tự duyệt", "Approved")}</Badge>
  )
}

function TransactionTable({
  transactions,
  onSelect,
  compact = false,
}: {
  transactions: Transaction[]
  onSelect?: (transaction: Transaction) => void
  compact?: boolean
}) {
  const { locale } = useMoneyCoach()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{text(locale, "Mô tả", "Description")}</TableHead>
          {!compact ? (
            <TableHead>{text(locale, "Danh mục", "Category")}</TableHead>
          ) : null}
          <TableHead>{text(locale, "Trạng thái", "Status")}</TableHead>
          <TableHead className="text-right">
            {text(locale, "Số tiền", "Amount")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow
            key={transaction.id}
            onClick={() => onSelect?.(transaction)}
            className={onSelect ? "cursor-pointer" : undefined}
          >
            <TableCell>
              <p className="font-medium">{transaction.merchant}</p>
              <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                {transaction.description}
              </p>
            </TableCell>
            {!compact ? <TableCell>{transaction.category}</TableCell> : null}
            <TableCell>{statusBadge(transaction, locale)}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {formatCurrency(transaction.amount, locale)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function Transactions() {
  const { state, locale, reviewTransaction, toggleRecurring } = useMoneyCoach()
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [selected, setSelected] = React.useState<Transaction | null>(null)

  const filtered = state.transactions.filter((transaction) => {
    const matchesText = `${transaction.merchant} ${transaction.description}`
      .toLowerCase()
      .includes(query.toLowerCase())
    return (
      matchesText && (category === "all" || transaction.category === category)
    )
  })

  return (
    <Content
      title={text(locale, "Giao dịch", "Transactions")}
      description={text(
        locale,
        "Tìm kiếm, lọc và mở từng giao dịch để xem cách phân loại.",
        "Search, filter, and inspect how each transaction was classified."
      )}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute top-2.5 left-2.5 text-muted-foreground" />
              <Input
                className="pl-8"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={text(
                  locale,
                  "Tìm merchant hoặc mô tả",
                  "Search merchant or description"
                )}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">
                    {text(locale, "Tất cả danh mục", "All categories")}
                  </SelectItem>
                  {categories.map((item) => (
                    <SelectItem value={item} key={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length ? (
            <TransactionTable transactions={filtered} onSelect={setSelected} />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  {text(locale, "Không tìm thấy", "Nothing found")}
                </EmptyTitle>
                <EmptyDescription>
                  {text(locale, "Hãy thử bộ lọc khác.", "Try another filter.")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
      <TransactionDetail
        key={selected?.id ?? "no-transaction"}
        transaction={selected}
        onClose={() => setSelected(null)}
        onReview={reviewTransaction}
        onToggleRecurring={toggleRecurring}
      />
    </Content>
  )
}

function TransactionDetail({
  transaction,
  onClose,
  onReview,
  onToggleRecurring,
}: {
  transaction: Transaction | null
  onClose: () => void
  onReview: (id: string, category: Category) => void
  onToggleRecurring: (id: string) => void
}) {
  const { locale } = useMoneyCoach()
  const [category, setCategory] = React.useState<Category>(
    transaction?.category ?? "Other"
  )

  return (
    <Sheet open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {transaction ? (
          <>
            <SheetHeader>
              <SheetTitle>{transaction.merchant}</SheetTitle>
              <SheetDescription>{transaction.description}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailItem
                  label={text(locale, "Số tiền", "Amount")}
                  value={formatCurrency(transaction.amount, locale)}
                />
                <DetailItem
                  label={text(locale, "Ngày", "Date")}
                  value={transaction.date}
                />
                <DetailItem
                  label="Confidence"
                  value={`${Math.round(transaction.confidence * 100)}%`}
                />
                <DetailItem
                  label={text(locale, "Nguồn", "Method")}
                  value={transaction.classifiedBy}
                />
              </div>
              <Field>
                <FieldLabel>{text(locale, "Danh mục", "Category")}</FieldLabel>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value as Category)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categories.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="recurring-detail">
                  {text(locale, "Thanh toán định kỳ", "Recurring payment")}
                </FieldLabel>
                <Switch
                  id="recurring-detail"
                  checked={transaction.recurring}
                  onCheckedChange={() => onToggleRecurring(transaction.id)}
                />
              </Field>
              <Button
                onClick={() => {
                  onReview(transaction.id, category)
                  onClose()
                }}
              >
                {text(locale, "Lưu phân loại", "Save category")}
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium tabular-nums">{value}</p>
    </div>
  )
}

function ReviewQueue() {
  const { state, locale, reviewTransaction } = useMoneyCoach()
  const pending = state.transactions.filter(
    (transaction) => transaction.status === "NEEDS_REVIEW"
  )
  const [drafts, setDrafts] = React.useState<Record<string, Category>>({})
  const [remember, setRemember] = React.useState<Record<string, boolean>>({})

  return (
    <Content
      title={text(locale, "Hàng chờ xác nhận", "Review queue")}
      description={text(
        locale,
        "AI chuyển các mô tả mơ hồ cho bạn quyết định trước khi tính insight.",
        "AI sends unclear descriptions to you before they shape insights."
      )}
      action={
        <Badge variant={pending.length ? "destructive" : "secondary"}>
          {pending.length} {text(locale, "còn lại", "remaining")}
        </Badge>
      }
    >
      {pending.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {pending.map((transaction) => {
            const draft = drafts[transaction.id] ?? transaction.category
            return (
              <Card key={transaction.id}>
                <CardHeader className="border-b">
                  <CardTitle>{transaction.merchant}</CardTitle>
                  <CardDescription>{transaction.description}</CardDescription>
                  <CardAction>
                    <p className="font-mono font-semibold tabular-nums">
                      {formatCurrency(transaction.amount, locale)}
                    </p>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Alert>
                    <SparklesIcon />
                    <AlertDescription>
                      AI: <strong>{transaction.category}</strong> · Confidence{" "}
                      <strong>
                        {Math.round(transaction.confidence * 100)}%
                      </strong>
                    </AlertDescription>
                  </Alert>
                  <Field>
                    <FieldLabel>
                      {text(locale, "Danh mục đúng", "Correct category")}
                    </FieldLabel>
                    <Select
                      value={draft}
                      onValueChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [transaction.id]: value as Category,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {categories.map((item) => (
                            <SelectItem value={item} key={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor={`remember-${transaction.id}`}>
                      {text(
                        locale,
                        "Ghi nhớ merchant cho lần sau",
                        "Remember this merchant"
                      )}
                    </FieldLabel>
                    <Switch
                      id={`remember-${transaction.id}`}
                      checked={remember[transaction.id] ?? false}
                      onCheckedChange={(checked) =>
                        setRemember((current) => ({
                          ...current,
                          [transaction.id]: checked,
                        }))
                      }
                    />
                  </Field>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    onClick={() =>
                      reviewTransaction(
                        transaction.id,
                        draft,
                        remember[transaction.id]
                      )
                    }
                  >
                    <ShieldCheckIcon data-icon="inline-start" />
                    {text(locale, "Xác nhận", "Approve")}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CircleCheckIcon />
              </EmptyMedia>
              <EmptyTitle>
                {text(
                  locale,
                  "Không còn mục cần duyệt",
                  "Nothing left to review"
                )}
              </EmptyTitle>
              <EmptyDescription>
                {text(
                  locale,
                  "Insight hiện phản ánh mọi giao dịch đã được xác nhận.",
                  "Insights now reflect all reviewed transactions."
                )}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/app/overview">
                  {text(locale, "Về tổng quan", "Return to overview")}
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </Card>
      )}
    </Content>
  )
}

function ImportHistory() {
  const { state, locale } = useMoneyCoach()
  return (
    <Content
      title={text(locale, "Lịch sử nhập", "Import history")}
      description={text(
        locale,
        "Bằng chứng dữ liệu được giữ lại sau mỗi lần xử lý sao kê.",
        "Proof that each processed statement remains available."
      )}
      action={
        <Button asChild>
          <Link href="/app/import">
            <UploadIcon data-icon="inline-start" />
            {text(locale, "Nhập mới", "New import")}
          </Link>
        </Button>
      }
    >
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{text(locale, "File", "File")}</TableHead>
                <TableHead>{text(locale, "Thời điểm", "Imported")}</TableHead>
                <TableHead>{text(locale, "Dòng", "Rows")}</TableHead>
                <TableHead>Rules / AI</TableHead>
                <TableHead>{text(locale, "Cần duyệt", "Review")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.imports.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.filename}</TableCell>
                  <TableCell>
                    {new Intl.DateTimeFormat(
                      locale === "vi" ? "vi-VN" : "en-US",
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }
                    ).format(new Date(item.importedAt))}
                  </TableCell>
                  <TableCell className="font-mono">{item.rows}</TableCell>
                  <TableCell className="font-mono">
                    {item.ruleMatches} / {item.aiCalls}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.reviewsNeeded ? "outline" : "secondary"}
                    >
                      {item.reviewsNeeded}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Content>
  )
}

function Spending() {
  const { state, locale } = useMoneyCoach()
  const summary = summarize(state.transactions)
  const config = {
    amount: {
      label: text(locale, "Chi tiêu", "Spending"),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig
  return (
    <Content
      title={text(locale, "Phân tích chi tiêu", "Spending analysis")}
      description={text(
        locale,
        "Theo dõi category và merchant tạo ra phần lớn chi tiêu.",
        "Track the categories and merchants driving your spending."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              {text(locale, "Danh mục chi tiêu", "Category breakdown")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={config} className="h-[340px] w-full">
              <BarChart data={summary.byCategory}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="category" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={7} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{text(locale, "Top drivers", "Top drivers")}</CardTitle>
            <CardDescription>
              {text(
                locale,
                "Từ giao dịch đã phân loại",
                "From classified transactions"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {summary.byCategory.slice(0, 6).map((category, index) => (
              <div key={category.category} className="flex items-center gap-3">
                <Badge variant="secondary">{index + 1}</Badge>
                <span className="flex-1">{category.category}</span>
                <span className="font-mono text-sm tabular-nums">
                  {formatCurrency(category.amount, locale)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Content>
  )
}

function Budgets() {
  const { state, locale, updateBudget } = useMoneyCoach()
  const summary = summarize(state.transactions)
  const spent = new Map(
    summary.byCategory.map((entry) => [entry.category, entry.amount])
  )
  const [draft, setDraft] = React.useState<Record<string, string>>({})

  return (
    <Content
      title={text(locale, "Ngân sách", "Budgets")}
      description={text(
        locale,
        "Đặt giới hạn và phát hiện danh mục vượt kế hoạch.",
        "Set category limits and identify overspending."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {state.budgets.map((budget) => {
          const actual = spent.get(budget.category) ?? 0
          const percentage = Math.min((actual / budget.limit) * 100, 100)
          const exceeded = actual > budget.limit
          return (
            <Card key={budget.category}>
              <CardHeader>
                <CardTitle>{budget.category}</CardTitle>
                <CardAction>
                  <Badge variant={exceeded ? "destructive" : "secondary"}>
                    {exceeded
                      ? text(locale, "Vượt ngân sách", "Over budget")
                      : text(locale, "Đúng kế hoạch", "On track")}
                  </Badge>
                </CardAction>
                <CardDescription>
                  {formatCurrency(actual, locale)} /{" "}
                  {formatCurrency(budget.limit, locale)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Progress value={percentage} />
                <Field orientation="horizontal">
                  <Input
                    type="number"
                    min={0}
                    aria-label={text(locale, "Giới hạn mới", "New limit")}
                    value={draft[budget.category] ?? String(budget.limit)}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [budget.category]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateBudget(
                        budget.category,
                        Number(draft[budget.category] ?? budget.limit)
                      )
                    }
                  >
                    {text(locale, "Lưu", "Save")}
                  </Button>
                </Field>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Content>
  )
}

function Recurring() {
  const { state, locale, toggleRecurring } = useMoneyCoach()
  const recurring = state.transactions.filter(
    (transaction) => transaction.recurring
  )
  const total = recurring.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0
  )

  return (
    <Content
      title={text(locale, "Thanh toán định kỳ", "Recurring payments")}
      description={text(
        locale,
        "Theo dõi subscription và dịch vụ xuất hiện đều đặn hàng tháng.",
        "Track subscriptions and services expected each month."
      )}
    >
      <StatCard
        label={text(
          locale,
          "Tổng định kỳ hàng tháng",
          "Monthly recurring total"
        )}
        value={formatCurrency(total, locale)}
        hint={`${recurring.length} ${text(locale, "dịch vụ được phát hiện", "detected services")}`}
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{text(locale, "Dịch vụ", "Service")}</TableHead>
                <TableHead>{text(locale, "Danh mục", "Category")}</TableHead>
                <TableHead>{text(locale, "Số tiền", "Amount")}</TableHead>
                <TableHead>{text(locale, "Theo dõi", "Track")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurring.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.merchant}
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {formatCurrency(Math.abs(transaction.amount), locale)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={transaction.recurring}
                      aria-label={text(
                        locale,
                        "Theo dõi định kỳ",
                        "Track recurring"
                      )}
                      onCheckedChange={() => toggleRecurring(transaction.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Content>
  )
}

function CoachWidget() {
  const { state, locale } = useMoneyCoach()
  const prompts: [string, string, string] = [
    text(locale, "Tôi chi nhiều nhất vào đâu?", "Where did I spend the most?"),
    text(
      locale,
      "Subscription hàng tháng là bao nhiêu?",
      "What are my monthly subscriptions?"
    ),
    text(
      locale,
      "Giao dịch nào cần kiểm tra?",
      "Which transactions need review?"
    ),
  ]
  const [question, setQuestion] = React.useState(prompts[0])
  const answer = buildCoachAnswer(question, state.transactions, locale)

  return (
    <Card className="flex flex-1 flex-col border-primary/20 bg-background/80 shadow-lg backdrop-blur-md">
      <CardHeader className="border-b border-border/50 pb-3">
        <Badge
          variant="secondary"
          className="mb-2 w-fit bg-primary/10 text-primary hover:bg-primary/20"
        >
          <BotIcon data-icon="inline-start" className="mr-1 h-3 w-3" />
          AI Coach
        </Badge>
        <CardTitle className="text-lg leading-tight">{question}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <p className="text-sm leading-relaxed">{answer}</p>

        <div className="mt-auto space-y-2">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {text(locale, "Gợi ý hỏi AI", "Ask AI")}
          </p>
          <div className="flex flex-col gap-1.5">
            {prompts.map((prompt) => (
              <Button
                key={prompt}
                variant={question === prompt ? "secondary" : "ghost"}
                size="sm"
                className="h-auto justify-start py-1.5 text-left text-xs whitespace-normal"
                onClick={() => setQuestion(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Coach() {
  const { state, locale, askCoach } = useMoneyCoach()
  const prompts: [string, string, string] = [
    text(locale, "Tôi chi nhiều nhất vào đâu?", "Where did I spend the most?"),
    text(
      locale,
      "Subscription hàng tháng là bao nhiêu?",
      "What are my monthly subscriptions?"
    ),
    text(
      locale,
      "Giao dịch nào cần kiểm tra?",
      "Which transactions need review?"
    ),
  ]
  const [messages, setMessages] = React.useState<CoachMessage[]>(() => [
    {
      id: "assistant-intro",
      role: "assistant",
      content: text(
        locale,
        "Mình có thể phân tích chi tiêu, khoản định kỳ và giao dịch cần review dựa trên dữ liệu đã import.",
        "I can analyze spending, recurring payments, and transactions that need review based on imported data."
      ),
      createdAt: "",
    },
  ])
  const [draft, setDraft] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const messageCounter = React.useRef(0)

  async function sendQuestion(question: string) {
    const trimmed = question.trim()
    if (!trimmed || isThinking) return

    messageCounter.current += 1
    const messageId = messageCounter.current
    const userMessage: CoachMessage = {
      id: `user-${messageId}`,
      role: "user",
      content: trimmed,
      createdAt: "",
    }

    setMessages((current) => [...current, userMessage])
    setDraft("")
    setIsThinking(true)

    try {
      const answer = await askCoach(trimmed)
      const assistantMessage: CoachMessage = {
        id: `assistant-${messageId}`,
        role: "assistant",
        content: answer,
        createdAt: "",
      }
      setMessages((current) => [...current, assistantMessage])
    } catch (err) {
      const errorMessage: CoachMessage = {
        id: `assistant-error-${messageId}`,
        role: "assistant",
        content: locale === "vi" 
          ? "Xin lỗi, tôi gặp sự cố khi kết nối tới máy chủ AI Coach." 
          : "Sorry, I encountered an issue connecting to the AI Coach server.",
        createdAt: "",
      }
      setMessages((current) => [...current, errorMessage])
    } finally {
      setIsThinking(false)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    sendQuestion(draft)
  }

  return (
    <Content
      title={text(locale, "Trợ lý tài chính", "Money coach")}
      description={text(
        locale,
        "Insight tài chính của bạn được phân tích bảo mật bằng trí tuệ nhân tạo.",
        "Your financial insights analyzed securely by artificial intelligence."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              {text(locale, "Gợi ý câu hỏi", "Suggested questions")}
            </CardTitle>
            <CardDescription>
              {text(
                locale,
                "Bấm một gợi ý hoặc tự nhập câu hỏi ở khung chat.",
                "Pick a suggestion or type your own question in the chat."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {prompts.map((prompt) => (
              <Button
                key={prompt}
                variant="ghost"
                className="justify-start text-left whitespace-normal"
                onClick={() => sendQuestion(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </CardContent>
        </Card>
        <Card className="min-h-[560px]">
          <CardHeader>
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              <BotIcon data-icon="inline-start" className="mr-1 h-3 w-3" />
              AI Money Coach
            </Badge>
            <CardTitle>
              {text(locale, "Hỏi Money Coach", "Ask Money Coach")}
            </CardTitle>
            <CardDescription>
              {text(
                locale,
                "Câu trả lời được phân tích trực tiếp bởi AI Bedrock dựa trên dữ liệu chi tiêu thực tế của bạn.",
                "Answers are analyzed in real-time by AI Bedrock grounded in your actual spending data."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[420px] flex-col gap-4">
            <ScrollArea className="h-[420px] rounded-lg border bg-muted/20">
              <div className="flex flex-col gap-3 p-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "border bg-background"
                      }`}
                    >
                      <p>{message.content}</p>
                      {message.role === "assistant" && message.steps?.length ? (
                        <div className="mt-3 flex flex-col gap-2 border-t pt-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {text(locale, "Cách xử lý", "Processing trace")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {text(
                                locale,
                                "Trace thao tác, không phải chain-of-thought nội bộ.",
                                "Action trace, not hidden chain-of-thought."
                              )}
                            </span>
                          </div>
                          <ol className="list-decimal ps-5 text-xs leading-5 text-muted-foreground">
                            {message.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      ) : null}
                      {message.role === "assistant" &&
                      message.sources?.length ? (
                        <div className="mt-3 flex flex-col gap-2 border-t pt-3">
                          <Badge variant="outline" className="w-fit">
                            {text(locale, "Nguồn đã đọc", "Sources read")}
                          </Badge>
                          <div className="flex flex-col gap-1.5">
                            {message.sources.map((source) => (
                              <div
                                key={`${message.id}-${source.label}`}
                                className="rounded-md border bg-muted/30 px-2 py-1.5"
                              >
                                <p className="text-xs font-medium">
                                  {source.label}
                                </p>
                                <p className="text-xs leading-5 text-muted-foreground">
                                  {source.detail}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                {isThinking ? (
                  <div className="flex justify-start">
                    <div className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
                      {text(
                        locale,
                        "Đang đọc summary, giao dịch local và nguồn W4...",
                        "Reading summary, local transactions, and W4 sources..."
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </ScrollArea>
            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault()
                        sendQuestion(draft)
                      }
                    }}
                    placeholder={text(
                      locale,
                      "Hỏi về chi tiêu, subscription, cashflow hoặc giao dịch cần review...",
                      "Ask about spending, subscriptions, cashflow, or transactions that need review..."
                    )}
                    className="min-h-20 resize-none"
                  />
                  <FieldDescription>
                    {text(
                      locale,
                      "Nhấn Enter để gửi, Shift+Enter để xuống dòng.",
                      "Press Enter to send, Shift+Enter for a new line."
                    )}
                  </FieldDescription>
                </Field>
              </FieldGroup>
              <div className="flex justify-end">
                <Button type="submit" disabled={!draft.trim() || isThinking}>
                  {text(locale, "Gửi", "Send")}
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </div>
            </form>
            <Alert>
              <SparklesIcon />
              <AlertDescription>
                {text(
                  locale,
                  "Nguồn: Trợ lý tài chính được vận hành trực tiếp bởi Bedrock qua AWS API Gateway và PostgreSQL thực tế.",
                  "Source: Personal finance assistant powered directly by Bedrock via AWS API Gateway and PostgreSQL."
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </Content>
  )
}

function Settings() {
  const { state, locale, setLocale, resetData } = useMoneyCoach()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Content
      title={text(locale, "Cài đặt & quyền riêng tư", "Settings & privacy")}
      description={text(
        locale,
        "Quản lý trải nghiệm demo và các rule bạn đã tạo khi duyệt.",
        "Manage the demo experience and rules created during review."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{text(locale, "Giao diện", "Preferences")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field>
              <FieldLabel>{text(locale, "Ngôn ngữ", "Language")}</FieldLabel>
              <Tabs
                value={locale}
                onValueChange={(value) => setLocale(value as "vi" | "en")}
              >
                <TabsList>
                  <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
              </Tabs>
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="dark-mode">
                {text(locale, "Chế độ tối", "Dark mode")}
              </FieldLabel>
              <Switch
                id="dark-mode"
                checked={resolvedTheme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </Field>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {text(locale, "Dữ liệu & tin cậy", "Data & trust")}
            </CardTitle>
            <CardDescription>
              {text(
                locale,
                "Prototype chỉ lưu trong browser.",
                "This prototype stores data in your browser only."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              {text(
                locale,
                "Không kết nối tài khoản ngân hàng thật.",
                "No real bank account is connected."
              )}
            </p>
            <p>
              {text(
                locale,
                "Không có giao dịch tiền hoặc lời khuyên đầu tư.",
                "No money movement or investment advice."
              )}
            </p>
            <p>
              {text(
                locale,
                "Supabase Auth và AWS backend là phase tiếp theo.",
                "Supabase Auth and AWS backend are the next phase."
              )}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={resetData}>
              {text(locale, "Đặt lại dữ liệu demo", "Reset demo data")}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {text(locale, "Rule đã ghi nhớ", "Remembered rules")}
          </CardTitle>
          <CardDescription>
            {text(
              locale,
              "Tạo từ thao tác duyệt giao dịch.",
              "Created while reviewing transactions."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.rules.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {text(locale, "Chứa merchant", "Contains merchant")}
                  </TableHead>
                  <TableHead>{text(locale, "Danh mục", "Category")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.contains}</TableCell>
                    <TableCell>{rule.category}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderClockIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {text(locale, "Chưa có rule", "No rules yet")}
                </EmptyTitle>
                <EmptyDescription>
                  {text(
                    locale,
                    "Bật ghi nhớ khi duyệt một giao dịch để tạo rule.",
                    "Enable remember while reviewing a transaction to create a rule."
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </Content>
  )
}
