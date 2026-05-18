import React, { useState } from 'react';

const STATUS_OPTIONS = ['Not Started', 'On Track', 'Completed'];

const STATUS_STYLES = {
  'Completed':   'bg-green-100 text-green-800 border-green-300',
  'On Track':    'bg-blue-100 text-blue-800 border-blue-300',
  'Not Started': 'bg-gray-100 text-gray-600 border-gray-300',
};

/**
 * CheckInCommentForm
 * Allows a manager to:
 *   1. Set / update the quarter status (Completed / On Track / Not Started)
 *   2. Write a formal check-in validation comment
 * Both are saved together via onSave(comment, status).
 */
const CheckInCommentForm = ({ initialComment, initialStatus, onSave }) => {
  const [comment, setComment]   = useState(initialComment || '');
  const [status,  setStatus]    = useState(initialStatus  || 'Not Started');
  const [isEditing, setIsEditing] = useState(!initialComment);
  const [saved, setSaved]       = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(comment, status);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isEditing) {
    return (
      <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <h5 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
            Manager Check-in
          </h5>
          <button
            onClick={() => setIsEditing(true)}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium underline"
          >
            Edit
          </button>
        </div>

        {/* Status badge */}
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLES[status]}`}>
          {status === 'Completed' ? '✓ ' : status === 'On Track' ? '→ ' : '○ '}{status}
        </span>

        {/* Comment */}
        {comment && (
          <p className="text-sm text-gray-700 italic leading-relaxed">"{comment}"</p>
        )}

        {saved && (
          <p className="text-xs text-green-600 font-semibold">✓ Saved successfully</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-3">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
        Manager Check-in &amp; Approval
      </label>

      {/* Status selector */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5 font-medium">Mark Quarter Status</p>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStatus(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                status === opt
                  ? STATUS_STYLES[opt] + ' ring-2 ring-offset-1 ring-indigo-400'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {opt === 'Completed' ? '✓ ' : opt === 'On Track' ? '→ ' : '○ '}{opt}
            </button>
          ))}
        </div>
      </div>

      {/* Comment textarea */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5 font-medium">Validation Comment</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          rows="3"
          placeholder="Enter your formal validation note for this quarter..."
          required
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {initialComment && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          ✓ Save Check-in
        </button>
      </div>
    </form>
  );
};

export default CheckInCommentForm;
