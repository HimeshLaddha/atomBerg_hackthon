import React, { useState } from 'react';

const CheckInCommentForm = ({ initialComment, onSave }) => {
  const [comment, setComment] = useState(initialComment || '');
  const [isEditing, setIsEditing] = useState(!initialComment);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(comment);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Manager Check-in Note</h5>
          <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium underline">Edit Note</button>
        </div>
        <p className="text-sm text-gray-700 italic">"{comment}"</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-gray-50 border border-gray-200 p-4 rounded-lg">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Manager Check-in Validation</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white mb-2"
        rows="3"
        placeholder="Enter your formal validation critique or feedback for this quarter..."
        required
      />
      <div className="flex justify-end space-x-2">
        {initialComment && (
          <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800">
            Cancel
          </button>
        )}
        <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors">
          Save Check-in Note
        </button>
      </div>
    </form>
  );
};

export default CheckInCommentForm;
