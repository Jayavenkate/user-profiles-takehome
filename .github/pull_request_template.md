## Summary

<!-- What does this PR do, in 2–4 sentences? -->

## Checklist

### Backend
- [ ] Django project set up with SQLite
- [ ] `UserProfile` model with one-to-one link to Django `User`
- [ ] Optional `profile_image` field with media storage configured
- [ ] Model registered in Django admin
- [ ] List endpoint with pagination (`page`, `page_size`, total count) and `search`
- [ ] Retrieve / Create / Update / Delete endpoints
- [ ] Create / update accept optional image upload (multipart)
- [ ] Import endpoint handling invalid records without crashing
- [ ] Input validation with useful error messages

### Frontend
- [ ] Client-side routes (`/`, `/profiles/new`, `/profiles/:id`, `/profiles/:id/edit`)
- [ ] List table with image thumbnail or placeholder
- [ ] Pagination and search kept in the URL
- [ ] Empty states (no data vs no search results) and profile-not-found
- [ ] Shared create/update form (not two copied forms)
- [ ] Image live preview; edit shows the current image
- [ ] Client-side validation plus API field errors
- [ ] Delete with confirmation
- [ ] Import button with result summary
- [ ] Loading, error and in-flight submit states
- [ ] Usable at ~768px width

### Documentation
- [ ] Setup instructions
- [ ] How it works (architecture, including frontend structure and image storage)
- [ ] API reference (include multipart image upload)
- [ ] Import behaviour (bad records, duplicates)
- [ ] Decisions & trade-offs
- [ ] Known issues

### Bonus (if any)
- [ ] Sortable columns
- [ ] Department / active filters
- [ ] Debounced search
- [ ] Frontend tests
- [ ] Backend tests
- [ ] Docker
- [ ] API docs (OpenAPI/Swagger)

## How to test

<!-- Step by step, how should the reviewer check your work? -->

## Import result

<!-- When you import data/user_profiles.json into an empty database, what is the result? Which records fail and why? -->

## Screenshots

<!-- List (with search / empty), detail, form (image preview), import result, narrow width -->

## Tools & resources used

<!-- Tutorials, docs, AI tools, etc. Be honest; it's fine to use them. -->

## Time spent

<!-- Approximate hours -->

## What I'd improve with more time

<!-- ... -->
