import Hero from '../components/Hero.jsx'
import Services from '../components/Services.jsx'
import Pricing from '../components/Pricing.jsx'
import WhyUs from '../components/WhyUs.jsx'
import HowItWorks from '../components/HowItWorks.jsx'
import TransformCta from '../components/TransformCta.jsx'
import Projects from '../components/Projects.jsx'
import BuiltSection from '../components/BuiltSection.jsx'
import Testimonials from '../components/Testimonials.jsx'
import ClientsSection from '../components/ClientsSection.jsx'
import ContactSection from '../components/ContactSection.jsx'

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Pricing />
      <WhyUs />
      <HowItWorks />
      <TransformCta />
      <Projects />
      <BuiltSection />
      <Testimonials />
      <ClientsSection />
      <ContactSection />
    </>
  )
}
