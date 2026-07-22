import { useNavigate } from 'react-router-dom';
// Removed X import
import { useAuth } from '../context/AuthContext';

import ParticleBackground from "@/components/ParticleBackground";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DivineEssenceSection from "@/components/DivineEssenceSection";
import ScripturesSection from "@/components/ScripturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import Footer from "@/components/Footer";

export const Landing = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleStartJourney = () => {
    if (user) {
      navigate('/chat');
    } else {
      navigate('/login');
    }
  };

  const handleLoginClick = () => {
    if (user) {
      navigate('/chat');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <ParticleBackground />
      <Navbar onLoginClick={handleLoginClick} onLogoutClick={logout} user={user} />
      <main className="relative z-10">
        <HeroSection onStartJourney={handleStartJourney} />
        <DivineEssenceSection />
        <ScripturesSection />
        <HowItWorksSection onStartJourney={handleStartJourney} />
      </main>
      <Footer />
    </div>
  );
};
