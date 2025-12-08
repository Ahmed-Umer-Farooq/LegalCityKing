import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export default function EndorsementModal({ isOpen, onClose, lawyerId, lawyerName }) {
  const [endorsementText, setEndorsementText] = useState('');
  const [relationship, setRelationship] = useState('');
  const [loading, setLoading] = useState(false);

  const relationshipOptions = [
    'Opposing Counsel on matter',
    'Worked together on matter',
    'Fellow lawyer in community',
    'Worked for lawyer',
    'Colleague at same firm',
    'Law school classmate',
    'Other professional relationship'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!endorsementText.trim() || !relationship) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/endorsements', {
        endorsed_lawyer_secure_id: lawyerId,
        endorsement_text: endorsementText.trim(),
        relationship
      });
      
      toast.success('Endorsement submitted successfully!');
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit endorsement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Endorse Lawyer</h2>
        <p className="text-gray-600 mb-6">Provide a professional endorsement for {lawyerName}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship *
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select relationship</option>
              {relationshipOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endorsement *
            </label>
            <textarea
              value={endorsementText}
              onChange={(e) => setEndorsementText(e.target.value)}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your professional endorsement..."
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Endorsement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
