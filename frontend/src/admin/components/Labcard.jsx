import React from 'react';

function StatusBadge({ status }) {
  const isActive = status === 'Active';
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
        isActive
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }`}
    >
      ● {status}
    </span>
  );
}

export default function LabCard({
  lab,
  onView,
  onAssignResource,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-[#0e1322] border border-gray-800 hover:border-gray-700 rounded-xl p-5 flex flex-col justify-between transition-all shadow-md">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3">
          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold px-2.5 py-1 rounded-full">
            {lab.category}
          </span>
          <StatusBadge status={lab.status} />
        </div>

        {/* Lab Title */}
        <h3
          onClick={() => onView(lab)}
          className="text-lg font-bold text-gray-100 hover:text-indigo-400 cursor-pointer transition-colors"
        >
          {lab.name}
        </h3>

        {/* Lab Metadata */}
        <div className="mt-3 space-y-1.5 text-xs text-gray-400">
          <p>
            📍 <span className="text-gray-300 font-medium">{lab.location}</span>
          </p>
          <p>
            👥 Capacity:{' '}
            <span className="text-gray-300 font-medium">
              {lab.capacity} Students
            </span>
          </p>
          <p>
            📦 Assigned Resources:{' '}
            <span className="text-indigo-400 font-medium">
              {lab.assignedResources?.length || 0} items
            </span>
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => onView(lab)}
            className="bg-[#161b2c] hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 transition-colors"
          >
            👁️ View
          </button>
        
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(lab)}
            className="text-gray-400 hover:text-amber-400 p-1.5 rounded-md hover:bg-amber-500/10 transition-colors text-xs"
            title="Edit Lab"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(lab.id)}
            className="text-gray-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors text-xs"
            title="Delete Lab"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}