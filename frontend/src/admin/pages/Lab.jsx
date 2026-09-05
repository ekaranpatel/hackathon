import React, { useState } from 'react';
import LabCard from '../components/Labcard';
import { useLabs } from '../services/labservice'; // Adjust path if needed

const CATEGORIES = ['Computer Science', 'Electronics', 'Mechanical', 'Biotech', 'Physics'];

export default function Labs({ user }) {
  // 1. Destructure flat hook structure directly
  const {
    labs: filteredLabs,
    loading,
    error,
    category: selectedCategory,
    setCategory: setSelectedCategory,
    search: searchQuery,
    setSearch: setSearchQuery,
    refreshData: refresh,
    createLab,
    updateLab,
    deleteLab,
    assignResource
  } = useLabs();

  // Modal Control States
  const [activeModal, setActiveModal] = useState(null); // 'ADD' | 'EDIT' | 'VIEW' | 'ASSIGN' | null
  const [currentLab, setCurrentLab] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    capacity: '',
    location: '',
    status: 'Active'
  });

  const [assignForm, setAssignForm] = useState({
    resourceName: '',
    count: 1
  });

  // Modal Openers
  const handleOpenAddModal = () => {
    setFormData({ name: '', category: CATEGORIES[0], capacity: '', location: '', status: 'Active' });
    setSubmitError(null);
    setActiveModal('ADD');
  };

  const handleOpenEditModal = (lab) => {
    setCurrentLab(lab);
    setFormData({
      name: lab.name || '',
      category: lab.category || CATEGORIES[0],
      capacity: lab.capacity || '',
      location: lab.location || '',
      status: lab.status || 'Active'
    });
    setSubmitError(null);
    setActiveModal('EDIT');
  };

  const handleOpenViewModal = (lab) => {
    setCurrentLab(lab);
    setActiveModal('VIEW');
  };

  const handleOpenAssignModal = (lab) => {
    setCurrentLab(lab);
    setAssignForm({ resourceName: '', count: 1 });
    setSubmitError(null);
    setActiveModal('ASSIGN');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSubmitError(null);
  };

  // API Actions
  const handleDeleteLab = async (labId) => {
    if (window.confirm('Are you sure you want to delete this lab?')) {
      try {
        await deleteLab(labId);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleSaveLab = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const payload = {
      ...formData,
      capacity: Number(formData.capacity)
    };

    try {
      if (activeModal === 'ADD') {
        await createLab(payload);
      } else if (activeModal === 'EDIT') {
        const id = currentLab.id || currentLab._id;
        await updateLab(id, payload);
      }
      handleCloseModal();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignResource = async (e) => {
    e.preventDefault();
    if (!assignForm.resourceName.trim()) return;

    setSubmitError(null);
    setIsSubmitting(true);
    const labId = currentLab.id || currentLab._id;

    try {
      const updatedLab = await assignResource(labId, {
        name: assignForm.resourceName,
        count: Number(assignForm.count)
      });
      
      // Update local state and trigger refresh to ensure two-way data consistency
      if (updatedLab) {
        setCurrentLab(updatedLab);
      }
      if (refresh) {
        await refresh();
      }

      handleCloseModal();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e1322] p-6 rounded-xl border border-gray-800 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Lab Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage laboratory facilities, assign equipment, and monitor status.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm shadow-md"
        >
          <span>➕</span> Add New Lab
        </button>
      </div>

      {/* API Error Alert */}
      {error && (
        <div className="bg-red-900/40 border border-red-500/50 p-4 rounded-xl flex items-center justify-between text-red-200 text-sm">
          <span>Failed to load labs: {error}</span>
          <button onClick={refresh} className="underline text-xs hover:text-white font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
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
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search lab name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161b2c] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Loading State / Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
          Loading laboratories...
        </div>
      ) : filteredLabs.length === 0 ? (
        <div className="bg-[#0e1322] border border-gray-800 rounded-xl p-12 text-center text-gray-400">
          No laboratories found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.map((lab) => {
            const id = lab.id || lab._id;
            return (
              <LabCard
                key={id}
                lab={lab}
                onView={handleOpenViewModal}
                onAssignResource={handleOpenAssignModal}
                onEdit={handleOpenEditModal}
                onDelete={() => handleDeleteLab(id)}
              />
            );
          })}
        </div>
      )}

      {/* --- MODAL: Add / Edit Lab --- */}
      {(activeModal === 'ADD' || activeModal === 'EDIT') && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1322] border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-100 mb-4">
              {activeModal === 'ADD' ? 'Add New Laboratory' : 'Edit Laboratory Details'}
            </h2>

            {submitError && (
              <div className="mb-4 p-2.5 bg-red-900/30 border border-red-500/40 rounded-lg text-xs text-red-300">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSaveLab} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Lab Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Cloud Computing Lab"
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
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Location / Room Number</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Building C, Room 102"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Operational Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-md"
                >
                  {isSubmitting ? 'Saving...' : activeModal === 'ADD' ? 'Create Lab' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: View Lab Details --- */}
      {activeModal === 'VIEW' && currentLab && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1322] border border-gray-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-gray-800 pb-3">
              <div>
                <span className="text-xs text-indigo-400 font-semibold">{currentLab.category}</span>
                <h2 className="text-xl font-bold text-gray-100">{currentLab.name}</h2>
              </div>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-[#161b2c] p-3 rounded-lg border border-gray-800">
              <div><span className="text-gray-500">Location:</span> <p className="font-semibold text-gray-200">{currentLab.location}</p></div>
              <div><span className="text-gray-500">Capacity:</span> <p className="font-semibold text-gray-200">{currentLab.capacity} seats</p></div>
              <div><span className="text-gray-500">Status:</span> <p className="font-semibold text-gray-200">{currentLab.status}</p></div>
              <div><span className="text-gray-500">Resources Allocated:</span> <p className="font-semibold text-gray-200">{currentLab.assignedResources?.length || 0} types</p></div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Assigned Resources & Equipment</h3>
              {!currentLab.assignedResources || currentLab.assignedResources.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No equipment allocated yet.</p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {currentLab.assignedResources.map((res, index) => (
                    <li key={res.id || res._id || index} className="flex justify-between items-center text-xs bg-[#161b2c] p-2.5 rounded-lg border border-gray-800">
                      <span className="text-gray-200 font-medium">{res.name || res.resourceName}</span>
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono font-bold">
                        Qty: {res.count || res.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Assign Resource --- */}
      {activeModal === 'ASSIGN' && currentLab && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1322] border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-100 mb-1">Assign Equipment</h2>
            <p className="text-xs text-indigo-400 mb-4">{currentLab.name}</p>

            {submitError && (
              <div className="mb-4 p-2.5 bg-red-900/30 border border-red-500/40 rounded-lg text-xs text-red-300">
                {submitError}
              </div>
            )}

            <form onSubmit={handleAssignResource} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  value={assignForm.resourceName}
                  onChange={(e) => setAssignForm({ ...assignForm, resourceName: e.target.value })}
                  className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Oscilloscope / Projector"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={assignForm.count}
                  onChange={(e) => setAssignForm({ ...assignForm, count: e.target.value })}
                  className="w-full bg-[#161b2c] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-md"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}