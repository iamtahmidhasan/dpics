import type { Metadata } from "next"

import { UsersTable } from "@/components/admin/users-table"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { DEFAULT_USER_PAGE_SIZE, listUsers } from "@/lib/services/user.service"

export const metadata: Metadata = {
  title: "Users",
}

export default async function AdminUsersPage() {
  const [lang, data] = await Promise.all([
    getLang(),
    listUsers({
      search: null,
      role: null,
      page: 1,
      pageSize: DEFAULT_USER_PAGE_SIZE,
    }),
  ])
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">{t("Users", "ব্যবহারকারী")}</h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Every account registered on the platform.",
            "প্ল্যাটফর্মে নিবন্ধিত সব অ্যাকাউন্ট।"
          )}
        </p>
      </div>

      <UsersTable initialData={data} />
    </div>
  )
}
