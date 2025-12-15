'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  isLoading?: boolean;
  details?: React.ReactNode;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
  details,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-red-500 dark:text-red-400" />,
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-200 dark:border-red-800',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />,
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          border: 'border-yellow-200 dark:border-yellow-800',
        };
      case 'info':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-blue-500 dark:text-blue-400" />,
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
          border: 'border-blue-200 dark:border-blue-800',
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />,
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          border: 'border-yellow-200 dark:border-yellow-800',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity" onClick={onClose} />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className={`relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 border-2 ${styles.border} text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg`}>
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                {styles.icon}
              </div>
              
              {/* Content */}
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    {message}
                  </p>
                  {details && (
                    <div className="mt-3">
                      {details}
                    </div>
                  )}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto transition-colors ${styles.confirmBtn} ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-600 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 sm:mt-0 sm:w-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized delete confirmation dialog
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  itemType?: string;
  count?: number;
  isLoading?: boolean;
  hasInteractions?: boolean;
  interactionDetails?: {
    likes?: number;
    saves?: number;
    comments?: number;
  };
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  count = 1,
  isLoading = false,
  hasInteractions = false,
  interactionDetails,
}: DeleteConfirmationDialogProps) {
  const isPlural = count > 1;
  const displayName = itemName || `${count} ${itemType}${isPlural ? 's' : ''}`;

  const getWarningMessage = () => {
    if (hasInteractions && interactionDetails) {
      const interactions = [];
      if (interactionDetails.likes) interactions.push(`${interactionDetails.likes} like${interactionDetails.likes > 1 ? 's' : ''}`);
      if (interactionDetails.saves) interactions.push(`${interactionDetails.saves} save${interactionDetails.saves > 1 ? 's' : ''}`);
      if (interactionDetails.comments) interactions.push(`${interactionDetails.comments} comment${interactionDetails.comments > 1 ? 's' : ''}`);
      
      return `This ${itemType} has ${interactions.join(', ')}. Deleting it will remove all associated data.`;
    }
    return '';
  };

  const details = hasInteractions ? (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mt-2">
      <div className="flex">
        <AlertTriangle className="w-5 h-5 text-yellow-400 dark:text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
        <div className="text-sm text-yellow-700 dark:text-yellow-300">
          <p className="font-medium">Warning: This action cannot be undone</p>
          <p className="mt-1">{getWarningMessage()}</p>
        </div>
      </div>
    </div>
  ) : (
    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-3 mt-2">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        <strong>This action cannot be undone.</strong> All associated data will be permanently removed.
      </p>
    </div>
  );

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${displayName}?`}
      message={`Are you sure you want to delete ${displayName}? This action cannot be undone.`}
      confirmText={isLoading ? 'Deleting...' : 'Delete'}
      cancelText="Cancel"
      type="danger"
      isLoading={isLoading}
      details={details}
    />
  );
}