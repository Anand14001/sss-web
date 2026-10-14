import { usePageReveals } from '../hooks/useReveal'

import Header from '../sections/Header'
import Hero from '../sections/Hero'
import About from '../sections/About'
import Categories from '../sections/Categories'
import WhyParticipate from '../sections/WhyParticipate'
import SpeakExpressInspire from '../sections/SpeakExpressInspire'
import Prizes from '../sections/Prizes'
import EventDetails from '../sections/EventDetails'
import Faqs from '../sections/Faqs'
import FinalCta from '../sections/FinalCta'
import Footer from '../sections/Footer'

/**
 * The marketing page.
 *
 * The registration form no longer lives here — every CTA now routes to
 * /registration, where the visitor picks a category first. This page is also
 * rendered behind the category modal, which is why it is a component rather
 * than the contents of App.
 */
export default function Landing() {
  usePageReveals()

  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Categories />
        <WhyParticipate />
        <SpeakExpressInspire />
        <Prizes />
        <EventDetails />
        <Faqs />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
