import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../../config/api';

const DEPARTMENTS = ['Engineering', 'Human Resources', 'Sales', 'Operations'];

const UserProvisioningForm = ({ onSuccess }) => {
  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [managerId, setManagerId] = useState('');

  // Generated credential states
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', text: '' }

  // Load active managers (L1) on component mount
  useEffect(() => {
    const loadManagers = async () => {
      try {
        setFetchLoading(true);
        const res = await axios.get(`${API}/api/users?role=Manager`);
        setManagers(res.data || []);
      } catch (err) {
        console.error('Failed to fetch managers:', err);
      } finally {
        setFetchLoading(false);
      }
    };
    loadManagers();
  }, []);

  // Clear status alert after 6 seconds
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(timer);
  }, [status]);

  // Frictionless Credential Generation
  const handleGenerateCredentials = () => {
    // Generate User ID: EMP-2026-XXX
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const genUserId = `EMP-2026-${randomDigits}`;

    // Generate Username from email prefix or name prefix
    let genUsername = '';
    if (email.trim() && email.includes('@')) {
      genUsername = email.trim().split('@')[0].toLowerCase();
    } else if (name.trim()) {
      genUsername = name.trim().toLowerCase().replace(/\s+/g, '.');
    } else {
      genUsername = `emp.${randomDigits}`;
    }

    setUserId(genUserId);
    setUsername(genUsername);
    setPassword('welcome@2026');
    setStatus(null);
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    // Client-side checks
    if (!userId.trim() || !username.trim() || !password.trim()) {
      setStatus({
        type: 'error',
        text: 'Please click "Generate Credentials" or manually enter User ID, Username, and Password first.',
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        department,
        managerId: managerId || null,
        userId: userId.trim(),
        username: username.trim(),
        password: password.trim(),
      };

      const res = await axios.post(`${API}/api/admin/provision-user`, payload);

      setStatus({
        type: 'success',
        text: res.data.message || 'User provisioned successfully!',
      });

      // Reset form on success
      setName('');
      setEmail('');
      setDepartment('Engineering');
      setManagerId('');
      setUserId('');
      setUsername('');
      setPassword('');

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Provisioning form submit error:', err);
      setStatus({
        type: 'error',
        text: err.response?.data?.message || 'Failed to provision user. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl">👤</span> User Provisioning Engine
        </h2>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          HR Administration portal to authorize new employees, create secure database records, and automatically initialize their H1 Goal Sheets.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g., John Doe"
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Corporate Email Address
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Department & L1 Manager Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* L1 Manager */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Active Manager (L1)
            </label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              disabled={fetchLoading}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white disabled:opacity-50"
            >
              <option value="" className="text-gray-400">
                {fetchLoading ? 'Loading managers...' : 'Select L1 Manager (None/Direct)'}
              </option>
              {managers.map((mgr) => (
                <option key={mgr._id} value={mgr._id}>
                  {mgr.name} ({mgr.userId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider & Credential Actions */}
        <div className="pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleGenerateCredentials}
            className="w-full py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 text-blue-700 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer shadow-sm"
          >
            🔑 Generate Credentials
          </button>
        </div>

        {/* Generated Fields Display */}
        {(userId || username || password) && (
          <div className="p-3.5 bg-blue-50/30 border border-blue-100 rounded-lg space-y-3">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
              Generated Credentials
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 font-bold mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 font-bold mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 font-bold mb-1">
                  Temp Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Action Control */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="text-xs sm:text-sm font-semibold px-4 py-2.5 w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-55 text-white rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md hover:shadow-blue-500/10"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Authorizing...
              </>
            ) : (
              '👤 Provision & Authorize User'
            )}
          </button>
        </div>

        {/* Status Alerts */}
        {status && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold text-center border transition-all ${
              status.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {status.text}
          </div>
        )}
      </form>
    </div>
  );
};

export default UserProvisioningForm;
