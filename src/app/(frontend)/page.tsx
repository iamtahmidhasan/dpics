import { CTASection } from '@/components/home/CTASection'
import { EventsSection } from '@/components/home/EventsSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { HeroSection } from '@/components/home/HeroSection'
import { JoinSection } from '@/components/home/JoinSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <EventsSection />
      <TestimonialsSection />
      <JoinSection />
      <CTASection />
    </>
  )
}
