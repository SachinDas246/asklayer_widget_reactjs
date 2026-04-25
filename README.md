# AskLayer Widget

React package for embedding an AskLayer AI search/chat bar inside customer websites.

## Install from GitHub

```bash
npm install github:YOUR_ORG/asklayer-widget
```

For the local demo in this repo, use the sibling `widget_demo` app.

## Usage

```tsx
import { AskLayerWidget } from '@asklayer/widget'
import '@asklayer/widget/styles.css'

export function HomePage() {
  return (
    <AskLayerWidget
      apiBaseUrl={import.meta.env.VITE_ASKLAYER_API_URL}
      apiKey={import.meta.env.VITE_ASKLAYER_API_KEY}
      siteId={import.meta.env.VITE_ASKLAYER_SITE_ID}
      placeholder="Ask anything about this site..."
      suggestedQuestions={[
        'How does this work?',
        'What are the pricing plans?',
        'Who is this for?',
      ]}
    />
  )
}
```

## Required env vars in the user's React app

```env
VITE_ASKLAYER_API_URL=https://api.asklayer.ai
VITE_ASKLAYER_API_KEY=asklayer_live_xxx
VITE_ASKLAYER_SITE_ID=site_xxx
```

## Backend contract

The component calls:

```txt
POST /api/widget/chat/
Authorization: Bearer <apiKey>
```

Body:

```json
{
  "site_id": "site_xxx",
  "message": "How does pricing work?",
  "history": [
    { "role": "user", "content": "What does this do?" },
    { "role": "assistant", "content": "..." }
  ]
}
```

Response:

```json
{
  "answer": "The Pro plan includes...",
  "sources": [
    { "title": "Pricing", "url": "https://example.com/pricing" }
  ]
}
```
