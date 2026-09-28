import { describe, expect, it } from 'vitest'

import { validateImage, validateProfile } from './validateProfile'

const VALID = {
  username: 'sara.ahmed',
  email: 'sara@example.com',
  first_name: 'Sara',
  last_name: 'Ahmed',
  gender: 'female',
  date_of_birth: '1992-03-04',
  job_title: 'Designer',
  department: 'Design',
  city: 'Dubai',
  country: 'United Arab Emirates',
  hire_date: '2021-06-01',
}

function imageFile(name, type, sizeBytes = 1024) {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: sizeBytes })
  return file
}

describe('validateProfile', () => {
  it('accepts a complete profile', () => {
    expect(validateProfile(VALID, null)).toEqual({})
  })

  it('requires every required field, ignoring whitespace-only values', () => {
    const errors = validateProfile({ ...VALID, first_name: '   ', city: '' }, null)
    expect(errors).toEqual({ first_name: 'First name is required.', city: 'City is required.' })
  })

  it('reports every required field on an empty form', () => {
    const errors = validateProfile({}, null)
    expect(Object.keys(errors)).toHaveLength(11)
    expect(errors.email).toBe('Email is required.')
  })

  it('rejects usernames with spaces and badly formed emails', () => {
    const errors = validateProfile({ ...VALID, username: 'sara ahmed', email: 'sara@example' }, null)
    expect(errors.username).toMatch(/no spaces/)
    expect(errors.email).toBe('Enter a valid email address.')
  })

  it('needs a date of birth in the past', () => {
    expect(validateProfile({ ...VALID, date_of_birth: '2999-01-01', hire_date: '' }, null).date_of_birth)
      .toBe('Date of birth must be in the past.')
  })

  it('needs the hire date after the date of birth', () => {
    expect(validateProfile({ ...VALID, hire_date: '1992-03-04' }, null).hire_date)
      .toBe('Hire date must be after date of birth.')
  })

  it('includes image errors', () => {
    expect(validateProfile(VALID, imageFile('cv.pdf', 'application/pdf')).profile_image).toMatch(/Only JPG/)
  })
})

describe('validateImage', () => {
  it('allows no image and the supported types', () => {
    expect(validateImage(null)).toBeNull()
    expect(validateImage(imageFile('me.PNG', 'image/png'))).toBeNull()
    expect(validateImage(imageFile('me.webp', 'image/webp'))).toBeNull()
  })

  it('checks both the MIME type and the extension', () => {
    expect(validateImage(imageFile('me.gif', 'image/gif'))).toMatch(/Only JPG/)
    expect(validateImage(imageFile('me.txt', 'image/png'))).toMatch(/Only JPG/)
  })

  it('limits the size to 5 MB', () => {
    expect(validateImage(imageFile('big.jpg', 'image/jpeg', 5 * 1024 * 1024))).toBeNull()
    expect(validateImage(imageFile('big.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1))).toBe('Image must be 5 MB or smaller.')
  })
})
