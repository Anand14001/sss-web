import { ExternalLink } from 'lucide-react'
import { WHATSAPP_GROUP_INVITE_URL } from '../data/event'

/**
 * Official SVG WhatsApp icon.
 */
function WhatsAppIcon({ className = 'w-5 h-5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.101-.477-.15-.678.15-.2.301-.778.979-.954 1.18-.176.201-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.676-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.15-.678-1.633-.929-2.235-.245-.587-.494-.507-.678-.517-.176-.01-.377-.01-.578-.01-.201 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.511 0 1.481 1.079 2.91 1.229 3.111.15.201 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.229 1.378.197 1.898.119.579-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12.04 2C6.528 2 2.05 6.478 2.05 11.99c0 1.838.498 3.562 1.365 5.044L2 22l5.12-1.343a9.94 9.94 0 0 0 4.92 1.293h.004c5.51 0 9.988-4.478 9.988-9.96 0-2.66-1.036-5.161-2.92-7.045C17.228 3.061 14.717 2 12.04 2zm0 18.25h-.003a8.27 8.27 0 0 1-4.218-1.153l-.302-.18-3.136.823.837-3.057-.197-.314a8.28 8.28 0 0 1-1.27-4.38c0-4.57 3.719-8.29 8.291-8.29 2.215 0 4.297.863 5.863 2.43 1.567 1.567 2.43 3.65 2.43 5.864 0 4.572-3.719 8.257-8.262 8.257z" />
    </svg>
  )
}

/**
 * Reusable WhatsApp Group Invitation CTA.
 *
 * Used on:
 * - Stage A: Registration Success Page (/registration/confirmation/:reference)
 * - Stage E: Booking / Payment Confirmation Page (/booking/:reference)
 * - Stage E: Shortlisted Payment Page after confirmation (/pay/:token)
 */
export default function WhatsAppGroupCTA({
  title = 'Join Our Official WhatsApp Group',
  description = 'Stay connected with the Salem Star Speaker Contest organisers. Join our official WhatsApp group to receive important announcements, contest updates, and participant instructions.',
  buttonText = 'Join WhatsApp Group',
  variant = 'card', // 'card' | 'banner' | 'compact'
  url = WHATSAPP_GROUP_INVITE_URL,
  className = ''
}) {
  if (variant === 'compact') {
    return (
      <div
        className={`rounded-2xl border border-emerald-600/20 bg-emerald-50/60 p-4 sm:p-5 text-left ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100">
              <WhatsAppIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-sans text-sm font-bold text-navy sm:text-base">{title}</h4>
              <p className="mt-0.5 font-sans text-xs text-muted leading-relaxed sm:text-sm">
                {description}
              </p>
            </div>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${buttonText} (opens in a new tab)`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 font-sans text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.98] cursor-pointer"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>{buttonText}</span>
            <ExternalLink size={14} className="opacity-80" aria-hidden="true" />
          </a>
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className={`overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50/20 p-5 sm:p-6 text-navy shadow-sm ${className}`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100">
              <WhatsAppIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="eyebrow inline-block text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                Official Contest Channel
              </span>
              <h3 className="font-sans text-base font-bold text-navy sm:text-lg">{title}</h3>
              <p className="mt-1 font-sans text-xs sm:text-sm text-navy/70 leading-relaxed max-w-xl">
                {description}
              </p>
            </div>
          </div>

          <div className="pt-2 md:pt-0 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${buttonText} (opens in a new tab)`}
              className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-emerald-600 px-6 py-3 font-sans text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.98] cursor-pointer"
            >
              <WhatsAppIcon className="h-5 w-5" />
              <span>{buttonText}</span>
              <ExternalLink size={15} className="opacity-80" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Default 'card' variant: Prominent, elegant card fitting Salem Star Speaker design system
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-2 border-emerald-600/20 bg-gradient-to-br from-white via-emerald-50/30 to-ivory p-6 sm:p-8 text-center shadow-md transition hover:shadow-lg ${className}`}
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg ring-8 ring-emerald-100/70">
        <WhatsAppIcon className="h-9 w-9" />
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-sans text-xs font-bold text-emerald-900 tracking-wide">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
        Official Contest Community
      </span>

      <h3 className="display mt-3 text-xl font-black tracking-tight text-navy sm:text-2xl">
        {title}
      </h3>

      <p className="mx-auto mt-2.5 max-w-lg font-sans text-sm leading-relaxed text-muted sm:text-base">
        {description}
      </p>

      <div className="mt-6 flex flex-col items-center justify-center gap-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${buttonText} (opens in a new tab)`}
          className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-emerald-600 px-8 py-3.5 font-sans text-sm sm:text-base font-bold text-white shadow-[0_10px_25px_-8px_rgba(5,150,105,0.6)] transition duration-200 hover:bg-emerald-700 hover:shadow-[0_14px_28px_-8px_rgba(5,150,105,0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.98] cursor-pointer"
        >
          <WhatsAppIcon className="h-5 w-5" />
          <span>{buttonText}</span>
          <ExternalLink size={16} className="opacity-90" aria-hidden="true" />
        </a>

        <p className="font-sans text-[11px] sm:text-xs text-muted">
          Free to join · Link opens WhatsApp directly in a new tab · Optional
        </p>
      </div>
    </div>
  )
}
