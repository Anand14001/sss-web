import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  CreditCard,
  Home,
  Loader2,
  Lock,
  MapPin,
  PhoneCall,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  TicketPercent,
  X
} from 'lucide-react'
import { api, loadRazorpayCheckout } from '../utils/api'
import { event, formatFee } from '../data/event'
import { validateCouponCode } from '../utils/validation'
import WhatsAppGroupCTA from '../components/WhatsAppGroupCTA'

export default function ParticipantPayment() {
  const { token } = useParams()

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Payment process state: null | 'ordering' | 'verifying' | 'confirmed' | 'failed'
  const [payPhase, setPayPhase] = useState(null)
  const [payError, setPayError] = useState(null)
  const [confirmedReceipt, setConfirmedReceipt] = useState(null)

  // Coupon state
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState(null)
  const [couponSuccess, setCouponSuccess] = useState(null)

  const handleApplyCoupon = async (e) => {
    e?.preventDefault()
    setCouponError(null)
    setCouponSuccess(null)
    const err = validateCouponCode(couponInput)
    if (err) {
      setCouponError(err)
      return
    }

    setCouponLoading(true)
    try {
      const res = await api.applyInvitationCoupon(token, couponInput.trim())
      if (res.success) {
        if (res.freeRegistration) {
          setConfirmedReceipt({
            paymentId: 'COMPLIMENTARY',
            orderId: `FREE-${invitation.reference}`,
            registration: res.invitation
          })
          setPayPhase('confirmed')
          setInvitation((prev) => ({
            ...prev,
            ...res.invitation,
            status: 'CONFIRMED',
            isPayable: false,
            payable: false
          }))
          return
        }

        setInvitation((prev) => ({
          ...prev,
          amountPaise: res.invitation.amountPaise,
          amountRupees: res.invitation.amountRupees,
          baseAmountPaise: res.invitation.baseAmountPaise,
          baseAmountRupees: res.invitation.baseAmountRupees,
          discountPaise: res.invitation.discountPaise,
          discountRupees: res.invitation.discountRupees,
          coupon: res.invitation.coupon,
          couponCode: res.invitation.coupon?.code
        }))
        setCouponSuccess(res.message || 'Coupon applied successfully!')
        setCouponInput('')
      } else {
        setCouponError(res.error || res.message || 'Failed to apply coupon.')
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid or ineligible coupon code.')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = async () => {
    setCouponError(null)
    setCouponSuccess(null)
    setCouponLoading(true)
    try {
      const res = await api.removeInvitationCoupon(token)
      if (res.success) {
        setInvitation((prev) => ({
          ...prev,
          amountPaise: res.invitation.amountPaise,
          amountRupees: res.invitation.amountRupees,
          baseAmountPaise: res.invitation.baseAmountPaise,
          baseAmountRupees: res.invitation.baseAmountRupees,
          discountPaise: 0,
          discountRupees: 0,
          coupon: null,
          couponCode: null
        }))
        setCouponInput('')
      } else {
        setCouponError(res.error || res.message || 'Failed to remove coupon.')
      }
    } catch (err) {
      setCouponError(err.message || 'Failed to remove coupon.')
    } finally {
      setCouponLoading(false)
    }
  }

  const fetchInvitation = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const res = await api.getInvitation(token)
      setInvitation(res.invitation)
      if (res.invitation?.status === 'PAID' || res.invitation?.status === 'CONFIRMED') {
        setPayPhase('confirmed')
      }
    } catch (err) {
      setError(err.message || 'Unable to load payment invitation details.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchInvitation()
  }, [fetchInvitation])

  useEffect(() => {
    if (invitation?.fullName) {
      document.title = `Payment Invitation for ${invitation.fullName} — ${event.name}`
    } else {
      document.title = `Payment Invitation — ${event.name}`
    }
  }, [invitation])

  const handleCopy = () => {
    if (!invitation?.reference) return
    navigator.clipboard?.writeText(invitation.reference).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handlePayNow = async () => {
    if (payPhase === 'ordering' || payPhase === 'verifying') return
    setPayError(null)
    setPayPhase('ordering')

    // Handle 100% complimentary registration
    if (invitation.amountRupees === 0) {
      try {
        const orderRes = await api.createInvitationOrder(token)
        if (orderRes.freeRegistration || orderRes.success) {
          setConfirmedReceipt({
            paymentId: 'COMPLIMENTARY',
            orderId: `FREE-${invitation.reference}`,
            registration: {
              ...invitation,
              status: 'CONFIRMED'
            }
          })
          setPayPhase('confirmed')
          setInvitation((prev) => ({ ...prev, status: 'CONFIRMED', isPayable: false, payable: false }))
          return
        }
      } catch (err) {
        setPayError(err.message || 'Failed to confirm complimentary registration.')
        setPayPhase('failed')
        return
      }
    }

    try {
      // 1. Create or retrieve checkout order for this invitation
      const orderRes = await api.createInvitationOrder(token)
      const order = orderRes.order

      // 2. Load Razorpay script
      const Razorpay = await loadRazorpayCheckout()

      setPayPhase(null)

      let handled = false
      let lastError = null

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: event.name,
        description: `Contest Entry Fee — ${invitation.categoryName || 'Salem Star Speaker'}`,
        image: '/images/title-logo.png',
        order_id: order.id,
        prefill: {
          name: invitation.fullName,
          email: invitation.email,
        },
        theme: { color: '#102E52' },

        modal: {
          ondismiss: () => {
            if (handled) return
            setPayError(
              lastError ||
                'The payment window was closed before completion. You can click the button below to retry when ready.'
            )
            setPayPhase(null)
          }
        },

        handler: async (response) => {
          handled = true
          setPayPhase('verifying')

          try {
            const verifyRes = await api.verifyPayment({
              registrationReference: invitation.reference,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invitationToken: token
            })

            if (verifyRes.success) {
              setConfirmedReceipt({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                registration: verifyRes.registration
              })
              setPayPhase('confirmed')
              setInvitation((prev) => ({ ...prev, status: 'PAID', isPayable: false, payable: false }))
            } else {
              throw new Error('Payment confirmation could not be verified by the server.')
            }
          } catch (verErr) {
            console.error('Verification error:', verErr)
            setPayError(
              'Your payment may have succeeded at the gateway but is taking a moment to verify. Please wait a few seconds and refresh this page.'
            )
            setPayPhase('failed')
          }
        }
      }

      const rzp = new Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        lastError = resp.error?.description || 'Payment was declined by your bank or card issuer.'
      })
      rzp.open()
    } catch (err) {
      console.error('Checkout error:', err)
      setPayError(err.message || 'Failed to initiate secure checkout. Please try again.')
      setPayPhase('failed')
    }
  }

  const isConfirmed = payPhase === 'confirmed' || invitation?.status === 'PAID' || invitation?.status === 'CONFIRMED'
  const isExpired = invitation?.status === 'EXPIRED'
  const isRejected = invitation?.status === 'REJECTED'
  const isCancelled = invitation?.status === 'CANCELLED'
  const isPayable = invitation?.isPayable || invitation?.payable

  const expiryFormatted = invitation?.expiresAt
    ? new Date(invitation.expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null

  return (
    <div className="min-h-screen bg-ivory text-navy selection:bg-gold selection:text-navy">
      {/* Masthead */}
      <header className="sticky top-0 z-40 band-dark band-dark-bottom text-white print:hidden">
        <div className="shell flex items-center justify-between gap-4 py-5">
          <Link to="/" className="flex min-h-11 shrink-0 items-center" aria-label={`${event.name} — home`}>
            <img
              src="/images/title-logo.png"
              alt={`${event.name} — ${event.tagline}`}
              width="2172"
              height="724"
              className="h-10 w-auto max-w-[min(58vw,15rem)] object-contain sm:h-12"
            />
          </Link>

          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/20"
          >
            <Home size={16} aria-hidden="true" />
            <span>Salem Star Speaker</span>
          </Link>
        </div>
      </header>

      <main className="shell py-8 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl">
          {/* Loading State */}
          {loading && (
            <div className="surface flex flex-col items-center justify-center rounded-3xl p-12 text-center shadow-lg">
              <Loader2 size={36} className="animate-spin text-gold" />
              <p className="mt-4 font-sans text-base font-semibold text-navy">Loading payment invitation...</p>
              <p className="mt-1 font-sans text-sm text-muted">Retrieving verified participant and fee details.</p>
            </div>
          )}

          {/* Invalid / Not Found Error */}
          {!loading && error && (
            <div className="surface rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <ShieldAlert size={32} />
              </div>
              <h2 className="mt-4 font-sans text-2xl font-bold text-navy">Invalid or Expired Payment Link</h2>
              <p className="mt-2 font-sans text-sm text-muted sm:text-base">
                {error}
              </p>
              <p className="mt-3 font-sans text-xs text-muted">
                Each payment link is unique and bound to a specific shortlisted participant.
                If you believe this link should be active, please contact the organizers.
              </p>

              <div className="mt-6 flex justify-center">
                <Link
                  to="/"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-6 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-navy-mid cursor-pointer"
                >
                  <Home size={16} />
                  <span>Return to Homepage</span>
                </Link>
              </div>
            </div>
          )}

          {/* Main Card */}
          {!loading && !error && invitation && (
            <div className="surface overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-xl sm:p-10">
              {/* Confirmed State */}
              {isConfirmed ? (
                <div className="text-center">
                  <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                    <CheckCircle2 size={44} strokeWidth={2.2} />
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    <Check size={14} className="text-emerald-600" />
                    <span>Payment Verified · Seat Confirmed</span>
                  </div>

                  <h1 className="display mt-4 text-3xl font-black text-navy sm:text-4xl">
                    Registration Confirmed!
                  </h1>

                  <p className="mt-3 font-sans text-base text-muted">
                    Thank you, <strong className="font-semibold text-navy">{invitation.fullName}</strong>.
                    Your payment of <strong className="font-semibold text-navy">₹{invitation.amountRupees}</strong> has been received and verified.
                    Your speaking slot is secured!
                  </p>

                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-center">
                    <p className="eyebrow text-xs text-emerald-800">Confirmed Reference</p>
                    <div className="mt-1 flex items-center justify-center gap-2">
                      <span className="font-mono text-2xl font-black text-navy">{invitation.reference}</span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="rounded-lg bg-white/80 p-1.5 text-navy shadow-xs hover:bg-white active:scale-95 cursor-pointer"
                      >
                        {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl bg-ivory/60 p-5 text-left">
                    <h3 className="eyebrow text-xs text-gold-dim">Receipt &amp; Event Details</h3>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-muted">Category</dt>
                        <dd className="font-semibold text-navy">{invitation.categoryName} ({invitation.categoryLabel})</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">Amount Paid</dt>
                        <dd className="font-semibold text-navy">₹{invitation.amountRupees}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">Contest Date</dt>
                        <dd className="font-semibold text-navy">{event.date.display}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">Venue</dt>
                        <dd className="font-semibold text-navy">{event.venue.name}, {event.venue.city}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Official WhatsApp Group CTA (Stage E) */}
                  <WhatsAppGroupCTA
                    className="mt-6 text-center"
                    title="Booking Confirmed!"
                    description="Your payment has been successfully verified. Join our official WhatsApp group to stay informed about contest announcements, updates, and participant instructions."
                    buttonText="Join WhatsApp Group"
                  />

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center print:hidden">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-navy/20 bg-white px-6 py-2.5 font-sans text-sm font-semibold text-navy hover:bg-navy/5 cursor-pointer"
                    >
                      <Printer size={16} />
                      <span>Print Confirmation Receipt</span>
                    </button>

                    <Link
                      to="/"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-navy px-8 py-2.5 font-sans text-sm font-semibold text-white hover:bg-navy-mid cursor-pointer"
                    >
                      <span>Return Home</span>
                    </Link>
                  </div>
                </div>
              ) : isExpired ? (
                /* Expired State */
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Clock size={32} />
                  </div>
                  <h2 className="font-sans text-2xl font-bold text-navy">Invitation Expired</h2>
                  <p className="mt-2 font-sans text-sm text-muted">
                    This payment link expired on <strong className="font-medium text-navy">{expiryFormatted}</strong>.
                    Payment invitations have a time limit to allow other applicants an opportunity if seats are constrained.
                  </p>
                  <p className="mt-3 font-sans text-sm text-muted">
                    Please contact the organizers to request a re-issued payment invitation.
                  </p>
                </div>
              ) : isRejected || isCancelled ? (
                /* Ineligible State */
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <AlertCircle size={32} />
                  </div>
                  <h2 className="font-sans text-2xl font-bold text-navy">Invitation No Longer Active</h2>
                  <p className="mt-2 font-sans text-sm text-muted">
                    This invitation has been cancelled or the application is no longer active.
                  </p>
                </div>
              ) : (
                /* Active Payable State */
                <div>
                  <div className="flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3.5 py-1 text-xs font-bold text-navy">
                      <Sparkles size={13} className="text-gold-dim" />
                      <span>Official Shortlisted Participant</span>
                    </div>

                    <h1 className="display mt-3 text-3xl font-black text-navy sm:text-4xl">
                      Complete Registration Payment
                    </h1>

                    <p className="mt-2 font-sans text-sm text-muted">
                      Congratulations! Your application for <strong className="font-semibold text-navy">{event.name}</strong> has been shortlisted.
                      Please complete your entry fee payment to confirm your seat.
                    </p>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="mt-8 rounded-2xl border border-navy/10 bg-ivory/50 p-6">
                    <div className="flex items-center justify-between border-b border-navy/10 pb-4">
                      <div>
                        <span className="text-xs text-muted uppercase tracking-wider">Participant</span>
                        <h3 className="font-sans text-lg font-bold text-navy">{invitation.fullName}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted uppercase tracking-wider">Category</span>
                        <p className="font-sans text-sm font-bold text-navy">
                          {invitation.categoryName} ({invitation.categoryLabel})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4">
                      <span className="font-sans text-sm text-muted">Application Reference</span>
                      <span className="font-mono text-sm font-bold text-navy">{invitation.reference}</span>
                    </div>

                    {expiryFormatted && (
                      <div className="flex items-center justify-between border-t border-navy/10 py-3 text-xs text-amber-800">
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          <span>Link Expires On</span>
                        </span>
                        <span className="font-semibold">{expiryFormatted}</span>
                      </div>
                    )}

                    {/* Coupon Section */}
                    <div className="mt-6 border-t border-navy/10 pt-5">
                      {!invitation.coupon ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <TicketPercent size={18} className="text-gold-dim" />
                            <span className="font-sans text-sm font-bold text-navy">Have a coupon code?</span>
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            Enter your coupon code to see whether you qualify for a discount.
                          </p>

                          <form onSubmit={handleApplyCoupon} className="mt-3">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <input
                                type="text"
                                id="coupon-code-input"
                                value={couponInput}
                                onChange={(e) => {
                                  setCouponInput(e.target.value.toUpperCase())
                                  if (couponError) setCouponError(null)
                                  if (couponSuccess) setCouponSuccess(null)
                                }}
                                placeholder="ENTER COUPON CODE"
                                disabled={couponLoading || payPhase === 'ordering' || payPhase === 'verifying'}
                                className="min-h-11 flex-1 rounded-xl border border-navy/20 bg-white px-3.5 font-mono text-sm uppercase tracking-wider text-navy placeholder:text-muted/60 focus:border-navy focus:outline-none"
                              />
                              <button
                                type="submit"
                                id="apply-coupon-btn"
                                disabled={couponLoading || !couponInput.trim() || payPhase === 'ordering' || payPhase === 'verifying'}
                                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-navy px-5 font-sans text-sm font-semibold text-white transition hover:bg-navy-mid disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                              >
                                {couponLoading ? (
                                  <>
                                    <Loader2 size={15} className="animate-spin text-gold" />
                                    <span>Applying...</span>
                                  </>
                                ) : (
                                  'Apply Coupon'
                                )}
                              </button>
                            </div>

                            {couponError && (
                              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{couponError}</span>
                              </p>
                            )}
                            {couponSuccess && (
                              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                <Check size={14} className="shrink-0" />
                                <span>{couponSuccess}</span>
                              </p>
                            )}
                          </form>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-950">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <Check size={16} strokeWidth={2.5} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm font-bold tracking-wider text-emerald-950">
                                    {invitation.coupon.code}
                                  </span>
                                  <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                    {invitation.coupon.isFree
                                      ? '100% Complimentary'
                                      : invitation.coupon.discountType === 'FLAT'
                                        ? `₹${invitation.coupon.discountValue} OFF`
                                        : `${invitation.coupon.discountValue}% OFF`}
                                  </span>
                                </div>
                                <p className="text-xs text-emerald-700">
                                  Coupon discount applied successfully
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              id="remove-coupon-btn"
                              onClick={handleRemoveCoupon}
                              disabled={couponLoading || payPhase === 'ordering' || payPhase === 'verifying'}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 cursor-pointer disabled:opacity-50"
                            >
                              {couponLoading ? <Loader2 size={12} className="animate-spin" /> : <X size={13} />}
                              <span>Remove Coupon</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="mt-6 border-t-2 border-navy/15 pt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted">
                        <span>Original Entry Fee</span>
                        <span className="font-mono font-medium text-navy">₹{invitation.baseAmountRupees ?? invitation.amountRupees}</span>
                      </div>

                      {Boolean(invitation.discountRupees && invitation.discountRupees > 0) && (
                        <div className="flex items-center justify-between text-sm font-medium text-emerald-700">
                          <span className="flex items-center gap-1.5">
                            <Tag size={14} />
                            <span>Coupon Discount ({invitation.coupon?.code || 'Applied'})</span>
                          </span>
                          <span className="font-mono font-bold">−₹{invitation.discountRupees}</span>
                        </div>
                      )}

                      <div className="flex items-baseline justify-between border-t border-navy/10 pt-3">
                        <div>
                          <span className="font-sans text-base font-black text-navy">You Pay</span>
                          <span className="block text-xs text-muted">Authoritative payable amount</span>
                        </div>
                        <span className="font-mono text-3xl font-black text-navy">
                          ₹{invitation.amountRupees}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {payError && (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
                      <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                      <div>
                        <h4 className="font-sans text-sm font-bold text-red-900">Payment Unsuccessful</h4>
                        <p className="mt-0.5 font-sans text-xs text-red-700 leading-relaxed">{payError}</p>
                      </div>
                    </div>
                  )}

                  {/* Payment CTA */}
                  <div className="mt-8">
                    <button
                      type="button"
                      id="proceed-payment-btn"
                      onClick={handlePayNow}
                      disabled={payPhase === 'ordering' || payPhase === 'verifying' || couponLoading}
                      className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-navy px-8 py-4 font-sans text-base font-semibold text-white shadow-[0_12px_30px_-16px_rgba(16,46,82,0.95)] transition hover:bg-navy-mid active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {payPhase === 'ordering' ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-gold" />
                          <span>Initiating Secure Checkout...</span>
                        </>
                      ) : payPhase === 'verifying' ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-gold" />
                          <span>Verifying Payment Signature...</span>
                        </>
                      ) : invitation.amountRupees === 0 ? (
                        <>
                          <CheckCircle2 size={18} className="text-emerald-400" />
                          <span>Confirm Free Registration (100% Discount)</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={18} className="text-gold" />
                          <span>Pay ₹{invitation.amountRupees} via Razorpay</span>
                        </>
                      )}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted">
                      <Lock size={13} className="text-navy/50" />
                      <span>Secured by 256-bit SSL encryption &amp; Razorpay payment gateway</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Organizer Help Strip */}
          <aside className="mt-8 surface-navy rounded-3xl p-6 text-white sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow flex items-center gap-2 text-gold-soft">
                  <PhoneCall size={15} />
                  Need assistance with your payment?
                </p>
                <p className="mt-1 font-sans text-sm text-white/70">
                  Our event coordinators are happy to assist.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {event.contacts.map((c) => (
                  <a
                    key={c.name}
                    href={`tel:${c.tel}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-sans text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <span>{c.name}:</span>
                    <span className="font-mono text-gold-soft">{c.phone}</span>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
