// Screen title and supporting copy use the shared scale.
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <header><h1 className="text-title uppercase text-ink">{title}</h1>{subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}</header>
}
