// "Send to Tempe 311": what a player needs to pass one report on to the City of Tempe's own
// service request form. StreetCreds sends nothing to the City itself.
//
// The City's form opens in a new tab on the right issue (tempe311.ts). It takes no location or
// description from a link, so the player pastes two things into it: the spot, into its Address
// box, and the details, into its Description box. Opening the form copies the spot, which the
// form asks for first; the player comes back once for the details.
//
// Used on the reward screen, right after a report is filed, and over the map from a pin's popup
// (CityHandoffDialog.tsx). It draws no card of its own: whatever shows it gives it one.
import { useState } from 'react'
import { strings } from '../../app/strings'
import { Button, ButtonAnchor, Eyebrow } from '../../app/ui'
import { type CityRecord, TEMPE_311_FORM_URL } from './cityRecords'
import { buildCityReport, type CityReportSource, cityLocationText } from './cityReport'
import { tempe311Target, tempe311Url } from './tempe311'

type Part = 'location' | 'details'
type Copied = { part: Part; ok: boolean } | null

/** The clipboard is missing on a page that is not served over HTTPS. There the call throws. */
function writeClipboard(text: string): Promise<void> {
  try {
    return navigator.clipboard.writeText(text)
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error('No clipboard'))
  }
}

interface CityHandoffProps {
  report: CityReportSource
  /** The City's own record of this spot, when it has one. It adds a line to the details. */
  cityRecord?: CityRecord
  /**
   * The photo at an address the browser can save a file from, such as the one the player has
   * just taken. Shows "Save photo", for the form's own photo button.
   */
  photoHref?: string | null
  /** How the link to the City's form is drawn. `secondary` on a screen that already has a main button. */
  emphasis?: 'primary' | 'secondary'
  /** An id for the heading, for a dialog that takes its name from it. */
  headingId?: string
}

export function CityHandoff({ report, cityRecord, photoHref, emphasis = 'primary', headingId }: CityHandoffProps) {
  const text = strings.city.handoff
  const [copied, setCopied] = useState<Copied>(null)

  const target = tempe311Target(report.category)
  const location = report.lat !== null && report.lng !== null ? cityLocationText(report.lat, report.lng) : null
  const details = buildCityReport(report, cityRecord)

  function copy(part: Part, value: string) {
    writeClipboard(value).then(
      () => setCopied({ part, ok: true }),
      () => setCopied({ part, ok: false }),
    )
  }

  const failed = copied?.ok === false
  const note =
    copied === null
      ? location
        ? text.idle
        : text.idleNoLocation
      : failed
        ? text.copyFailed
        : copied.part === 'location'
          ? text.locationCopied
          : text.detailsCopied
  const opens = target.open === 'picker' ? text.opens.picker : text.opens[target.open](target.name)

  return (
    <div className="flex flex-col gap-4 font-sans text-sm text-ink">
      <div>
        <Eyebrow>{text.eyebrow}</Eyebrow>
        <h2 id={headingId} className="mt-1 text-base font-semibold">
          {text.title}
        </h2>
        <p className="mt-1 text-muted">{text.intro}</p>
      </div>

      <ol className="flex flex-col gap-4">
        <li className="flex flex-col gap-2">
          <p className="text-xs text-muted">{text.locationLabel}</p>
          {location ? (
            <>
              <p className="select-all font-mono">{location}</p>
              <Button variant="secondary" onClick={() => copy('location', location)}>
                {text.copyLocation}
              </Button>
            </>
          ) : (
            <p>{text.noLocation}</p>
          )}
        </li>
        <li className="flex flex-col gap-2">
          <p className="text-xs text-muted">{text.detailsLabel}</p>
          {/* A few lines as a preview. All of it when copying failed, so it can be selected by hand. */}
          <p className={`select-all whitespace-pre-line break-words ${failed ? '' : 'line-clamp-3'}`}>{details}</p>
          <Button variant="secondary" onClick={() => copy('details', details)}>
            {text.copyDetails}
          </Button>
        </li>
        {photoHref && (
          <li className="flex flex-col gap-2">
            <p className="text-xs text-muted">{text.photoLabel}</p>
            <ButtonAnchor variant="secondary" href={photoHref} download={text.photoFileName}>
              {text.savePhoto}
            </ButtonAnchor>
          </li>
        )}
      </ol>

      {/* Always there, and two lines tall, so the buttons under it do not move when it changes. */}
      <p role="status" className={`min-h-10 text-xs ${failed ? 'text-severity-high' : 'text-muted'}`}>
        {note}
      </p>

      <div className="flex flex-col gap-2">
        <ButtonAnchor
          variant={emphasis}
          href={tempe311Url(target)}
          target="_blank"
          rel="noopener noreferrer"
          // The form asks for the spot first, so it is on the clipboard when the form opens,
          // unless the player has already copied something here. The link opens either way.
          onClick={() => {
            if (copied === null && location) copy('location', location)
          }}
        >
          {text.open}
          <span className="sr-only"> {text.newTab}</span>
        </ButtonAnchor>
        <p className="text-xs text-muted">{opens}</p>
        {/* The City's own page, which works whatever happens to the ids in tempe311.ts. */}
        <a className="popup-link self-start" href={TEMPE_311_FORM_URL} target="_blank" rel="noopener noreferrer">
          {text.cityPage}
          <span className="sr-only"> {text.newTab}</span>
        </a>
      </div>
    </div>
  )
}
