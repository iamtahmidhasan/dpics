import { AdminUserHeader } from "@/components/admin/user-detail/admin-user-header"
import { AdminUserMobileNav } from "@/components/admin/user-detail/admin-user-mobile-nav"
import { AdminUserOverviewTab } from "@/components/admin/user-detail/admin-user-overview-tab"

export default function AdminUserDetailPage() {
  return (
    <>
      {/* Mobile view (< md): User summary card + interactive app-style list */}
      <div className="block md:hidden space-y-4">
        <AdminUserHeader />
        <AdminUserMobileNav />
      </div>

      {/* Desktop view (>= md): Overview tab directly */}
      <div className="hidden md:block">
        <AdminUserOverviewTab />
      </div>
    </>
  )
}