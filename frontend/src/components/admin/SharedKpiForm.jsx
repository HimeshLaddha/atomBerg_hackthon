import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

const UOM_TYPES = [
  'Numeric_Min',
  'Percentage_Min',
  'Numeric_Max',
  'Percentage_Max',
  'Zero-based',
  'Timeline',
];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Human Resources'];

// ─────────────────────────────────────────────────────────────────────────────
/**
 * SharedKpiForm
 * Allows an HR Admin to inject a Corporate/Departmental KPI into employee
 * GoalSheets.  Supports two targeting modes:
 *   1. Department broadcast — injects into all employees in a department
 *   2. Targeted by Employee IDs — comma-separated list of userId values
 *      (e.g. "EMP-003, EMP-004")
 */
const SharedKpiForm = ({ onSuccess }) => {
  const [mode, setMode] = useState('department'); // 'department' | 'targeted'
  const [form, setForm] = useState({
    title: '',
    thrustArea: '',
    uomType: 'Numeric_Min',
    target: '',
    department: 'Engineering',
    employeeIds: '',   // comma-separated userId strings for targeted mode
  });
  const [status, setStatus] = useState(null); // { type: 'success'|'error', text: '' }
  const [loading, setLoading] = useState(false);

  // Clear status after 5 s
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 5000);
    return () => clearTimeout(t);
  }, [status]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    // Build request payload
    const payload = {
      title:     form.title.trim(),
      thrustArea: form.thrustArea.trim(),
      uomType:   form.uomType,
      target:    form.target.trim(),
    };

    if (mode === 'department') {
      payload.department = form.department;
    } else {
      // Parse comma-separated employee IDs into a clean array
      const ids = form.employeeIds
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (!ids.length) {
        setStatus({ type: 'error', text: 'Please enter at least one Employee ID.' });
        setLoading(false);
        return;
      }
      payload.employeeIds = ids;
    }

    try {
      const endpoint = mode === 'department'
        ? `${API}/api/goals/shared-kpi`          // existing department broadcast
        : `${API}/api/admin/broadcast-kpi`;       // new per-ID endpoint

      const res = await axios.post(endpoint, payload);
      setStatus({ type: 'success', text: res.data.message });
      // Reset form fields (keep mode & department)
      setForm(prev => ({ ...prev, title: '', thrustArea: '', target: '', employeeIds: '' }));
      if (onSuccess) onSuccess();
    } catch (err) {
      setStatus({
        type: 'error',
        text: err.response?.data?.message || 'Broadcast failed. Check backend logs.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <span className="text-2xl mt-0.5">📡</span>
        <div>
          <p className="text-sm font-bold text-blue-800">Shared KPI Injection Engine</p>
          <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
            Injected goals appear on employees' goal sheets with{' '}
            <strong>Title, Thrust Area, UoM, and Target locked as read-only</strong>.
            The employee may only adjust the <strong>Weightage</strong> field.
          </p>
        </div>
      </div>

      {/* Targeting mode toggle */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'department', label: '🏢 Department Broadcast' },
          { key: 'targeted',   label: '🎯 Target by Employee IDs' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
              mode === key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">

        {/* Targeting field */}
        {mode === 'department' ? (
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Target Department
            </label>
            <select
              value={form.department}
              onChange={e => set('department', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Employee IDs <span className="text-gray-400 font-normal">(comma-separated, e.g. EMP-003, EMP-004)</span>
            </label>
            <input
              type="text"
              required
              value={form.employeeIds}
              onChange={e => set('employeeIds', e.target.value)}
              placeholder="EMP-003, EMP-004"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        )}

        {/* KPI Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Thrust Area
            </label>
            <input
              required
              type="text"
              value={form.thrustArea}
              onChange={e => set('thrustArea', e.target.value)}
              placeholder="e.g. Quality, Growth"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              KPI Title
            </label>
            <input
              required
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. System Uptime"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Unit of Measurement
            </label>
            <select
              value={form.uomType}
              onChange={e => set('uomType', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {UOM_TYPES.map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Planned Target
            </label>
            <input
              required
              type="text"
              value={form.target}
              onChange={e => set('target', e.target.value)}
              placeholder="e.g. 99.9, 100, 2026-06-30"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Broadcasting…
            </>
          ) : (
            `📡 ${mode === 'department' ? 'Broadcast KPI to Department' : 'Inject KPI to Selected Employees'}`
          )}
        </button>

        {/* Status message */}
        {status && (
          <div className={`p-3 rounded-lg text-sm font-medium text-center border ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {status.text}
          </div>
        )}
      </form>
    </div>
  );
};

export default SharedKpiForm;
