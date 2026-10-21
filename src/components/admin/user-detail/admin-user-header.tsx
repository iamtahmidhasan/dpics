"use client"

import { Loader2, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "cn"
import { useAdminUser } from "./admin-user-context"

export function AdminUserHeader({ className }: { className?: string }) {
  const { t } = useLanguage()
  const {
    user,
    isSelf,
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    deleteError,
    handleDelete,
  } = useAdminUser()

  const initials = (user.name || user.email || "?").trim().charAt(0).toUpperCase()

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-start justify-between gap-3 p-3.5 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-border/70 bg-card sm:bg-transparent",
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-11 sm:size-10 ring-2 ring-primary/20 ring-offset-1 ring-offset-background">
            {user.avatar && (
              <AvatarImage
                keepMounted
                render={<Image src={user.avatar} alt={user.name} width={44} height={44} unoptimized />}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate font-heading text-base sm:text-lg font-semibold">{user.name}</h1>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {user.roles.map((role) => (
                <Badge key={role} variant="outline" className="text-[10px] px-1.5 py-0 h-4.5">
                  {role}
                </Badge>
              ))}
              {isSelf ? (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4.5">
                  {t("You", "আপনি")}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/admin/users"
            className="rounded-md border border-border px-2.5 py-1.5 text-xs/relaxed transition-colors hover:bg-muted"
          >
            {t("Back to users", "ব্যবহারকারীদের ফিরুন")}
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              {t("Delete user permanently?", "ব্যবহারকারী স্থায়ীভাবে মুছে ফেলবেন?")}
            </DialogTitle>
            <DialogDescription className="space-y-2 text-xs/relaxed pt-2">
              <span>
                {t(
                  `Are you sure you want to delete "${user.name}" (${user.email})?`,
                  `আপনি কি নিশ্চিত যে "${user.name}" (${user.email}) মুছে ফেলতে চান?`
                )}
              </span>
              <span className="block text-destructive/90 font-medium">
                {t(
                  "This action cannot be undone. All data across all models (membership profile, student ID, instructor profile, committee roles, sessions, and login accounts) will be deleted immediately.",
                  "এই কাজটি অপরিবর্তনীয়। এই ব্যবহারকারীর সাথে সম্পর্কিত সমস্ত তথ্য (সদস্য প্রোফাইল, স্টুডেন্ট আইডি, শিক্ষক প্রোফাইল, কমিটি পদবি, সেশন এবং অ্যাকাউন্ট লগইন) অবিলম্বে স্থায়ীভাবে মুছে যাবে।"
                )}
              </span>
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {deleteError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Trash2 data-icon="inline-start" />
              )}
              {isDeleting
                ? t("Deleting...", "মুছে ফেলা হচ্ছে...")
                : t("Confirm delete", "মুছে ফেলা নিশ্চিত করুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
