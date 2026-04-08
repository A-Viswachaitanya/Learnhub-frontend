import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/Contexts';
import { Button, Input, Card } from '../components/UI';

const UserProfile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: '', bio: '', email: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) setFormData({ name: user.name, bio: user.bio || '', email: user.email });
  }, [user]);

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      <Card className="profile-card">
        <div className="profile-header">
          <div className="profile-info">
            <div className="profile-avatar">
              {user.name[0]}
            </div>
            <div>
              <h1 className="profile-name">{user.name}</h1>
              <p className="profile-role">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setIsEditing(!isEditing)}>{isEditing ? 'Cancel' : 'Edit Profile'}</Button>
        </div>

        <div className="profile-form">
          <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={!isEditing} />
          <Input label="Email Address" value={formData.email} onChange={() => {}} disabled={true} /> 
          <Input multiline label="Bio" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} disabled={!isEditing} placeholder="Tell us about yourself..." />
          
          {isEditing && (
            <div className="profile-save-row">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;