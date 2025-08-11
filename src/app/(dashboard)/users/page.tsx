"use client";

import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilSquareIcon,
  UserIcon,
  TrashIcon,
  ArrowPathIcon,
  UserGroupIcon,
  UserCircleIcon,
  KeyIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Pagination, Stack } from "@mui/material";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  registerUser,
  type User,
} from "@/api/Users/page";
import EditUserModal from "@/components/EditUserModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import UserDetailsModal from "@/components/UserDetailsModal";
import ResetPasswordModal from "@/components/ResetPasswordModal";
import RegisterUserModal from "@/components/RegisterUserModal";

const UserManagement = () => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [loading, setLoading] = useState(false);

  // State for modals
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // State for users data
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    users: 0,
  });

  // Last refresh time
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const filters = {
        ...(searchTerm && { name: searchTerm }),
      };

      const response = await getAllUsers(page, limit, filters);
      if (response.success) {
        setUsers(response.result.users);
        setTotalUsers(response.result.total);
        setTotalPages(response.result.pages);
        setStats({
          total: response.result.total,
          admins: response.result.users.filter((user) => user.role === "admin")
            .length,
          users: response.result.users.filter((user) => user.role === "user")
            .length,
        });
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, searchTerm, selectedRole]);

  // Handle view user details
  const handleViewUser = async (userId: string) => {
    try {
      setLoading(true);
      const response = await getUserById(userId);
      if (response.success) {
        setSelectedUser(response.result);
        setShowUserDetailsModal(true);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit user
  const handleEditClick = async (userId: string) => {
    try {
      setLoading(true);
      const response = await getUserById(userId);
      if (response.success) {
        setSelectedUser(response.result);
        setShowEditModal(true);
      }
    } catch (error) {
      console.error("Error fetching user for edit:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      const response = await deleteUser(selectedUser._id);
      if (response.success) {
        setShowDeleteModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle reset password
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleResetPasswordClick = async (user: User) => {
    setIsResetPasswordLoading(true);
    try {
      const response = await forgotPassword(user.email);
      if (response.success) {
        setUserToReset(user);
        setResetToken(response.result || null);
        setIsResetModalOpen(true);
      }
    } catch (error) {
      console.error("Error requesting password reset:", error);
      throw new Error("Failed to request password reset");
    } finally {
      setIsResetPasswordLoading(false);
    }
  };

  const handleResetPassword = async (
    newPassword: string,
    confirmPassword: string
  ) => {
    if (!userToReset || !resetToken) return;

    setIsResetPasswordLoading(true);
    try {
      const response = await resetPassword(resetToken, {
        newPassword,
        confirmPassword,
      });
      if (response.success) {
        setIsResetModalOpen(false);
        setUserToReset(null);
        setResetToken(null);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      throw new Error("Failed to reset password");
    } finally {
      setIsResetPasswordLoading(false);
    }
  };

  // Handle user registration
  const handleRegisterUser = async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    setIsRegistering(true);
    try {
      const response = await registerUser(userData);
      if (response.success) {
        setIsRegisterModalOpen(false);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRole("All Roles");
    setPage(1);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-col md:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600">
            Manage your system users and their roles
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-3 items-end">
            <div className="flex items-center text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-2 flex-col md:flex-row">
            {users.length <= 1 && (
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <UserPlusIcon className="h-5 w-5" />
                <span>Register User</span>
              </button>
            )}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className={`flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ArrowPathIcon
                className={`h-5 w-5 text-gray-500 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring focus:ring-orange-500 focus:border-orange-500"
            placeholder="Search users by name or email..."
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg border-2 border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created At
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <UserGroupIcon className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-400">
                        {loading ? "Loading users..." : "No users found"}
                      </p>
                      {!loading && (
                        <button
                          onClick={clearFilters}
                          className="mt-3 text-sm cursor-pointer text-orange-600 hover:text-orange-800"
                        >
                          Clear filters to see all users
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-inner">
                          <UserIcon className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleViewUser(user._id)}
                          className="text-gray-500 hover:text-orange-600 p-2 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                          title="View Details"
                          disabled={loading}
                        >
                          <UserCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(user._id)}
                          className="text-gray-500 hover:text-orange-600 p-2 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                          title="Edit User"
                          disabled={loading}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleResetPasswordClick(user)}
                          className={`text-gray-500 hover:text-orange-600 p-2 rounded-lg hover:bg-orange-50 transition-colors ${
                            isResetPasswordLoading &&
                            userToReset?._id === user._id
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          title="Reset Password"
                          disabled={isResetPasswordLoading || loading}
                        >
                          <KeyIcon
                            className={`h-5 w-5 ${
                              isResetPasswordLoading &&
                              userToReset?._id === user._id
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete User"
                          disabled={loading}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Stack spacing={2} className="flex flex-col items-center">
              {/* Default view for smaller screens */}
              <div className="block sm:hidden">
                <Pagination
                  page={page}
                  count={totalPages}
                  onChange={(_, newPage) => setPage(newPage)}
                  siblingCount={0}
                  boundaryCount={1}
                  color="primary"
                  size="small"
                />
              </div>
              {/* Enhanced view for larger screens */}
              <div className="hidden sm:block">
                <Pagination
                  page={page}
                  count={totalPages}
                  onChange={(_, newPage) => setPage(newPage)}
                  siblingCount={1}
                  boundaryCount={2}
                  color="primary"
                  size="medium"
                  showFirstButton
                  showLastButton
                />
              </div>
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
            </Stack>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          isOpen={showUserDetailsModal}
          onClose={() => {
            setShowUserDetailsModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSave={async (updatedData) => {
            try {
              const response = await updateUser(selectedUser._id, updatedData);
              if (response.success) {
                setShowEditModal(false);
                setSelectedUser(null);
                fetchUsers();
              }
            } catch (error) {
              console.error("Error updating user:", error);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        confirmText={loading ? "Deleting..." : "Delete"}
        type="danger"
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setUserToReset(null);
        }}
        onSubmit={handleResetPassword}
        loading={isResetPasswordLoading}
      />

      {/* Register User Modal */}
      <RegisterUserModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={handleRegisterUser}
        loading={isRegistering}
      />
    </div>
  );
};

export default UserManagement;
