import { CTASection } from '@/components/home/CTASection'
import { EventsSection } from '@/components/home/EventsSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { HeroSection } from '@/components/home/HeroSection'
import { JoinSection } from '@/components/home/JoinSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { AchievementsSection } from '@/components/home/AchievementsSection'
import { PostsSection } from '@/components/home/PostsSection'
import { listPublishedAchievements } from '@/lib/services/achievement.service'
import { listPublishedPosts } from '@/lib/services/post.service'

export default async function Home() {
  const [featuredAchievements, latestAchievements, postsData] = await Promise.all([
    listPublishedAchievements({ isFeatured: true, pageSize: 6 }),
    listPublishedAchievements({ pageSize: 6 }),
    listPublishedPosts({ pageSize: 3 }),
  ])

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <AchievementsSection
        featured={featuredAchievements.achievements}
        latest={latestAchievements.achievements}
      />
      <EventsSection />
      <PostsSection posts={postsData.posts} />
      <TestimonialsSection />
      <JoinSection />
      <CTASection />
    </>
  )
}
