import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { runInAction } from 'mobx';
import { authStore } from '../stores/AuthStore';
import { userStore } from '../stores/UserStore.jsx';
import '../styles/profile.css';

const Profile = observer(() => {
    const { username } = useParams();
    const navigate = useNavigate();
    
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: '', bio: '', displayName: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Provjera: jesi li to ti? (Ako nema username u URL-u ili ako se podudara s ulogiranim)
    const isMyProfile = !username || (authStore.user && authStore.user.username === username);

    useEffect(() => {
        const loadProfile = async () => {
            runInAction(() => {
                userStore.publicProfile = null;
            });

            if (isMyProfile) {
                // Čekaj da se uvjerimo da smo ulogirani prije nego zovemo privatni profil
                if (authStore.isAuthenticated) {
                    await userStore.fetchProfile();
                }
            } else if (username) {
                await userStore.fetchPublicProfile(username);
            }
        };

    loadProfile();
    }, [username, isMyProfile, authStore.isAuthenticated]);

    // Sinkronizacija forme
    useEffect(() => {
        const p = isMyProfile ? userStore.profile : userStore.publicProfile;
        if (p) {
            setFormData({
                username: p.username || '',
                bio: p.bio || '',
                displayName: p.displayName || ''
            });
            setPreviewUrl(p.avatar);
        }
    }, [userStore.profile, userStore.publicProfile, isMyProfile]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('username', formData.username);
            data.append('displayName', formData.displayName);
            data.append('bio', formData.bio);
            if (selectedFile) data.append('avatar', selectedFile);

            await userStore.updateProfile(data);
            setIsEditing(false);
            if (formData.username !== username) {
                navigate(`/profile/${formData.username}`);
            }
        } catch (err) {
            alert(err);
        }
    };

    if (userStore.isLoading) return <div className="loader">Učitavanje...</div>;

    const p = isMyProfile ? userStore.profile : userStore.publicProfile;

    if (!p && !userStore.isLoading) return <div className="error">Korisnik nije pronađen.</div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-banner"></div>
                <div className="profile-content">
                    <div className="profile-avatar-wrapper">
                        {previewUrl ? <img src={previewUrl} alt="Avatar" className="profile-avatar" /> : <div className="avatar-placeholder"></div>}
                    </div>
                    
                    <div className="profile-actions">
                        {isMyProfile ? (
                            !isEditing ? (
                                <button className="edit-btn" onClick={() => setIsEditing(true)}>Uredi profil</button>
                            ) : (
                                <div className="edit-buttons-gap">
                                    <button className="cancel-btn" onClick={() => setIsEditing(false)}>Odustani</button>
                                    <button className="save-btn" onClick={handleUpdate}>Spremi</button>
                                </div>
                            )
                        ) : (
                            authStore.isAuthenticated && <button className="follow-btn">Prati</button>
                        )}
                    </div>

                    <div className="profile-info">
                        {!isEditing ? (
                            <div className="view-mode">
                                <h2>{p?.displayName || p?.username}</h2>
                                <p className="handle">@{p?.username}</p>
                                <p className="bio">{p?.bio || "Nema biografije."}</p>
                            </div>
                        ) : (
                            <form className="edit-form">
                                <input type="file" onChange={handleFileChange} />
                                <input type="text" value={formData.displayName} placeholder="Ime" onChange={e => setFormData({...formData, displayName: e.target.value})} />
                                <input type="text" value={formData.username} placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} />
                                <textarea value={formData.bio} placeholder="Bio" onChange={e => setFormData({...formData, bio: e.target.value})} />
                            </form>
                        )}
                        {isMyProfile && <button className="logout-link" onClick={() => authStore.logout()}>Odjavi se</button>}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Profile;