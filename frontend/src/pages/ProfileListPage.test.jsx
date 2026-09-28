import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { listProfiles } from '../api/profiles'
import { ToastContext } from '../hooks/useToast'
import { makePage, makeProfile } from '../test/fixtures'
import ProfileListPage from './ProfileListPage'

vi.mock('../api/profiles', () => ({
  listProfiles: vi.fn(),
  deleteProfile: vi.fn(),
  importProfiles: vi.fn(),
  listDepartments: vi.fn().mockResolvedValue([]),
}))

function renderList(url = '/') {
  render(
    <ToastContext.Provider value={vi.fn()}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/" element={<ProfileListPage />} />
        </Routes>
      </MemoryRouter>
    </ToastContext.Provider>,
  )
  return userEvent.setup()
}

const lastListCall = () => listProfiles.mock.calls.at(-1)[0]

describe('ProfileListPage', () => {
  beforeEach(() => {
    listProfiles.mockResolvedValue(makePage())
  })

  it('invites the user to add or import profiles when there are none', async () => {
    renderList()

    expect(await screen.findByRole('heading', { name: 'No profiles yet' })).toBeInTheDocument()
    expect(screen.getByText(/Import JSON/, { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New profile' })).toHaveAttribute('href', '/profiles/new')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    // There's nothing to search, filter or act on yet.
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('says when a search has no results and can clear it', async () => {
    const user = renderList('/?search=zzz&status=inactive')

    expect(await screen.findByRole('heading', { name: 'No profiles match “zzz”' })).toBeInTheDocument()
    expect(lastListCall()).toMatchObject({ search: 'zzz', filters: { is_active: 'false' } })

    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }))

    expect(await screen.findByRole('heading', { name: 'No profiles yet' })).toBeInTheDocument()
    expect(lastListCall()).toMatchObject({ search: '', filters: { is_active: undefined } })
  })

  it('says when only the filters exclude everything', async () => {
    renderList('/?department=Legal')

    expect(await screen.findByRole('heading', { name: 'No profiles match these filters' })).toBeInTheDocument()
    expect(screen.getByText('Department: Legal')).toBeInTheDocument()
  })

  it('shows a load error with a retry button', async () => {
    listProfiles.mockRejectedValueOnce(new ApiError('Could not reach the server.', 0, null))
    const user = renderList()

    expect(await screen.findByRole('heading', { name: 'Could not load profiles' })).toBeInTheDocument()
    expect(screen.getByText('Could not reach the server.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'No profiles yet' })).toBeInTheDocument()
    expect(listProfiles).toHaveBeenCalledTimes(2)
  })

  it('offers the first page when the page number is past the end', async () => {
    listProfiles.mockRejectedValueOnce(new ApiError('Invalid page.', 404, null))
    const user = renderList('/?page=9')

    await user.click(await screen.findByRole('button', { name: 'Go to first page' }))

    await waitFor(() => expect(lastListCall()).toMatchObject({ page: 1 }))
  })

  it('lists profiles and sorts when a column header is clicked', async () => {
    listProfiles.mockResolvedValue(makePage([makeProfile(), makeProfile({ id: 2, username: 'omar', first_name: 'Omar', email: 'omar@example.com' })]))
    const user = renderList()

    const table = await screen.findByRole('table')
    expect(within(table).getByRole('link', { name: 'Sara Ahmed' })).toBeInTheDocument()
    expect(within(table).getByRole('link', { name: 'Omar Ahmed' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: 'sara.ahmed' })).toBeInTheDocument()
    expect(lastListCall().ordering).toBe('')

    const nameHeader = screen.getByRole('columnheader', { name: 'Name' })
    await user.click(within(nameHeader).getByRole('button'))
    await waitFor(() => expect(lastListCall().ordering).toBe('name'))
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')

    await user.click(within(nameHeader).getByRole('button'))
    await waitFor(() => expect(lastListCall().ordering).toBe('-name'))
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('searches once typing pauses, not on every keystroke', async () => {
    listProfiles.mockResolvedValue(makePage([makeProfile()]))
    const user = renderList()
    await screen.findByRole('table')
    const callsBefore = listProfiles.mock.calls.length

    await user.type(screen.getByRole('searchbox'), 'sara')

    await waitFor(() => expect(lastListCall().search).toBe('sara'))
    expect(listProfiles.mock.calls.length - callsBefore).toBe(1)
    expect(screen.getByRole('searchbox')).toHaveFocus()
  })
})
