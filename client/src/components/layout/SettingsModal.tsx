import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Clock, BookOpen, Quote } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [mantraEnabled, setMantraEnabled] = useState(false);
  const [mantraTime, setMantraTime] = useState('08:00');
  
  const [journalEnabled, setJournalEnabled] = useState(false);
  const [journalTime, setJournalTime] = useState('20:00');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dharma_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        setMantraEnabled(parsed.mantraEnabled ?? false);
        setMantraTime(parsed.mantraTime ?? '08:00');
        setJournalEnabled(parsed.journalEnabled ?? false);
        setJournalTime(parsed.journalTime ?? '20:00');
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('dharma_notifications', JSON.stringify({
      mantraEnabled,
      mantraTime,
      journalEnabled,
      journalTime
    }));
  }, [mantraEnabled, mantraTime, journalEnabled, journalTime]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-dharma-ink w-full max-w-md rounded-3xl shadow-2xl border border-dharma-line-dark overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dharma-line-dark bg-dharma-ink-2">
              <h2 className="text-2xl font-serif text-dharma-ivory flex items-center gap-2">
                <Bell className="w-5 h-5 text-dharma-flame" />
                Notifications
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-dharma-ivory/5 rounded-full transition-colors text-dharma-ivory-dim hover:text-dharma-ivory"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              
              {/* Daily Mantra */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                      <Quote className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-dharma-ivory">Daily Mantra</h3>
                      <p className="text-sm text-dharma-ivory-dim">Receive your chosen mantra</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={mantraEnabled}
                      onChange={(e) => setMantraEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-dharma-line-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dharma-flame"></div>
                  </label>
                </div>
                
                {mantraEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center justify-between pl-12 pr-2"
                  >
                    <span className="text-sm text-dharma-ivory-dim flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Time
                    </span>
                    <input 
                      type="time" 
                      value={mantraTime}
                      onChange={(e) => setMantraTime(e.target.value)}
                      className="bg-transparent border border-dharma-line-dark rounded-md px-3 py-1 text-sm text-dharma-ivory focus:outline-none focus:border-dharma-flame"
                    />
                  </motion.div>
                )}
              </div>

              {/* Journal Reminder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-dharma-ivory">Journal Reminder</h3>
                      <p className="text-sm text-dharma-ivory-dim">Time to reflect and write</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={journalEnabled}
                      onChange={(e) => setJournalEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-dharma-line-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dharma-flame"></div>
                  </label>
                </div>
                
                {journalEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center justify-between pl-12 pr-2"
                  >
                    <span className="text-sm text-dharma-ivory-dim flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Time
                    </span>
                    <input 
                      type="time" 
                      value={journalTime}
                      onChange={(e) => setJournalTime(e.target.value)}
                      className="bg-transparent border border-dharma-line-dark rounded-md px-3 py-1 text-sm text-dharma-ivory focus:outline-none focus:border-dharma-flame"
                    />
                  </motion.div>
                )}
              </div>

            </div>

            <div className="p-6 border-t border-dharma-line-dark bg-dharma-ink-2">
              <button 
                onClick={onClose}
                className="w-full py-3 bg-dharma-ivory text-dharma-ink rounded-xl font-medium hover:bg-dharma-flame transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
