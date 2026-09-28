import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../api/client'
import { listCountries, listDepartments } from '../../api/profiles'
import { ToastContext } from '../../hooks/useToast'
import { makeProfile } from '../../test/fixtures'
import ProfileForm from './ProfileForm'

vi.mock('../../api/profiles', () => ({
  listDepartments: vi.fn(),
  listCountries: vi.fn(),
}))

const showToast = vi.fn()

async function renderForm(props = {}) {
  const onSubmit = props.onSubmit || vi.fn().mockResolvedValue()
  const user = userEvent.setup()
  render(
    <ToastContext.Provider value={showToast}>
      <MemoryRouter>
        <ProfileForm submitLabel="Create profile" cancelTo="/" {...props} onSubmit={onSubmit} />
      </MemoryRouter>
    </ToastContext.Provider>,
  )
  // The form waits for the department and country suggestions before it shows.
  await screen.findByRole('button', { name: 'Create profile' })
  return { user, onSubmit }
}

const input = (label) => screen.getByLabelText(new RegExp(`^${label}`))

async function fillValidForm(user) {
  await user.type(input('First name'), 'Sara')
  await user.type(input('Last name'), 'Ahmed')
  await user.type(input('Username'), 'sara.ahmed')
  await user.type(input('Email'), '  sara@example.com ')
  await user.click(input('Gender'))
  await user.click(screen.getByRole('option', { name: 'Female' }))
  fireEvent.change(input('Date of birth'), { target: { value: '1992-03-04' } })
  await user.type(input('Job title'), 'Designer')
  await user.type(input('Department'), 'Design')
  fireEvent.change(input('Hire date'), { target: { value: '2021-06-01' } })
  await user.type(input('City'), 'Dubai')
  await user.type(input('Country'), 'Kuwait')
}

describe('ProfileForm', () => {
  beforeEach(() => {
    listDepartments.mockResolvedValue(['Design', 'Engineering'])
    listCountries.mockResolvedValue(['Kuwait'])
  })

  it('shows an error on every required field and does not submit an empty form', async () => {
    const { user, onSubmit } = await renderForm()

    await user.click(screen.getByRole('button', { name: 'Create profile' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('First name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Gender is required.')).toBeInTheDocument()
    expect(screen.getByText('Hire date is required.')).toBeInTheDocument()
    expect(screen.queryByText(/Phone is required/)).not.toBeInTheDocument()
    expect(input('First name')).toHaveAttribute('aria-invalid', 'true')
    expect(input('First name')).toHaveAccessibleDescription('First name is required.')
    // The first invalid field on screen gets focus.
    expect(input('First name')).toHaveFocus()
    expect(showToast).toHaveBeenCalledWith('Please fix the highlighted fields.', { tone: 'error' })
  })

  it('clears a field error as soon as that field is edited', async () => {
    const { user } = await renderForm()
    await user.click(screen.getByRole('button', { name: 'Create profile' }))

    await user.type(input('City'), 'D')

    expect(screen.queryByText('City is required.')).not.toBeInTheDocument()
    expect(screen.getByText('Country is required.')).toBeInTheDocument()
  })

  it('checks email format and date order before submitting', async () => {
    const { user, onSubmit } = await renderForm()
    await fillValidForm(user)
    await user.clear(input('Email'))
    await user.type(input('Email'), 'sara@example')
    fireEvent.change(input('Hire date'), { target: { value: '1990-01-01' } })

    await user.click(screen.getByRole('button', { name: 'Create profile' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Hire date must be after date of birth.')).toBeInTheDocument()
    expect(input('Email')).toHaveFocus()
  })

  it('submits trimmed values as FormData', async () => {
    const { user, onSubmit } = await renderForm()
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Create profile' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const data = onSubmit.mock.calls[0][0]
    expect(data).toBeInstanceOf(FormData)
    expect(data.get('email')).toBe('sara@example.com')
    expect(data.get('gender')).toBe('female')
    expect(data.get('is_active')).toBe('true')
    expect(data.has('profile_image')).toBe(false)
  })

  it('shows server validation errors on the matching fields', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError('Please fix the highlighted fields.', 400, { email: ['A user with this email already exists.'] }),
    )
    const { user } = await renderForm({ onSubmit })
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Create profile' }))

    expect(await screen.findByText('A user with this email already exists.')).toBeInTheDocument()
    expect(input('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(input('Email')).toHaveFocus()
    expect(showToast).toHaveBeenCalledWith('A user with this email already exists.', { tone: 'error' })
    // The button is usable again so the user can retry.
    expect(screen.getByRole('button', { name: 'Create profile' })).toBeEnabled()
  })

  it('reports other failures without marking fields', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError('Request failed (500).', 500, null))
    const { user } = await renderForm({ onSubmit })
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Create profile' }))

    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Could not save: Request failed (500).', { tone: 'error' }))
    expect(input('Email')).toHaveAttribute('aria-invalid', 'false')
  })

  it('starts from the existing values when editing', async () => {
    await renderForm({ profile: makeProfile({ first_name: 'Omar', is_active: false }) })

    expect(input('First name')).toHaveValue('Omar')
    expect(input('Gender')).toHaveTextContent('Female')
    expect(screen.getByRole('switch')).not.toBeChecked()
  })
})
