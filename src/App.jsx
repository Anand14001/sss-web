import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import SmoothScroll from './components/SmoothScroll'
import Landing from './pages/Landing'
import CategoryChooser from './pages/CategoryChooser'
import RegistrationCategory from './pages/RegistrationCategory'
import Booking from './pages/Booking'

/**
 * Redirects legacy /registration/status/:reference URLs to the canonical
 * /booking/:reference route while preserving the reference parameter.
 */
function LegacyStatusRedirect() {
  const { reference } = useParams()
  return <Navigate to={`/booking/${reference}`} replace />
}

/**
 * Application Routes.
 *
 * /registration renders the category chooser over the landing page so the modal
 * retains context and the back action returns to the previous scroll position.
 *
 * /registration/:slug serves the category registration form (kids, teens, adults).
 *
 * /booking/:reference is the dedicated canonical booking & payment status page.
 *
 * Any legacy /registration/status/:reference links seamlessly redirect to /booking/:reference.
 */
export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/registration"
          element={
            <>
              <Landing />
              <CategoryChooser />
            </>
          }
        />
        {/* Canonical booking & payment status route */}
        <Route path="/booking/:reference" element={<Booking />} />

        {/* Legacy status route redirect */}
        <Route path="/registration/status/:reference" element={<LegacyStatusRedirect />} />

        {/* Category registration forms */}
        <Route path="/registration/:slug" element={<RegistrationCategory />} />

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
