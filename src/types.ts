export type AskLayerSource = {
  title: string
  url: string
}

export type AskLayerMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AskLayerSource[]
}

export type AskLayerWidgetProps = {
  apiBaseUrl: string
  apiKey: string
  placeholder?: string
  suggestedQuestions?: string[]
  brandName?: string
  className?: string
  onError?: (error: Error) => void
}

export type WidgetChatResponse = {
  answer: string
  sources?: AskLayerSource[]
}
