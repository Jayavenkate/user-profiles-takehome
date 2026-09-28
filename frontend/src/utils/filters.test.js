import { describe, expect, it } from 'vitest'

import { EMPTY_FILTERS, countActiveFilters, describeFilters, readFilters, toApiParams, validateFilters } from './filters'

describe('readFilters', () => {
  it('keeps valid values and drops invalid ones', () => {
    const params = new URLSearchParams('department=Design&status=maybe&created_from=2026-09-01&created_to=soon')
    expect(readFilters(params)).toEqual({ ...EMPTY_FILTERS, department: 'Design', created_from: '2026-09-01' })
  })

  it('counts only the filters that are set', () => {
    expect(countActiveFilters(readFilters(new URLSearchParams('status=inactive&department=HR')))).toBe(2)
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0)
  })
})

describe('toApiParams', () => {
  it('maps status to is_active and leaves unset filters out', () => {
    expect(toApiParams({ ...EMPTY_FILTERS, status: 'inactive' })).toMatchObject({
      is_active: 'false',
      department: undefined,
      created_after: undefined,
    })
  })

  it('turns local days into a start-inclusive, end-exclusive range', () => {
    const params = toApiParams({ ...EMPTY_FILTERS, created_from: '2026-09-01', created_to: '2026-09-30' })
    expect(params.created_after).toBe(new Date(2026, 8, 1).toISOString())
    // The whole of the 30th is included, so the range ends at the next local midnight.
    expect(params.created_before).toBe(new Date(2026, 9, 1).toISOString())
  })
})

describe('validateFilters', () => {
  it('rejects a range that ends before it starts', () => {
    expect(validateFilters({ ...EMPTY_FILTERS, updated_from: '2026-09-10', updated_to: '2026-09-01' }))
      .toEqual({ updated_to: 'End date must be on or after the start date.' })
    expect(validateFilters({ ...EMPTY_FILTERS, created_from: '2026-09-10', created_to: '2026-09-10' })).toEqual({})
  })
})

describe('describeFilters', () => {
  it('gives one chip per filter, with the URL keys it clears', () => {
    const chips = describeFilters({ ...EMPTY_FILTERS, status: 'active', updated_to: '2026-09-28' })
    expect(chips.map((chip) => chip.keys)).toEqual([['status'], ['updated_from', 'updated_to']])
    expect(chips[0].label).toBe('Status: Active')
    expect(chips[1].label).toMatch(/^Updated until /)
  })
})
