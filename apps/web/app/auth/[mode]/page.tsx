import { AuthPageClient } from "./client"

const modes = ["sign-in", "sign-up", "forgot-password", "verify"]

export function generateStaticParams() {
  return modes.map((mode) => ({ mode }))
}

export default async function AuthRoute({
  params,
}: {
  params: Promise<{ mode: string }>
}) {
  const { mode } = await params
  return <AuthPageClient mode={mode} />
}
