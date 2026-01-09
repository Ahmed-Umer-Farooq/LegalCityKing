import React from 'react';
import { X, User, Mail, Phone, MapPin } from 'lucide-react';

export default function ViewClientModal({ isOpen, onClose, client }) {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-[#181A2A]">Client Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#EDF3FF] rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-[#186898]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#181A2A]">{client.name}</h3>
              <p className="text-[#737791]">Client ID: {client.id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{client.email}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{client.mobile_number || client.phone || 'Not provided'}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{client.username || 'Not provided'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="text-gray-900">
                    {client.address && <div>{client.address}</div>}
                    {(client.city || client.state || client.zip_code) && (
                      <div>{client.city}{client.city && client.state ? ', ' : ''}{client.state} {client.zip_code}</div>
                    )}
                    {client.country && <div>{client.country}</div>}
                    {!client.address && !client.city && !client.state && !client.country && 'Not provided'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}