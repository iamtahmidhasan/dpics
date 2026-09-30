'use client'

import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'

export function CTASection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-500 to-emerald-400 p-12 text-center shadow-2xl shadow-primary/20"
        >
          {/* Background pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          {/* Glow blobs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Your tech journey starts here.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
              Join 200+ students who are already coding, competing, and building their future with
              DPI Computing Society.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/sign-up" />}
                className="group h-12 gap-2 rounded-full bg-white px-8 font-semibold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
              >
                Join DPICS Today
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                nativeButton={false}
                render={<Link href="/contact" />}
                className="h-12 rounded-full px-8 font-semibold text-white hover:bg-white/15 hover:text-white"
              >
                Get in Touch
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
