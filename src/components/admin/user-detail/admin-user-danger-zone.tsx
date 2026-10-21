"use client"

import { Trash2 } from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminUser } from "./admin-user-context"

export function AdminUserDangerZone() {
  const { t } = useLanguage()
  const { isSelf, setShowDeleteDialog } = useAdminUser()

  if (isSelf) return null

  return (
    <Card className="border-destructive/30 bg-destructive/5 mt-6">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
          <Trash2 className="size-4" />
          {t("Danger zone", "বিপদজনক অঞ্চল")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t(
            "Permanently delete this user and all associated records (membership, student ID, instructor profile, committee roles, and active sessions).",
            "এই ব্যবহারকারী এবং তার সমস্ত সম্পর্কিত তথ্য (সদস্যপদ, স্টুডেন্ট আইডি, শিক্ষক প্রোফাইল, কমিটি পদবি এবং সেশন) স্থায়ীভাবে মুছে ফেলুন।"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end pt-0">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="size-3.5" data-icon="inline-start" />
          {t("Delete user", "ব্যবহারকারী মুছুন")}
        </Button>
      </CardContent>
    </Card>
  )
}
