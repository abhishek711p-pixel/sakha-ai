import { Hero } from '../components/sections/Hero';
import { Struggle } from '../components/sections/Struggle';
import { ChatPreview } from '../components/sections/ChatPreview';
import { Journal } from '../components/sections/Journal';
import { Mixtape } from '../components/sections/Mixtape';
import { Library } from '../components/sections/Library';
import { Features } from '../components/sections/Features';
import { DailyMantra } from '../components/sections/DailyMantra';
import { Shop } from '../components/sections/Shop';
import { Testimonials } from '../components/sections/Testimonials';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const Landing = () => {
  return (
    <div className="bg-dharma-ink min-h-screen text-dharma-ivory font-sans">
      <Navbar />
      <main>
        <Hero />
        <Struggle />
        <ChatPreview />
        <Journal />
        <Mixtape />
        <Library />
        <Features />
        <DailyMantra />
        <Shop />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};
