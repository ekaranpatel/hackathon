import React from 'react';

export default function ResourceCard({
  resource,
  availableQuantity,
  onEdit,
  onDelete,
  onQuickQuantityChange,
  onAssign,
  onUnassignLab
}) {
  const resourceId = resource?._id || resource?.id;
  const assignedLabs = resource?.assignedLabs || [];

  // Extract ID reliably regardless of Mongoose schema format
  const getLabId = (item) => {
    if (typeof item === 'string') return item;
    if (typeof item?.lab === 'string') return item.lab;
    if (typeof item?.labId === 'string') return item.labId;
    if (item?.lab?._id) return item.lab._id;
    if (item?.labId?._id) return item.labId._id;
    return item?._id || item?.id;
  };

  // Helper to extract Lab Name cleanly (handles populated objects or fallback fields)
  const getLabName = (item) => {
    if (item?.labName) return item.labName;
    if (item?.name) return item.name;

    // Checks populated Mongoose fields (item.lab or item.labId)
    if (typeof item?.lab === 'object' && item.lab?.name) return item.lab.name;
    if (typeof item?.labId === 'object' && item.labId?.name) return item.labId.name;

    // Fallback if backend returns unpopulated ID or code string
    if (item?.labId?.code || item?.lab?.code) {
      return item?.labId?.code || item?.lab?.code;
    }

    return 'Assigned Laboratory';
  };

  // Extract assigned quantity across schema variants (assignedQuantity vs quantity vs count)
  const getAssignedQuantity = (item) => {
    return item?.assignedQuantity ?? item?.quantity ?? item?.count ?? 0;
  };

  // Safe handler for unassigning lab
  const handleUnassignClick = (lab) => {
    if (!onUnassignLab) return;
    const targetLabId = getLabId(lab);

    onUnassignLab({
      labId: targetLabId,
      resourceId: resourceId,
      resourceName: resource?.name,
      assignedResourceId: lab?._id || lab?.id || targetLabId,
      quantity: getAssignedQuantity(lab)
    });
  };

  return (
    <div className="bg-[#0e1322] border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">
      {/* Top Bar: Category & Edit/Delete Actions */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
            {resource?.category || 'General'}
          </span>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(resource)}
                className="text-gray-400 hover:text-indigo-400 text-xs transition-colors"
                title="Edit Resource"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(resourceId)}
                className="text-gray-400 hover:text-red-400 text-xs transition-colors"
                title="Delete Resource"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-100">{resource?.name}</h3>
      </div>

      {/* Stock Summary and Quick Increments */}
      <div className="bg-[#161b2c] p-3 rounded-lg border border-gray-800/80 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Stock</span>
          <div className="flex items-center gap-2">
            {onQuickQuantityChange && (
              <button
                onClick={() => onQuickQuantityChange(resource, -1)}
                disabled={(resource?.totalQuantity || 0) <= 0}
                className="w-6 h-6 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-200 rounded flex items-center justify-center text-xs font-bold transition-colors"
                title="Decrease Total Stock"
              >
                -
              </button>
            )}
            <span className="font-semibold text-gray-200 font-mono text-sm px-1">
              {resource?.totalQuantity ?? 0}
            </span>
            {onQuickQuantityChange && (
              <button
                onClick={() => onQuickQuantityChange(resource, 1)}
                className="w-6 h-6 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded flex items-center justify-center text-xs font-bold transition-colors"
                title="Increase Total Stock"
              >
                +
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-gray-800/60 pt-2">
          <span className="text-gray-400">Available Reserve</span>
          <span
            className={`font-semibold font-mono ${
              availableQuantity > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {availableQuantity} units
          </span>
        </div>
      </div>

      {/* Lab Allocations Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Assigned Laboratories ({assignedLabs.length})
        </h4>

        {assignedLabs.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No lab assignments yet.</p>
        ) : (
          <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {assignedLabs.map((lab, idx) => {
              const currentLabId = getLabId(lab);
              const qty = getAssignedQuantity(lab);

              return (
                <li
                  key={currentLabId || idx}
                  className="flex items-center justify-between text-xs bg-[#161b2c]/60 p-2 rounded border border-gray-800/50 text-gray-300"
                >
                  <span className="truncate pr-2 font-medium">{getLabName(lab)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-300 font-semibold bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                      {qty}x
                    </span>
                    {onUnassignLab && (
                      <button
                        onClick={() => handleUnassignClick(lab)}
                        className="text-gray-500 hover:text-red-400 transition-colors px-1 text-sm font-bold"
                        title="Remove from lab"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Assign Action Button */}
      <button
        onClick={() => onAssign && onAssign(resource)}
        disabled={availableQuantity <= 0}
        className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Assign to Lab
      </button>
    </div>
  );
}