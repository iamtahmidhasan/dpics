import * as React from 'react'

export interface LaserFlowProps extends React.HTMLAttributes<HTMLDivElement> {
  surfaceRef?: React.RefObject<HTMLElement | null>
  beamPosition?: number
  surfaceLevel?: number
  color?: string
  intensity?: number
  beamWidth?: number
  flare?: number
  spread?: number
  spill?: number
  fog?: number
  dust?: number
  streaks?: number
  dots?: number
  pulse?: number
  speed?: number
  seed?: number
  mouseInteraction?: boolean
  revealImage?: string
  revealRadius?: number
  revealOpacity?: number
  intro?: boolean
  theme?: 'dark' | 'light'
  paused?: boolean
  dpr?: number
  className?: string
}

export declare const LaserFlow: React.FC<LaserFlowProps>
export default LaserFlow
