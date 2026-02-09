import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { runInAction } from 'mobx';
import { authStore } from '../stores/AuthStore';
import { userStore } from '../stores/UserStore.jsx';
import { Tweet } from '../components/layout/Tweet.jsx';
import TweetDetail from './TweetDetail';
import '../styles/profile.css';

const Profile = observer(() => {
    const { username } = useParams();
    const navigate = useNavigate();
    
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: '', bio: '', displayName: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedTweet, setSelectedTweet] = useState(null);

    const isMyProfile = !username || (authStore.user && authStore.user.username === username);

    useEffect(() => {
        const loadProfile = async () => {
            runInAction(() => { userStore.publicProfile = null; });
            if (isMyProfile) {
                if (authStore.isAuthenticated) await userStore.fetchProfile();
            } else if (username) {
                await userStore.fetchPublicProfile(username);
            }
        };
        loadProfile();
    }, [username, isMyProfile, authStore.isAuthenticated]);

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
        if (e) e.preventDefault();
        try {
            const data = new FormData();
            data.append('username', formData.username);
            data.append('displayName', formData.displayName);
            data.append('bio', formData.bio);
            if (selectedFile) data.append('avatar', selectedFile);

            await userStore.updateProfile(data);
            setIsEditing(false);
            setSelectedFile(null);

            if (formData.username !== username && username) {
                navigate(`/profile/${formData.username}`);
            }
        } catch (err) { 
            alert("Greška pri ažuriranju: " + err); 
        }
    };

    if (userStore.isLoading) return <div className="loader">Učitavanje...</div>;
    
    const p = isMyProfile ? userStore.profile : userStore.publicProfile;
    if (!p && !userStore.isLoading) return <div className="error">Korisnik nije pronađen.</div>;

    return (
        <div className="profile-container">
            {selectedTweet && (
                <TweetDetail 
                    tweet={selectedTweet} 
                    onClose={() => setSelectedTweet(null)} 
                />
            )}

            <div className="profile-card">
                <div className="profile-banner"></div>
                <div className="profile-content">
                    <div className="profile-avatar-wrapper">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Avatar" className="profile-avatar" />
                        ) : (
                            <div className="avatar-placeholder"></div>
                        )}
                        {isEditing && (
                            <label htmlFor="avatar-upload" className="avatar-edit-overlay">
                                <span>Promijeni</span>
                                <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            </label>
                        )}
                    </div>
                    
                    <div className="profile-actions">
                        {isMyProfile ? (
                            !isEditing ? (
                                <button className="edit-btn" onClick={() => setIsEditing(true)}>Uredi profil</button>
                            ) : (
                                <div className="edit-buttons-gap">
                                    <button className="cancel-btn" onClick={() => { setIsEditing(false); setPreviewUrl(p.avatar); }}>Odustani</button>
                                    <button className="save-btn" onClick={handleUpdate}>Spremi</button>
                                </div>
                            )
                        ) : (
                            authStore.isAuthenticated && (
                                <div className="action-buttons-wrapper">
                                    <button className="message-btn-large" onClick={() => navigate(`/messages/${p.id}`)}>
                                        <span className="msg-icon">✉️ Pošalji poruku</span>
                                    </button>
                                    
                                    {/* DINAMIČNI FOLLOW GUMB */}
                                    {p.isFollowing ? (
                                        <button 
                                            className="follow-btn following" 
                                            onClick={() => userStore.handleUnfollow(p.id)}
                                        >
                                            <span className="text-following">Pratim</span>
                                            <span className="text-unfollow">Otprati</span>
                                        </button>
                                    ) : (
                                        <button 
                                            className="follow-btn follow-black" 
                                            onClick={() => userStore.handleFollow(p.id)}
                                        >
                                            Prati
                                        </button>
                                    )}
                                </div>
                            )
                        )}
                    </div>

                    <div className="profile-info">
                        {!isEditing ? (
                            <div className="view-mode">
                                <h2>{p?.displayName || p?.username}</h2>
                                <p className="handle">@{p?.username}</p>
                                <p className="bio">{p?.bio || "Nema biografije."}</p>
                                
                                {/* STATISTIKA PRATITELJA */}
                                <div className="profile-stats">
                                    <span><strong>{p.followingCount || 0}</strong> Prati</span>
                                    <span><strong>{p.followersCount || 0}</strong> Pratitelja</span>
                                </div>
                            </div>
                        ) : (
                            <form className="edit-form" onSubmit={handleUpdate}>
                                <div className="input-group">
                                    <label>Ime prikaza</label>
                                    <input type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label>Biografija</label>
                                    <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                                </div>
                            </form>
                        )}
                        {isMyProfile && !isEditing && (
                            <button className="logout-link" onClick={() => authStore.logout()}>Odjavi se</button>
                        )}
                    </div>
                </div>

                <div className="profile-tweets-section">
                    <h3 className="section-title">Objave</h3>
                    {p.Tweets && p.Tweets.length > 0 ? (
                        <div className="tweets-list">
                            {p.Tweets.map((tweet) => (
                                <Tweet 
                                    key={tweet.id}
                                    tweet={{...tweet, User: p}} 
                                    onOpen={setSelectedTweet}
                                    onLikeUpdate={() => isMyProfile ? userStore.fetchProfile() : userStore.fetchPublicProfile(p.username)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="no-tweets-msg">Korisnik još nema objavljenih tweetova.</p>
                    )}
                </div>
            </div>
        </div>
    );
});

export default Profile;