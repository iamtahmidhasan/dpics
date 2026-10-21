import { permanentRedirect } from "next/navigation"

type Props = {
  params: Promise<{ code: string }>
}

export default async function VerifyCertRedirectPage({ params }: Props) {
  const { code } = await params
  permanentRedirect(`/verify/${encodeURIComponent(code)}`)
}
