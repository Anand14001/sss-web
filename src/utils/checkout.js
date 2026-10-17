import { api, loadRazorpayCheckout } from './api'
import { event } from '../data/event'

/**
 * Razorpay Checkout, driven in one place.
 *
 * Both the registration form and the status page need to open checkout against
 * a server-created order and reach the same conclusion about what happened, so
 * the sequence lives here rather than being written twice.
 *
 * Three things this gets right that an inline version did not:
 *
 *  · The outcome is decided by a local flag, not by reading React state from
 *    inside a callback. A callback handed to Razorpay closes over the render
 *    that created it, so `status` seen in `ondismiss` is whatever it was when
 *    checkout opened — never the value it has by the time the modal closes.
 *
 *  · A declined card does not end the attempt. Razorpay keeps its modal open
 *    after `payment.failed` so the visitor can try another method; the old
 *    code switched the page underneath to a failure screen, leaving two
 *    contradictory views on screen at once. The error is remembered and only
 *    reported if the visitor then gives up and closes the modal.
 *
 *  · A payment that succeeded but could not be verified is reported as
 *    PENDING, never as failed. They are not the same thing: offering "retry
 *    payment" for money that has already left someone's account is how people
 *    get charged twice.
 */

/** Poll the status endpoint, for when the webhook confirms before we do.
 *  30s total — a webhook round trip can comfortably exceed the 15s the first
 *  version allowed. */
async function pollUntilPaid(reference, { attempts = 10, intervalMs = 3000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    try {
      const res = await api.getRegistrationStatus(reference)
      const reg = res.registration
      if (
        reg?.status === 'PAID' ||
        reg?.status === 'CONFIRMED' ||
        Boolean(reg?.isConfirmed) ||
        reg?.paymentStatus === 'CAPTURED'
      ) {
        return reg
      }
    } catch {
      // A transient failure mid-poll is not an answer. Keep asking.
    }
  }
  return null
}

/**
 * Opens checkout for an order and resolves the outcome through callbacks.
 *
 * `onFailed` receives `{ reason, pending }`. When `pending` is true the money
 * may well have been taken — the caller must offer "check status", not "pay
 * again".
 */
export async function openCheckout({
  order,
  reference,
  description,
  prefill = {},
  onVerifying,
  onConfirmed,
  onFailed
}) {
  const Razorpay = await loadRazorpayCheckout()

  // Set the moment Razorpay hands back a payment: from then on the outcome
  // belongs to the handler, and a modal close is just the modal closing.
  let handled = false
  let lastError = null

  const options = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: event.name,
    description,
    image: '/images/title-logo.png',
    order_id: order.id,
    prefill,
    theme: { color: '#102E52' },

    modal: {
      ondismiss: () => {
        if (handled) return
        onFailed({
          reason:
            lastError ||
            'The payment window was closed before the payment completed. Your details are saved — you can pay for the same registration without filling the form again.',
          pending: false
        })
      }
    },

    handler: async (response) => {
      handled = true
      onVerifying?.()

      try {
        const res = await api.verifyPayment({
          registrationReference: reference,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        })

        if (!res.success) throw new Error('Verification returned an unconfirmed status.')

        onConfirmed({
          registration: res.registration,
          paymentId: response.razorpay_payment_id
        })
        return
      } catch (err) {
        console.error('Payment verification failed:', err)
      }

      // Verification did not answer. The webhook may still confirm it, so ask
      // the server rather than assuming the worst.
      const polled = await pollUntilPaid(reference)
      if (polled) {
        onConfirmed({ registration: polled, paymentId: response.razorpay_payment_id })
        return
      }

      onFailed({
        reason:
          'Your payment went through, but we could not confirm it in time. Do not pay again — check the status of your registration in a few minutes, or contact the organisers with your reference.',
        pending: true
      })
    }
  }

  const rzp = new Razorpay(options)

  // Not an outcome on its own: the modal stays open so another method can be
  // tried. Remember why, and report it only if the visitor gives up.
  rzp.on('payment.failed', (resp) => {
    lastError = resp.error?.description || 'The payment was unsuccessful.'
  })

  rzp.open()
}
