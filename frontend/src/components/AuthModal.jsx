import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, UserPlus, X } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusTarget = firstInputRef.current || dialogRef.current?.querySelector('button, input');
    focusTarget?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = mode === 'login'
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser(form);

      onAuthSuccess(response.data.user, response.data.token);
      onClose();
    } catch (requestError) {
      setError(requestError.message || 'Unable to authenticate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog auth-modal-dialog"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="modal-header">
          <div>
            <div className="auth-modal-kicker">
              {mode === 'login' ? <LockKeyhole size={13} /> : <UserPlus size={13} />}
              <span>Private workspace</span>
            </div>
            <h3 className="modal-title" id="auth-modal-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h3>
            <p className="modal-description">Keep your legal documents attached to your account.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close authentication dialog">
            <X size={16} />
          </button>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode selector">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'auth-tab-active' : ''}`}
            onClick={() => switchMode('login')}
            role="tab"
            aria-selected={mode === 'login'}
            aria-controls="auth-panel"
            tabIndex={mode === 'login' ? 0 : -1}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'auth-tab-active' : ''}`}
            onClick={() => switchMode('register')}
            role="tab"
            aria-selected={mode === 'register'}
            aria-controls="auth-panel"
            tabIndex={mode === 'register' ? 0 : -1}
          >
            Create Account
          </button>
        </div>

        {error && <div className="auth-error" aria-live="polite">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} id="auth-panel" aria-live="polite">
          {mode === 'register' && (
            <label className="auth-field">
              <span>Name</span>
              <input
                ref={mode === 'register' ? firstInputRef : null}
                name="name"
                value={form.name}
                onChange={updateField}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              ref={mode === 'login' ? firstInputRef : null}
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-password-wrap">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={updateField}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
