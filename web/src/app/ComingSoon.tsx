// Stand-in for a screen that is not built yet. Each route in App.tsx uses it until its real
// screen exists, so every path in the app already works.
import { Link } from 'react-router'
import { strings } from './strings'

export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-muted">{strings.comingSoon.body}</p>
      <Link
        to="/home"
        className="mt-5 flex min-h-11 items-center justify-center rounded-xl border border-line px-4 font-semibold text-accent"
      >
        {strings.comingSoon.backHome}
      </Link>
    </section>
  )
}
