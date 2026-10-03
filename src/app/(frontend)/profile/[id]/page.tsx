import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicProfileView } from "@/components/profile/public-profile-view"
import { PublicProfileService } from "@/lib/services/public-profile.service"
import { getLang } from "@/lib/i18n-server"
import { SITE_NAME, SITE_URL } from "@/lib/site"

interface PublicProfilePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await PublicProfileService.getProfileByIdentifier(id)

  if (!profile) {
    return {
      title: `Profile Not Found | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    }
  }

  const roleTag = profile.isInstructor
    ? "Instructor"
    : profile.isMember
    ? "Member"
    : "Profile"

  const title = `${profile.name} - ${roleTag} Profile | ${SITE_NAME}`
  const description =
    profile.instructor?.bio ||
    profile.instructor?.expertise ||
    `${profile.name}'s public profile and activity timeline at ${SITE_NAME}.`
  const canonicalSlug = profile.slug || profile.member?.studentId || profile.instructor?.instructorId || id
  const profileUrl = `${SITE_URL}/profile/${canonicalSlug}`

  return {
    title,
    description,
    alternates: { canonical: profileUrl },
    openGraph: {
      title,
      description,
      url: profileUrl,
      type: "profile",
      siteName: SITE_NAME,
      images: profile.avatar ? [{ url: profile.avatar, alt: profile.name }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: profile.avatar ? [profile.avatar] : undefined,
    },
  }
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { id } = await params
  const [profile, lang] = await Promise.all([
    PublicProfileService.getProfileByIdentifier(id),
    getLang(),
  ])

  if (!profile) {
    notFound()
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    image: profile.avatar || undefined,
    jobTitle: profile.isInstructor ? "Instructor" : profile.isMember ? "Member" : "Community Member",
    description: profile.instructor?.bio || profile.instructor?.expertise || undefined,
    worksFor: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL.toString(),
    },
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 md:px-8 py-4 sm:py-7 space-y-3 sm:space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Responsive Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <a href="/" className="hover:text-foreground transition-colors">
          Home
        </a>
        <span>/</span>
        <a
          href={profile.isInstructor ? "/instructors" : "/members"}
          className="hover:text-foreground transition-colors"
        >
          {profile.isInstructor ? "Instructors" : "Members"}
        </a>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[220px] sm:max-w-none">
          {profile.name}
        </span>
      </nav>

      <PublicProfileView
        profile={profile}
        defaultTab={profile.isInstructor && profile.instructedCourses.length > 0 ? "teaching" : "activities"}
      />
    </div>
  )
}
