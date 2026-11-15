// Loads the City records once and keeps them for the visit. Used by the map screen and the board.
import { useQuery } from '@tanstack/react-query'
import { cityRecordsKey } from '../../app/queryClient'
import { type CityRecord, loadCityRecords } from './cityRecords'

// The same empty list every time, so nothing that depends on the records runs again while they load.
const NONE: CityRecord[] = []

export interface CityRecordsState {
  records: CityRecord[]
  /** The day the records were copied from the City. Null until they have loaded. */
  copiedAt: string | null
  status: 'loading' | 'ready' | 'error'
}

export function useCityRecords(): CityRecordsState {
  const query = useQuery({
    queryKey: cityRecordsKey,
    queryFn: loadCityRecords,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
  return {
    records: query.data?.records ?? NONE,
    copiedAt: query.data?.copiedAt ?? null,
    status: query.data ? 'ready' : query.isError ? 'error' : 'loading',
  }
}
