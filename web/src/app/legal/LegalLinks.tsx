import { Link } from 'react-router'
import { strings } from '../strings'
import type { LegalPageId } from './content'

export const legalLinkClass = 'inline-flex min-h-11 min-w-11 items-center justify-center px-2 py-2 text-sm text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 outline-ink'
const pages: readonly LegalPageId[] = ['privacy', 'terms', 'about']

export function LegalLinks({ current }: { current?: LegalPageId }) {
  return (
    <nav aria-label={strings.legal.navigation} className="flex flex-wrap items-center justify-center gap-x-2">
      {pages.filter((page) => page !== current).map((page) => (
        <Link key={page} to={`/${page}`} className={legalLinkClass}>{strings.legal.pages[page].label}</Link>
      ))}
    </nav>
  )
}

export function LegalFooter() {
  return <footer className="shrink-0 border-t border-dotted border-line px-2 py-2"><LegalLinks /></footer>
}
