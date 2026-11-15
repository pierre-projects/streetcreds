// Temporary, lazy-loaded showcase for the soft glass radar HUD system.
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, ButtonLink, Card, ErrorNotice, Eyebrow, LinkCard, LogoMark, OptionCard, ScreenHeader, TextField } from '../ui'

const colors = ['page', 'surface', 'line', 'ink', 'muted', 'accent', 'on-accent', 'on-ink', 'severity-low', 'severity-medium', 'severity-high']
const shapes = ['radius-pill', 'radius-control', 'radius-card', 'shadow-float', 'surface-frost', 'blur-frost']

export function Component() {
  const [tokens] = useState(() => {
    const style = getComputedStyle(document.documentElement)
    return Object.fromEntries([...colors.map((name) => `color-${name}`), ...shapes, 'font-sans', 'font-mono', 'text-display', 'text-title', 'text-label'].map((name) => [name, style.getPropertyValue(`--${name}`).trim()]))
  })
  const [option, setOption] = useState('selected')
  const [status, setStatus] = useState('Ready to try an action.')
  const [figures, setFigures] = useState('Waiting for the self-hosted font…')
  const focusTarget = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let active = true
    void document.fonts.load('700 32px Outfit').then(() => {
      const context = document.createElement('canvas').getContext('2d')
      if (!context || !active) return
      context.font = '700 32px Outfit'
      const widths = Array.from('0123456789', (digit) => context.measureText(digit).width)
      const equal = Math.max(...widths) - Math.min(...widths) < 0.5
      setFigures(`${equal ? 'Nearly equal' : 'Unequal'} digit widths at 32 px bold: ${widths.map((width) => width.toFixed(2)).join(', ')}. HUD totals use tabular-nums.`)
    })
    return () => { active = false }
  }, [])

  return (
    <main className="app-column space-y-8 px-4 py-8">
      <div className="flex items-center gap-3"><LogoMark /><Eyebrow>StreetCreds / radar HUD</Eyebrow></div>
      <ScreenHeader title="Soft glass radar" subtitle="Frosted pills over a full-bleed map. Same palette. Soft radii, float shadow, Outfit." />

      <section className="space-y-3">
        <h2 className="section-title">01 / Colors</h2>
        <p className="text-sm text-muted">Hex values are unchanged. Accent stays scarce: brand mark, player locus, one primary CTA.</p>
        <div className="grid grid-cols-2 gap-3">
          {colors.map((name) => <Card as="div" key={name}>
            <div className="mb-3 h-12 rounded-control border border-ink/10" style={{ backgroundColor: `var(--color-${name})` }} />
            <p className="break-words font-mono text-sm">{name}</p>
            <p className="mt-1 break-words font-mono text-xs text-muted">{tokens[`color-${name}`]}</p>
          </Card>)}
        </div>
      </section>

      <Card>
        <h2 className="section-title">02 / Contrast</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>Ink is the default text. Muted on paper stays roughly 7.6:1.</li>
          <li>Orange is a fill, never small text on paper. Ink on orange is the on-accent token.</li>
          <li>Pin color encodes severity. Category is label text on a white chip.</li>
          <li>Frost surfaces are white at ~70–85% with backdrop blur—not neon glow stacks.</li>
        </ul>
      </Card>

      <section className="space-y-3">
        <h2 className="section-title">03 / Type</h2>
        <Card tone="dark"><Eyebrow tone="dark">Display / {tokens['text-display']}</Eyebrow><p className="points-total mt-2">1,250</p></Card>
        <Card>
          <ScreenHeader title="Title / 28 px" subtitle={`CSS value: ${tokens['text-title']}`} />
          <Eyebrow className="mt-4">Label / {tokens['text-label']}</Eyebrow>
          <p className="mt-3 text-base">Outfit, geometric neo-grotesk. Weights 400 / 500 / 700 self-hosted as woff2.</p>
          <p className="mt-3 break-words font-mono text-xs text-muted">{tokens['font-sans']}</p>
          <p className="mt-2 break-words font-mono text-xs text-muted">{tokens['font-mono']}</p>
        </Card>
        <Card>
          <h3 className="font-bold">Outfit figures</h3>
          <p className="mt-2 text-2xl font-bold tabular-nums">111111<br />888888<br />0123456789</p>
          <p className="mt-3 text-sm text-muted">{figures}</p>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">04 / Shape and frost</h2>
        {shapes.map((name) => (
          <Card as="div" key={name}>
            <Eyebrow>{name}</Eyebrow>
            <p className="mt-2 break-words font-mono text-sm">{tokens[name] || '(see index.css)'}</p>
            {name === 'radius-pill' && <div className="mt-3 h-10 rounded-pill bg-accent" />}
            {name === 'radius-control' && <div className="mt-3 h-10 rounded-control border border-ink/15 bg-page" />}
            {name === 'radius-card' && <div className="mt-3 h-16 rounded-card border border-ink/10 bg-page shadow-float" />}
            {name === 'shadow-float' && <div className="mt-3 h-12 rounded-card bg-surface shadow-float" />}
            {name === 'surface-frost' && (
              <div className="mt-3 rounded-pill border border-ink/10 px-4 py-3 text-sm" style={{ background: 'var(--surface-frost)', backdropFilter: 'blur(var(--blur-frost))' }}>
                Frost pill sample
              </div>
            )}
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="section-title">05 / HUD chrome</h2>
        <div className="relative overflow-hidden rounded-card border border-ink/10 bg-ink/10 p-4">
          <div className="app-header">
            <span className="app-brand"><LogoMark />StreetCreds</span>
            <div className="app-hud-meta">
              <div className="app-hud-points">
                <span className="app-hud-points-label">CIVIC</span>
                <span className="app-hud-points-value">340</span>
              </div>
              <span className="app-hud-divider" aria-hidden="true" />
              <span className="app-hud-place">Mill Ave</span>
            </div>
          </div>
          <div className="relative mt-6 h-40 overflow-hidden rounded-card bg-page">
            <span className="radar-ring" aria-hidden="true" />
            <span className="radar-ring" aria-hidden="true" />
            <span className="radar-locus left-1/2 top-1/2" aria-hidden="true" />
          </div>
          <div className="radar-dock-inner mt-4">
            <span className="radar-dock-btn" aria-hidden="true">·</span>
            <span className="radar-dock-primary">Report a problem<span className="radar-dock-plus">+</span></span>
            <span className="radar-dock-btn" aria-hidden="true">·</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="section-title">06 / Components</h2>
        <Eyebrow>Buttons / soft press, no hard offset</Eyebrow>
        <Button onClick={() => setStatus('Primary action pressed.')}>Primary action</Button>
        <Button variant="secondary" onClick={() => setStatus('Secondary action pressed.')}>Secondary action</Button>
        <Button disabled>Disabled primary</Button>
        <Button variant="secondary" disabled>Disabled secondary</Button>
        <ButtonLink to="/home">Primary link (to Home)</ButtonLink>
        <ButtonLink to="/home" variant="secondary">Secondary link (to Home)</ButtonLink>
        <p role="status" className="text-sm text-muted">{status}</p>
        <Card><p>Plain section card</p><Badge className="mt-3">+50 pts</Badge></Card>
        <Card as="div" selected><p>Selected div card / heavier ink border</p><Badge className="mt-3">Your neighborhood</Badge></Card>
        <ul><Card as="li">List item card</Card></ul>
        <Card tone="dark"><Eyebrow tone="dark">Dark card</Eyebrow><p className="points-total mt-2">130</p><p className="mt-3 text-on-ink/70">Secondary text on ink.</p><a href="#phone-rules" className="wallet-link mt-2">Focus this link with Tab</a></Card>
        <Card tone="dark" selected><p>Selected dark card</p></Card>
        <LinkCard to="/home"><span>Link card<br /><span className="text-sm text-muted">Press or use the keyboard.</span></span><Badge>+30 pts</Badge></LinkCard>
        <TextField label="Nickname" hint="A default field with a hint." placeholder="Your nickname" />
        <TextField label="Nickname with an error" hint="Use 2 to 20 characters." error="Enter at least two characters." defaultValue="A" />
        <TextField label="Disabled field" disabled defaultValue="Not editable" />
        <fieldset className="space-y-2"><legend className="mb-2 font-medium">Radio cards</legend>
          <OptionCard name="design-options" value="selected" checked={option === 'selected'} onChange={setOption} label="First option" />
          <OptionCard name="design-options" value="other" checked={option === 'other'} onChange={setOption} label="Second option" />
          <OptionCard name="design-options" value="disabled" checked={false} onChange={setOption} label="Disabled option" disabled />
          <OptionCard name="design-disabled-selected" value="disabled-selected" checked onChange={setOption} label="Disabled selected option" disabled />
        </fieldset>
        <ErrorNotice message="Could not load your points." fallback="Try again." onRetry={() => setStatus('Retry pressed. This is a local demonstration.')} retryLabel="Try again" />
        <ErrorNotice message="" fallback="Empty messages use this fallback." />
        <ScreenHeader title="Screen header" subtitle="Optional supporting text — sentence case, not shouted." />
        <ScreenHeader title="Title only" />
        <Eyebrow>Eyebrow label</Eyebrow>
        <div className="flex items-center gap-3"><LogoMark /><span className="font-bold">Logo mark (orange hex S)</span></div>
        <Card><Eyebrow>Keyboard focus</Eyebrow><p className="my-3 text-sm text-muted">Tab through these controls to see focus outlines.</p><Button variant="secondary" onClick={() => focusTarget.current?.focus()}>Move focus to next button</Button><Button ref={focusTarget} className="mt-4" variant="secondary">Focus target</Button></Card>
      </section>

      <Card id="phone-rules">
        <h2 className="section-title">07 / Phone rules</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>Every tap target is at least 44 px tall.</li>
          <li>The content column caps at 480 px; check at 375 px with no horizontal scroll.</li>
          <li>Home is map-first: one primary Report action in the dock.</li>
          <li>Reduced motion disables radar pulse, HUD enter, and pin appear.</li>
        </ul>
      </Card>
    </main>
  )
}
