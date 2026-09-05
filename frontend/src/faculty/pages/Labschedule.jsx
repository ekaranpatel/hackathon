import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FlaskConical, RefreshCw, AlertCircle } from 'lucide-react';
import { BACKEND_URL } from '../../pages/Api'; // Adjust relative path to your Api file if needed
import { LabCard } from '../components/Labschedulecard';

export default function LabBookingPage() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/labs`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fallback to empty array if response data format varies
        setLabs(Array.isArray(response.data) ? response.data : response.data.labs || []);
      } catch (err) {
        console.error('Failed to load laboratories:', err);
        setError(err.response?.data?.message || 'Failed to fetch laboratory data from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, []);
 

 
  return (
    <div className="min-h-screen bg-[#0b0f19] p-6 md:p-10 font-sans text-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-[#121827] border border-gray-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Department Laboratories</h1>
            <p className="text-xs text-gray-400 mt-1">
              Select a laboratory to view its timetable or request a booking slot.
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-900/20 border border-rose-500/40 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-400 gap-3">
            <RefreshCw className="w-7 h-7 animate-spin" />
            <span className="text-xs text-gray-400">Loading laboratories...</span>
          </div>
        ) : (
          /* Grid of Lab Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.length > 0 ? (
              labs.map((lab) => (
                <LabCard
                  key={lab._id || lab.id}
                  lab={lab}
               
                />
              ))
            ) : (
              <div className="col-span-full py-16 bg-[#121827] border border-gray-800 rounded-xl text-center">
                <FlaskConical className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <h3 className="text-gray-300 font-medium text-base">No laboratories found</h3>
                <p className="text-gray-500 text-xs mt-1">
                  There are currently no laboratories available to display.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}