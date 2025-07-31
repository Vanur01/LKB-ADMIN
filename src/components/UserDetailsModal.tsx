import React from 'react';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { type User } from '@/api/Users/page';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const UserDetailsModal = ({ isOpen, onClose, user }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="h-6 w-6 text-gray-500" />
        </button>

        {/* Modal Content */}
        <div className="p-8">
          {/* User Header */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-inner">
                <UserIcon className="h-12 w-12 text-orange-600" />
              </div>
              <div className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role}
              </div>
            </div>

            <h2 className="mt-4 text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>

          {/* User Details */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Role</div>
              <div className="text-sm font-medium text-gray-900">
                               {user.role}

              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Account Created</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Last Updated</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(user.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>

            
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-sm cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;