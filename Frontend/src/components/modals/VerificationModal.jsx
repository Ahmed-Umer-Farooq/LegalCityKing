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
    const newFiles = [...e.target.files];
    const existingFiles = [...documents];
    const combinedFiles = [...existingFiles, ...newFiles];
    
    if (combinedFiles.length > 5) {
      alert('Maximum 5 files allowed. Please remove some files first.');
      return;
    }
    
    setDocuments(combinedFiles);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Professional Verification</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {verificationStatus && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(verificationStatus.verification_status)}
              <span className="font-semibold text-slate-800 capitalize">
                Status: {verificationStatus.verification_status === 'pending' ? 'Under Review' : verificationStatus.verification_status || 'Not Submitted'}
              </span>
            </div>
            {verificationStatus.verification_notes && (
              <p className="text-sm text-slate-600 mt-2 pl-8">{verificationStatus.verification_notes}</p>
            )}
          </div>
        )}

        {(!verificationStatus?.verification_status || verificationStatus.verification_status === 'pending' || verificationStatus.verification_status === 'rejected') && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Required Documents</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• State Bar License Certificate</li>
                <li>• Professional ID or Driver's License</li>
                <li>• Law Degree Certificate (optional)</li>
                <li>• Professional Liability Insurance (optional)</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Document Upload</label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <div className="text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-lg font-medium text-slate-700 mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500">PDF, JPG, PNG files only</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Maximum 5 files allowed</span>
                <span>10MB per file limit</span>
              </div>
            </div>

            {documents.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-semibold text-green-900 mb-2">Selected Files ({documents.length})</h4>
                <div className="space-y-2">
                  {Array.from(documents).map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-green-800">
                      <FileText className="w-4 h-4" />
                      <span>{doc.name}</span>
                      <span className="text-xs text-green-600">({(doc.size / 1024 / 1024).toFixed(1)}MB)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={submitVerification}
              disabled={loading || documents.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Documents...
                </div>
              ) : (
                'Submit for Professional Review'
              )}
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
    </div>
  );
}