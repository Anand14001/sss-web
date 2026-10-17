import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { CategoriesProvider } from './context/CategoriesContext'
import SmoothScroll from './components/SmoothScroll'
import Landing from './pages/Landing'
import CategoryChooser from './pages/CategoryChooser'
import RegistrationCategory from './pages/RegistrationCategory'
import Booking from './pages/Booking'
import ApplicationConfirmation from './pages/ApplicationConfirmation'
import ParticipantPayment from './pages/ParticipantPayment'

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
 */
export default function App() {
  return (
    <BrowserRouter>
      <CategoriesProvider>
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
        {/* Dedicated Application Confirmation */}
        <Route path="/application/confirmation/:reference" element={<ApplicationConfirmation />} />
        <Route path="/application/:reference" element={<ApplicationConfirmation />} />

        {/* Participant Payment Page via Secure Invitation Token */}
        <Route path="/pay/:token" element={<ParticipantPayment />} />

        {/* Canonical booking & payment status route */}
        <Route path="/booking/:reference" element={<Booking />} />

        {/* Legacy status route redirect */}
        <Route path="/registration/status/:reference" element={<LegacyStatusRedirect />} />

        {/* Category registration forms */}
        <Route path="/registration/:slug" element={<RegistrationCategory />} />

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </CategoriesProvider>
    </BrowserRouter>
  )
}

