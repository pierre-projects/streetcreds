import { useEffect } from 'react'
import { Link } from 'react-router'
import { strings } from '../strings'
import { LogoMark, ScreenHeader } from '../ui'
import { legalContent, legalDetails, legalReferences, type LegalPageId, type LegalSection } from './content'
import { LegalLinks, legalLinkClass } from './LegalLinks'

export function LegalPageFrame({ page }: { page: LegalPageId }) {
  const copy = legalContent[page]
  const labels = strings.legal.pages[page]
  const headings: Readonly<Record<string, string>> = labels.sections
  const sections: Readonly<Record<string, LegalSection>> = copy.sections

  useEffect(() => {
    const previousTitle = document.title
    document.title = `${labels.title} | ${strings.appName}`
    window.scrollTo(0, 0)
    return () => { document.title = previousTitle }
  }, [labels.title])

  return (
    <div className="app-column px-4 py-6 [overflow-wrap:anywhere]">
      <header className="mb-6 space-y-3">
        <div className="app-brand"><LogoMark />{strings.appName}</div>
        <Link to="/" className={legalLinkClass}>{strings.legal.back}</Link>
      </header>
      <main className="space-y-6">
        <div>
          <ScreenHeader title={labels.title} />
          <p className="mt-3 font-mono text-xs text-muted">
            {strings.legal.lastUpdated}{' '}
            <time dateTime={legalDetails.effectiveDate}>{strings.legal.effectiveDate}</time>
          </p>
        </div>
        <p className="text-base leading-relaxed">{copy.intro}</p>
        {Object.entries(sections).map(([key, section]) => (
          <section key={key} aria-labelledby={`${page}-${key}`} className="space-y-3 border-t border-dotted border-line pt-5">
            <h2 id={`${page}-${key}`} className="section-title">{headings[key]}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-base leading-relaxed">{paragraph}</p>)}
            {section.references && <ul>
              {section.references.map((reference) => <li key={reference}>
                <a className={legalLinkClass} href={legalReferences[reference]}>{strings.legal.references[reference]}</a>
              </li>)}
            </ul>}
          </section>
        ))}
        <section aria-labelledby="legal-contact" className="border-t border-dotted border-line pt-5">
          <h2 id="legal-contact" className="section-title">{strings.legal.contact}</h2>
          <a className={`${legalLinkClass} mt-2 max-w-full`} href={`mailto:${legalDetails.contactEmail}`}>{legalDetails.contactEmail}</a>
        </section>
      </main>
      <footer className="mt-6 border-t border-dotted border-line pt-3"><LegalLinks current={page} /></footer>
    </div>
  )
}
