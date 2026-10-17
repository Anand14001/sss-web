/**
 * API client for Salem Star Speaker backend.
 * Reads base URL from VITE_API_BASE_URL or defaults to '/api/v1'.
 */

export const API_BASE_URL =
  ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
    '').replace(/\/$/, '') || '/api/v1';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned non-JSON response (${response.status})`);
  }

  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = data.code;
    error.details = data.details;
    throw error;
  }

  return data;
}

export const api = {
  getHealth: () => request('/health'),
  getEventConfig: () => request(`/event?_t=${Date.now()}`),
  createApplication: (payload) =>
    request('/applications', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  createRegistration: (payload) =>
    request('/registrations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getInvitation: (token) =>
    request(`/invitations/${encodeURIComponent(token)}`),
  createInvitationOrder: (token) =>
    request(`/invitations/${encodeURIComponent(token)}/checkout`, {
      method: 'POST'
    }),
  verifyPayment: (payload) =>
    request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getRegistrationStatus: (reference) =>
    request(`/registrations/${encodeURIComponent(reference)}/status`),
  retryPayment: (reference) =>
    request(`/registrations/${encodeURIComponent(reference)}/retry-payment`, {
      method: 'POST'
    }),
  validateCoupon: (payload, signal) =>
    request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal
    }),
  applyCoupon: (reference, payload) =>
    request(`/registrations/${encodeURIComponent(reference)}/apply-coupon`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  removeCoupon: (reference) =>
    request(`/registrations/${encodeURIComponent(reference)}/remove-coupon`, {
      method: 'POST'
    }),
  applyInvitationCoupon: (token, couponCode) =>
    request(`/invitations/${encodeURIComponent(token)}/apply-coupon`, {
      method: 'POST',
      body: JSON.stringify({ couponCode })
    }),
  removeInvitationCoupon: (token) =>
    request(`/invitations/${encodeURIComponent(token)}/coupon`, {
      method: 'DELETE'
    })
};

/**
 * Loads the Razorpay Checkout script dynamically.
 */
export function loadRazorpayCheckout() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(window.Razorpay);
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        reject(new Error('Razorpay SDK failed to load.'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay Checkout script. Check your internet connection.'));
    };
    document.body.appendChild(script);
  });
}
