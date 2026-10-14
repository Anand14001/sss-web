import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SmoothScroll from './components/SmoothScroll'
import Landing from './pages/Landing'
import CategoryChooser from './pages/CategoryChooser'
import RegistrationCategory from './pages/RegistrationCategory'

/**
 * Routes.
 *
 * /registration renders the landing page with the category chooser over it, so
 * the modal has the site behind it rather than a blank backdrop — and so the
 * back button returns to exactly where the visitor was.
 *
 * Anything unrecognised goes home rather than showing a dead end. Direct hits
 * on nested URLs rely on the SPA fallback in public/.htaccess.
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
        <Route path="/registration/:slug" element={<RegistrationCategory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
