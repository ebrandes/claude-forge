export interface Section {
  id: string
  title: string
  emoji: string
  order: number
  render: (params: SectionParams) => string
}

export interface SectionParams {
  maxLinesPerFile?: number
  idealLineRange?: [number, number]
  responsiveMode?: 'mobile-first' | 'desktop-first' | 'context-aware'
  mobileFirstRoutes?: string[]
  desktopFirstRoutes?: string[]
  projectDescription?: string
  techStack?: string[]
  qualityLevel?: 'strict' | 'moderate' | 'relaxed'
  customRules?: string[]
  extras?: string[]
  [key: string]: unknown
}
