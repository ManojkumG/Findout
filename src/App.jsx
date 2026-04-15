import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Mic, Loader2, Search as SearchIcon, X, MessageSquare, BookOpen, Youtube, Linkedin, Twitter, ExternalLink } from 'lucide-react';
import { searchPerson, loginApi, signupApi } from './services/api';

function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Theme State: 'light', 'dark', or 'system' (Off)
  const [theme, setTheme] = useState(() => localStorage.getItem('findout_theme') || 'dark');

  // Voice Search State
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('findout_theme', theme);
  }, [theme]);

  // Auth State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('findout_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      const data = await searchPerson(searchQuery.trim());
      setResults(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err.message || 'Failed to search details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    performSearch(query);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Search. Please try Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("Voice search started. Speak now...");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcript received:", transcript);
      setQuery(transcript);
      // Execute search immediately with the transcript
      performSearch(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access blocked. Please enable it in browser settings.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("Voice search ended.");
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setIsListening(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    try {
      if (authMode === 'login') {
        const res = await loginApi(email, password);
        localStorage.setItem('findout_user', JSON.stringify(res.user));
        setUser(res.user);
      } else {
        const res = await signupApi(name, email, password);
        localStorage.setItem('findout_user', JSON.stringify(res.user));
        setUser(res.user);
      }
      setShowAuthModal(false);
      setEmail(''); setPassword(''); setName('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="logo-btn">Findout</div>
        <div className="nav-actions">
          <div className="theme-selector-segmented" data-active={theme}>
            <div className="theme-active-pill"></div>
            <button
              className={`theme-seg-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme(theme === 'light' ? 'system' : 'light')}
              title="Light Mode"
            >
              <Sun size={18} />
            </button>
            <button
              className={`theme-seg-btn ${theme === 'system' ? 'active' : ''}`}
              onClick={() => setTheme('system')}
              title="System Default (Off)"
            >
              <div className="dot-indicator"></div>
            </button>
            <button
              className={`theme-seg-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme(theme === 'dark' ? 'system' : 'dark')}
              title="Dark Mode"
            >
              <Moon size={18} />
            </button>
          </div>
          {user ? (
            <div className="user-profile-nav">
              <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="Avatar" className="user-nav-avatar" />
              <button className="logout-btn" onClick={() => {
                localStorage.removeItem('findout_user');
                setUser(null);
              }}>
                Logout ({user.name})
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowAuthModal(true)}>
              Sign In
            </button>
          )}
        </div>
      </header>

      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <button className="close-btn" onClick={() => setShowAuthModal(false)}>&times;</button>
              <h2 className="modal-title">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                {authMode === 'signup' && (
                  <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} />
                )}
                <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />

                {authError && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{authError}</p>}

                <button type="submit" className="auth-submit-btn" disabled={isAuthLoading}>
                  {isAuthLoading ? <Loader2 size={20} className="spinner" style={{ margin: '0 auto' }} /> : (authMode === 'login' ? 'Continue' : 'Sign Up')}
                </button>

                <div className="social-login-sep">
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  className="google-auth-btn"
                  onClick={() => {
                    // Mock Google Login with Real-looking Avatar
                    const mockGoogleUser = {
                      name: 'Gmano Kumar',
                      email: 'gmano.kumar@gmail.com',
                      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gmano'
                    };
                    localStorage.setItem('findout_user', JSON.stringify(mockGoogleUser));
                    setUser(mockGoogleUser);
                    setShowAuthModal(false);
                  }}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/wait.gif" alt="G" style={{ width: '18px', marginRight: '10px', display: 'none' }} />
                  Continue with Google
                </button>
              </form>

              <div className="auth-switch">
                {authMode === 'login' ? (
                  <p onClick={() => setAuthMode('signup')}>Don't have an account? <span>Sign up</span></p>
                ) : (
                  <p onClick={() => setAuthMode('login')}>Already have an account? <span>Sign In</span></p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`search-container ${results.length > 0 ? 'has-results' : ''}`}>
        <AnimatePresence>
          {!results.length && !isLoading && (
            <motion.h1
              className="search-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              Profile Intelligence
            </motion.h1>
          )}
        </AnimatePresence>

        {!results.length && !isLoading && (
          <motion.p
            className="search-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Digital Presence • Smart Profiles • Employment Networks
          </motion.p>
        )}

        <form className="search-form" onSubmit={handleSearch}>
          <SearchIcon size={20} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search Entity Intelligence & Verified Profiles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
          {query && (
            <button type="button" className="clear-btn" onClick={() => setQuery('')}>
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={handleVoiceSearch}
            title="Voice Search"
          >
            <Mic size={20} />
          </button>
          <button type="submit" className="find-btn" disabled={isLoading || !query.trim()}>
            <span>Search</span>
            <SearchIcon size={18} style={{ display: window.innerWidth <= 768 ? 'block' : 'none' }} />
          </button>
        </form>

        {isLoading && (
          <motion.div
            className="loading-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 size={24} className="spinner" />
            <span>Extracting live profiles...</span>
          </motion.div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ color: '#ef4444', marginTop: '1.5rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}
          >
            {error}
          </motion.p>
        )}
      </div>

      {results.length > 0 && (
        <div className="results-wrapper">
          <motion.div
            className="results-grid"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2
                }
              }
            }}
          >
            {results.map((result, i) => (
              <motion.div
                className="card"
                key={result.id || i}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  show: { opacity: 1, y: 0, scale: 1 }
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{
                  y: -10,
                  boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)",
                  transition: { duration: 0.2 }
                }}
              >
                <div className="card-top">
                  <div className="card-avatar-container">
                    <img
                      src={result.photoUrl}
                      alt={result.name}
                      className="card-avatar"
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(result.name)}&backgroundColor=38bdf8,8b5cf6,0ea5e9`;
                      }}
                    />
                    {result.badge && (
                      <span className={`card-badge ${result.badge === 'Verified Profile' ? 'verified' : 'smart'}`}>
                        {result.badge}
                      </span>
                    )}
                  </div>
                  <div className="card-info">
                    <div className="card-header-flex">
                      <div className="name-plate">{result.name}</div>
                    </div>
                    <div className="detail-plate">{result.role}</div>
                  </div>
                </div>
                <div className="card-summary">
                  {result.summary}
                </div>
                <div className="card-footer" style={{
                  justifyContent: 'flex-end',
                  marginTop: '1.2rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div className="social-footer-icons" style={{ display: 'flex', gap: '8px' }}>
                    {result.socials?.reddit && (
                      <a href={result.socials.reddit} target="_blank" rel="noopener noreferrer" className="linkedin-link-icon" style={{ color: '#ff4500' }} title="Reddit">
                        <MessageSquare size={16} />
                      </a>
                    )}
                    {result.socials?.blog && (
                      <a href={result.socials.blog} target="_blank" rel="noopener noreferrer" className="linkedin-link-icon" style={{ color: '#38bdf8' }} title="Blog">
                        <BookOpen size={16} />
                      </a>
                    )}

                    {result.socials?.youtube && (
                      <a href={result.socials.youtube} target="_blank" rel="noopener noreferrer" className="linkedin-link-icon" style={{ color: '#ff0000' }} title="YouTube">
                        <Youtube size={16} />
                      </a>
                    )}
                    {result.socials?.linkedin && (
                      <a href={result.socials.linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-link-icon" style={{ color: '#0a66c2' }} title="LinkedIn">
                        <Linkedin size={16} />
                      </a>
                    )}
                    {result.socials?.twitter && (
                      <a href={result.socials.twitter} target="_blank" rel="noopener noreferrer" className="linkedin-link-icon" style={{ color: '#1da1f2' }} title="Twitter">
                        <Twitter size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </>
  );
}

export default App;
