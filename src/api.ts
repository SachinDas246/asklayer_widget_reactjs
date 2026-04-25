import type { AskLayerMessage, WidgetChatResponse } from './types'

type SendWidgetMessageArgs = {
  apiBaseUrl: string
  apiKey: string
  siteId: string | number
  message: string
  history: Pick<AskLayerMessage, 'role' | 'content'>[]
}

export async function sendWidgetMessage({
  apiBaseUrl,
  apiKey,
  siteId,
  message,
  history,
}: SendWidgetMessageArgs): Promise<WidgetChatResponse> {
  const baseUrl = apiBaseUrl.replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/api/widget/chat/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      site_id: siteId,
      message,
      history,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'AskLayer could not answer right now.')
  }

  return data
}
