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

export type WidgetChatResponse = {
  answer: string
  sources?: AskLayerSource[]
}
