import test from 'node:test'
import assert from 'node:assert/strict'
import { validateRegistration, FIELD_ORDER } from '../src/utils/validation.js'
import { categories } from '../src/data/event.js'

test('Client-side Registration Validation Suite', async (t) => {
  const kidCategory = categories.find((c) => c.slug === 'kid')
  const teenCategory = categories.find((c) => c.slug === 'teen')
  const adultCategory = categories.find((c) => c.slug === 'adult')

  assert.ok(kidCategory, 'Kid category must exist')
  assert.ok(teenCategory, 'Teen category must exist')
  assert.ok(adultCategory, 'Adult category must exist')

  const validJuniorValues = {
    fullName: 'Aarav Sharma',
    email: 'aarav@example.com',
    phone: '9876543210',
    dob: '2014-05-10', // Age 12 -> kid
    occupation: 'Student',
    city: 'Salem',
    guardianName: 'Rajesh Sharma',
    guardianRelationship: 'Father',
    guardianPhone: '9876543211',
    guardianEmail: 'rajesh@example.com',
  }

  await t.test('1. Valid junior registration produces no errors', () => {
    const errors = validateRegistration(validJuniorValues, kidCategory)
    assert.deepStrictEqual(errors, {})
  })

  await t.test('2. Junior registration missing guardian name is blocked', () => {
    const errors = validateRegistration({ ...validJuniorValues, guardianName: '' }, kidCategory)
    assert.strictEqual(errors.guardianName, "Please enter the parent/guardian's full name.")
  })

  await t.test('3. Junior registration missing guardian relationship is blocked', () => {
    const errors = validateRegistration({ ...validJuniorValues, guardianRelationship: '' }, kidCategory)
    assert.strictEqual(errors.guardianRelationship, 'Please select your relationship to the participant.')
  })

  await t.test('4. Junior registration missing guardian phone number is blocked', () => {
    const errors = validateRegistration({ ...validJuniorValues, guardianPhone: '' }, kidCategory)
    assert.strictEqual(errors.guardianPhone, 'Please enter a valid parent/guardian contact number.')
  })

  await t.test('5. Junior registration missing guardian email is blocked', () => {
    const errors = validateRegistration({ ...validJuniorValues, guardianEmail: '' }, kidCategory)
    assert.strictEqual(errors.guardianEmail, 'Please enter a valid parent/guardian email address.')
  })

  await t.test('6. Teen registration enforces same mandatory parent/guardian fields', () => {
    const teenValues = {
      fullName: 'Priya Teen',
      email: 'priya@example.com',
      phone: '9876543210',
      dob: '2011-04-12', // Age 15 -> teen
      occupation: 'Student',
      city: 'Salem',
      guardianName: '',
      guardianRelationship: '',
      guardianPhone: '',
      guardianEmail: '',
    }
    const errors = validateRegistration(teenValues, teenCategory)
    assert.strictEqual(errors.guardianName, "Please enter the parent/guardian's full name.")
    assert.strictEqual(errors.guardianRelationship, 'Please select your relationship to the participant.')
    assert.strictEqual(errors.guardianPhone, 'Please enter a valid parent/guardian contact number.')
    assert.strictEqual(errors.guardianEmail, 'Please enter a valid parent/guardian email address.')
  })

  await t.test('7. Invalid phone numbers and emails for guardian are blocked', () => {
    const errors = validateRegistration(
      {
        ...validJuniorValues,
        guardianPhone: 'invalid-phone',
        guardianEmail: 'invalid-email',
      },
      kidCategory
    )
    assert.strictEqual(errors.guardianPhone, 'Please enter a valid parent/guardian contact number.')
    assert.strictEqual(errors.guardianEmail, 'Please enter a valid parent/guardian email address.')
  })

  await t.test('8. Whitespace-only values for guardian fields are blocked', () => {
    const errors = validateRegistration(
      {
        ...validJuniorValues,
        guardianName: '   ',
        guardianRelationship: '   ',
        guardianPhone: '   ',
        guardianEmail: '   ',
      },
      kidCategory
    )
    assert.strictEqual(errors.guardianName, "Please enter the parent/guardian's full name.")
    assert.strictEqual(errors.guardianRelationship, 'Please select your relationship to the participant.')
    assert.strictEqual(errors.guardianPhone, 'Please enter a valid parent/guardian contact number.')
    assert.strictEqual(errors.guardianEmail, 'Please enter a valid parent/guardian email address.')
  })

  await t.test('9. Adult registration does not enforce guardian fields', () => {
    const adultValues = {
      fullName: 'Suresh Kumar',
      email: 'suresh@example.com',
      phone: '9876543210',
      dob: '1995-05-10', // Age 31 -> adult
      occupation: 'Working Professional',
      city: 'Salem',
      guardianName: '',
      guardianRelationship: '',
      guardianPhone: '',
      guardianEmail: '',
    }
    const errors = validateRegistration(adultValues, adultCategory)
    assert.deepStrictEqual(errors, {})
  })

  await t.test('10. FIELD_ORDER includes guardian fields in logical order for error focus', () => {
    assert.ok(FIELD_ORDER.includes('guardianName'))
    assert.ok(FIELD_ORDER.includes('guardianRelationship'))
    assert.ok(FIELD_ORDER.includes('guardianPhone'))
    assert.ok(FIELD_ORDER.includes('guardianEmail'))
    assert.ok(FIELD_ORDER.indexOf('guardianName') < FIELD_ORDER.indexOf('guardianRelationship'))
    assert.ok(FIELD_ORDER.indexOf('guardianRelationship') < FIELD_ORDER.indexOf('guardianPhone'))
    assert.ok(FIELD_ORDER.indexOf('guardianPhone') < FIELD_ORDER.indexOf('guardianEmail'))
  })
})
