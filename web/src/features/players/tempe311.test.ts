import { describe, expect, it } from 'vitest'
import { CATEGORIES } from '../../../../shared/constants'
import { tempe311RecordTarget, tempe311Target, tempe311Url } from './tempe311'

const BASE = 'https://iframe.publicstuff.com/#?client_id=1000028'

describe('tempe311Url', () => {
  it('opens one issue’s form', () => {
    expect(tempe311Url({ open: 'form', id: 1009682, name: 'Pothole' })).toBe(`${BASE}&request_type_id=1009682`)
  })

  it('opens one group’s list', () => {
    expect(tempe311Url({ open: 'list', id: 4720, name: 'Graffiti' })).toBe(`${BASE}&request_type_category_id=4720`)
  })

  it('opens the City’s own picker when there is nothing closer', () => {
    expect(tempe311Url({ open: 'picker' })).toBe(BASE)
  })
})

describe('tempe311Target', () => {
  it('sends a pothole straight to the Pothole form', () => {
    expect(tempe311Url(tempe311Target('pothole'))).toBe(`${BASE}&request_type_id=1009682`)
  })

  it('sends the categories the City splits further to that group’s list', () => {
    expect(tempe311Url(tempe311Target('streetlight'))).toBe(`${BASE}&request_type_category_id=4765`)
    expect(tempe311Url(tempe311Target('graffiti'))).toBe(`${BASE}&request_type_category_id=4720`)
    expect(tempe311Url(tempe311Target('blocked-sidewalk'))).toBe(`${BASE}&request_type_category_id=4768`)
  })

  it('sends "other" to the picker', () => {
    expect(tempe311Target('other')).toEqual({ open: 'picker' })
  })

  it('has somewhere to go for every category', () => {
    for (const category of CATEGORIES) {
      expect(tempe311Url(tempe311Target(category)).startsWith(BASE)).toBe(true)
    }
  })
})

describe('tempe311RecordTarget', () => {
  it('sends a bus stop to Bus Stop Maintenance', () => {
    expect(tempe311Url(tempe311RecordTarget('bus-stop'))).toBe(`${BASE}&request_type_id=1009772`)
  })

  it('sends concrete work to Sidewalk or Curb Repair', () => {
    for (const kind of ['curb-ramp', 'uneven-sidewalk', 'gap'] as const) {
      expect(tempe311Url(tempe311RecordTarget(kind))).toBe(`${BASE}&request_type_id=1009685`)
    }
  })

  it('sends an obstruction to the Streets list', () => {
    expect(tempe311Url(tempe311RecordTarget('obstruction'))).toBe(`${BASE}&request_type_category_id=4768`)
  })
})
