import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, X, CheckCircle, XCircle, MoreVertical, Trash2 } from 'lucide-react';
import api from '../api/axios';
import ConfirmationModal from '../components/ConfirmationModal';

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  status?: string;
}

export default function Users() {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number; openUpward: boolean } | null>(null);
  const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Get current logged-in user info
  const currentUserEmail = sessionStorage.getItem('userEmail') || '';
  const currentUserId = sessionStorage.getItem('userId') || '';

  // Check if a user is the currently logged-in user
  const isCurrentUser = (user: User) => {
    return (user._id === currentUserId || user.id === currentUserId) ||
           (user.email.toLowerCase() === currentUserEmail.toLowerCase());
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Staff',
    password: ''
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId && 
          !target.closest('[data-menu-button]') && 
          !target.closest('[data-dropdown-menu]')) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/auth/users');
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/admin/create-user', formData);
      if (response.data.success) {
        setSuccess('User created successfully!');
        setShowModal(false);
        setFormData({
          name: '',
          email: '',
          role: 'Staff',
          password: ''
        });
        // Refresh users list
        await fetchUsers();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
      console.error('Error creating user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      setError('');
      const response = await api.patch(`/auth/users/${userId}/status`, {
        isActive: !currentStatus
      });
      if (response.data.success) {
        setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        await fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user status');
      console.error('Error updating user status:', err);
    }
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role || 'Staff',
      password: '' // Don't pre-fill password for security
    });
    setShowEditModal(true);
    setError('');
    setSuccess('');
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      };

      // Only include password if it's provided
      if (formData.password && formData.password.trim() !== '') {
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setSubmitting(false);
          return;
        }
        updateData.password = formData.password;
      }

      const response = await api.put(`/auth/users/${editingUser._id || editingUser.id}`, updateData);
      
      if (response.data.success) {
        setSuccess('User updated successfully!');
        setShowEditModal(false);
        setEditingUser(null);
        setFormData({
          name: '',
          email: '',
          role: 'Staff',
          password: ''
        });
        await fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
      console.error('Error updating user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const response = await api.delete(`/auth/users/${userToDelete}`);
      
      if (response.data.success) {
        setShowDeleteModal(false);
        setUserToDelete(null);
        setSuccess('User deleted successfully!');
        await fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
      setShowDeleteModal(false);
      setUserToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // Calculate dropdown position and handle opening
  const handleMenuToggle = (userId: string) => {
    if (openMenuId === userId) {
      // Close menu
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      // Open menu
      const button = menuButtonRefs.current[userId];
      if (button) {
        const rect = button.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownHeight = 200;
        const spacing = 8;
        
        // Check if should open upward
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        // Calculate horizontal position (right-aligned)
        const right = viewportWidth - rect.right;
        
        // Calculate vertical position
        const top = openUpward 
          ? rect.top - dropdownHeight - spacing
          : rect.bottom + spacing;
        
        setOpenMenuId(userId);
        setMenuPosition({
          top: Math.max(8, Math.min(top, viewportHeight - dropdownHeight - 8)),
          right: Math.max(8, right),
          openUpward
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system users and permissions</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setError('');
            setSuccess('');
          }}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-700 hover:text-red-900 ml-4 p-1 hover:bg-red-100 rounded transition-colors"
            aria-label="Close error message"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No users found. Click "Add User" to create a new user.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id || user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role || 'Staff'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {user.isActive !== false ? (
                          <>
                            <CheckCircle size={18} className="text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={18} className="text-red-600" />
                            <span className="text-sm text-red-600 font-medium">Disabled</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isCurrentUser(user) ? (
                        <span className="text-xs text-gray-400 italic">Current User</span>
                      ) : (
                        <div className="relative">
                          <button 
                            ref={(el) => { menuButtonRefs.current[user._id || user.id || ''] = el; }}
                            onClick={() => handleMenuToggle(user._id || user.id || '')}
                            data-menu-button
                            className={`p-2 rounded transition-colors ${
                              openMenuId === (user._id || user.id) 
                                ? 'bg-gray-200 text-gray-800' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Actions"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {openMenuId === (user._id || user.id) && menuPosition && (
                            <div 
                              data-dropdown-menu
                              className="fixed w-48 bg-white rounded-lg shadow-xl border-2 border-gray-300 z-[9999] overflow-hidden transition-all duration-200 ease-out"
                              style={{
                                top: `${menuPosition.top}px`,
                                right: `${menuPosition.right}px`,
                                opacity: 1,
                                transform: 'scale(1)',
                                animation: 'fadeIn 0.2s ease-out'
                              }}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditClick(user)}
                                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors border-b border-gray-100"
                                >
                                  <Edit size={18} className="text-blue-600" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleStatusToggle(user._id || user.id || '', user.isActive !== false)}
                                  className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors border-b border-gray-100 ${
                                    user.isActive !== false
                                      ? 'text-red-800 hover:bg-red-50 hover:text-red-700'
                                      : 'text-green-800 hover:bg-green-50 hover:text-green-700'
                                  }`}
                                >
                                  {user.isActive !== false ? (
                                    <>
                                      <XCircle size={18} className="text-red-600" />
                                      <span>Disable</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle size={18} className="text-green-600" />
                                      <span>Enable</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(user._id || user.id || '')}
                                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                                >
                                  <Trash2 size={18} className="text-red-600" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
        isDestructive={true}
      />

      {/* Add User Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Error Message in Modal */}
              {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setError('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setError('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={submitting}
                >
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setError('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                    setFormData({
                      name: '',
                      email: '',
                      role: 'Staff',
                      password: ''
                    });
                  }}
                  disabled={submitting}
                  className={`flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              {/* Error Message in Modal */}
              {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setError('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setError('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={submitting}
                >
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-gray-500 text-xs font-normal">(Leave blank to keep current password)</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setError('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  minLength={6}
                  placeholder="Enter new password (min 6 characters) or leave blank"
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Updating...' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setError('');
                    setFormData({
                      name: '',
                      email: '',
                      role: 'Staff',
                      password: ''
                    });
                  }}
                  disabled={submitting}
                  className={`flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
