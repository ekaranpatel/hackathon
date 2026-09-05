import React from 'react';
import { 
  MapPin, 
  Users, 
  Calendar, 
  Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LabCard({ lab, onCheckSchedule, onBookNow }) {
  const navigate = useNavigate();
  
  // Case-insensitive check supporting both 'Active' and 'Available'
  const statusLower = lab?.status?.toLowerCase();
  const isAvailable = statusLower === 'active' || statusLower === 'available';

   const labId = lab._id || lab.id;

  return (
    <div className="bg-[#121827] rounded-xl border border-gray-800 hover:border-indigo-500/40 shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Lab Header & Details */}
      <div className="p-5">
        <div className="flex justify-between items-center mb-3 gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {lab.location || 'Location Unspecified'}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              isAvailable
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            ● {lab.status || 'Inactive'}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-100 mb-1">{lab.name}</h3>
        <p className="text-xs text-gray-400 mb-4">{lab.category || lab.department}</p>
        
        <div className="flex items-center gap-1.5 text-xs text-gray-300">
          <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>Capacity: <strong className="font-semibold text-gray-200">{lab.capacity || 'N/A'} Seats</strong></span>
        </div>
      </div>

      {/* Action Buttons */}
      
      <div className="p-4 bg-[#182035]/60 border-t  border-gray-800/80 grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate(`/faculty/Shedule-detail/${labId}`)}
          className="w-full py-2 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white     cursor-pointer font-semibold text-gray-300  border border-gray-700/80 rounded-lg hover:text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0 " />
          Check Schedule
        </button>
        
      </div>
       
    </div>
  );
}