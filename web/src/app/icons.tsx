// Small line icons for the navigation and the board. Inline SVG, so there is no icon library to load.
import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function HomeIcon() {
  return (
    <Icon>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M10 20v-5h4v5" />
    </Icon>
  )
}

export function LeaderboardIcon() {
  return (
    <Icon>
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
    </Icon>
  )
}

export function MapIcon() {
  return (
    <Icon>
      <path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.800 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Icon>
  )
}

/** Points down. The City panel on the board turns it over when the panel is folded away. */
export function ChevronIcon() {
  return (
    <Icon>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  )
}

/** Recenter / navigate control on the home radar dock. */
export function NavigateIcon() {
  return (
    <Icon>
      <path d="m12 3 7 18-7-4-7 4 7-18Z" />
    </Icon>
  )
}

/** Plus glyph inside the primary Report CTA. */
export function PlusIcon() {
  return (
    <Icon>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  )
}

/** Council quest control on the home radar dock. */
export function CouncilIcon() {
  return (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  )
}

/** The CIVIC coin: a circle with a star, in Coin amber. */
export function CoinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-coin">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-on-coin)" strokeOpacity=".35" strokeWidth="1.5" />
      <path d="m12 6.8 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5Z" fill="var(--color-on-coin)" />
    </svg>
  )
}

export function CameraIcon() {
  return (
    <Icon>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </Icon>
  )
}

/** A council agenda page. */
export function DocumentIcon() {
  return (
    <Icon>
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </Icon>
  )
}

/** The budget quest: where taxes go. */
export function PieIcon() {
  return (
    <Icon>
      <path d="M12 3a9 9 0 1 0 9 9h-9Z" />
      <path d="M15 3.5A9 9 0 0 1 20.5 9H15Z" />
    </Icon>
  )
}

export function TagIcon() {
  return (
    <Icon>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </Icon>
  )
}

export function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function ChevronRightIcon() {
  return (
    <Icon>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  )
}
