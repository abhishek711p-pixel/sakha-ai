import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { HeartHandshake, ArrowLeft, Trash2, LogOut, ShieldCheck, User, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auth Guard
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleClearConversations = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all your conversations? This cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    try {
      await api.deleteAllConversations();
      setSuccessMsg('All conversations have been successfully deleted.');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to clear conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Settings</h2>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex justify-center py-12 px-4">
        <div className="w-full max-w-2xl space-y-8">
          
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl flex items-center gap-3 shadow-sm"
            >
              <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm font-medium">{successMsg}</p>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 shadow-sm"
            >
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </motion.div>
          )}

          {/* Account Details */}
          <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <User className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Account Details</h3>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-wide uppercase">Email Address</label>
              <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium">
                {user.username || user.email}
              </div>
            </div>
          </section>

          {/* Data & Privacy */}
          <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Data & Privacy</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-slate-800">Clear all conversations</h4>
                <p className="text-sm text-slate-500 mt-1">Permanently delete all your chat history.</p>
              </div>
              <button
                onClick={handleClearConversations}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold border border-red-100 transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> 
                {loading ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </section>

          {/* Logout */}
          <section className="pt-4 flex justify-center">
             <button
                onClick={handleLogout}
                className="px-8 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold shadow-sm transition-all flex items-center gap-2"
              >
                <LogOut className="w-5 h-5 text-slate-500" /> Sign out of Companion
             </button>
          </section>

        </div>
      </main>

    </div>
  );
};
