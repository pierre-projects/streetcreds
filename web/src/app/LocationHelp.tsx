// The steps to unblock location, for a player whose browser refused. A web page cannot open the
// phone's Settings app, so this is the nearest thing to a button for it: short numbered steps
// that stay on screen, above the button that tries again.
import type { LocationHelp as Help } from './location'
import { strings } from './strings'
import { Card } from './ui'

export function LocationHelp({ help }: { help: Help }) {
  return (
    <Card role="alert" aria-labelledby="location-help-title">
      <h2 id="location-help-title" className="text-base font-semibold text-ink">{help.title}</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink marker:font-semibold">
        {help.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      {help.canRetry && <p className="mt-3 text-sm leading-relaxed text-muted">{strings.location.blocked.hint}</p>}
    </Card>
  )
}
