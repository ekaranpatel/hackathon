import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../pages/Api';  
import { FlaskConical, AlertCircle, RefreshCw, Layers, MapPin, Box, Users } from 'lucide-react';

export default function FacultyLab({ user }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const facultyCategory = user?.category || '';

  useEffect(() => {
    const fetchAssignedLabs = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/labs/category`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { category: facultyCategory }
        });

        // Additional client-side fallback filter just in case
        const matchedLabs = response.data.filter((lab) =>
          facultyCategory
            ? lab.category?.toLowerCase() === facultyCategory.toLowerCase()
            : true
        );

        setLabs(matchedLabs);
      } catch (err) {
        console.error('Failed to load faculty labs:', err);
        setError(err.response?.data?.message || 'Failed to load assigned labs.');
      } finally {
        setLoading(false);
      }
    };

    if (facultyCategory) {
      fetchAssignedLabs();
    } else {
      setLoading(false);
    }
  }, [facultyCategory]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-[#121827] border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-indigo-400" />
            Assigned Department Labs
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Viewing labs matching your assigned category profile.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#1a2234] px-4 py-2 rounded-lg border border-indigo-500/30">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span className="text-xs text-gray-400 uppercase tracking-wider">Category:</span>
          <span className="text-sm font-semibold text-indigo-300">
            {facultyCategory || 'No Category Assigned'}
          </span>
        </div>
      </div>

      {/* Warning if no category assigned to faculty profile */}
      {!facultyCategory && !loading && (
        <div className="bg-amber-900/20 border border-amber-500/40 text-amber-300 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Your account does not have a department category assigned. Contact an administrator to assign a category to your profile.
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/40 text-red-300 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-indigo-400 font-semibold gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Loading assigned labs...
        </div>
      ) : (
        /* Lab Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.length > 0 ? (
            labs.map((lab) => (
              <div
                key={lab._id || lab.id}
                className="bg-[#121827] border border-gray-800 hover:border-indigo-500/50 rounded-xl p-5 transition-all shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Card Title & Category */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-100">{lab.name}</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium shrink-0">
                      {lab.category}
                    </span>
                  </div>

                  {/* Location Banner */}
                  <div className="flex items-center gap-1.5 text-xs text-indigo-300 mb-3 bg-[#182035] px-2.5 py-1.5 rounded-md w-fit border border-indigo-500/10">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Location: <strong className="text-white font-medium">{lab.location || 'Not Specified'}</strong></span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {lab.description || 'No description provided for this lab.'}
                  </p>

                  {/* Assigned Resources Section */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-2">
                      <Box className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Assigned Resources</span>
                    </div>

                    {lab.assignedResources && lab.assignedResources.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {lab.assignedResources.map((res, index) => (
                          <span
                            key={res._id || index}
                            className="text-xs bg-[#1a2234] border border-gray-700/80 text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1.5"
                          >
                            <span className="text-gray-200 font-medium">{res.name}</span>
                            <span className="bg-indigo-600/30 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border border-indigo-500/20">
                              x{res.count}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No resources assigned yet.</p>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-gray-800/80 flex justify-between items-center text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>Capacity: <strong className="text-gray-200">{lab.capacity || 'N/A'}</strong></span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    lab.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {lab.status || 'Active'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            facultyCategory && (
              <div className="col-span-full py-16 bg-[#121827] border border-gray-800 rounded-xl text-center">
                <FlaskConical className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-gray-300 font-medium text-lg">No labs found</h3>
                <p className="text-gray-500 text-sm mt-1">
                  There are currently no labs registered under the "{facultyCategory}" category.
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}