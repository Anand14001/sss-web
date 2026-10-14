/**
 * API client for Salem Star Speaker backend.
 * Reads base URL from VITE_API_BASE_URL or defaults to '/api/v1'.
 */

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || '/api/v1';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    'Content-Type': 'application/json',
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
  getEventConfig: () => request('/event'),
  createRegistration: (payload) =>
    request('/registrations', {
      method: 'POST',
      body: JSON.stringify(payload)
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
