// Stand-in for a screen that is not built yet. Each route in App.tsx uses it until its real
// screen exists, so every path in the app already works.
import { ButtonLink, Card, ScreenHeader } from './ui'
import { strings } from './strings'

export function ComingSoon({ title }: { title: string }) {
  return (
    <Card>
      <ScreenHeader title={title} />
      <p className="mt-2 text-muted">{strings.comingSoon.body}</p>
      <ButtonLink to="/home" variant="secondary" className="mt-5">{strings.comingSoon.backHome}</ButtonLink>
    </Card>
  )
}
