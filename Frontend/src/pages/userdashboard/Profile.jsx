import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, Camera, Briefcase, Building, Globe, Heart, Shield, Award, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import api from '../../utils/api';

const Profile = () => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    mobile_number: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    date_of_birth: '',
    bio: '',
    job_title: '',
    company: '',
    profile_image: null,
    social_links: {
      linkedin: '',
      twitter: '',
      facebook: '',
      website: ''
    },
    interests: [],
    privacy_settings: {
      show_email: false,
      show_phone: false,
      show_address: false
    },
    profile_completion_percentage: 0
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Fetch profile data from backend
  const fetchProfile = async () => {
    try {
      setFetchingProfile(true);
      const response = await api.get('/auth/me');
      const userData = response.data;
      
      setProfileData({
        name: userData.name || '',
        username: userData.username || '',
        email: userData.email || '',
        mobile_number: userData.mobile_number || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        zip_code: userData.zip_code || '',
        country: userData.country || '',
        date_of_birth: userData.date_of_birth || '',
        bio: userData.bio || '',
        job_title: userData.job_title || '',
        company: userData.company || '',
        profile_image: userData.profile_image || null,
        social_links: userData.social_links ? (typeof userData.social_links === 'string' ? JSON.parse(userData.social_links) : userData.social_links) : {
          linkedin: '',
          twitter: '',
          facebook: '',
          website: ''
        },
        interests: userData.interests ? (typeof userData.interests === 'string' ? JSON.parse(userData.interests) : userData.interests) : [],
        privacy_settings: userData.privacy_settings ? (typeof userData.privacy_settings === 'string' ? JSON.parse(userData.privacy_settings) : userData.privacy_settings) : {
          show_email: false,
          show_phone: false,
          show_address: false
        },
        profile_completion_percentage: userData.profile_completion_percentage || 0,
        role: userData.role,
        registration_id: userData.registration_id,
        law_firm: userData.law_firm,
        speciality: userData.speciality
      });
      
      if (userData.profile_image) {
        setImagePreview(`http://localhost:5001${userData.profile_image}`);
      } else if (userData.avatar) {
        setImagePreview(userData.avatar);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setFetchingProfile(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData({...profileData, profile_image: file});
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        name: profileData.name,
        username: profileData.username,
        mobile_number: profileData.mobile_number,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        zip_code: profileData.zip_code,
        country: profileData.country,
        date_of_birth: profileData.date_of_birth,
        bio: profileData.bio,
        job_title: profileData.job_title,
        company: profileData.company,
        social_links: profileData.social_links,
        interests: profileData.interests,
        privacy_settings: profileData.privacy_settings
      };
      
      const response = await api.put('/auth/me', updateData);
      const updatedUser = response.data.user;
      
      // Update auth context
      login(localStorage.getItem('token'), updatedUser);
      
      // Refresh profile data
      await fetchProfile();
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile();
  };

  const calculateCompletion = () => {
    const fields = [
      profileData.name, profileData.username, profileData.mobile_number,
      profileData.address, profileData.city, profileData.state, profileData.country,
      profileData.date_of_birth, profileData.bio, profileData.job_title, profileData.company
    ];
    const completed = fields.filter(field => field && field.trim()).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  if (fetchingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'social', label: 'Social Links', icon: Globe },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Profile Summary */}
              <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-blue-600" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                      <Camera className="w-3 h-3 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <h3 className="font-semibold text-lg">{profileData.name || 'Your Name'}</h3>
                  <p className="text-blue-100 text-sm">{profileData.email}</p>
                </div>
                
                {/* Completion Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Profile Completion</span>
                    <span>{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-blue-500 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </h2>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your full name"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <User className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.name || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.username}
                            onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Choose a username"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <User className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.username || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={profileData.date_of_birth}
                            onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">
                              {profileData.date_of_birth ? new Date(profileData.date_of_birth).toLocaleDateString() : 'Not provided'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-lg">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{profileData.email}</span>
                          <Lock className="w-4 h-4 text-gray-400 ml-auto" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      {isEditing ? (
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg min-h-[100px]">
                          <p className="text-gray-900">{profileData.bio || 'No bio provided'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={profileData.mobile_number}
                            onChange={(e) => setProfileData({...profileData, mobile_number: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your phone number"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.mobile_number || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.address}
                            onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your address"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.address || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.city}
                            onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your city"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.city || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.state}
                            onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your state"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.state || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.zip_code}
                            onChange={(e) => setProfileData({...profileData, zip_code: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your ZIP code"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.zip_code || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.country}
                            onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your country"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <Globe className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.country || 'Not provided'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'professional' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.job_title}
                            onChange={(e) => setProfileData({...profileData, job_title: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your job title"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <Briefcase className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.job_title || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.company}
                            onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your company"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <Building className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.company || 'Not provided'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'social' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={profileData.social_links.linkedin}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              social_links: {...profileData.social_links, linkedin: e.target.value}
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://linkedin.com/in/username"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <Globe className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.social_links.linkedin || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={profileData.social_links.twitter}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              social_links: {...profileData.social_links, twitter: e.target.value}
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://twitter.com/username"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <Globe className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.social_links.twitter || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={profileData.social_links.facebook}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              social_links: {...profileData.social_links, facebook: e.target.value}
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://facebook.com/username"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <Globe className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.social_links.facebook || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={profileData.social_links.website}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              social_links: {...profileData.social_links, website: e.target.value}
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://yourwebsite.com"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                            <Globe className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{profileData.social_links.website || 'Not provided'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-900">Privacy Settings</h3>
                          <p className="text-sm text-blue-700 mt-1">Control what information is visible to other users</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Show Email Address</h4>
                          <p className="text-sm text-gray-600">Allow other users to see your email address</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileData.privacy_settings.show_email}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              privacy_settings: {...profileData.privacy_settings, show_email: e.target.checked}
                            })}
                            className="sr-only peer"
                            disabled={!isEditing}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Show Phone Number</h4>
                          <p className="text-sm text-gray-600">Allow other users to see your phone number</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileData.privacy_settings.show_phone}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              privacy_settings: {...profileData.privacy_settings, show_phone: e.target.checked}
                            })}
                            className="sr-only peer"
                            disabled={!isEditing}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Show Address</h4>
                          <p className="text-sm text-gray-600">Allow other users to see your address</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileData.privacy_settings.show_address}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              privacy_settings: {...profileData.privacy_settings, show_address: e.target.checked}
                            })}
                            className="sr-only peer"
                            disabled={!isEditing}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;