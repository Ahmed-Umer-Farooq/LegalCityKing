import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../../utils/api';

export default function VerificationModal({ isOpen, onClose }) {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVerificationStatus();
    }
  }, [isOpen]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await api.get('/verification/status');
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const handleFileChange = (e) => {
    setDocuments([...e.target.files]);
  };

  const submitVerification = async () => {
    if (documents.length === 0) {
      alert('Please upload at least one document');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      documents.forEach(doc => formData.append('documents', doc));

      const response = await api.post('/verification/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Verification documents submitted successfully!');
      fetchVerificationStatus();
      setDocuments([]);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error submitting verification:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit verification documents';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'submitted': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Lawyer Verification</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {verificationStatus && (
          <div className="mb-4 p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(verificationStatus.verification_status)}
              <span className="font-medium capitalize">
                {verificationStatus.verification_status || 'Not Started'}
              </span>
            </div>
            {verificationStatus.verification_notes && (
              <p className="text-sm text-gray-600">{verificationStatus.verification_notes}</p>
            )}
          </div>
        )}

        {(!verificationStatus?.verification_status || verificationStatus.verification_status === 'pending' || verificationStatus.verification_status === 'rejected') && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Upload your bar license, professional certificates, and ID to get verified.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Upload Documents</label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full p-2 border rounded-lg"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted: PDF, JPG, PNG (Max 5 files, 10MB each)
              </p>
            </div>

            {documents.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Selected Files:</p>
                {Array.from(documents).map((doc, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    • {doc.name}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={submitVerification}
              disabled={loading || documents.length === 0}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        )}

        {verificationStatus?.verification_status === 'submitted' && (
          <div className="text-center py-4">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Your documents are under review. You'll be notified once approved.
            </p>
          </div>
        )}

        {verificationStatus?.verification_status === 'approved' && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Congratulations! You are now a verified lawyer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}