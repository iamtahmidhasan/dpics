import { CTASection } from '@/components/home/CTASection'
import { EventsSection } from '@/components/home/EventsSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { HeroSection } from '@/components/home/HeroSection'
import { JoinSection } from '@/components/home/JoinSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { AchievementsSection } from '@/components/home/AchievementsSection'
import { listPublishedAchievements } from '@/lib/services/achievement.service'

export default async function Home() {
  const [featuredData, latestData] = await Promise.all([
    listPublishedAchievements({ isFeatured: true, pageSize: 6 }),
    listPublishedAchievements({ pageSize: 6 }),
  ])

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <AchievementsSection
        featured={featuredData.achievements}
        latest={latestData.achievements}
      />
      <EventsSection />
      <TestimonialsSection />
      <JoinSection />
      <CTASection />
    </>
  )
}
