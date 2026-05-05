import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, IdCard, Eye, EyeOff, AlertCircle, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

// ─── First Login — Force Password Change ─────────────────────────────────────
const ForcePasswordChange = ({ onDone }) => {
  const { changePassword } = useAuth();
  const [form, setForm]   = useState({ current: 'GMS@1234', newPwd: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPwd.length < 6) return setError('Password must be at least 6 characters.');
    if (form.newPwd !== form.confirm) return setError('Passwords do not match.');
    if (form.newPwd === 'GMS@1234') return setError('Please choose a different password from the default.');

    setLoading(true);
    const result = await changePassword(form.current, form.newPwd);
    setLoading(false);

    if (result.success) { setDone(true); setTimeout(onDone, 1500); }
    else setError(result.error || 'Failed to change password.');
  };

  if (done) return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <p className="font-bold text-lg text-green-700">Password set successfully!</p>
      <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
          <KeyRound className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold">Set Your Password</h2>
        <p className="text-sm text-muted-foreground mt-1">This is your first login. Please set a personal password.</p>
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Your default password is <strong>GMS@1234</strong>. You must change it to continue.</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'New Password', key: 'newPwd', placeholder: 'Min 6 characters' },
          { label: 'Confirm Password', key: 'confirm', placeholder: 'Repeat new password' },
        ].map(field => (
          <div key={field.key}>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">{field.label}</label>
            <input
              type="password"
              value={form[field.key]}
              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>
        ))}
        {error && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />{error}
          </div>
        )}
        <button
          type="submit" disabled={loading}
          className="h-10 w-full rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Setting…</> : 'Set My Password'}
        </button>
      </form>
    </div>
  );
};

// ─── Main Login Page ──────────────────────────────────────────────────────────
const Login = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]         = useState({ id: '', password: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [mustChange, setMustChange] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(form.id.trim(), form.password);
    setLoading(false);

    if (!result.success) return setError(result.error || 'Login failed.');
    if (result.mustChangePassword) return setMustChange(true);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)' }}>

      {/* Background grid */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>

          {mustChange ? (
            <div style={{ background: 'white' }}>
              <ForcePasswordChange onDone={() => navigate('/')} />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-8 pb-6">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
                    G
                  </div>
                  <div>
                    <p className="font-black text-lg text-white tracking-tight">GMS</p>
                    <p className="text-xs text-blue-300">Global Marketing Solutions</p>
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                <p className="text-sm text-blue-200 mt-1">Sign in with your Employee ID</p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="px-8 pb-8 space-y-4">
                {/* Employee ID */}
                <div>
                  <label className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1.5 block">Employee ID</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 h-4 w-4 text-blue-300" />
                    <input
                      type="text"
                      value={form.id}
                      onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                      placeholder="EMP-0001 or email@gms.com"
                      className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-3 text-sm text-white placeholder:text-blue-300/60 outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-300" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-10 text-sm text-white placeholder:text-blue-300/60 outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-3 text-blue-300 hover:text-white transition-colors">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex gap-2 rounded-xl border border-red-400/30 bg-red-500/20 p-3 text-sm text-red-200">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />{error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit" disabled={loading}
                  className="h-11 w-full rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</> : 'Sign In →'}
                </button>

                {/* Info */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-blue-200 space-y-1">
                  <p className="font-semibold">🔐 Login with your Employee ID</p>
                  <p>Your Employee ID (e.g. <span className="font-mono text-white">EMP-0001</span>) and default password <span className="font-mono text-white">GMS@1234</span> were shared by HR.</p>
                  <p>You'll be asked to set a new password on first login.</p>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-blue-400 mt-4">
          Don't have credentials? Contact your HR department.
        </p>
      </div>
    </div>
  );
};

export default Login;
