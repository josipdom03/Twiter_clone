import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import { userStore } from '../stores/UserStore.jsx'; 
import '../styles/profile.css';

const Profile = observer(() => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: '', bio: '' });
    const [selectedFile, setSelectedFile] = useState(null); // Za datoteku
    const [previewUrl, setPreviewUrl] = useState(null);    // Za prikaz prije spremanja

    useEffect(() => {
        userStore.fetchProfile();
    }, []);

    useEffect(() => {
        if (userStore.profile) {
            setFormData({
                username: userStore.profile.username || '',
                bio: userStore.profile.bio || ''
            });
            setPreviewUrl(userStore.profile.avatar);
        }
    }, [userStore.profile]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Instantni prikaz slike
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // Kreiramo FormData jer šaljemo datoteku
            const data = new FormData();
            data.append('username', formData.username);
            data.append('bio', formData.bio);
            if (selectedFile) {
                data.append('avatar', selectedFile);
            }

            await userStore.updateProfile(data); // UserStore mora primati FormData
            setIsEditing(false);
        } catch (err) {
            alert(err);
        }
    };

    if (userStore.isLoading && !userStore.profile) return <div className="loader">Učitavanje...</div>;

    const p = userStore.profile;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-banner"></div>
                <div className="profile-content">
                    <div className="profile-avatar-wrapper">
                        <img src={previewUrl} alt="Avatar" className="profile-avatar" />
                    </div>
                    
                    <div className="profile-actions">
                        {!isEditing ? (
                            <button className="edit-btn" onClick={() => setIsEditing(true)}>Uredi profil</button>
                        ) : (
                            <div className="edit-buttons-gap">
                                <button className="cancel-btn" onClick={() => setIsEditing(false)}>Odustani</button>
                                <button className="save-btn" onClick={handleUpdate}>Spremi</button>
                            </div>
                        )}
                    </div>

                    <div className="profile-info">
                        {!isEditing ? (
                            <div className="view-mode">
                                <h2>{p?.username}</h2>
                                <p className="handle">@{p?.username?.toLowerCase()}</p>
                                <p className="bio">{p?.bio || "Nema biografije."}</p>
                            </div>
                        ) : (
                            <form className="edit-form">
                                <div className="input-group">
                                    <label>Promijeni profilnu sliku</label>
                                    <input type="file" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <div className="input-group">
                                    <label>Korisničko ime</label>
                                    <input 
                                        type="text" 
                                        value={formData.username} 
                                        onChange={e => setFormData({...formData, username: e.target.value})} 
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Biografija</label>
                                    <textarea 
                                        value={formData.bio} 
                                        onChange={e => setFormData({...formData, bio: e.target.value})} 
                                    />
                                </div>
                            </form>
                        )}
                        <button className="logout-link" onClick={() => authStore.logout()}>Odjavi se</button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Profile;