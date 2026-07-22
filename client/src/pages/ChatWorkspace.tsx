import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { Message, Conversation, Persona } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake, ShieldAlert, ArrowLeft, Send, LogOut, Plus, Settings as SettingsIcon, Trash2, Edit2, Home } from 'lucide-react';

export const ChatWorkspace = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stateConvoId = location.state?.activeConversationId;

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth Guard
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Initial Load
  useEffect(() => {
    async function initData() {
      try {
        const [personaList, convoList] = await Promise.all([
          api.getPersonas(),
          api.getConversations()
        ]);
        
        setPersonas(personaList);
        setConversations(convoList);

        if (stateConvoId) {
          setActiveConvoId(stateConvoId);
        } else if (convoList.length > 0) {
          setActiveConvoId(convoList[0].id);
        } else {
          // If no conversations exist, automatically create one with the Companion persona
          const newConvo = await api.createConversation('companion', '');
          setConversations([newConvo]);
          setActiveConvoId(newConvo.id);
        }
      } catch (err) {
        console.error('Error loading initial chat data:', err);
      }
    }
    if (user) {
      initData();
    }
  }, [user, stateConvoId]);

  // Load Messages on Convo Change
  useEffect(() => {
    if (!activeConvoId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      setLoadingHistory(true);
      try {
        const history = await api.getMessages(activeConvoId!);
        setMessages(history);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadMessages();
  }, [activeConvoId, conversations, personas]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isReflecting]);

  const sendUserMessage = async (text: string) => {
    if (!text.trim() || !activeConvoId || isReflecting) return;

    // Append user message locally
    const newUserMsg: Message = {
      sender: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMsg]);

    // Show simulated unhurried reflecting delay
    setIsReflecting(true);

    try {
      const response = await api.sendMessage(activeConvoId, text);
      
      setMessages(prev => [...prev, response]);
      setIsReflecting(false);
      
      // Refresh conversations list to update sidebar message descriptions
      api.getConversations().then(setConversations).catch(console.error);

    } catch (err) {
      console.error('Error sending message:', err);
      setIsReflecting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const msg = inputMsg;
    setInputMsg('');
    await sendUserMessage(msg);
  };

  const handleCreateNewChat = async () => {
    try {
      const newConvo = await api.createConversation('companion', '');
      setConversations(prev => [newConvo, ...prev]);
      setActiveConvoId(newConvo.id);
    } catch (err) {
      console.error("Failed to create conversation", err);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvoId === id) {
        setActiveConvoId(conversations.find(c => c.id !== id)?.id || null);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  const handleRenameConversation = async (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = window.prompt("Rename conversation:", currentTitle);
    if (newName && newName.trim() !== currentTitle) {
      try {
        await api.renameConversation(id, newName.trim());
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newName.trim() } : c));
      } catch (err) {
        console.error("Failed to rename conversation", err);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const activeConversation = conversations.find((c) => c.id === activeConvoId);
  
  const activeBotName = activeConversation?.bot_name || 'Companion';

  const handleRenameBot = async () => {
    const newName = window.prompt("What would you like to name your bot?", activeBotName);
    if (newName && newName.trim() !== '' && newName.trim() !== activeBotName) {
      const isNewChat = window.confirm(`Start a NEW chat with ${newName.trim()}? (Cancel to rename in THIS chat)`);
      try {
        if (isNewChat) {
          const newConvo = await api.createConversation('companion', '', newName.trim());
          setConversations(prev => [newConvo, ...prev]);
          setActiveConvoId(newConvo.id);
        } else if (activeConvoId) {
          await api.updateConversationBotName(activeConvoId, newName.trim());
          setConversations(prev => prev.map(c => c.id === activeConvoId ? { ...c, bot_name: newName.trim() } : c));
        }
      } catch (err) {
        console.error('Failed to rename bot', err);
        alert('Failed to rename bot');
      }
    }
  };

  return (
    <div className="relative min-h-screen flex font-sans bg-background overflow-x-hidden text-foreground">
      
      {/* Background - optimized with CSS animations */}
      <div className="fixed inset-0 bg-background pointer-events-none z-0">
        {/* Divine blue gradient */}
        <div 
          className="absolute inset-0 opacity-25"
          style={{
            background: "radial-gradient(ellipse at center, hsla(210, 85%, 50%, 0.15) 0%, transparent 60%)",
          }}
        />
        
        {/* Soft circular glow - CSS animation */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 md:w-[500px] h-80 md:h-[500px] rounded-full animate-breathe-krishna"
          style={{
            background: "radial-gradient(circle, hsla(210, 85%, 50%, 0.1) 0%, transparent 70%)",
          }}
        />
        
        {/* Peacock feather particles - CSS animated, reduced count */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-particle"
            style={{
              width: 10 + (i % 4) * 5,
              height: 10 + (i % 4) * 5,
              background: i % 3 === 0 
                ? "radial-gradient(circle, hsla(180, 70%, 50%, 0.4) 0%, transparent 70%)"
                : i % 3 === 1
                ? "radial-gradient(circle, hsla(210, 85%, 55%, 0.4) 0%, transparent 70%)"
                : "radial-gradient(circle, hsla(270, 50%, 50%, 0.3) 0%, transparent 70%)",
              left: `${5 + (i * 12)}%`,
              top: `${10 + (i % 6) * 14}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${6 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-80 glass-card border-r border-border/30 relative z-10 p-5 justify-between">
        <div className="space-y-6 flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-border/30">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <HeartHandshake className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-foreground tracking-wide">
                {activeBotName}
              </span>
            </div>
            <button onClick={handleRenameBot} className="text-muted-foreground hover:text-primary p-1 transition-colors" title="Rename Bot">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-3.5 py-3 rounded-xl border border-primary/30 hover:border-primary hover:bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center transition-all duration-300"
              title="Back to Home"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={handleCreateNewChat}
              className="flex-grow py-3 rounded-xl border border-primary/30 hover:border-primary hover:bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>

          <div className="space-y-2 flex-grow overflow-hidden flex flex-col">
            <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">Recent Chats</h4>
            <div className="space-y-1.5 overflow-y-auto pr-1 flex-grow h-0">
              {conversations.map((convo) => {
                const isActive = convo.id === activeConvoId;
                const title = (convo as any).title || (convo.bot_name && convo.bot_name !== 'Companion' ? `${convo.bot_name} Chat` : 'Companion Chat');
                return (
                  <div
                    key={convo.id}
                    onClick={() => setActiveConvoId(convo.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all duration-300 group ${
                      isActive ? 'bg-primary/10 border border-primary/40 shadow-[0_0_10px_rgba(212,175,55,0.05)]' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-grow min-w-0 pr-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {title}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {convo.last_message_time ? new Date(convo.last_message_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {convo.last_message_content || 'A quiet space.'}
                        </p>
                      </div>
                      <div className="flex-col gap-1 hidden group-hover:flex">
                         <button onClick={(e) => handleRenameConversation(convo.id, title, e)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                           <Edit2 className="w-3.5 h-3.5" />
                         </button>
                         <button onClick={(e) => handleDeleteConversation(convo.id, e)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/30 mt-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-xs font-bold text-primary uppercase">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : user?.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.username || user?.email}</p>
            </div>
            <button onClick={() => navigate('/settings')} className="text-muted-foreground hover:text-foreground p-1">
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold flex items-center justify-center gap-2 border border-destructive/20 transition-all duration-300"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-grow flex flex-col h-screen relative z-10 bg-transparent">
        {/* Header */}
        <header className="p-3 md:p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-krishna flex items-center justify-center text-foreground shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <span className="font-display text-lg">🦚</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-krishna-blue">{activeBotName}</h2>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Empathetic Listener</p>
            </div>
          </div>
          
          <button
             onClick={handleCreateNewChat}
             className="md:hidden px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-xs font-medium text-primary flex items-center gap-1 shadow-sm"
          >
             <Plus className="w-3.5 h-3.5" /> New
          </button>
        </header>

        {/* Message Log */}
        <div className="flex-grow overflow-y-auto px-4 md:px-8 py-8 space-y-6">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-medium">
              Loading conversation...
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4">
                  <h1
                    className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                    style={{
                      background: "linear-gradient(135deg, hsl(210 85% 50%), hsl(270 50% 50%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Your Safe Space
                  </h1>
                  <p className="text-krishna-blue/80 text-sm md:text-base font-medium tracking-wide">
                    I'm here to listen. Share whatever is on your mind today, free of judgment.
                  </p>
                </div>
              )}

              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={index}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-2xl flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-lg backdrop-blur-md border ${
                          isUser
                            ? 'bg-gradient-krishna border-primary/30 text-foreground rounded-br-sm'
                            : msg.isCrisis
                            ? 'bg-destructive/60 border-destructive/50 text-destructive-foreground rounded-bl-sm space-y-4'
                            : 'glass-card border-krishna-blue/30 text-foreground rounded-bl-sm'
                        }`}
                      >
                        {msg.isCrisis ? (
                          <>
                            <div className="flex items-start gap-3">
                              <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-bold text-destructive text-sm">Support Resources</p>
                                <p className="text-sm text-destructive/80 whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                            {msg.resources && (
                              <div className="mt-4 pt-3 border-t border-destructive/50 flex flex-wrap gap-3 items-center justify-between">
                                <div className="text-xs font-bold text-white bg-destructive/80 px-3 py-1.5 rounded-lg shadow-sm border border-destructive/50">
                                  Call or Text: {msg.resources.phone}
                                </div>
                                <a
                                  href={msg.resources.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-destructive hover:text-destructive-foreground underline font-semibold"
                                >
                                  Visit Website
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1 font-medium">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isReflecting && (
                <div className="flex justify-start">
                  <div className="glass-card border border-white/10 p-4 rounded-2xl rounded-bl-sm flex items-center gap-3 shadow-lg backdrop-blur-md">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-krishna-blue/80 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 rounded-full bg-krishna-blue/80 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 rounded-full bg-krishna-blue/80 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 bg-background/80 backdrop-blur-md border-t border-border/30 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="flex-grow glass-card p-2 flex items-center gap-2" style={{ borderColor: "hsla(210, 85%, 50%, 0.3)" }}>
              <input
                type="text"
                required
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={isReflecting}
                placeholder={isReflecting ? `${activeBotName} is typing...` : "Share your thoughts..."}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground px-2 py-1 text-sm md:text-base min-w-0"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim() || isReflecting}
                className="p-2.5 md:p-3 rounded-full bg-gradient-krishna text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex-shrink-0 active:scale-95"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
