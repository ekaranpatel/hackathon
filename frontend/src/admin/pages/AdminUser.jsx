import React, { useState, useEffect, useRef } from 'react';
import {
  fetchUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser
} from '../services/Userservice';

// Available categories matching your lab categories
const CATEGORIES = [
  'Computer Science',
  'Electrical & Electronics',
  'Mechanical',
  'Robotics & AI',
  'Civil',
  'General'
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modal States
  const [selectedUserForView, setSelectedUserForView] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Student',
    category: 'Computer Science'
  });

  const menuRef = useRef(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch users with filters
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers({
        role: selectedRole,
        status: selectedStatus,
        search: searchTerm
      });
      
      const userArray = Array.isArray(data) ? data : (data?.users || []);
      setUsers(userArray);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search and reload on filter change
  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedRole, selectedStatus]);

  // Submit new user
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newUser,
        category: newUser.role === 'Faculty' ? newUser.category : ''
      };

      const response = await createUser(payload);
      
      // Handle both direct res.data and nested user object formats safely
      const createdUser = response?.user || response?.data?.user || response;

      const normalizedUser = {
        ...createdUser,
        id: createdUser.id || createdUser._id,
        status: createdUser.status || 'Active'
      };

      // Instantly push new user to top of local state
      setUsers((prev) => [normalizedUser, ...prev]);
      setIsAddModalOpen(false);

      // Reset form
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'Student',
        category: 'Computer Science'
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add user');
    }
  };

  // Change user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      const updated = await updateUserRole(userId, newRole);
      const updatedUser = updated?.user || updated;
      
      setUsers((prev) =>
        prev.map((u) => ((u.id || u._id) === userId ? { ...u, ...updatedUser } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActiveMenuId(null);
    }
  };

  // Toggle user active / block status
  const handleToggleBlock = async (user) => {
    const userId = user.id || user._id;
    const nextStatus = user.status === 'Active' ? 'Blocked' : 'Active';
    try {
      const updated = await updateUserStatus(userId, nextStatus);
      const updatedUser = updated?.user || updated;

      setUsers((prev) =>
        prev.map((u) => ((u.id || u._id) === userId ? { ...u, ...updatedUser, status: nextStatus } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActiveMenuId(null);
    }
  };

  // Delete user
  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => (u.id || u._id) !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActiveMenuId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Main Card Wrapper */}
        <div className="bg-[#0e1322] border border-gray-800 rounded-xl p-6 shadow-xl space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Users</h1>
              <p className="text-sm text-gray-400">Manage students, faculty, and administrators</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-all shadow-md"
            >
              + Add User
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#161b2c] border border-gray-700/80 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-800">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-[#161b2c] border border-gray-700 text-xs sm:text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Roles ▼</option>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Admin">Admin</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#161b2c] border border-gray-700 text-xs sm:text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Status ▼</option>
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
              </select>

              {(selectedRole !== 'All' || selectedStatus !== 'All' || searchTerm !== '') && (
                <button
                  onClick={() => { setSelectedRole('All'); setSelectedStatus('All'); setSearchTerm(''); }}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="text-xs sm:text-sm text-gray-400 font-mono">
              Total Users: <span className="text-indigo-400 font-semibold">{users.length}</span>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#161b2c]/80 text-gray-400 uppercase text-xs tracking-wider border-b border-gray-800">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500 italic">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const userId = user.id || user._id;
                    return (
                      <tr key={userId} className="hover:bg-[#161b2c]/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-gray-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center text-indigo-300 text-xs font-semibold">
                            👤
                          </div>
                          {user.name}
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 font-mono text-xs">{user.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                            user.role === 'Admin' ? 'bg-purple-950/40 border-purple-800 text-purple-300' :
                            user.role === 'Faculty' ? 'bg-blue-950/40 border-blue-800 text-blue-300' :
                            'bg-gray-800 border-gray-700 text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-indigo-300">
                          {user.role === 'Faculty' ? user.category || '—' : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            user.status === 'Active'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-red-950/60 text-red-400 border border-red-800/60'
                          }`}>
                            {user.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === userId ? null : userId)}
                            className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-gray-100 transition-colors"
                          >
                            ⋮
                          </button>

                          {activeMenuId === userId && (
                            <div
                              ref={menuRef}
                              className="absolute right-4 mt-2 w-48 bg-[#161b2c] border border-gray-700 rounded-lg shadow-2xl z-50 py-1 text-left text-xs"
                            >
                              <button
                                onClick={() => { setSelectedUserForView(user); setActiveMenuId(null); }}
                                className="w-full px-4 py-2 hover:bg-gray-800/80 text-gray-200 flex items-center gap-2"
                              >
                                👁️ View Profile
                              </button>
                              <div className="border-t border-gray-800 my-1"></div>
                              <div className="px-4 py-1 text-[10px] text-gray-500 uppercase font-semibold">
                                Change Role
                              </div>
                              {['Student', 'Faculty', 'Admin'].map(
                                (r) => r !== user.role && (
                                  <button
                                    key={r}
                                    onClick={() => handleRoleChange(userId, r)}
                                    className="w-full px-4 py-1.5 hover:bg-indigo-900/30 text-gray-300 hover:text-indigo-300 text-left"
                                  >
                                    → Set as {r}
                                  </button>
                                )
                              )}
                              <div className="border-t border-gray-800 my-1"></div>
                              <button
                                onClick={() => handleToggleBlock(user)}
                                className={`w-full px-4 py-2 hover:bg-gray-800/80 flex items-center gap-2 ${
                                  user.status === 'Active' ? 'text-amber-400' : 'text-emerald-400'
                                }`}
                              >
                                {user.status === 'Active' ? '🚫 Block User' : '✅ Unblock User'}
                              </button>
                              <button
                                onClick={() => handleDelete(userId)}
                                className="w-full px-4 py-2 hover:bg-red-950/50 text-red-400 flex items-center gap-2"
                              >
                                🗑️ Delete User
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddSubmit} className="bg-[#0e1322] border border-gray-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-100">Add New User</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full p-2 bg-[#161b2c] border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full p-2 bg-[#161b2c] border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2 bg-[#161b2c] border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full p-2 bg-[#161b2c] border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Category Dropdown - Rendered ONLY for Faculty */}
              {newUser.role === 'Faculty' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Assigned Lab Category</label>
                  <select
                    value={newUser.category}
                    onChange={(e) => setNewUser({ ...newUser, category: e.target.value })}
                    className="w-full p-2 bg-[#161b2c] border border-indigo-500/50 rounded text-xs text-indigo-300 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-xs font-semibold"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Profile Modal */}
      {selectedUserForView && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0e1322] border border-gray-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-100">User Profile Details</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong className="text-gray-400">Name:</strong> {selectedUserForView.name}</p>
              <p><strong className="text-gray-400">Email:</strong> {selectedUserForView.email}</p>
              <p><strong className="text-gray-400">Role:</strong> {selectedUserForView.role}</p>
              {selectedUserForView.role === 'Faculty' && (
                <p><strong className="text-gray-400">Category:</strong> <span className="text-indigo-400 font-medium">{selectedUserForView.category || 'Unassigned'}</span></p>
              )}
              <p><strong className="text-gray-400">Status:</strong> {selectedUserForView.status || 'Active'}</p>
            </div>
            <div className="text-right pt-4 border-t border-gray-800">
              <button
                onClick={() => setSelectedUserForView(null)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}