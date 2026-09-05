import React, { useState } from 'react';
import ResourceCard from '../components/ResourceCard';
import { useResources } from '../services/Resource';

const CATEGORIES = ['Hardware', 'Electronics', 'Robotics', 'Software', 'Furniture', 'General'];

export default function ResourceAdmin() {
  const {
    resources = [],
    labsList = [],
    loading,
    error,
    refreshData,
    addResource,
    assignToLab,
    deleteResource,
    quickQuantityChange,
    unassignLab
  } = useResources();

  // Local UI Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal Control States
  const [activeModal, setActiveModal] = useState(null); // 'ADD' | 'ASSIGN' | null
  const [currentResourceId, setCurrentResourceId] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    totalQuantity: 1
  });

  const [assignForm, setAssignForm] = useState({
    labId: '',
    quantity: 1
  });

  // Dynamically resolve resource from state
  const currentResource = resources.find(
    (r) => String(r._id || r.id) === String(currentResourceId)
  );

  // GUARANTEED FORMULA: Available = Total Quantity - Sum(Assigned Lab Quantities)
  const getAvailableQuantity = (resource) => {
    if (!resource) return 0;

    const totalAllocated = (resource.assignedLabs || []).reduce((sum, item) => {
      const allocatedQty = Number(
        item?.assignedQuantity ?? item?.quantity ?? item?.count ?? 0
      );
      return sum + (isNaN(allocatedQty) ? 0 : allocatedQty);
    }, 0);

    const available = Number(resource.totalQuantity || 0) - totalAllocated;
    return available > 0 ? available : 0;
  };

  // Filtered list based on category & search term
  const filteredResources = resources.filter((res) => {
    const matchesCat = selectedCategory === 'All' || res.category === selectedCategory;
    const matchesSearch = (res.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Modal Triggers
  const handleOpenAdd = () => {
    setFormData({ name: '', category: CATEGORIES[0], totalQuantity: 1 });
    setSubmitError(null);
    setActiveModal('ADD');
  };

  const handleOpenAssign = (res) => {
    const resId = res._id || res.id;
    setCurrentResourceId(resId);
    const firstLabId = labsList[0]?._id || labsList[0]?.id || '';
    setAssignForm({
      labId: firstLabId,
      quantity: 1
    });
    setSubmitError(null);
    setActiveModal('ASSIGN');
  };

  // Action Handlers
  const handleCreateResource = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await addResource({
        ...formData,
        totalQuantity: Number(formData.totalQuantity)
      });
      if (typeof refreshData === 'function') await refreshData();
      setActiveModal(null);
    } catch (err) {
      setSubmitError(err.message || 'Failed to create resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignResource = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await assignToLab(currentResourceId, assignForm.labId, Number(assignForm.quantity));
      if (typeof refreshData === 'function') {
        await refreshData();
      }
      setActiveModal(null);
      setCurrentResourceId(null);
    } catch (err) {
      setSubmitError(err.message || 'Failed to assign resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for ResourceCard callbacks
  const handleDelete = async (resId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      if (typeof deleteResource === 'function') {
        await deleteResource(resId);
        if (typeof refreshData === 'function') await refreshData();
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleQuickQuantityChange = async (target, delta) => {
    try {
      if (typeof quickQuantityChange === 'function') {
        await quickQuantityChange(target, delta);
        if (typeof refreshData === 'function') await refreshData();
      }
    } catch (err) {
      alert(`Quantity update failed: ${err.message}`);
    }
  };

  const handleUnassignLab = async (resourceId, labId) => {
    try {
      if (typeof unassignLab === 'function') {
        await unassignLab(resourceId, labId);
        if (typeof refreshData === 'function') await refreshData();
      }
    } catch (err) {
      alert(`Unassign failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm">Fetching resource inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 p-6 rounded-xl text-center text-red-300 space-y-3">
        <p>Failed to load data: {error}</p>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-red-800/40 hover:bg-red-800 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e1322] p-6 rounded-xl border border-gray-800 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Resource Inventory</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track equipment stock, allocate resources to laboratories, and maintain stock health.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm shadow-md"
        >
          <span>➕</span> Add New Resource
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1322] p-4 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-400 uppercase font-semibold">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#161b2c] text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161b2c] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid Display */}
      {filteredResources.length === 0 ? (
        <div className="bg-[#0e1322] border border-gray-800 rounded-xl p-12 text-center text-gray-400">
          No inventory items matched your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <ResourceCard
              key={res._id || res.id}
              resource={res}
              availableQuantity={getAvailableQuantity(res)}
              onAssign={() => handleOpenAssign(res)}
              onDelete={handleDelete}
              onQuickQuantityChange={handleQuickQuantityChange}
              onUnassignLab={handleUnassignLab}
            />
          ))}
        </div>
      )}

      {/* Modal: Create Resource */}
      {activeModal === 'ADD' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1322] border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-100 mb-4">Add New Inventory Item</h2>

            {submitError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-xs text-red-300">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Resource Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Workstation PC"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                    className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-md"
                >
                  {isSubmitting ? 'Saving...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign to Lab */}
      {activeModal === 'ASSIGN' && currentResource && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1322] border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-100 mb-1">Assign Resource to Lab</h2>
            <p className="text-xs text-indigo-400 mb-4">{currentResource.name}</p>

            {submitError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-xs text-red-300">
                {submitError}
              </div>
            )}

            <form onSubmit={handleAssignResource} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Laboratory</label>
                <select
                  value={assignForm.labId}
                  onChange={(e) => setAssignForm({ ...assignForm, labId: e.target.value })}
                  className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                >
                  {labsList.map((lab) => (
                    <option key={lab._id || lab.id} value={lab._id || lab.id}>
                      {lab.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs text-gray-400">Quantity to Assign</label>
                  <span className="text-xs text-emerald-400 font-mono">
                    Available: {getAvailableQuantity(currentResource)}
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={getAvailableQuantity(currentResource)}
                  value={assignForm.quantity}
                  onChange={(e) => setAssignForm({ ...assignForm, quantity: e.target.value })}
                  className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setCurrentResourceId(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-md"
                >
                  {isSubmitting ? 'Assigning...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}