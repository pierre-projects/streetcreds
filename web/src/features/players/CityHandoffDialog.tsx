// The "Send to Tempe 311" panel over the map, opened from a report's popup.
//
// A native <dialog>, shown with showModal(): the browser puts it above the map and everything
// floating over the map, keeps the keyboard inside it, and closes it on Escape. No library.
import { useEffect, useId, useRef } from 'react'
import type { PublicReport } from '../../../../shared/types'
import { strings } from '../../app/strings'
import { Button } from '../../app/ui'
import { CityHandoff } from './CityHandoff'
import type { CityRecord } from './cityRecords'

interface CityHandoffDialogProps {
  /** The report to send on. Null keeps the dialog closed. */
  report: PublicReport | null
  /** The City's own record of that spot, when it has one. */
  cityRecord?: CityRecord
  onClose: () => void
}

export function CityHandoffDialog({ report, cityRecord, onClose }: CityHandoffDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (report && !dialog.open) dialog.showModal()
    else if (!report && dialog.open) dialog.close()
  }, [report])

  return (
    <dialog
      ref={ref}
      className="handoff-dialog"
      aria-labelledby={headingId}
      // Escape closes the dialog by itself. This tells whoever opened it.
      onClose={onClose}
      // The dimmed page around the panel is part of the dialog, so a tap there lands on the dialog itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {report && (
        <div className="flex flex-col gap-4 p-5">
          {/* The key starts the panel afresh for another report: nothing copied yet. */}
          <CityHandoff key={report.id} report={report} cityRecord={cityRecord} headingId={headingId} />
          <Button variant="secondary" onClick={onClose}>
            {strings.city.handoff.close}
          </Button>
        </div>
      )}
    </dialog>
  )
}
