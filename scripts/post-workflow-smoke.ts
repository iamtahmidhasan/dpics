/**
 * Throwaway end-to-end check of the post moderation workflow against the real
 * database. Run with: npx tsx scripts/post-workflow-smoke.ts
 */
import "dotenv/config"

import prisma from "@/lib/prisma"
import { Role, PostStatus } from "@/generated/prisma/enums"
import { toPostSlug } from "@/lib/post-slug"
import {
  createPost,
  submitPost,
  reviewPost,
  updatePost,
  updatePostAsAdmin,
  deletePost,
  deletePostAsAdmin,
  listPublishedPosts,
  getPublishedPostBySlug,
  getPostCounts,
  parsePostInput,
} from "@/lib/services/post.service"

const stamp = Date.now()
let failures = 0

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`  PASS  ${label}`)
  } else {
    failures += 1
    console.log(`  FAIL  ${label}`)
  }
}

async function expectReject(label: string, run: () => Promise<unknown>) {
  try {
    await run()
    failures += 1
    console.log(`  FAIL  ${label} (expected a rejection, got success)`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log(`  PASS  ${label} -> ${message.slice(0, 60)}`)
  }
}

async function main() {
  const author = await prisma.user.create({
    data: {
      email: `smoke-author-${stamp}@example.test`,
      emailVerified: true,
      name: "Smoke Author",
      roles: [Role.MEMBER],
      image: [],
      createdAt: new Date(),
    },
  })
  const admin = await prisma.user.create({
    data: {
      email: `smoke-admin-${stamp}@example.test`,
      emailVerified: true,
      name: "Smoke Admin",
      roles: [Role.ADMIN],
      image: [],
      createdAt: new Date(),
    },
  })

  const authorActor = { userId: author.id, isAdmin: false }
  const adminActor = { userId: admin.id, isAdmin: true }
  const input = parsePostInput({
    title: `Smoke post ${stamp}`,
    titleBn: `স্মোক পোস্ট ${stamp}`,
    content: "## Heading\n\nSome **body** text with `code`.\n\n- one\n- two\n",
    contentBn: "## শিরোনাম\n\nকিছু **বাংলা** টেক্সট।",
    category: "cat_post_technical",
    tags: ["smoke", "Test Tag"],
  })
  input.slug = toPostSlug(`smoke-post-${stamp}`)

  console.log("\n1. author creates a draft")
  const draft = await createPost(input, authorActor)
  check("starts as DRAFT", draft.status === PostStatus.DRAFT)
  check("slug is unique and lowercase", draft.slug === `smoke-post-${stamp}`)
  check("tags are normalised", draft.tags.join(",") === "smoke,test-tag")
  check("excerpt derived from content", Boolean(draft.excerpt))
  check("reading time computed", draft.readingMinutes >= 1)

  console.log("\n2. draft is not public")
  check(
    "not in published list",
    !(await listPublishedPosts({ q: input.slug })).posts.some((p) => p.id === draft.id)
  )
  let hidden = false
  try {
    await getPublishedPostBySlug(draft.slug)
  } catch {
    hidden = true
  }
  check("public fetch 404s a draft", hidden)

  console.log("\n3. author submits for review")
  const pending = await submitPost(draft.id, authorActor)
  check("moves to PENDING", pending.status === PostStatus.PENDING)
  check("submittedAt stamped", Boolean(pending.submittedAt))

  console.log("\n4. author cannot approve their own post")
  await expectReject("review by author is refused", () =>
    reviewPost(
      draft.id,
      { decision: "APPROVE" },
      { userId: author.id, isAdmin: false }
    )
  )

  console.log("\n5. admin rejects with a reason")
  const rejected = await reviewPost(
    draft.id,
    { decision: "REJECT", reason: "Please add a code example." },
    adminActor
  )
  check("moves to REJECTED", rejected.status === PostStatus.REJECTED)
  check("reason stored", rejected.massageForAuthor === "Please add a code example.")

  console.log("\n6. author may still edit a REJECTED post")
  const revised = await updatePost(draft.id, { title: `Smoke post ${stamp} revised` }, authorActor)
  check("edit allowed while REJECTED", revised.title.endsWith("revised"))

  console.log("\n7. author re-submits the revised post, then admin approves")
  const resubmitted = await submitPost(draft.id, authorActor)
  check("REJECTED -> PENDING again", resubmitted.status === PostStatus.PENDING)

  const published = await reviewPost(draft.id, { decision: "APPROVE" }, adminActor)
  check("moves to PUBLISHED", published.status === PostStatus.PUBLISHED)
  check("publishedAt stamped", Boolean(published.publishedAt))
  check("rejection reason cleared", published.massageForAuthor === null)

  console.log("\n8. published post is public")
  const live = await getPublishedPostBySlug(published.slug)
  check("public fetch works", live.id === draft.id)
  check("public payload hides the author email", !("email" in live.author))
  check("public payload hides the reviewer id", !("reviewedById" in live))
  check(
    "appears in published list",
    (await listPublishedPosts({ q: "Smoke post" })).posts.some((p) => p.id === draft.id)
  )

  console.log("\n9. author is locked out of an approved post")
  await expectReject("author update refused", () =>
    updatePost(draft.id, { title: "sneaky edit" }, authorActor)
  )
  await expectReject("author delete refused", () => deletePost(draft.id, authorActor))
  await expectReject("author withdraw refused", () => submitPost(draft.id, authorActor))

  console.log("\n10. admin can still edit and archive")
  const adminEdited = await updatePostAsAdmin(
    draft.id,
    { title: `Smoke post ${stamp} admin edited`, status: PostStatus.ARCHIVED },
    adminActor
  )
  check("admin edit applied", adminEdited.title.endsWith("admin edited"))
  check("admin can archive", adminEdited.status === PostStatus.ARCHIVED)
  check(
    "archived post leaves the public list",
    !(await listPublishedPosts({ q: "Smoke post" })).posts.some((p) => p.id === draft.id)
  )

  console.log("\n11. counts aggregate")
  const counts = await getPostCounts()
  check("total is at least 1", counts.total >= 1)
  check("archived bucket counted", counts.ARCHIVED >= 1)

  console.log("\n12. duplicate slug is rejected")
  const clash = parsePostInput({
    title: "Another post",
    slug: published.slug,
    content: "Different body.",
  })
  await expectReject("duplicate slug refused", () => createPost(clash, adminActor))

  console.log("\n13. cleanup")
  await deletePostAsAdmin(draft.id)
  check("post removed", (await prisma.post.count({ where: { id: draft.id } })) === 0)
  await prisma.user.deleteMany({ where: { id: { in: [author.id, admin.id] } } })

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`)
}

main()
  .catch((error) => {
    console.error("\nsmoke test crashed:", error)
    failures += 1
  })
  .finally(() => {
    
    process.exit(failures === 0 ? 0 : 1)
  })
