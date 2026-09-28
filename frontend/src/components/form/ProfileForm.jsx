import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { validateImage, validateProfile } from '../../utils/validateProfile'
import FormField from './FormField'
import ImageInput from './ImageInput'

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
// anything that isn't a form field is shown at the top of the form.
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
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const previewRef = useRef(null)
  const formRef = useRef(null)

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
    setFormError(null)

    const clientErrors = validateProfile(values, imageFile)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) {
      setFormError('Please fix the highlighted fields.')
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
        setFormError(otherErrors[0] || 'The server rejected some fields. Please check them below.')
        focusFirstError(fieldErrors)
      } else {
        setFormError(`Could not save: ${error.message}`)
      }
    }
  }

  // Small helper so each text field is one line below.
  const field = (name, label, { type = 'text', required = true, ...inputProps } = {}) => (
    <FormField name={name} label={label} required={required} error={errors[name]}>
      {(props) => <input {...props} type={type} value={values[name]} onChange={handleChange} {...inputProps} />}
    </FormField>
  )

  return (
    <form ref={formRef} className="card profile-form" onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert alert-error" role="alert">{formError}</div>}

      <fieldset>
        <legend>Profile image</legend>
        <ImageInput
          previewUrl={previewUrl}
          currentUrl={profile?.profile_image}
          removed={removeImage}
          name={`${values.first_name} ${values.last_name}`.trim()}
          error={errors.profile_image}
          onSelect={selectImage}
          onClearSelection={() => selectImage(null)}
          onRemove={() => setRemoveImage(true)}
          onUndoRemove={() => setRemoveImage(false)}
        />
      </fieldset>

      <fieldset>
        <legend>Account</legend>
        <div className="form-grid">
          {field('first_name', 'First name', { autoComplete: 'given-name' })}
          {field('last_name', 'Last name', { autoComplete: 'family-name' })}
          {field('username', 'Username', { autoComplete: 'off' })}
          {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Personal</legend>
        <div className="form-grid">
          <FormField name="gender" label="Gender" required error={errors.gender}>
            {(props) => (
              <select {...props} value={values.gender} onChange={handleChange}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            )}
          </FormField>
          {field('date_of_birth', 'Date of birth', { type: 'date' })}
          {field('phone', 'Phone', { type: 'tel', required: false, autoComplete: 'tel' })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Work</legend>
        <div className="form-grid">
          {field('job_title', 'Job title')}
          {field('department', 'Department')}
          {field('city', 'City')}
          {field('country', 'Country')}
          {field('hire_date', 'Hire date', { type: 'date' })}
          <div className="form-field checkbox-field">
            <label>
              <input type="checkbox" name="is_active" checked={values.is_active} onChange={handleChange} />
              Active
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>About</legend>
        <FormField name="bio" label="Bio" error={errors.bio}>
          {(props) => <textarea {...props} rows={4} value={values.bio} onChange={handleChange} />}
        </FormField>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        <Link to={cancelTo} className="button">Cancel</Link>
      </div>
    </form>
  )
}
