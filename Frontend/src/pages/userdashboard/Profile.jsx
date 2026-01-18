import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, Camera, Briefcase, Building, Globe, Lock, CheckCircle, Settings } from 'lucide-react';
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile');
      
      try {
        setLoading(true);
        const response = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setImagePreview(`http://localhost:5001${response.data.url}`);
        toast.success('Profile image updated successfully!');
        fetchProfile();
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      } finally {
        setLoading(false);
      }
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
    { id: 'social', label: 'Social Links', icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-sm text-gray-600">Manage your account information and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              {/* Profile Summary */}
              <div className="p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center overflow-hidden border border-white/30">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer shadow-lg">
                      <Camera className="w-3 h-3 text-blue-600" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <h3 className="font-semibold text-base">{profileData.name || 'Your Name'}</h3>
                  <p className="text-blue-100 text-xs opacity-90">{profileData.email}</p>
                </div>
                
                {/* Completion Progress */}
                <div className="mt-4 relative">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-white/90">Profile Completion</span>
                    <span className="font-medium">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div 
                      className="bg-white rounded-full h-1.5 transition-all duration-500 shadow-sm"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="p-3 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 transition-colors ${
                      activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const activeTabData = tabs.find(tab => tab.id === activeTab);
                    return (
                      <>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <activeTabData.icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {activeTabData?.label}
                        </h2>
                      </>
                    );
                  })()}
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
                      >
                        <Save className="w-4 h-4" />
                        <span className="text-sm font-medium">{loading ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Cancel</span>
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
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Full Name *</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Enter your full name"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.name || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Username *</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.username}
                            onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Choose a username"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.username || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Date of Birth</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={profileData.date_of_birth}
                            onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">
                              {profileData.date_of_birth ? new Date(profileData.date_of_birth).toLocaleDateString() : 'Not provided'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/80 rounded-xl border border-blue-100">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-900 font-medium flex-1">{profileData.email}</span>
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500">Email cannot be changed for security reasons</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Bio</label>
                      {isEditing ? (
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100 min-h-[100px]">
                          <p className="text-gray-900 leading-relaxed">{profileData.bio || 'No bio provided'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Phone Number *</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={profileData.mobile_number}
                            onChange={(e) => setProfileData({...profileData, mobile_number: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Enter your phone number"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.mobile_number || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Address</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.address}
                            onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Enter your address"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.address || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">City</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.city}
                            onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Enter your city"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.city || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">State</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.state}
                            onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Enter your state"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.state || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">ZIP Code</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.zip_code}
                            onChange={(e) => setProfileData({...profileData, zip_code: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Enter your ZIP code"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.zip_code || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Country</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.country}
                            onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Enter your country"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.country || 'Not provided'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'professional' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Job Title</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.job_title}
                            onChange={(e) => setProfileData({...profileData, job_title: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Enter your job title"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.job_title || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Company</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.company}
                            onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Enter your company"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.company || 'Not provided'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'social' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">LinkedIn</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={profileData.social_links.linkedin}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              social_links: {...profileData.social_links, linkedin: e.target.value}
                            })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="https://linkedin.com/in/username"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.social_links.linkedin || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Twitter</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={profileData.social_links.twitter}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              social_links: {...profileData.social_links, twitter: e.target.value}
                            })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="https://twitter.com/username"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.social_links.twitter || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Facebook</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={profileData.social_links.facebook}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              social_links: {...profileData.social_links, facebook: e.target.value}
                            })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="https://facebook.com/username"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.social_links.facebook || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Website</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={profileData.social_links.website}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              social_links: {...profileData.social_links, website: e.target.value}
                            })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="https://yourwebsite.com"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{profileData.social_links.website || 'Not provided'}</span>
                          </div>
                        )}
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