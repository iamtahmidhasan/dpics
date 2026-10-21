"use client"

import { AdminUserPosts } from "@/components/admin/admin-user-posts"
import { useAdminUser } from "./admin-user-context"

export function AdminUserPostsTab() {
  const { user, posts } = useAdminUser()

  return (
    <AdminUserPosts
      userId={user.id}
      userName={user.name || user.email}
      initialPosts={posts ?? { posts: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }}
    />
  )
}
