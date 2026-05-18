import React, { useState, useMemo } from 'react';
import { calculateGoalProgress } from '../../utils/progressEngine';

// ── Rich mock user profiles ────────────────────────────────────────────────────
export const MOCK_PROFILES = [
  {
    id: 'EMP-001', name: 'Alice Chen', role: 'Employee',
    department: 'Engineering', manager: 'Bob Martinez',
    sheetStatus: 'Draft',
    goals: [
      { title: 'Reduce build time', uomType: 'Numeric_Max', target: '10', thrustArea: 'Operational Excellence',
        quarterlyAchievements: { Q1: { status: 'In Progress', actualAchievement: '', managerComment: '' } } },
      { title: 'Ship 3 features', uomType: 'Numeric_Min', target: '3', thrustArea: 'Product Growth',
        quarterlyAchievements: { Q1: { status: 'Not Started', actualAchievement: '', managerComment: '' } } },
    ],
  },
  {
    id: 'EMP-002', name: 'David Lee', role: 'Employee',
    department: 'Sales', manager: 'Priya Nair',
    sheetStatus: 'Draft',
    goals: [
      { title: 'Achieve ₹50L revenue', uomType: 'Numeric_Min', target: '5000000', thrustArea: 'Revenue Growth',
        quarterlyAchievements: { Q1: { status: 'Not Started', actualAchievement: '', managerComment: '' } } },
    ],
  },
  {
    id: 'EMP-003', name: 'Sana Mirza', role: 'Employee',
    department: 'Marketing', manager: 'Bob Martinez',
    sheetStatus: 'Pending_Approval',
    goals: [
      { title: 'Launch campaign', uomType: 'Timeline', target: '2026-03-31', thrustArea: 'Brand Building',
        quarterlyAchievements: { Q1: { status: 'Completed', actualAchievement: '2026-03-28', managerComment: 'Great work!' } } },
      { title: 'Zero ad budget overruns', uomType: 'Zero-based', target: '0', thrustArea: 'Operational Excellence',
        quarterlyAchievements: { Q1: { status: 'Completed', actualAchievement: '0', managerComment: 'Excellent discipline.' } } },
    ],
  },
  {
    id: 'MGR-001', name: 'Bob Martinez', role: 'Manager',
    department: 'Engineering', manager: 'Carol Admin',
    sheetStatus: 'Approved',
    goals: [
      { title: 'Team delivery rate', uomType: 'Percentage_Min', target: '90', thrustArea: 'Operational Excellence',
        quarterlyAchievements: { Q1: { status: 'In Progress', actualAchievement: '75', managerComment: '' } } },
    ],
  },
  {
    id: 'MGR-002', name: 'Priya Nair', role: 'Manager',
    department: 'Sales', manager: 'Carol Admin',
    sheetStatus: 'Approved',
    goals: [
      { title: 'Sales pipeline coverage', uomType: 'Numeric_Min', target: '3', thrustArea: 'Revenue Growth',
        quarterlyAchievements: { Q1: { status: 'Not Started', actualAchievement: '', managerComment: '' } } },
    ],
  },
  {
    id: 'EMP-004', name: 'Rohan Gupta', role: 'Employee',
    department: 'Human Resources', manager: 'Priya Nair',
    sheetStatus: 'Approved',
    goals: [
      { title: 'Reduce attrition to <5%', uomType: 'Percentage_Max', target: '5', thrustArea: 'People Development',
        quarterlyAchievements: { Q1: { status: 'Completed', actualAchievement: '3.2', managerComment: 'Strong retention strategy!' } } },
    ],
  },
];

// ── Cycle offset options ───────────────────────────────────────────────────────
export const CYCLE_OPTIONS = [
  { value: 'on_schedule', label: '✅ On Schedule', days: 0 },
  { value: 'may1_5d',     label: '⚠️  5 Days Past May 1st Goal Window',   days: 5  },
  { value: 'jul_10d',     label: '🔥 10 Days Past July Q1 Window',        days: 10 },
];

// ── Interval badge renderer ────────────────────────────────────────────────────
const getIntervalBadge = (days) => {
  if (days >= 1 && days <= 3) {
    return {
      label: '⚠️ Auto-Notification to Employee',
      classes: 'bg-amber-100 text-amber-800 border-amber-300',
      ring: 'border-l-4 border-amber-400',
    };
  }
  if (days >= 4 && days <= 7) {
    return {
      label: '🔥 Escalated to L1 Manager',
      classes: 'bg-orange-100 text-orange-800 border-orange-300',
      ring: 'border-l-4 border-orange-500',
    };
  }
  if (days >= 8) {
    return {
      label: '🚨 Critical Alert Streamed to HR / Skip-Level',
      classes: 'bg-red-100 text-red-900 border-red-300',
      ring: 'border-l-4 border-red-600',
    };
  }
  return null;
};

// ── Rule-Based Trigger Engine ──────────────────────────────────────────────────
const runEscalationRules = (cycleValue, days) => {
  if (cycleValue === 'on_schedule' || days === 0) return [];

  const breaches = [];

  MOCK_PROFILES.forEach((profile) => {
    // Rule 1: 5 Days Past May 1st → flag any employee with Draft status
    if (cycleValue === 'may1_5d') {
      if (profile.role === 'Employee' && profile.sheetStatus === 'Draft') {
        breaches.push({
          id: `${profile.id}-draft`,
          person: profile.name,
          role: profile.role,
          department: profile.department,
          manager: profile.manager,
          ruleTriggered: '5-Day May 1st Goal Submission Window',
          breachType: 'Goal Sheet Still in Draft',
          detail: `${profile.name} has not submitted their goal sheet (current status: ${profile.sheetStatus}). May 1st submission deadline has passed by ${days} day(s).`,
          days,
          severity: days >= 8 ? 'critical' : days >= 4 ? 'elevated' : 'warning',
        });
      }
    }

    // Rule 2: 10 Days Past July Q1 → flag employees/managers with missing Q1 achievements or comments
    if (cycleValue === 'jul_10d') {
      const missingQ1Achievement = profile.goals.some(
        (g) => !g.quarterlyAchievements?.Q1?.actualAchievement || g.quarterlyAchievements?.Q1?.actualAchievement === ''
      );
      const missingQ1Comment = profile.goals.every(
        (g) => !g.quarterlyAchievements?.Q1?.managerComment || g.quarterlyAchievements?.Q1?.managerComment?.trim() === ''
      );

      if (missingQ1Achievement) {
        breaches.push({
          id: `${profile.id}-q1-achievement`,
          person: profile.name,
          role: profile.role,
          department: profile.department,
          manager: profile.manager,
          ruleTriggered: '10-Day July Q1 Achievement Update Window',
          breachType: 'Q1 Achievement Update Missing',
          detail: `${profile.name} has not logged Q1 actual achievements for one or more goals. Q1 update window expired ${days} day(s) ago.`,
          days,
          severity: days >= 8 ? 'critical' : days >= 4 ? 'elevated' : 'warning',
        });
      }

      if ((profile.role === 'Manager' || profile.role === 'Employee') && missingQ1Comment) {
        breaches.push({
          id: `${profile.id}-q1-comment`,
          person: profile.name,
          role: profile.role,
          department: profile.department,
          manager: profile.manager,
          ruleTriggered: '10-Day July Q1 Manager Check-in Window',
          breachType: 'Q1 Manager Comment Log Missing',
          detail: `No Q1 check-in comment has been logged for ${profile.name}'s goals. Manager comment log overdue by ${days} day(s).`,
          days,
          severity: days >= 8 ? 'critical' : days >= 4 ? 'elevated' : 'warning',
        });
      }
    }
  });

  return breaches;
};

// ── Severity icon ──────────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
  const map = {
    warning:  { bg: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400', label: 'WARNING' },
    elevated: { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'ELEVATED' },
    critical: { bg: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-600',    label: 'CRITICAL' },
  };
  const s = map[severity] || map.warning;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ── Main EscalationEngine Component ───────────────────────────────────────────
const EscalationEngine = () => {
  const [selectedCycle, setSelectedCycle] = useState('on_schedule');

  const cycleOption = CYCLE_OPTIONS.find((o) => o.value === selectedCycle);
  const days = cycleOption?.days ?? 0;
  const breaches = useMemo(() => runEscalationRules(selectedCycle, days), [selectedCycle, days]);

  const intervalBadge = getIntervalBadge(days);

  // Group breaches by breach type for the log
  const criticalCount  = breaches.filter((b) => b.severity === 'critical').length;
  const elevatedCount  = breaches.filter((b) => b.severity === 'elevated').length;
  const warningCount   = breaches.filter((b) => b.severity === 'warning').length;

  return (
    <div className="space-y-8">
      {/* ── Control Widget ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🎛️</span>
              <h2 className="text-white font-extrabold text-xl">Escalation Simulation Controller</h2>
            </div>
            <p className="text-slate-300 text-sm">
              Simulate compliance cycle date offsets. The rule engine will scan all seeded employee profiles
              and flag any breaches according to BRD policy.
            </p>
          </div>

          <div className="min-w-[320px]">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Simulate Target Cycle Date Offset
            </label>
            <select
              id="cycle-offset-dropdown"
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-xl
                         text-sm font-semibold backdrop-blur-sm focus:ring-2 focus:ring-indigo-400
                         focus:border-indigo-400 transition-all cursor-pointer
                         appearance-none hover:bg-white/15"
              style={{ backgroundImage: 'none' }}
            >
              {CYCLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-gray-900 bg-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interval status bar */}
        {intervalBadge && (
          <div className={`mt-5 flex items-center gap-3 px-4 py-3 rounded-xl border bg-white/5 ${intervalBadge.ring}`}>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Active Interval Rule</p>
              <p className={`text-xs font-semibold mt-0.5 px-2.5 py-1 rounded-lg inline-block border ${intervalBadge.classes}`}>
                {intervalBadge.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">Day Offset</p>
              <p className="text-white font-black text-2xl">{days}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Summary counters ───────────────────────────────────────────────── */}
      {selectedCycle !== 'on_schedule' && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Breaches',   value: breaches.length, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
            { label: 'Critical',         value: criticalCount,   color: 'text-red-600',    bg: 'bg-red-50 border-red-100'     },
            { label: 'Elevated',         value: elevatedCount,   color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
            { label: 'Warning',          value: warningCount,    color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100' },
          ].map((kpi) => (
            <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.bg}`}>
              <p className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-1 font-semibold uppercase tracking-wider">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── On-schedule state ─────────────────────────────────────────────── */}
      {selectedCycle === 'on_schedule' && (
        <div className="text-center py-20 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-green-800">All Systems On Schedule</h3>
          <p className="text-green-600 text-sm mt-2 max-w-md mx-auto">
            No compliance breaches detected. Select a cycle date offset above to simulate escalation scenarios.
          </p>
        </div>
      )}

      {/* ── Escalation Log Grid ───────────────────────────────────────────── */}
      {selectedCycle !== 'on_schedule' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                🚨 System Escalation Log
                {breaches.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-sm font-black rounded-full">
                    {breaches.length} breach{breaches.length > 1 ? 'es' : ''}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Rule-triggered compliance flags for cycle: <span className="font-semibold text-indigo-600">{cycleOption?.label}</span>
              </p>
            </div>
          </div>

          {breaches.length === 0 && (
            <div className="text-center py-16 bg-green-50 rounded-2xl border border-green-100">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-green-700 font-bold">No breaches flagged under this simulation window.</p>
            </div>
          )}

          <div className="space-y-4">
            {breaches.map((breach, idx) => {
              const badge = getIntervalBadge(breach.days);
              return (
                <div
                  key={breach.id}
                  className={`rounded-2xl border-2 overflow-hidden shadow-sm transition-all hover:shadow-md ${
                    breach.severity === 'critical'
                      ? 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50'
                      : breach.severity === 'elevated'
                      ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
                      : 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
                  }`}
                >
                  {/* Card header */}
                  <div className={`px-5 py-3 border-b flex items-center justify-between ${
                    breach.severity === 'critical' ? 'border-red-200 bg-red-100/60' :
                    breach.severity === 'elevated' ? 'border-orange-200 bg-orange-100/60' :
                    'border-amber-200 bg-amber-100/60'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono text-xs font-bold">#{String(idx + 1).padStart(2, '0')}</span>
                      <SeverityBadge severity={breach.severity} />
                      <span className="font-bold text-gray-800 text-sm">{breach.breachType}</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500 bg-white/60 px-2 py-0.5 rounded-lg border">
                      Day +{breach.days}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Person info */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Flagged Person</p>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm ${
                          breach.role === 'Manager' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                          'bg-gradient-to-br from-blue-500 to-cyan-600'
                        }`}>
                          {breach.person.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{breach.person}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                              breach.role === 'Manager'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>{breach.role}</span>
                            <span className="text-xs text-gray-400">{breach.department}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 pl-12">
                        Reports to: <span className="font-semibold text-gray-700">{breach.manager}</span>
                      </p>
                    </div>

                    {/* Rule + Detail */}
                    <div className="lg:col-span-1 space-y-1.5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rule Triggered</p>
                      <p className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
                        📋 {breach.ruleTriggered}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">{breach.detail}</p>
                    </div>

                    {/* Escalation chain */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Escalation Chain</p>
                      <div className="space-y-2">
                        {[
                          { range: 'Day 1–3', label: '⚠️ Auto-Notification to Employee', active: breach.days >= 1 },
                          { range: 'Day 4–7', label: '🔥 Escalated to L1 Manager',        active: breach.days >= 4 },
                          { range: 'Day 8+',  label: '🚨 Critical → HR / Skip-Level',     active: breach.days >= 8 },
                        ].map((step) => (
                          <div key={step.range}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                              step.active
                                ? 'bg-white border-indigo-200 text-indigo-800 shadow-sm'
                                : 'bg-white/40 border-gray-200 text-gray-400'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${step.active ? 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.7)]' : 'bg-gray-300'}`} />
                            <span className="text-gray-400 font-mono">{step.range}</span>
                            <span className="flex-1">{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Active interval badge */}
                  {badge && (
                    <div className={`mx-5 mb-4 px-3 py-2 rounded-lg border text-xs font-bold ${badge.classes}`}>
                      🔔 Current Interval Status: {badge.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalationEngine;
