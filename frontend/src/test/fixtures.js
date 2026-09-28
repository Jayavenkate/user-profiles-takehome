/** A profile as the API returns it. */
export function makeProfile(overrides = {}) {
  return {
    id: 1,
    username: 'sara.ahmed',
    email: 'sara@example.com',
    first_name: 'Sara',
    last_name: 'Ahmed',
    phone: '',
    gender: 'female',
    date_of_birth: '1992-03-04',
    job_title: 'Designer',
    department: 'Design',
    city: 'Dubai',
    country: 'United Arab Emirates',
    bio: '',
    hire_date: '2021-06-01',
    is_active: true,
    profile_image: null,
    created_at: '2026-09-28T09:00:00Z',
    updated_at: '2026-09-28T09:00:00Z',
    ...overrides,
  }
}

/** One page of the list endpoint. */
export function makePage(results = [], { count = results.length, next = null, previous = null } = {}) {
  return { count, next, previous, results }
}
