export type HeroSearchWidgetProps = {
  apiBaseUrl: string
  apiKey: string
  placeholder?: string
  suggestedQuestions?: string[]
  brandName?: string
  className?: string
  onError?: (error: Error) => void
}
