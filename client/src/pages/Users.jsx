import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, ChevronLeft, ChevronRight, Eye, ShieldAlert, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { usersService, profileService } from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 20, totalPages: 2 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchUsers = async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      const data = await usersService.getUsers(page, 10, search);
      setUsers(data.users || []);
      setPagination(data.pagination || { page, limit: 10, total: 20, totalPages: 2 });
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchQuery);
  }, [currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchQuery);
  };

  const handleViewProfile = async (userId) => {
    setModalLoading(true);
    setSelectedUser(null);
    setModalError('');
    try {
      // Trigger Bug 3: Insecure Direct Object Reference (IDOR)
      // Calls GET /api/profile/:id directly
      const profileData = await profileService.getProfileById(userId);
      setSelectedUser(profileData);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to load profile.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Users Directory</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Displaying directory of registered users with pagination and direct profile inspection.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, role..."
              className="bg-card border border-cardBorder rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Bug 5 Notice Banner if Page 2 returns 0 items */}
      {currentPage === 2 && users.length === 0 && !isLoading && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Bug 5 Demonstrated (Pagination Off-by-One):</span>
            <p className="mt-1 text-slate-300">
              Page 2 returned 0 users! In <code className="text-amber-300 font-mono">routes/users.js</code>, offset is calculated as <code className="text-amber-300 font-mono">offset = page * limit (2 * 10 = 20)</code> instead of <code className="text-blue-300 font-mono">(page - 1) * limit (10)</code>. This skips records 11–20 entirely!
            </p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card border border-cardBorder rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-cardBorder text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cardBorder text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-400">#{u.id}</td>
                    <td className="py-3 px-4 font-medium text-white">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium capitalize bg-slate-900 border border-slate-700 text-slate-300">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewProfile(u.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No users found for Page {currentPage}. (See Bug 5 pagination notice above).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-4 border-t border-cardBorder bg-slate-900/40 text-xs">
          <span className="text-slate-400">
            Showing Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
            <span className="font-semibold text-white">{pagination.totalPages || 2}</span> ({pagination.total || 20} total users)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-card border border-cardBorder hover:border-slate-600 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Page 1</span>
            </button>
            <button
              onClick={() => setCurrentPage(2)}
              disabled={currentPage === 2}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-card border border-cardBorder hover:border-slate-600 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Page 2 (Trigger Bug 5)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Modal demonstrating Bug 3 (IDOR) */}
      {(selectedUser || modalLoading || modalError) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-cardBorder rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => { setSelectedUser(null); setModalError(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Profile Inspector</h2>
            </div>

            {modalLoading ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                Querying /api/profile/:id...
              </div>
            ) : modalError ? (
              <div className="p-3 rounded-lg bg-red-950/40 border border-danger text-xs text-red-200">
                {modalError}
              </div>
            ) : selectedUser ? (
              <div className="space-y-4 text-xs">
                {/* IDOR Warning Banner */}
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 text-amber-200">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4" /> Bug 3 IDOR Vulnerability Exposed:
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Endpoint <code className="text-amber-300 font-mono">GET /api/profile/{selectedUser.id}</code> returned this user's profile without verifying if the authenticated token owns this account!
                  </p>
                </div>

                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">User ID:</span>
                    <span className="font-mono text-blue-400 font-bold">#{selectedUser.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Full Name:</span>
                    <span className="font-medium text-white">{selectedUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-mono text-slate-300">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Role:</span>
                    <span className="capitalize font-semibold text-emerald-400">{selectedUser.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created:</span>
                    <span className="font-mono text-slate-400">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  Close Inspector
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
