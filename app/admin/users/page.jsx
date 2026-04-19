'use client';
/**
 * app/admin/users/page.jsx
 * User management table — RBAC-aware role dropdown and delete.
 */
import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Trash2, RefreshCw, Eye } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = { user: ['user', 'admin'], admin: ['user', 'admin', 'superadmin'] };

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function UsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingRoles, setUpdatingRoles] = useState({});
  const [pendingRoles, setPendingRoles] = useState({});
  const [updatingSubs, setUpdatingSubs] = useState({});
  const [pendingSubs, setPendingSubs] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const { data } = await apiClient.get(`/admin/users?${params}`);
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages || 1);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleRoleUpdate(userId, newRole) {
    setUpdatingRoles((p) => ({ ...p, [userId]: true }));
    try {
      const { data } = await apiClient.put(`/admin/change-role/${userId}`, { role: newRole });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: data.user.role } : u));
      setPendingRoles((p) => { const next = { ...p }; delete next[userId]; return next; });
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setUpdatingRoles((p) => { const next = { ...p }; delete next[userId]; return next; });
    }
  }

  async function handleSubscriptionUpdate(userId, newSub) {
    setUpdatingSubs((p) => ({ ...p, [userId]: true }));
    try {
      const { data } = await apiClient.put(`/admin/change-subscription/${userId}`, { subscription: newSub });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, subscription: data.user.subscription } : u));
      setPendingSubs((p) => { const next = { ...p }; delete next[userId]; return next; });
      toast.success(`Subscription updated to ${newSub}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update subscription');
    } finally {
      setUpdatingSubs((p) => { const next = { ...p }; delete next[userId]; return next; });
    }
  }

  async function handleDelete(userId, username) {
    if (!confirm(`Delete user "${username}" and all their wallpapers?`)) return;
    try {
      await apiClient.delete(`/admin/delete-user/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success(`User "${username}" deleted`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  }

  // Can current admin modify this target?
  function canModify(targetUser) {
    if (targetUser._id === currentUser?.id) return false; // can't modify self
    if (isSuperAdmin) return true;
    // admin can only touch 'user' role, not other admins or superadmin
    return targetUser.role === 'user';
  }

  function getRoleOptions(targetUser) {
    if (isSuperAdmin) return ['user', 'admin', 'superadmin'];
    return ROLE_OPTIONS['user']; // admin can only promote between user/admin
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
            <Users size={22} className="text-blue-400" />
            User Management
          </h1>
          <p className="text-text-muted text-sm mt-1">Manage platform users and their roles.</p>
        </div>
        <button onClick={fetchUsers} className="btn-outline py-2 px-3">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search by username or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9 py-2.5 text-sm" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="input-field py-2.5 text-sm w-40 appearance-none" style={{ background: '#13131f' }}>
          <option value="" style={{ background: '#13131f' }}>All Roles</option>
          <option value="user" style={{ background: '#13131f' }}>User</option>
          <option value="admin" style={{ background: '#13131f' }}>Admin</option>
          <option value="superadmin" style={{ background: '#13131f' }}>Superadmin</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#1a1a2e', borderBottom: '1px solid rgba(124,58,237,0.12)' }}>
                {['User', 'Email', 'Role', 'Access', 'Uploads', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-widest text-text-muted px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(124,58,237,0.06)' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-4 w-24 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-muted">No users found</td></tr>
              ) : (
                users.map((u) => {
                  const modifiable = canModify(u);
                  const currentPendingRole = pendingRoles[u._id] ?? u.role;
                  const isUpdating = !!updatingRoles[u._id];
                  const roleChanged = pendingRoles[u._id] && pendingRoles[u._id] !== u.role;

                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(124,58,237,0.06)' }}
                      className="hover:bg-bg-elevated/50 transition-colors">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                            {u.username?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{u.username}</p>
                            {u._id === currentUser?.id && <p className="text-[10px] text-purple-400">You</p>}
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-5 py-4 text-sm text-text-muted max-w-[200px] truncate">{u.email}</td>
                      {/* Role */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {modifiable ? (
                            <select
                              value={currentPendingRole}
                              onChange={(e) => setPendingRoles((p) => ({ ...p, [u._id]: e.target.value }))}
                              className="text-xs py-1.5 px-2.5 rounded-lg border transition-all appearance-none"
                              style={{ background: '#1a1a2e', color: '#f8fafc', border: '1px solid rgba(124,58,237,0.3)' }}
                            >
                              {getRoleOptions(u).map((r) => (
                                <option key={r} value={r} style={{ background: '#13131f' }}>{r}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`badge-${u.role} text-xs px-2.5 py-1 rounded-full font-semibold`}>{u.role}</span>
                          )}
                          {modifiable && roleChanged && (
                            <button
                              onClick={() => handleRoleUpdate(u._id, currentPendingRole)}
                              disabled={isUpdating}
                              className="text-xs px-2 py-1 rounded-md bg-purple-primary text-white hover:opacity-80 transition-opacity"
                            >
                              {isUpdating ? '...' : 'Update'}
                            </button>
                          )}
                        </div>
                      </td>
                      {/* Subscription */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={pendingSubs[u._id] ?? u.subscription ?? 'free'}
                            onChange={(e) => setPendingSubs((p) => ({ ...p, [u._id]: e.target.value }))}
                            className="text-[10px] py-1 px-2 rounded-lg border appearance-none lowercase font-bold"
                            style={{ background: '#13131f', color: '#94a3b8', border: '1px solid rgba(124,58,237,0.2)' }}
                          >
                            <option value="free">free</option>
                            <option value="pro">pro</option>
                            <option value="premium">premium</option>
                          </select>
                          {(pendingSubs[u._id] && pendingSubs[u._id] !== u.subscription) && (
                            <button
                                onClick={() => handleSubscriptionUpdate(u._id, pendingSubs[u._id])}
                                disabled={updatingSubs[u._id]}
                                className="text-[10px] p-1.5 rounded-md bg-blue-600 text-white"
                            >
                                {updatingSubs[u._id] ? '...' : <RefreshCw size={10} />}
                            </button>
                          )}
                        </div>
                      </td>
                      {/* Uploads */}
                      <td className="px-5 py-4 text-sm text-text-secondary">{u.uploadCount || 0}</td>
                      {/* Joined */}
                      <td className="px-5 py-4 text-xs text-text-muted">{formatDate(u.createdAt)}</td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/users/${u._id}`}
                            className="p-1.5 rounded-lg text-text-muted hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </Link>
                          {modifiable && (
                            <button
                              onClick={() => handleDelete(u._id, u.username)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-red-500/10 transition-all"
                              title="Delete User"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4" style={{ borderTop: '1px solid rgba(124,58,237,0.08)' }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline py-1.5 px-3 text-sm disabled:opacity-40">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`py-1.5 px-3 rounded-lg text-sm font-semibold ${p === page ? 'bg-purple-primary text-white' : 'bg-bg-card text-text-secondary border border-[rgba(124,58,237,0.2)]'}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline py-1.5 px-3 text-sm disabled:opacity-40">›</button>
          </div>
        )}
      </div>
    </div>
  );
}
