import { useEffect } from 'react';
import { AnnouncementBar } from '../components/home/AnnouncementBar';
import { Header } from '../components/home/Header';
import { HeroBanner } from '../components/home/HeroBanner';
import { BenefitsBar } from '../components/home/BenefitsBar';
import { FeaturedSlider } from '../components/home/featuredSlider';
import { PricingSection } from '../components/home/PricingSection';
import { CategoriesGrid } from '../components/home/CategoriesGrid';
import { ReviewsSection } from '../components/home/ReviewsSection';
import { AboutBanner } from '../components/home/AboutBanner';
import { NewsletterCommunity } from '../components/home/NewsletterCommunity';
import { BlogSection } from '../components/home/BlogSection';
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
    <div className="min-h-screen font-primary text-brand-dark bg-white">
      <AnnouncementBar />
      <Header />

      <main>
        <HeroBanner />
        <BenefitsBar />
        <FeaturedSlider />
        <PricingSection />
        <CategoriesGrid />
        <ReviewsSection />
        <AboutBanner />
        <NewsletterCommunity />
        <BlogSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
