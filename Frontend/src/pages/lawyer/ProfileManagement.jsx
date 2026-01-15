import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Award, Calendar, Building, Globe, Camera, Save, X, Edit3, Upload, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

export default function ProfileManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [imagePreview, setImagePreview] = useState(null);
  const calculateProfileCompletion = () => {
    const fields = [
      profileData.name, profileData.mobile_number, profileData.bio,
      profileData.address, profileData.city, profileData.state,
      profileData.registration_id, profileData.speciality, profileData.law_firm,
      profileData.education[0]?.institution, profileData.experience[0]?.position,
      profileData.certifications[0]?.name
    ];
    const completed = fields.filter(field => field && field.trim()).length;
    return Math.round((completed / fields.length) * 100);
  };

  const [profileData, setProfileData] = useState({
    // Personal Info
    name: '',
    email: '',
    mobile_number: '',
    date_of_birth: '',
    bio: '',
    profile_image: null,
    
    // Contact Info
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    
    // Professional Info
    registration_id: '',
    law_firm: '',
    speciality: '',
    years_licensed: '',
    hourly_rate: '',
    
    // Education
    education: [
      { institution: '', degree: '', year: '', field: '' }
    ],
    
    // Experience
    experience: [
      { position: '', company: '', start_year: '', end_year: '', description: '' }
    ],
    
    // Certifications & Awards
    certifications: [
      { name: '', issuer: '', year: '', description: '' }
    ],
    
    // Languages
    languages: ['English'],
    
    // Practice Areas
    practice_areas: [
      { area: '', percentage: 100, years_experience: '' }
    ],
    
    // Professional Associations
    associations: [
      { name: '', role: '', start_year: '', end_year: '' }
    ],
    
    // Publications
    publications: [
      { title: '', publication: '', year: '', description: '' }
    ],
    
    // Speaking Engagements
    speaking: [
      { title: '', event: '', year: '', description: '' }
    ],
    
    // Social Links
    social_links: {
      linkedin: '',
      twitter: '',
      facebook: '',
      website: ''
    },
    
    // Office Hours
    office_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    },
    
    // Payment Options
    payment_options: {
      credit_cards: true,
      payment_plans: true,
      contingency_fee: true,
      free_consultation: true
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/lawyer/profile');
      const data = response.data;
      
      // If no data from API, try localStorage
      if (!data || !data.id) {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser && storedUser.id) {
          setProfileData({
            ...profileData,
            ...storedUser
          });
          return;
        }
      }
      
      setProfileData({
        ...profileData,
        ...data,
        education: data.education ? JSON.parse(data.education) : profileData.education,
        experience: data.experience ? JSON.parse(data.experience) : profileData.experience,
        certifications: data.certifications ? JSON.parse(data.certifications) : profileData.certifications,
        languages: data.languages ? JSON.parse(data.languages) : profileData.languages,
        practice_areas: data.practice_areas ? JSON.parse(data.practice_areas) : profileData.practice_areas,
        associations: data.associations ? JSON.parse(data.associations) : profileData.associations,
        publications: data.publications ? JSON.parse(data.publications) : profileData.publications,
        speaking: data.speaking ? JSON.parse(data.speaking) : profileData.speaking,
        social_links: data.social_links ? (typeof data.social_links === 'string' ? (() => {
        try {
          const parsed = JSON.parse(data.social_links);
          // Check if it's an object with numeric keys (double stringified)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).some(k => !isNaN(k))) {
            return profileData.social_links; // Use default
          }
          return parsed;
        } catch (e) {
          return profileData.social_links;
        }
      })() : data.social_links) : profileData.social_links,
        office_hours: data.office_hours ? JSON.parse(data.office_hours) : profileData.office_hours,
        payment_options: data.payment_options ? JSON.parse(data.payment_options) : profileData.payment_options
      });
      
      if (data.profile_image) {
        setImagePreview(`http://localhost:5001${data.profile_image}`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser && storedUser.id) {
        setProfileData({
          ...profileData,
          ...storedUser
        });
      }
    }
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...profileData,
        education: JSON.stringify(profileData.education),
        experience: JSON.stringify(profileData.experience),
        certifications: JSON.stringify(profileData.certifications),
        languages: JSON.stringify(profileData.languages),
        practice_areas: JSON.stringify(profileData.practice_areas),
        associations: JSON.stringify(profileData.associations),
        publications: JSON.stringify(profileData.publications),
        speaking: JSON.stringify(profileData.speaking),
        social_links: JSON.stringify(profileData.social_links),
        office_hours: JSON.stringify(profileData.office_hours),
        payment_options: JSON.stringify(profileData.payment_options)
      };
      
      console.log('Saving profile data:', dataToSave);
      const response = await api.put('/auth/me', dataToSave);
      console.log('Profile save response:', response.data);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      await fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      console.error('Error updating profile:', error.response?.data || error);
    }
  };

  const addArrayItem = (field, defaultItem) => {
    setProfileData({
      ...profileData,
      [field]: [...profileData[field], defaultItem]
    });
  };

  const removeArrayItem = (field, index) => {
    setProfileData({
      ...profileData,
      [field]: profileData[field].filter((_, i) => i !== index)
    });
  };

  const updateArrayItem = (field, index, key, value) => {
    const updated = [...profileData[field]];
    updated[index] = { ...updated[index], [key]: value };
    setProfileData({
      ...profileData,
      [field]: updated
    });
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Full Name *</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.name || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Email</label>
          <div className="px-4 py-3 bg-blue-50 rounded-xl text-gray-600">
            {profileData.email} (Cannot be changed)
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Phone Number *</label>
          {isEditing ? (
            <input
              type="tel"
              value={profileData.mobile_number}
              onChange={(e) => setProfileData({...profileData, mobile_number: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.mobile_number || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Date of Birth</label>
          {isEditing ? (
            <input
              type="date"
              value={profileData.date_of_birth}
              onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">
              {profileData.date_of_birth ? new Date(profileData.date_of_birth).toLocaleDateString() : 'Not provided'}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Professional Bio</label>
        {isEditing ? (
          <textarea
            value={profileData.bio}
            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your legal expertise and experience..."
          />
        ) : (
          <div className="px-4 py-3 bg-gray-50 rounded-xl min-h-[100px]">
            {profileData.bio || 'No bio provided'}
          </div>
        )}
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Phone Number *</label>
          {isEditing ? (
            <input
              type="tel"
              value={profileData.mobile_number}
              onChange={(e) => setProfileData({...profileData, mobile_number: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.mobile_number || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Address</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.address}
              onChange={(e) => setProfileData({...profileData, address: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.address || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">City</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.city}
              onChange={(e) => setProfileData({...profileData, city: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.city || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">State</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.state}
              onChange={(e) => setProfileData({...profileData, state: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.state || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">ZIP Code</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.zip_code}
              onChange={(e) => setProfileData({...profileData, zip_code: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.zip_code || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Country</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.country}
              onChange={(e) => setProfileData({...profileData, country: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.country || 'Not provided'}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProfessionalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Bar Registration ID *</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.registration_id}
              onChange={(e) => setProfileData({...profileData, registration_id: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.registration_id || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Law Firm</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.law_firm}
              onChange={(e) => setProfileData({...profileData, law_firm: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.law_firm || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Primary Speciality *</label>
          {isEditing ? (
            <select
              value={profileData.speciality}
              onChange={(e) => setProfileData({...profileData, speciality: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Speciality</option>
              <option value="Criminal Law">Criminal Law</option>
              <option value="Family Law">Family Law</option>
              <option value="Corporate Law">Corporate Law</option>
              <option value="Civil Law">Civil Law</option>
              <option value="Tax Law">Tax Law</option>
              <option value="Property Law">Property Law</option>
              <option value="Labor Law">Labor Law</option>
              <option value="Immigration Law">Immigration Law</option>
              <option value="Personal Injury">Personal Injury</option>
              <option value="Estate Planning">Estate Planning</option>
            </select>
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.speciality || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Years Licensed</label>
          {isEditing ? (
            <input
              type="number"
              value={profileData.years_licensed}
              onChange={(e) => setProfileData({...profileData, years_licensed: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.years_licensed || 'Not provided'}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Hourly Rate ($)</label>
          {isEditing ? (
            <input
              type="number"
              value={profileData.hourly_rate}
              onChange={(e) => setProfileData({...profileData, hourly_rate: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="300"
            />
          ) : (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">
              {profileData.hourly_rate ? `$${profileData.hourly_rate}` : 'Not provided'}
            </div>
          )}
        </div>
      </div>

      {/* Practice Areas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-700">Practice Areas</label>
          {isEditing && (
            <button
              onClick={() => addArrayItem('practice_areas', { area: '', percentage: 100, years_experience: '' })}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Area
            </button>
          )}
        </div>
        
        {profileData.practice_areas.map((area, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-xl">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={area.area}
                  onChange={(e) => updateArrayItem('practice_areas', index, 'area', e.target.value)}
                  placeholder="Practice Area"
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                />
                <input
                  type="number"
                  value={area.percentage}
                  onChange={(e) => updateArrayItem('practice_areas', index, 'percentage', e.target.value)}
                  placeholder="Percentage"
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                />
                <input
                  type="number"
                  value={area.years_experience}
                  onChange={(e) => updateArrayItem('practice_areas', index, 'years_experience', e.target.value)}
                  placeholder="Years Experience"
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                />
                <button
                  onClick={() => removeArrayItem('practice_areas', index)}
                  className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="md:col-span-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{area.area || 'Not specified'}</span>
                  <span className="text-blue-600 font-bold">{area.percentage}%</span>
                </div>
                <p className="text-sm text-gray-600">{area.years_experience} years experience</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderEducationExperience = () => (
    <div className="space-y-8">
      {/* Education */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-semibold text-gray-700">Education</label>
          {isEditing && (
            <button
              onClick={() => addArrayItem('education', { institution: '', degree: '', year: '', field: '' })}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Education
            </button>
          )}
        </div>
        
        {profileData.education.map((edu, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-xl">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => updateArrayItem('education', index, 'institution', e.target.value)}
                  placeholder="Institution"
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                />
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateArrayItem('education', index, 'degree', e.target.value)}
                  placeholder="Degree"
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                />
                <input
                  type="text"
                  value={edu.field}
                  onChange={(e) => updateArrayItem('education', index, 'field', e.target.value)}
                  placeholder="Field of Study"
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                />
                <input
                  type="number"
                  value={edu.year}
                  onChange={(e) => updateArrayItem('education', index, 'year', e.target.value)}
                  placeholder="Year"
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                />
                <button
                  onClick={() => removeArrayItem('education', index)}
                  className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="md:col-span-5">
                <h4 className="font-semibold text-gray-900">{edu.institution || 'Institution not specified'}</h4>
                <p className="text-gray-600">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                <p className="text-sm text-gray-500">{edu.year}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Experience */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-semibold text-gray-700">Work Experience</label>
          <button
            onClick={() => addArrayItem('experience', { position: '', company: '', start_year: '', end_year: '', description: '' })}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </button>
        </div>
        
        {profileData.experience.map((exp, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-xl">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateArrayItem('experience', index, 'position', e.target.value)}
                    placeholder="Position"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateArrayItem('experience', index, 'company', e.target.value)}
                    placeholder="Company"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={exp.start_year}
                    onChange={(e) => updateArrayItem('experience', index, 'start_year', e.target.value)}
                    placeholder="Start Year"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="number"
                    value={exp.end_year}
                    onChange={(e) => updateArrayItem('experience', index, 'end_year', e.target.value)}
                    placeholder="End Year (or 'Present')"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <textarea
                  value={exp.description}
                  onChange={(e) => updateArrayItem('experience', index, 'description', e.target.value)}
                  placeholder="Description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
                <button
                  onClick={() => removeArrayItem('experience', index)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-gray-900">{exp.position || 'Position not specified'}</h4>
                <p className="text-blue-600 font-medium">{exp.company}</p>
                <p className="text-gray-600 text-sm">{exp.start_year} - {exp.end_year || 'Present'}</p>
                {exp.description && <p className="text-gray-700 mt-2">{exp.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCertificationsAwards = () => (
    <div className="space-y-8">
      {/* Certifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-semibold text-gray-700">Certifications & Licenses</label>
          <button
            onClick={() => addArrayItem('certifications', { name: '', issuer: '', year: '', description: '' })}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Certification
          </button>
        </div>
        
        {profileData.certifications.map((cert, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-xl">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => updateArrayItem('certifications', index, 'name', e.target.value)}
                    placeholder="Certification Name"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={cert.issuer}
                    onChange={(e) => updateArrayItem('certifications', index, 'issuer', e.target.value)}
                    placeholder="Issuing Organization"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="number"
                    value={cert.year}
                    onChange={(e) => updateArrayItem('certifications', index, 'year', e.target.value)}
                    placeholder="Year"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <textarea
                  value={cert.description}
                  onChange={(e) => updateArrayItem('certifications', index, 'description', e.target.value)}
                  placeholder="Description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
                <button
                  onClick={() => removeArrayItem('certifications', index)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-gray-900">{cert.name || 'Certification not specified'}</h4>
                <p className="text-gray-600">{cert.issuer} • {cert.year}</p>
                {cert.description && <p className="text-gray-700 text-sm mt-1">{cert.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Professional Associations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-semibold text-gray-700">Professional Associations</label>
          {isEditing && (
            <button
              onClick={() => addArrayItem('associations', { name: '', role: '', start_year: '', end_year: '' })}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Association
            </button>
          )}
        </div>
        
        {profileData.associations.map((assoc, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-xl">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    value={assoc.name}
                    onChange={(e) => updateArrayItem('associations', index, 'name', e.target.value)}
                    placeholder="Association Name"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={assoc.role}
                    onChange={(e) => updateArrayItem('associations', index, 'role', e.target.value)}
                    placeholder="Role/Position"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="number"
                    value={assoc.start_year}
                    onChange={(e) => updateArrayItem('associations', index, 'start_year', e.target.value)}
                    placeholder="Start Year"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="number"
                    value={assoc.end_year}
                    onChange={(e) => updateArrayItem('associations', index, 'end_year', e.target.value)}
                    placeholder="End Year"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <button
                  onClick={() => removeArrayItem('associations', index)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-gray-900">{assoc.name || 'Association not specified'}</h4>
                <p className="text-gray-600">{assoc.role} • {assoc.start_year} - {assoc.end_year || 'Present'}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Languages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-semibold text-gray-700">Languages</label>
          {isEditing && (
            <button
              onClick={() => setProfileData({...profileData, languages: [...profileData.languages, '']})}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Language
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profileData.languages.map((lang, index) => (
            <div key={index} className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={lang}
                    onChange={(e) => {
                      const updated = [...profileData.languages];
                      updated[index] = e.target.value;
                      setProfileData({...profileData, languages: updated});
                    }}
                    placeholder="Language"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <button
                    onClick={() => {
                      const updated = profileData.languages.filter((_, i) => i !== index);
                      setProfileData({...profileData, languages: updated});
                    }}
                    className="px-2 py-2 bg-red-100 text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium border border-purple-200">
                  {lang || 'Language not specified'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSocialWeb = () => (
    <div className="space-y-8">
      {/* Social Links */}
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-gray-700">Social Media & Website</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">LinkedIn</label>
            {isEditing ? (
              <input
                type="url"
                value={profileData.social_links.linkedin}
                onChange={(e) => setProfileData({...profileData, social_links: {...profileData.social_links, linkedin: e.target.value}})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://linkedin.com/in/username"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.social_links.linkedin || 'Not provided'}</div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Twitter</label>
            {isEditing ? (
              <input
                type="url"
                value={profileData.social_links.twitter}
                onChange={(e) => setProfileData({...profileData, social_links: {...profileData.social_links, twitter: e.target.value}})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://twitter.com/username"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.social_links.twitter || 'Not provided'}</div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Facebook</label>
            {isEditing ? (
              <input
                type="url"
                value={profileData.social_links.facebook}
                onChange={(e) => setProfileData({...profileData, social_links: {...profileData.social_links, facebook: e.target.value}})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://facebook.com/username"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.social_links.facebook || 'Not provided'}</div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Website</label>
            {isEditing ? (
              <input
                type="url"
                value={profileData.social_links.website}
                onChange={(e) => setProfileData({...profileData, social_links: {...profileData.social_links, website: e.target.value}})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://yourwebsite.com"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-xl">{profileData.social_links.website || 'Not provided'}</div>
            )}
          </div>
        </div>
      </div>

      {/* Publications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-semibold text-gray-700">Publications</label>
          {isEditing && (
            <button
              onClick={() => addArrayItem('publications', { title: '', publication: '', year: '', description: '' })}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Publication
            </button>
          )}
        </div>
        
        {profileData.publications.map((pub, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-xl">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={pub.title}
                    onChange={(e) => updateArrayItem('publications', index, 'title', e.target.value)}
                    placeholder="Publication Title"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={pub.publication}
                    onChange={(e) => updateArrayItem('publications', index, 'publication', e.target.value)}
                    placeholder="Publication/Journal"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="number"
                    value={pub.year}
                    onChange={(e) => updateArrayItem('publications', index, 'year', e.target.value)}
                    placeholder="Year"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <textarea
                  value={pub.description}
                  onChange={(e) => updateArrayItem('publications', index, 'description', e.target.value)}
                  placeholder="Description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
                <button
                  onClick={() => removeArrayItem('publications', index)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-gray-900">{pub.title || 'Publication not specified'}</h4>
                <p className="text-gray-600">{pub.publication} • {pub.year}</p>
                {pub.description && <p className="text-gray-700 text-sm mt-1">{pub.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Speaking Engagements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-semibold text-gray-700">Speaking Engagements</label>
          {isEditing && (
            <button
              onClick={() => addArrayItem('speaking', { title: '', event: '', year: '', description: '' })}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Speaking
            </button>
          )}
        </div>
        
        {profileData.speaking.map((speak, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-xl">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={speak.title}
                    onChange={(e) => updateArrayItem('speaking', index, 'title', e.target.value)}
                    placeholder="Speaking Title"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={speak.event}
                    onChange={(e) => updateArrayItem('speaking', index, 'event', e.target.value)}
                    placeholder="Event/Conference"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="number"
                    value={speak.year}
                    onChange={(e) => updateArrayItem('speaking', index, 'year', e.target.value)}
                    placeholder="Year"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <textarea
                  value={speak.description}
                  onChange={(e) => updateArrayItem('speaking', index, 'description', e.target.value)}
                  placeholder="Description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
                <button
                  onClick={() => removeArrayItem('speaking', index)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-gray-900">{speak.title || 'Speaking engagement not specified'}</h4>
                <p className="text-gray-600">{speak.event} • {speak.year}</p>
                {speak.description && <p className="text-gray-700 text-sm mt-1">{speak.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderOfficePayment = () => (
    <div className="space-y-8">
      {/* Office Hours */}
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-gray-700">Office Hours</label>
        <div className="space-y-3">
          {Object.entries(profileData.office_hours).map(([day, hours]) => (
            <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 border border-gray-200 rounded-xl">
              <div className="font-medium text-gray-900 capitalize">{day}</div>
              {isEditing ? (
                <>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      office_hours: {
                        ...profileData.office_hours,
                        [day]: { ...hours, open: e.target.value }
                      }
                    })}
                    disabled={hours.closed}
                    className="px-3 py-2 border border-gray-200 rounded-lg disabled:bg-gray-100"
                  />
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      office_hours: {
                        ...profileData.office_hours,
                        [day]: { ...hours, close: e.target.value }
                      }
                    })}
                    disabled={hours.closed}
                    className="px-3 py-2 border border-gray-200 rounded-lg disabled:bg-gray-100"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hours.closed}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        office_hours: {
                          ...profileData.office_hours,
                          [day]: { ...hours, closed: e.target.checked }
                        }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Closed</span>
                  </label>
                </>
              ) : (
                <div className="md:col-span-3">
                  {hours.closed ? (
                    <span className="text-red-600 font-medium">Closed</span>
                  ) : (
                    <span className="text-gray-700">{hours.open} - {hours.close}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Options */}
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-gray-700">Payment Options</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(profileData.payment_options).map(([option, enabled]) => (
            <div key={option} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
              {isEditing ? (
                <>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      payment_options: {
                        ...profileData.payment_options,
                        [option]: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <span className="text-gray-700 capitalize">
                    {option.replace('_', ' ')}
                  </span>
                </>
              ) : (
                <>
                  <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className={`text-sm ${enabled ? 'text-gray-700' : 'text-gray-400'} capitalize`}>
                    {option.replace('_', ' ')}
                  </span>
                  {enabled && <span className="text-xs text-green-600 font-medium">Available</span>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'contact', label: 'Contact & Location', icon: MapPin },
    { id: 'professional', label: 'Professional Info', icon: Building },
    { id: 'education', label: 'Education & Experience', icon: Award },
    { id: 'certifications', label: 'Certifications & Awards', icon: Award },
    { id: 'social', label: 'Social & Web', icon: Globe },
    { id: 'settings', label: 'Office & Payment', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Profile Management</h1>
              <p className="text-gray-600">Manage all aspects of your professional lawyer profile</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{calculateProfileCompletion()}%</div>
              <div className="text-sm text-gray-500">Profile Complete</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${calculateProfileCompletion()}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
              {/* Profile Header */}
              <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-white" />
                      )}
                    </div>
                    {isEditing && (
                      <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center cursor-pointer">
                        <Camera className="w-3 h-3 text-blue-600" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Image size must be less than 5MB');
                                return;
                              }
                              const formData = new FormData();
                              formData.append('profileImage', file);
                              try {
                                console.log('Uploading image:', file.name, file.size);
                                const response = await api.post('/profile/upload-image', formData, {
                                  headers: {
                                    'Content-Type': 'multipart/form-data'
                                  }
                                });
                                console.log('Image upload response:', response.data);
                                setImagePreview(`http://localhost:5001${response.data.imageUrl}`);
                                toast.success('Profile image updated!');
                                await fetchProfile();
                              } catch (error) {
                                console.error('Image upload error:', error.response?.data || error);
                                toast.error(error.response?.data?.error || 'Failed to upload image');
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <h3 className="font-semibold">{profileData.name || 'Your Name'}</h3>
                  <p className="text-blue-100 text-sm">{profileData.speciality || 'Legal Professional'}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-3 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-lg border">
              {/* Header */}
              <div className="px-6 py-5 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    {tabs.find(t => t.id === activeTab)?.icon && 
                      React.createElement(tabs.find(t => t.id === activeTab).icon, { className: "w-4 h-4 text-blue-600" })
                    }
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                </div>
                
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          fetchProfile();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === 'personal' && renderPersonalInfo()}
                {activeTab === 'contact' && renderContactInfo()}
                {activeTab === 'professional' && renderProfessionalInfo()}
                {activeTab === 'education' && renderEducationExperience()}
                {activeTab === 'certifications' && renderCertificationsAwards()}
                {activeTab === 'social' && renderSocialWeb()}
                {activeTab === 'settings' && renderOfficePayment()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
