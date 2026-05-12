# AskLayer Widget

React package for embedding an AskLayer AI search/chat bar inside customer websites.

## Install from GitHub

```bash
npm install @asklayer/widget-reactjs
```

## Usage

```tsx
import { AskLayerWidget } from '@asklayer/widget'
import '@asklayer/widget/styles.css'

export function HomePage() {
  return (
    <AskLayerWidget
      apiBaseUrl={import.meta.env.VITE_ASKLAYER_API_URL}
      apiKey={import.meta.env.VITE_ASKLAYER_API_KEY}
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
