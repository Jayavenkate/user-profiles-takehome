import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { listCountries, listDepartments } from '../../api/profiles'
import useFetch from '../../hooks/useFetch'
import { validateImage, validateProfile } from '../../utils/validateProfile'
import { BriefcaseIcon, CameraIcon, FileTextIcon, IdCardIcon, UserIcon } from '../Icons'
import FormField from './FormField'
import FormSection from './FormSection'
import Combobox from './Combobox'
import ImageInput from './ImageInput'
import Select from './Select'
import Spinner, { LoadingState } from '../Spinner'
import useToast from '../../hooks/useToast'

const EMPTY_VALUES = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  gender: '',
  date_of_birth: '',
  job_title: '',
  department: '',
  city: '',
  country: '',
  bio: '',
  hire_date: '',
  is_active: true,
}

function toFormValues(profile) {
  if (!profile) return EMPTY_VALUES
  return Object.fromEntries(Object.keys(EMPTY_VALUES).map((key) => [key, profile[key] ?? EMPTY_VALUES[key]]))
}

// API errors look like { email: ['...'] }. Keep the first message per field;
// anything that isn't a form field is shown in an error toast.
function splitApiErrors(data) {
  const fieldErrors = {}
  const otherErrors = []
  Object.entries(data || {}).forEach(([key, messages]) => {
    const message = [].concat(messages)[0]
    if (key in EMPTY_VALUES || key === 'profile_image') fieldErrors[key] = message
    else otherErrors.push(message)
  })
  return { fieldErrors, otherErrors }
}

/**
 * Shared by the create and edit pages.
 * `onSubmit(formData)` must return a promise; it rejects with an ApiError on failure.
 */
export default function ProfileForm({ profile = null, submitLabel, cancelTo, onSubmit }) {
  const [values, setValues] = useState(() => toFormValues(profile))
  const [errors, setErrors] = useState({})
  const showToast = useToast()
  const [submitting, setSubmitting] = useState(false)

  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const previewRef = useRef(null)
  const formRef = useRef(null)
  // Suggestions for the department and country boxes, so people reuse existing names.
  const departments = useFetch((signal) => listDepartments(signal), [])
  const countries = useFetch((signal) => listCountries(signal), [])

  // Free the last preview URL when leaving the page.
  useEffect(() => () => previewRef.current && URL.revokeObjectURL(previewRef.current), [])

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setField(name, type === 'checkbox' ? checked : value)
  }

  function selectImage(file) {
    const error = validateImage(file)
    setErrors((prev) => ({ ...prev, profile_image: error || undefined }))
    if (error) return

    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = file ? URL.createObjectURL(file) : null
    setImageFile(file)
    setPreviewUrl(previewRef.current)
    if (file) setRemoveImage(false)
  }

  // Focus the first invalid field in the order it appears on screen.
  function focusFirstError(fieldErrors) {
    const ids = Object.keys(fieldErrors).filter((key) => fieldErrors[key]).map((key) => `field-${key}`)
    const controls = formRef.current ? Array.from(formRef.current.elements) : []
    controls.find((control) => ids.includes(control.id))?.focus()
  }

  function buildFormData() {
    const data = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      data.append(key, typeof value === 'string' ? value.trim() : String(value))
    })
    if (imageFile) data.append('profile_image', imageFile)
    // An empty value tells the API to clear the image.
    else if (removeImage) data.append('profile_image', '')
    return data
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const clientErrors = validateProfile(values, imageFile)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) {
      showToast('Please fix the highlighted fields.', { tone: 'error' })
      focusFirstError(clientErrors)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(buildFormData())
      // On success the page navigates away, so there's nothing more to do here.
    } catch (error) {
      setSubmitting(false)
      if (error.status === 400 && error.data) {
        const { fieldErrors, otherErrors } = splitApiErrors(error.data)
        setErrors(fieldErrors)
        // With a single field error, its own message (e.g. "A user with this email already exists.") is clearest.
        const fieldMessages = Object.values(fieldErrors)
        const summary = otherErrors[0]
          || (fieldMessages.length === 1 ? fieldMessages[0] : 'The server rejected some fields. Please check them below.')
        showToast(summary, { tone: 'error' })
        focusFirstError(fieldErrors)
      } else {
        showToast(`Could not save: ${error.message}`, { tone: 'error' })
      }
    }
  }

  // Small helper so each text field is one line below.
  const field = (name, label, { type = 'text', required = true, hint, className, ...inputProps } = {}) => (
    <FormField name={name} label={label} required={required} hint={hint} error={errors[name]} className={className}>
      {(props) => <input {...props} type={type} value={values[name]} onChange={handleChange} {...inputProps} />}
    </FormField>
  )

  const displayName = `${values.first_name} ${values.last_name}`.trim()

  // Wait for the dropdown options on first load so the form doesn't appear half-empty.
  if ((departments.loading && !departments.data) || (countries.loading && !countries.data)) {
    return <LoadingState label="Loading form…" />
  }

  return (
    <form ref={formRef} className="profile-form" onSubmit={handleSubmit} noValidate>

      <div className="form-panel">
        <FormSection
          icon={<CameraIcon size={18} />}
          title="Profile photo"
          description="Optional. Shown in the directory."
          grid={false}
        >
          <ImageInput
            previewUrl={previewUrl}
            currentUrl={profile?.profile_image}
            removed={removeImage}
            name={displayName}
            error={errors.profile_image}
            onSelect={selectImage}
            onClearSelection={() => selectImage(null)}
            onRemove={() => setRemoveImage(true)}
            onUndoRemove={() => setRemoveImage(false)}
          />
        </FormSection>

        <FormSection icon={<UserIcon size={18} />} title="Account" description="Name and login details.">
          {field('first_name', 'First name', { autoComplete: 'given-name', placeholder: 'e.g. Sara' })}
          {field('last_name', 'Last name', { autoComplete: 'family-name', placeholder: 'e.g. Ahmed' })}
          {field('username', 'Username', {
            autoComplete: 'off',
            placeholder: 'e.g. sara.ahmed',
            hint: 'Letters, numbers and . _ @ + - only.',
          })}
          {field('email', 'Email', {
            type: 'email',
            autoComplete: 'email',
            placeholder: 'name@company.com',
            className: 'form-field-span-2',
          })}
        </FormSection>

        <FormSection icon={<IdCardIcon size={18} />} title="Personal" description="Basic personal information.">
          <FormField name="gender" label="Gender" required error={errors.gender}>
            {(props) => (
              <Select
                {...props}
                value={values.gender}
                options={GENDERS}
                placeholder="Select gender"
                onChange={(value) => setField('gender', value)}
              />
            )}
          </FormField>
          {field('date_of_birth', 'Date of birth', { type: 'date' })}
          {field('phone', 'Phone', { type: 'tel', required: false, autoComplete: 'tel', placeholder: '+965 1234 5678' })}
        </FormSection>

        <FormSection icon={<BriefcaseIcon size={18} />} title="Work" description="Role, team and location.">
          {field('job_title', 'Job title', { placeholder: 'e.g. Product Designer' })}
          <FormField name="department" label="Department" required error={errors.department}>
            {(props) => (
              <Combobox
                {...props}
                value={values.department}
                options={departments.data || []}
                placeholder="Select department"
                onChange={(value) => setField('department', value)}
              />
            )}
          </FormField>
          {field('hire_date', 'Hire date', { type: 'date' })}
          {field('city', 'City', { placeholder: 'e.g. Riyadh' })}
          <FormField name="country" label="Country" required error={errors.country}>
            {(props) => (
              <Combobox
                {...props}
                value={values.country}
                options={countries.data || []}
                placeholder="Select country"
                onChange={(value) => setField('country', value)}
              />
            )}
          </FormField>
          <div className="form-field">
            <label htmlFor="field-is_active">Status</label>
            <label className="switch-field">
              <input
                id="field-is_active"
                type="checkbox"
                role="switch"
                className="switch"
                name="is_active"
                checked={values.is_active}
                onChange={handleChange}
              />
              <span className="switch-state">{values.is_active ? 'Active' : 'Inactive'}</span>
            </label>
          </div>
        </FormSection>

        <FormSection icon={<FileTextIcon size={18} />} title="About" description="A short bio shown on the profile page.">
          <FormField name="bio" label="Bio" error={errors.bio} className="form-field-wide">
            {(props) => (
              <textarea
                {...props}
                rows={5}
                value={values.bio}
                onChange={handleChange}
                placeholder="A few words about their work and interests…"
              />
            )}
          </FormField>
        </FormSection>

        <div className="form-actions">
          <div className="form-actions-buttons">
            <Link to={cancelTo} className="button">Cancel</Link>
            <button type="submit" className="button button-primary" disabled={submitting}>
              {submitting ? <Spinner label="Saving…" /> : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

const GENDERS = [
  ['male', 'Male'],
  ['female', 'Female'],
]
