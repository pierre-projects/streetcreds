// Plain-language alert and optional retry, including empty-message fallback.
import { Button } from './Button'
import { Card } from './Card'
type Retry = { onRetry: () => void; retryLabel: string } | { onRetry?: undefined; retryLabel?: undefined }
export function ErrorNotice({ message, fallback, onRetry, retryLabel }: { message?: string | null; fallback: string } & Retry) {
  return <Card><p role="alert" className="text-base text-severity-high">{message || fallback}</p>{onRetry && <Button variant="secondary" onClick={onRetry} className="mt-4">{retryLabel}</Button>}</Card>
}
