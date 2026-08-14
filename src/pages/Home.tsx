import { useEffect } from 'react';
import { AnnouncementBar } from '../components/home/AnnouncementBar';
import { Header } from '../components/home/Header';
import { HeroBanner } from '../components/home/HeroBanner';
import { BenefitsBar } from '../components/home/BenefitsBar';
import { FeaturedSlider } from '../components/home/featuredSlider';
import { CategoriesGrid } from '../components/home/CategoriesGrid';
import { PricingSection } from '../components/home/PricingSection';
import { ReviewsSection } from '../components/home/ReviewsSection';
import { AboutBanner } from '../components/home/AboutBanner';
import { ContactSection } from '../components/home/ContactSection';
import { Footer } from '../components/home/Footer';

const Home = () => {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, []);

  return (
    <div className="min-h-screen font-primary text-[#1C2333] bg-white">
      <AnnouncementBar />
      <Header />

      <main>
        <HeroBanner />
        <BenefitsBar />
        <FeaturedSlider />
        <CategoriesGrid />
        <PricingSection />
        <ReviewsSection />
        <AboutBanner />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
