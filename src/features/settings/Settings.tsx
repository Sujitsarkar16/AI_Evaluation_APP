import React, { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { User, ExternalLink, Upload, Eye, EyeOff, Save, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Settings = () => {
  const { toast } = useToast();
  
  // User data state
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    first_name: '',
    last_name: '',
    role: '',
    profile: {
      avatar: '',
      bio: '',
      phone: ''
    }
  });

  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    phone: ''
  });

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    assignments: true,
    evaluations: true,
    system: true
  });

  // Evaluation type state
  const [selectedEvaluationType, setSelectedEvaluationType] = useState('rubric');

  // Load user data and settings on component mount
  useEffect(() => {
    loadUserData();
    loadNotificationSettings();
    loadEvaluationType();
  }, []);

  const loadUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserData(user);
        setProfileForm({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          bio: user.profile?.bio || '',
          phone: user.profile?.phone || ''
        });
        if (user.profile?.avatar) {
          setPhotoPreview(user.profile.avatar);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadNotificationSettings = () => {
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  };

  const loadEvaluationType = () => {
    const savedEvaluationType = localStorage.getItem('defaultEvaluationType');
    if (savedEvaluationType) {
      setSelectedEvaluationType(savedEvaluationType);
    }
  };

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle notification changes
  const handleNotificationChange = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('notificationSettings', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a photo smaller than 5MB"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file"
        });
        return;
      }

      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Upload photo
  const uploadPhoto = async () => {
    if (!selectedPhoto) return null;

    const formData = new FormData();
    formData.append('photo', selectedPhoto);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.avatar_url;
      }
    } catch (error) {
      console.error('Photo upload error:', error);
    }
    return null;
  };

  // Save profile
  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    // Debugging logs
    console.log('🔄 Starting profile save...');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      const token = localStorage.getItem('authToken');
      console.log('Token available:', !!token);
      
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to update your profile"
        });
        setIsLoading(false);
        return;
      }
      
      // Upload photo if selected
      let avatarUrl = userData.profile?.avatar;
      if (selectedPhoto) {
        console.log('📸 Uploading photo...');
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
          console.log('📸 Photo uploaded:', uploadedUrl);
        }
      }

      const updateData = {
        profile: {
          ...userData.profile,
          bio: profileForm.bio,
          phone: profileForm.phone,
          avatar: avatarUrl
        },
        first_name: profileForm.first_name,
        last_name: profileForm.last_name
      };

      console.log('📤 Sending update data:', updateData);

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        // Update localStorage with new user data
        const updatedUser = { 
          ...userData, 
          ...updateData,
          profile: { ...userData.profile, ...updateData.profile }
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserData(updatedUser);
        setSelectedPhoto(null);

        console.log('✅ Profile updated successfully');
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please check the console for details."
      });
    }
    setIsLoading(false);
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match"
      });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long"
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });

      const data = await response.json();

      if (data.success) {
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        setShowPasswordForm(false);

        toast({
          title: "Password changed",
          description: "Your password has been changed successfully",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Password change failed",
        description: error.message || "Failed to change password"
      });
    }
    setIsLoading(false);
  };

  // Handle evaluation type change
  const handleEvaluationTypeChange = (e) => {
    const newType = e.target.value;
    setSelectedEvaluationType(newType);
    localStorage.setItem('defaultEvaluationType', newType);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Settings</h2>
      
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Profile Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Profile Settings</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center mb-6">
              <div className="relative mb-4 sm:mb-0 sm:mr-6">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-blue-600" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h4 className="text-xl font-medium text-gray-800">
                  {profileForm.first_name} {profileForm.last_name}
                </h4>
                <p className="text-gray-600 capitalize">{userData.role}</p>
                <p className="text-sm text-gray-500">{userData.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input 
                  type="text" 
                  name="first_name"
                  value={profileForm.first_name}
                  onChange={handleProfileChange}
                  className="w-full" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input 
                  type="text" 
                  name="last_name"
                  value={profileForm.last_name}
                  onChange={handleProfileChange}
                  className="w-full" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input 
                  type="email" 
                  value={userData.email}
                  disabled
                  className="w-full bg-gray-100" 
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input 
                  type="tel" 
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  placeholder="Your phone number"
                  className="w-full" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea 
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                />
              </div>
            </div>

            <div className="mt-6">
              <Button 
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Security Settings</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="mb-6">
              {!showPasswordForm ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full sm:w-auto"
                >
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Change Password</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        name="current_password"
                        value={passwordForm.current_password}
                        onChange={handlePasswordChange}
                        className="w-full pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        name="new_password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        className="w-full pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        name="confirm_password"
                        value={passwordForm.confirm_password}
                        onChange={handlePasswordChange}
                        className="w-full pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({
                          current_password: '',
                          new_password: '',
                          confirm_password: ''
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="py-4 flex justify-between items-center border-t">
              <div>
                <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
                <input type="checkbox" id="tfa-toggle" className="sr-only" />
                <span className="absolute inset-0 rounded-full transition duration-200 ease-in-out"></span>
                <span className="absolute inset-y-0 left-0 w-6 h-6 bg-white rounded-full shadow transform transition duration-200 ease-in-out"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Notification Settings</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="divide-y">
              {Object.entries({
                email: { title: 'Email Notifications', desc: 'Receive email updates about your courses' },
                sms: { title: 'SMS Notifications', desc: 'Receive text messages for urgent updates' },
                assignments: { title: 'Assignment Reminders', desc: 'Get notified about upcoming due dates' },
                evaluations: { title: 'Evaluation Updates', desc: 'Notifications when evaluations are complete' },
                system: { title: 'System Notifications', desc: 'Important system updates and maintenance' }
              }).map(([key, { title, desc }]) => (
                <div key={key} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{title}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                  <div 
                    className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${
                      notifications[key] ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    onClick={() => handleNotificationChange(key)}
                  >
                    <span className={`absolute inset-y-0 w-6 h-6 bg-white rounded-full shadow transform transition duration-200 ease-in-out ${
                      notifications[key] ? 'translate-x-6' : 'translate-x-0'
                    }`}></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Evaluation Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Evaluation Settings</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Evaluation Type
              </label>
              <select 
                value={selectedEvaluationType}
                onChange={handleEvaluationTypeChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-white"
                disabled
              >
                <option value="rubric">Rubric Based Evaluation</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Only rubric-based evaluation is available. This provides structured assessment with clear scoring criteria.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Current Evaluation Method: Rubric Based Evaluation</h4>
              <p className="text-sm text-blue-700 mb-3">
                Evaluates based on predefined rubrics with detailed criteria including accuracy, completeness, clarity, and depth of knowledge. Provides comprehensive assessment with clear scoring levels and detailed feedback.
              </p>
              <Link 
                to="/dashboard/evaluations" 
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Go to Evaluations Page
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 