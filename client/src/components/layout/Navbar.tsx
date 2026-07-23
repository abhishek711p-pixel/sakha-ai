import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { ShoppingBag, Settings, Flame } from "lucide-react";
import { useCart } from "../../lib/CartContext";
import { useStreak } from "../../lib/StreakContext";
import { SettingsModal } from "./SettingsModal";
import { StreakModal } from "../ui/StreakModal";
import { useAuth } from "../../context/AuthContext";

export function Navbar() {
  const { items } = useCart();
  const { streak, hasCheckedInToday, checkIn } = useStreak();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed top-0 w-full z-40 flex items-center justify-between transition-all duration-500 ${
          scrolled
            ? 'py-3 px-8 md:px-16 backdrop-blur-xl bg-dharma-ink/90 border-b border-dharma-line-dark shadow-lg shadow-black/40'
            : 'py-6 px-8 md:px-16 bg-transparent'
        }`}
      >
        {/* Logo */}
        <Link to="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 text-2xl font-serif text-dharma-ivory tracking-wide cursor-pointer"
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-dharma-flame text-3xl leading-none"
            >
              ☼
            </motion.span>
            Dharma<span className="gradient-text font-bold">X</span>
          </motion.div>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-base font-medium text-dharma-ivory-dim">
          {['Home', 'Guides', 'Scriptures', 'Books', 'Journal', 'Mixtape'].map((label, i) => {
            const path = ['/', '/#guides', '/#library', '/reading-room', '/#journal', '/#mixtape'][i];
            return (
              <Link
                key={label}
                to={path}
                className="relative group hover:text-dharma-ivory transition-colors duration-200"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-dharma-flame transition-all duration-300 group-hover:w-full" />
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Streak Badge */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={checkIn}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-colors group ${
              hasCheckedInToday 
                ? 'bg-dharma-flame/10 border-dharma-flame/30' 
                : 'bg-dharma-ink-3 border-dharma-line-dark hover:border-dharma-flame/40'
            }`}
            title={hasCheckedInToday ? "Checked in today!" : "Click to check in for today"}
          >
            <motion.div
              animate={hasCheckedInToday ? {} : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Flame className={`w-4 h-4 transition-colors ${hasCheckedInToday ? 'text-dharma-flame' : 'text-dharma-ivory-dim group-hover:text-dharma-flame'}`} />
            </motion.div>
            <span className={`text-sm font-semibold transition-colors ${hasCheckedInToday ? 'text-dharma-flame' : 'text-dharma-ivory-dim group-hover:text-dharma-ivory'}`}>
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </span>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 30 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-dharma-ivory-dim hover:text-dharma-flame transition-colors"
          >
            <Settings className="w-5 h-5" />
          </motion.button>

          <Link to="/cart">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 text-dharma-ivory-dim hover:text-dharma-flame transition-colors block"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-0 w-4 h-4 bg-dharma-flame text-white text-[10px] font-bold rounded-full flex items-center justify-center -translate-y-1/4 translate-x-1/4"
                >
                  {cartItemCount}
                </motion.span>
              )}
            </motion.button>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/chat')}
                className="px-6 py-2.5 text-sm font-semibold text-black bg-dharma-flame rounded-full hover:bg-dharma-saffron transition-colors duration-300 shadow-md shadow-dharma-flame/30"
              >
                Enter Chat
              </motion.button>
              <button
                onClick={logout}
                className="hidden md:block px-4 py-2 border border-dharma-line-dark rounded-full text-sm text-dharma-ivory-dim hover:bg-dharma-flame hover:text-white transition duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-dharma-flame rounded-full hover:bg-dharma-saffron transition-colors duration-300 shadow-md shadow-dharma-flame/30"
            >
              Begin Journey
            </motion.button>
          )}
        </div>
      </motion.nav>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <StreakModal />
    </>
  );
}
