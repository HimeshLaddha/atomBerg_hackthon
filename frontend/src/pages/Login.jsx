import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

// ── Dummy credentials map ─────────────────────────────────────────────────────
// userIds MUST match backend/src/utils/seed.js exactly.
const CREDENTIALS = {
  // Admins
  'alex.rivera':  { password: 'adm@2026',  userId: 'EMP-001', name: 'Alex Rivera',  role: 'Admin',    department: 'Human Resources' },
  'priya.kapoor': { password: 'adm@2026b', userId: 'EMP-011', name: 'Priya Kapoor', role: 'Admin',    department: 'Human Resources' },
  'sam.obrien':   { password: 'adm@2026c', userId: 'EMP-012', name: "Sam O'Brien",  role: 'Admin',    department: 'Operations'      },
  // Managers
  'jane.smith':   { password: 'mgr@2026',  userId: 'EMP-002', name: 'Jane Smith',   role: 'Manager',  department: 'Engineering'     },
  'bob.martinez': { password: 'mgr@2026b', userId: 'EMP-005', name: 'Bob Martinez', role: 'Manager',  department: 'Sales'           },
  'nina.patel':   { password: 'mgr@2026c', userId: 'EMP-006', name: 'Nina Patel',   role: 'Manager',  department: 'Marketing'       },
  'raj.mehta':    { password: 'mgr@2026d', userId: 'EMP-007', name: 'Raj Mehta',    role: 'Manager',  department: 'Finance'         },
  // Employees
  'john.doe':     { password: 'emp@2026',  userId: 'EMP-003', name: 'John Doe',     role: 'Employee', department: 'Engineering'     },
  'diana.emp':    { password: 'emp@2026b', userId: 'EMP-004', name: 'Diana Employee',role: 'Employee', department: 'Engineering'     },
  'alice.chen':   { password: 'emp@2026c', userId: 'EMP-008', name: 'Alice Chen',   role: 'Employee', department: 'Engineering'     },
  'david.lee':    { password: 'emp@2026d', userId: 'EMP-009', name: 'David Lee',    role: 'Employee', department: 'Sales'           },
  'sana.mirza':   { password: 'emp@2026e', userId: 'EMP-010', name: 'Sana Mirza',   role: 'Employee', department: 'Sales'           },
  'leo.costa':    { password: 'emp@2026f', userId: 'EMP-013', name: 'Leo Costa',    role: 'Employee', department: 'Marketing'       },
  'meera.joshi':  { password: 'emp@2026g', userId: 'EMP-014', name: 'Meera Joshi',  role: 'Employee', department: 'Marketing'       },
  'tom.nguyen':   { password: 'emp@2026h', userId: 'EMP-015', name: 'Tom Nguyen',   role: 'Employee', department: 'Finance'         },
  'fia.andersen': { password: 'emp@2026i', userId: 'EMP-016', name: 'Fia Andersen', role: 'Employee', department: 'Finance'         },
  'rohan.gupta':  { password: 'emp@2026j', userId: 'EMP-017', name: 'Rohan Gupta',  role: 'Employee', department: 'Engineering'     },
};


// ── Persona quick-login cards (primary 3 for instant access) ──────────────────
const PERSONAS = [
  {
    username: 'john.doe',
    name: 'John Doe',
    role: 'Employee',
    displayRole: 'Software Engineer · Engineering',
    id: 'EMP-003',
    gradient: 'from-violet-600 to-indigo-700',
    ring: 'ring-violet-500/40',
    tagBg: 'bg-violet-500/15',
    tagText: 'text-violet-300',
    border: 'border-violet-500/25',
    glow: '0 0 40px rgba(139,92,246,0.25)',
    hint: 'Approved & Locked · Full Q1–Q4 data',
    icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>),
  },
  {
    username: 'jane.smith',
    name: 'Jane Smith',
    role: 'Manager',
    displayRole: 'Engineering Manager · 4 direct reports',
    id: 'EMP-002',
    gradient: 'from-emerald-600 to-teal-700',
    ring: 'ring-emerald-500/40',
    tagBg: 'bg-emerald-500/15',
    tagText: 'text-emerald-300',
    border: 'border-emerald-500/25',
    glow: '0 0 40px rgba(16,185,129,0.25)',
    hint: 'Approvals · Inline check-ins',
    icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>),
  },
  {
    username: 'alex.rivera',
    name: 'Alex Rivera',
    role: 'Admin',
    displayRole: 'HR Director · Governance',
    id: 'EMP-001',
    gradient: 'from-blue-600 to-violet-700',
    ring: 'ring-blue-500/40',
    tagBg: 'bg-blue-500/15',
    tagText: 'text-blue-300',
    border: 'border-blue-500/25',
    glow: '0 0 40px rgba(79,70,229,0.25)',
    hint: 'KPI broadcast · Escalation · Analytics',
    icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>),
  },
];

// ── All users for the credentials legend ──────────────────────────────────────
const ALL_USERS = [
  { group:'Admin',    items:[
    { name:'Alex Rivera',  username:'alex.rivera',  pwd:'adm@2026',  dept:'HR',          id:'EMP-001' },
    { name:'Priya Kapoor', username:'priya.kapoor', pwd:'adm@2026b', dept:'HR',          id:'EMP-011' },
    { name:"Sam O'Brien",  username:'sam.obrien',   pwd:'adm@2026c', dept:'Operations',  id:'EMP-012' },
  ]},
  { group:'Manager',  items:[
    { name:'Jane Smith',   username:'jane.smith',   pwd:'mgr@2026',  dept:'Engineering', id:'EMP-002' },
    { name:'Bob Martinez', username:'bob.martinez',  pwd:'mgr@2026b', dept:'Sales',       id:'EMP-005' },
    { name:'Nina Patel',   username:'nina.patel',   pwd:'mgr@2026c', dept:'Marketing',   id:'EMP-006' },
    { name:'Raj Mehta',    username:'raj.mehta',    pwd:'mgr@2026d', dept:'Finance',     id:'EMP-007' },
  ]},
  { group:'Employee', items:[
    { name:'John Doe',     username:'john.doe',     pwd:'emp@2026',  dept:'Engineering', id:'EMP-003' },
    { name:'Diana Emp.',   username:'diana.emp',    pwd:'emp@2026b', dept:'Engineering', id:'EMP-004' },
    { name:'Alice Chen',   username:'alice.chen',   pwd:'emp@2026c', dept:'Engineering', id:'EMP-008' },
    { name:'David Lee',    username:'david.lee',    pwd:'emp@2026d', dept:'Sales',       id:'EMP-009' },
    { name:'Sana Mirza',   username:'sana.mirza',   pwd:'emp@2026e', dept:'Sales',       id:'EMP-010' },
    { name:'Leo Costa',    username:'leo.costa',    pwd:'emp@2026f', dept:'Marketing',   id:'EMP-013' },
    { name:'Meera Joshi',  username:'meera.joshi',  pwd:'emp@2026g', dept:'Marketing',   id:'EMP-014' },
    { name:'Tom Nguyen',   username:'tom.nguyen',   pwd:'emp@2026h', dept:'Finance',     id:'EMP-015' },
    { name:'Fia Andersen', username:'fia.andersen', pwd:'emp@2026i', dept:'Finance',     id:'EMP-016' },
    { name:'Rohan Gupta',  username:'rohan.gupta',  pwd:'emp@2026j', dept:'Engineering', id:'EMP-017' },
  ]},
];

// ─────────────────────────────────────────────────────────────────────────────
const Login = () => {
  const { login, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();

  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // Direct card login
  const handleCardLogin = (persona) => {
    setActiveCard(persona.username);
    const cred = CREDENTIALS[persona.username];
    setTimeout(() => {
      login({ userId: cred.userId, name: cred.name, role: cred.role, department: cred.department });
      navigate('/dashboard', { replace: true });
    }, 320);
  };

  // Form login
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError('');
    const cred = CREDENTIALS[username.trim().toLowerCase()];
    if (!cred || cred.password !== password) {
      setError('Invalid username or password. Check the hint below each card.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      login({ userId: cred.userId, name: cred.name, role: cred.role, department: cred.department });
      navigate('/dashboard', { replace: true });
    }, 500);
  };

  // Auto-fill form from card hint click
  const handleFillCreds = (persona) => {
    const cred = CREDENTIALS[persona.username];
    setUsername(persona.username);
    setPassword(cred.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#080910] flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}/>
        <div className="absolute -bottom-24 -right-16 w-[480px] h-[480px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)' }}/>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '44px 44px' }}/>
      </div>

      {/* ── Main card ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}>

        {/* ── LEFT: Login Form ─────────────────────────────────────────────── */}
        <div className="lg:w-[42%] bg-[#0f1117] border-r border-white/[0.07] flex flex-col justify-between p-8 lg:p-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">GoalSync</p>
                <p className="text-white/35 text-[10px] leading-none mt-0.5 font-medium tracking-wider uppercase">Enterprise Portal</p>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-white mb-1.5">Welcome back</h1>
            <p className="text-sm text-white/40 mb-8 leading-relaxed">
              Sign in with your credentials or choose a profile on the right to launch instantly.
            </p>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </span>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder="e.g. john.doe"
                    required
                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl pl-10 pr-4 py-3
                      text-sm text-white placeholder-white/20
                      focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20
                      transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl pl-10 pr-11 py-3
                      text-sm text-white placeholder-white/20
                      focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20
                      transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPass
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25">
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-xs text-red-400 leading-snug">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl font-bold text-sm text-white
                  bg-gradient-to-r from-violet-600 to-indigo-600
                  hover:from-violet-500 hover:to-indigo-500
                  disabled:opacity-60 disabled:cursor-not-allowed
                  shadow-lg shadow-violet-900/40
                  transition-all duration-200 hover:shadow-violet-900/60 hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-white/20 mt-8 leading-relaxed">
            This portal uses anonymous dummy credentials for simulation purposes only.
            No real personal data is collected.
          </p>
        </div>

        {/* ── RIGHT: Quick-Login Cards ─────────────────────────────────────── */}
        <div className="lg:w-[58%] bg-[#0a0b14] flex flex-col justify-center p-8 lg:p-10 gap-4">

          {/* Header */}
          <div className="mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] mb-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"/>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Quick Access · Demo Profiles</span>
            </div>
            <h2 className="text-lg font-bold text-white">Select a profile to launch directly</h2>
            <p className="text-xs text-white/35 mt-1">Click any card to sign in instantly, or use the credentials to fill the form.</p>
          </div>
          

          {/* Full credentials legend — all 17 users */}
          <div className="mt-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-4 pt-3 pb-2">
              Full Credential Reference · 17 Users
            </p>
            <div className="h-[390px] overflow-y-auto px-4 pb-3 space-y-3 scrollbar-thin">
              {ALL_USERS.map(({ group, items }) => {
                const groupColor =
                  group === 'Admin'    ? 'text-blue-400'   :
                  group === 'Manager'  ? 'text-emerald-400' :
                  'text-violet-400';
                return (
                  <div key={group}>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${groupColor}`}>
                      {group}
                    </p>
                    <div className="space-y-1">
                      {items.map(u => (
                        <button
                          key={u.username}
                          onClick={() => { setUsername(u.username); setPassword(u.pwd); setError(''); }}
                          className="w-full flex items-center gap-2 text-left hover:bg-white/[0.05] rounded-lg px-2 py-1 transition-colors group"
                        >
                          <div className="w-5 h-5 rounded flex-shrink-0 bg-white/[0.08] flex items-center justify-center">
                            <span className={`text-[8px] font-black ${groupColor}`}>{u.name.charAt(0)}</span>
                          </div>
                          <span className="text-[10px] text-white/50 font-medium flex-1 truncate group-hover:text-white/70">{u.name}</span>
                          <span className="text-[9px] font-mono text-white/25">{u.username}</span>
                          <span className="text-[9px] font-mono text-white/20">{u.pwd}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-white/15 text-center pb-2">Click any row to auto-fill credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
