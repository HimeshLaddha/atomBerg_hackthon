import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { calculateGoalProgress, calculateRawProgress } from '../../utils/progressEngine';
import { MOCK_PROFILES } from './EscalationEngine';
import API from '../../config/api';

// ── Colour palette per quarter ─────────────────────────────────────────────────
const Q_COLORS = {
  Q1: { bar: 'bg-indigo-500',  badge: 'bg-indigo-100 text-indigo-700',  ring: 'border-indigo-300'  },
  Q2: { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', ring: 'border-emerald-300' },
  Q3: { bar: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700',   ring: 'border-violet-300'  },
  Q4: { bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700',     ring: 'border-amber-300'   },
};

// ── Small helpers ──────────────────────────────────────────────────────────────
const ProgressBar = ({ pct, colorClass = 'bg-indigo-500', height = 'h-2.5' }) => (
  <div className={`w-full bg-gray-100 rounded-full ${height} overflow-hidden`}>
    <div
      className={`${height} rounded-full transition-all duration-700 ${colorClass}`}
      style={{ width: `${Math.min(pct, 100)}%` }}
    />
  </div>
);

const MetricBadge = ({ label, value, color }) => (
  <div className={`rounded-xl p-4 border ${color}`}>
    <p className="text-3xl font-black">{value}</p>
    <p className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-70">{label}</p>
  </div>
);

// ── UoM type to human label ────────────────────────────────────────────────────
const UOM_LABEL = {
  Numeric_Min:    'Min (Higher Better)',
  Numeric_Max:    'Max (Lower Better)',
  Percentage_Min: 'Min %',
  Percentage_Max: 'Max %',
  'Zero-based':   'Zero Incidents',
  Timeline:       'Timeline',
};

const UOM_BADGE_COLOR = {
  Numeric_Min:    'bg-green-100 text-green-700 border-green-200',
  Numeric_Max:    'bg-blue-100 text-blue-700 border-blue-200',
  Percentage_Min: 'bg-teal-100 text-teal-700 border-teal-200',
  Percentage_Max: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Zero-based':   'bg-rose-100 text-rose-700 border-rose-200',
  Timeline:       'bg-purple-100 text-purple-700 border-purple-200',
};

// ── Thrust area colour mapping ─────────────────────────────────────────────────
const THRUST_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-amber-500',  'bg-rose-500',    'bg-cyan-500',
];

// ── Compute aggregate QoQ score for a profile+quarter using the UoM engine ────
const computeQScore = (profile, quarter) => {
  if (!profile.goals.length) return 0;
  const scores = profile.goals.map((g) =>
    calculateGoalProgress(
      g.uomType,
      g.target,
      g.quarterlyAchievements?.[quarter]?.actualAchievement ?? ''
    )
  );
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
};

// ── Manager effectiveness derived from mock profiles ──────────────────────────
const buildManagerStats = (sheets) => {
  // Build from API sheets (live data) OR fall back to mock profiles
  const source = sheets.length > 0 ? sheets : [];
  const managerMap = {};

  // From live API data
  source.forEach((sheet) => {
    const mgrName = sheet.employeeId?.managerId?.name ?? sheet.employeeId?.manager ?? 'Unknown Manager';
    if (!managerMap[mgrName]) managerMap[mgrName] = { total: 0, checkedIn: 0, pending: 0, names: [] };
    managerMap[mgrName].total += 1;
    managerMap[mgrName].names.push(sheet.employeeId?.name ?? '?');

    const allQsHaveComment = ['Q1', 'Q2', 'Q3', 'Q4'].every((q) =>
      sheet.goals.some((g) => g.quarterlyAchievements?.[q]?.managerComment?.trim())
    );
    if (allQsHaveComment) managerMap[mgrName].checkedIn += 1;
    else managerMap[mgrName].pending += 1;
  });

  // Supplement / override with mock profiles for richer demo
  const managerProfiles = MOCK_PROFILES.filter((p) => p.role === 'Manager');
  managerProfiles.forEach((mgr) => {
    const directReports = MOCK_PROFILES.filter((p) => p.manager === mgr.name);
    const checkedIn = directReports.filter((dr) =>
      dr.goals.every((g) => g.quarterlyAchievements?.Q1?.managerComment?.trim())
    ).length;

    if (!managerMap[mgr.name]) {
      managerMap[mgr.name] = { total: directReports.length, checkedIn, pending: directReports.length - checkedIn, names: directReports.map((d) => d.name) };
    } else {
      // Merge
      managerMap[mgr.name].total = Math.max(managerMap[mgr.name].total, directReports.length);
    }
  });

  return Object.entries(managerMap)
    .map(([name, data]) => ({
      name,
      ...data,
      rate: data.total > 0 ? Math.round((data.checkedIn / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
};

// ── QoQ Performance grid (using mock profiles for rich demo) ──────────────────
const QoQGrid = ({ selectedQ, sheets }) => {
  const profiles = MOCK_PROFILES;

  const rows = profiles.map((profile) => {
    const score = computeQScore(profile, selectedQ);
    const isTeam = profile.role === 'Manager';
    const statusLabel = score >= 80 ? 'On Track' : score >= 50 ? 'At Risk' : 'Behind';
    const statusColor = score >= 80
      ? 'bg-green-100 text-green-700'
      : score >= 50
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700';

    return { ...profile, score, isTeam, statusLabel, statusColor };
  });

  const avgScore = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
  const qColor = Q_COLORS[selectedQ] || Q_COLORS.Q1;

  return (
    <div className="space-y-4">
      {/* Quarter summary */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-3 rounded-xl border ${qColor.ring} bg-white shadow-sm`}>
        <div>
          <span className={`px-3 py-1 rounded-full text-sm font-black border ${qColor.badge} ${qColor.ring}`}>
            {selectedQ} Performance
          </span>
          <p className="text-sm text-gray-500 mt-1">
            UoM-scored aggregate across {rows.length} profiles
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-gray-800">{avgScore}%</p>
          <p className="text-xs text-gray-500">Org Average</p>
        </div>
      </div>

      {/* Per-profile grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((row) => (
          <div key={row.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm ${
                  row.role === 'Manager'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                }`}>
                  {row.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-tight">{row.name}</p>
                  <p className="text-xs text-gray-400">{row.department}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.statusColor}`}>
                {row.statusLabel}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">{selectedQ} Achievement Score</span>
                <span className={`font-black ${row.score >= 80 ? 'text-green-600' : row.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {row.score}%
                </span>
              </div>
              <ProgressBar
                pct={row.score}
                colorClass={row.score >= 80 ? 'bg-green-500' : row.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                height="h-2"
              />
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                row.role === 'Manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>{row.role}</span>
              <span className="text-xs text-gray-400">
                {row.goals.length} goal{row.goals.length !== 1 ? 's' : ''}
              </span>
              {row.isTeam && (
                <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">Team Leader</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main AnalyticsDashboard Component ─────────────────────────────────────────
const AnalyticsDashboard = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQ, setSelectedQ] = useState('Q1');

  useEffect(() => {
    axios
      .get(`${API}/api/goals/approved?t=${Date.now()}`)
      .then((r) => setSheets(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const allGoals = useMemo(() => {
    const apiGoals = sheets.flatMap((s) => s.goals || []);
    const mockGoals = MOCK_PROFILES.flatMap((p) => p.goals);
    // Deduplicate by title (simple heuristic — prefer API data)
    const apiTitles = new Set(apiGoals.map((g) => g.title));
    const uniqueMock = mockGoals.filter((g) => !apiTitles.has(g.title));
    return [...apiGoals, ...uniqueMock];
  }, [sheets]);

  const thrustMap = useMemo(() => {
    const m = {};
    allGoals.forEach((g) => {
      m[g.thrustArea ?? 'Uncategorised'] = (m[g.thrustArea ?? 'Uncategorised'] || 0) + 1;
    });
    return m;
  }, [allGoals]);

  const uomMap = useMemo(() => {
    const m = {};
    allGoals.forEach((g) => {
      const key = g.uomType ?? 'Unknown';
      m[key] = (m[key] || 0) + 1;
    });
    return m;
  }, [allGoals]);

  const totalGoals = allGoals.length;
  const managerStats = useMemo(() => buildManagerStats(sheets), [sheets]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
          <span className="text-white text-lg">📊</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">QoQ Analytics Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Section 5.4 — Goal Distribution, UoM Matrix & Manager Effectiveness</p>
        </div>
      </div>

      {/* ── KPI Summary row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricBadge label="Total Active Goals"   value={totalGoals}  color="bg-indigo-50 border-indigo-100 text-indigo-700" />
        <MetricBadge label="Thrust Areas"         value={Object.keys(thrustMap).length} color="bg-violet-50 border-violet-100 text-violet-700" />
        <MetricBadge label="UoM Categories"       value={Object.keys(uomMap).length}    color="bg-emerald-50 border-emerald-100 text-emerald-700" />
        <MetricBadge label="Managers Tracked"     value={managerStats.length}            color="bg-amber-50 border-amber-100 text-amber-700" />
      </div>

      {/* ── Goal Distribution Chart Grid ─────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-extrabold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-1 h-6 bg-indigo-500 rounded-full" />
          Goal Distribution Breakdown
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── By Thrust Area ───────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-xs font-black">PILLAR</span>
              By Corporate Thrust Area
            </h4>
            {Object.keys(thrustMap).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No goal data available.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(thrustMap)
                  .sort((a, b) => b[1] - a[1])
                  .map(([area, count], i) => {
                    const pct = totalGoals > 0 ? Math.round((count / totalGoals) * 100) : 0;
                    const color = THRUST_COLORS[i % THRUST_COLORS.length];
                    return (
                      <div key={area}>
                        <div className="flex justify-between items-center text-sm mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${color}`} />
                            <span className="font-semibold text-gray-700">{area}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-gray-800">{count}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500`}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar pct={pct} colorClass={color} height="h-3" />
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ── By UoM Type ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-xs font-black">UoM</span>
              By Measurement Type
            </h4>
            {Object.keys(uomMap).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No UoM data available.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(uomMap).map(([uom, count]) => {
                  const pct = totalGoals > 0 ? Math.round((count / totalGoals) * 100) : 0;
                  const badgeColor = UOM_BADGE_COLOR[uom] ?? 'bg-gray-100 text-gray-700 border-gray-200';
                  return (
                    <div key={uom}
                      className={`rounded-xl border p-4 flex flex-col gap-2 ${badgeColor} transition-all hover:shadow-md hover:-translate-y-0.5`}
                    >
                      <span className="text-xs font-black uppercase tracking-wider opacity-70">
                        {UOM_LABEL[uom] ?? uom}
                      </span>
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-black">{count}</span>
                        <span className="text-sm font-bold opacity-60 mb-0.5">goal{count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                          <div className="h-1.5 rounded-full bg-current opacity-40" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── QoQ Comparison ───────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <h3 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-6 bg-violet-500 rounded-full" />
            Quarter-on-Quarter Performance Comparison
          </h3>
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
            {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
              const qc = Q_COLORS[q];
              return (
                <button
                  key={q}
                  onClick={() => setSelectedQ(q)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    selectedQ === q
                      ? `${qc.badge} shadow-sm border ${qc.ring}`
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {q}
                </button>
              );
            })}
          </div>
        </div>
        <QoQGrid selectedQ={selectedQ} sheets={sheets} />
      </div>

      {/* ── Manager Effectiveness Ranking ────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-extrabold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-1 h-6 bg-amber-500 rounded-full" />
          Manager Effectiveness Rating Board
        </h3>

        {managerStats.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm font-medium">No manager data available.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {managerStats.slice(0, 3).map((mgr, idx) => (
              <div
                key={mgr.name}
                className="bg-white rounded-2xl border border-gray-200 px-5 py-4 shadow-sm
                           flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all"
              >
                {/* Rank badge */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm ${
                  idx === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                  idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                  idx === 2 ? 'bg-gradient-to-br from-amber-600 to-yellow-700' :
                              'bg-gradient-to-br from-slate-500 to-slate-600'
                }`}>
                  #{idx + 1}
                </div>

                {/* Manager info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{mgr.name}</p>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">Manager</span>
                    {mgr.rate === 100 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">⭐ 100% Check-in</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                    <span>👥 {mgr.total} Direct Report{mgr.total !== 1 ? 's' : ''}</span>
                    <span className="text-green-600 font-semibold">✓ {mgr.checkedIn} Completed</span>
                    {mgr.pending > 0 && <span className="text-amber-600 font-semibold">⏳ {mgr.pending} Pending</span>}
                  </div>
                  {mgr.names?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      Reports: {mgr.names.join(', ')}
                    </p>
                  )}
                </div>

                {/* Progress */}
                <div className="sm:w-48 flex-shrink-0">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500 font-semibold">Check-in Completion</span>
                    <span className={`font-black ${mgr.rate === 100 ? 'text-green-600' : mgr.rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {mgr.rate}%
                    </span>
                  </div>
                  <ProgressBar
                    pct={mgr.rate}
                    colorClass={mgr.rate === 100 ? 'bg-green-500' : mgr.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                    height="h-3"
                  />
                </div>

                {/* Status chip */}
                <div className="flex-shrink-0">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    mgr.rate === 100
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : mgr.rate >= 50
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {mgr.rate === 100 ? '✅ Complete' : mgr.rate >= 50 ? '⏳ In Progress' : '❌ At Risk'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
