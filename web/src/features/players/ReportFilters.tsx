// The controls that narrow down which reports are shown: a switch for each severity, a menu of
// types, and a line saying how many are showing. The severity switches double as the color key
// for the pins. The parent keeps the filter and applies it; this only draws it and asks for changes.
import type { ReactNode } from 'react'
import { CATEGORIES } from '../../../../shared/constants'
import { strings } from '../../app/strings'
import {
  applyFilter,
  countByCategory,
  countBySeverity,
  isFiltering,
  NO_FILTER,
  type PinnedReport,
  type ReportFilter,
  SEVERITY_DOT,
  SEVERITY_ORDER,
} from './mapReports'

interface ReportFiltersProps {
  /** Every report, before filtering. */
  pins: PinnedReport[]
  filter: ReportFilter
  /** Given a function from the current filter to the next one, like a state setter, so two quick taps both count. */
  onChange: (update: (current: ReportFilter) => ReportFilter) => void
  /** For the phone: no type menu and no numbers on the severity switches, so the switches fit on one row. */
  compact?: boolean
  /** Something to put on the same row as the type menu, such as the board's sort menu. Not shown in the short form. */
  beside?: ReactNode
}

export function ReportFilters({ pins, filter, onChange, compact = false, beside }: ReportFiltersProps) {
  const filtering = isFiltering(filter)
  const shown = applyFilter(pins, filter).length
  // Each control counts what the other one leaves, so a number is always what picking it would show.
  const perSeverity = countBySeverity(applyFilter(pins, { ...NO_FILTER, category: filter.category }))
  const perCategory = countByCategory(applyFilter(pins, { ...NO_FILTER, severities: filter.severities }))

  return (
    <div role="group" aria-label={strings.map.filtersLabel} className="filter-sheet">
      <div className="flex flex-wrap gap-2">
        {SEVERITY_ORDER.map((severity) => (
          <button
            key={severity}
            type="button"
            className="filter-toggle"
            aria-pressed={filter.severities[severity]}
            aria-label={strings.map.severityToggle(strings.severities[severity], perSeverity[severity])}
            onClick={() =>
              onChange((current) => ({
                ...current,
                severities: { ...current.severities, [severity]: !current.severities[severity] },
              }))
            }
          >
            <span className={`filter-dot ${SEVERITY_DOT[severity]}`} aria-hidden="true" />
            {strings.severities[severity]}
            {!compact && <span className="font-mono tabular-nums text-muted">{perSeverity[severity]}</span>}
          </button>
        ))}
      </div>

      {!compact && (
        <div className="flex items-center gap-2">
          {/* The label is for screen readers: on screen the menu's own words, "All types", say what it is. */}
          <label className="flex min-w-0 flex-1">
            <span className="sr-only">{strings.map.typeLabel}</span>
            <select
              className="filter-select"
              value={filter.category ?? ''}
              onChange={(event) => {
                const category = CATEGORIES.find((option) => option === event.target.value) ?? null
                onChange((current) => ({ ...current, category }))
              }}
            >
              <option value="">{strings.map.allTypes}</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {strings.map.typeOption(strings.categories[category], perCategory[category])}
                </option>
              ))}
            </select>
          </label>
          {beside}
        </div>
      )}

      {/* Always one button tall, so nothing below jumps when "Show all" appears. */}
      <div className="flex min-h-11 items-center justify-between gap-3">
        <p className="text-sm text-ink" aria-live="polite">
          {!filtering
            ? strings.map.count(pins.length)
            : shown === 0
              ? strings.map.noMatch
              : strings.map.countFiltered(shown, pins.length)}
        </p>
        {filtering && (
          <button type="button" className="filter-reset" onClick={() => onChange(() => NO_FILTER)}>
            {strings.map.showAll}
          </button>
        )}
      </div>
    </div>
  )
}
