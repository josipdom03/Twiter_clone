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
    const [formData, setFormData] = useState({ username: '', bio: '', displayName: '', isPrivate: false });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedTweet, setSelectedTweet] = useState(null);

    const [userModal, setUserModal] = useState({
        isOpen: false,
        title: '',
        users: []
    });

    // Provjera je li ovo moj profil (ako nema username-a u URL-u ili ako je isti kao u authStore)
    const isMyProfile = !username || (authStore.user && authStore.user.username === username);
    const p = isMyProfile ? userStore.profile : userStore.publicProfile;

    // Provjera može li se vidjeti sadržaj (Tweets, liste pratitelja)
    const canSeeContent = isMyProfile || (p && (!p.isPrivate || p.isFollowing));

    useEffect(() => {
        const loadData = async () => {
            // Resetiramo javni profil pri promjeni kako ne bi vidjeli starog korisnika dok se novi učitava
            if (!isMyProfile) {
                runInAction(() => { userStore.publicProfile = null; });
            }

            if (isMyProfile) {
                await userStore.fetchProfile();
            } else if (username) {
                await userStore.fetchPublicProfile(username);
            }
        };
        loadData();
    }, [username, isMyProfile, authStore.isAuthenticated]);

    // Sinkronizacija forme za editiranje s podacima iz baze
    useEffect(() => {
        if (p) {
            setFormData({
                username: p.username || '',
                bio: p.bio || '',
                displayName: p.displayName || '',
                isPrivate: p.isPrivate || false 
            });
            setPreviewUrl(p.avatar);
        }
    }, [p]);

    const handleUpdate = async (e) => {
        if (e) e.preventDefault();
        try {
            const data = new FormData();
            data.append('username', formData.username);
            data.append('displayName', formData.displayName);
            data.append('bio', formData.bio);
            data.append('isPrivate', formData.isPrivate); 
            if (selectedFile) data.append('avatar', selectedFile);

            await userStore.updateProfile(data);
            setIsEditing(false);
            
            // Ako je korisnik promijenio username, navigiraj na novi URL
            if (formData.username !== username && username) {
                navigate(`/profile/${formData.username}`);
            }
        } catch (err) { 
            alert(err); 
        }
    };

    const handleLogout = () => {
        if (window.confirm("Želite li se odjaviti?")) {
            authStore.logout();
            navigate('/login');
        }
    };

    const openUserModal = (type) => {
        if (!p || !canSeeContent) return; 
        const list = type === 'following' ? p.Following : p.Followers;
        
        setUserModal({
            isOpen: true,
            title: type === 'following' ? 'Prati' : 'Pratitelji',
            users: list || []
        });
    };

    if (userStore.isLoading && !p) return <div className="loader">Učitavanje...</div>;
    if (!p && !userStore.isLoading) return <div className="error">Korisnik nije pronađen.</div>;

    return (
        <div className="profile-container">
            {selectedTweet && <TweetDetail tweet={selectedTweet} onClose={() => setSelectedTweet(null)} />}

            {/* Modal za listu pratitelja */}
            {userModal.isOpen && (
                <div className="modal-overlay" onClick={() => setUserModal({ ...userModal, isOpen: false })}>
                    <div className="users-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{userModal.title}</h3>
                            <button className="close-x-btn" onClick={() => setUserModal({ ...userModal, isOpen: false })}>✕</button>
                        </div>
                        <div className="modal-users-list">
                            {userModal.users.length > 0 ? userModal.users.map((userData, index) => (
                                <div key={userData.id || index} className="modal-user-item" onClick={() => {
                                    setUserModal({ ...userModal, isOpen: false });
                                    navigate(`/profile/${userData.username}`);
                                }}>
                                    <img src={userData.avatar || '/default-avatar.png'} alt="avatar" />
                                    <div className="modal-user-info">
                                        <span className="m-display">{userData.displayName || userData.username}</span>
                                        <span className="m-handle">@{userData.username}</span>
                                    </div>
                                </div>
                            )) : <p className="no-users-msg">Nema korisnika za prikaz.</p>}
                        </div>
                    </div>
                </div>
            )}

            <div className="profile-card">
                <div className="profile-banner"></div>
                <div className="profile-content">
                    <div className="profile-avatar-wrapper">
                        <img src={previewUrl || '/default-avatar.png'} alt="Avatar" className="profile-avatar" />
                        {isEditing && (
                            <label htmlFor="avatar-upload" className="avatar-edit-overlay">
                                <span>Promijeni</span>
                                <input id="avatar-upload" type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) { 
                                        setSelectedFile(file); 
                                        setPreviewUrl(URL.createObjectURL(file)); 
                                    }
                                }} style={{ display: 'none' }} />
                            </label>
                        )}
                    </div>
                    
                    <div className="profile-actions">
                        {isMyProfile ? (
                            !isEditing ? (
                                <div className="owner-actions">
                                    <button className="edit-btn" onClick={() => setIsEditing(true)}>Uredi profil</button>
                                    <button className="logout-btn-profile" onClick={handleLogout}>Odjavi se</button>
                                </div>
                            ) : (
                                <div className="edit-buttons-gap">
                                    <button className="cancel-btn" onClick={() => { setIsEditing(false); setPreviewUrl(p.avatar); }}>Odustani</button>
                                    <button className="save-btn" onClick={handleUpdate}>Spremi</button>
                                </div>
                            )
                        ) : authStore.isAuthenticated && (
                            <div className="action-buttons-wrapper">
                                <button className="message-btn-large" onClick={() => navigate(`/messages/${p.id}`)}>✉️</button>
                                
                                <button 
                                    className={`follow-btn ${p.isFollowing ? 'following' : p.followStatus === 'pending' ? 'pending' : 'follow-black'}`}
                                    onClick={() => {
                                        if (p.isFollowing) userStore.handleUnfollow(p.id);
                                        else if (p.followStatus !== 'pending') userStore.handleFollow(p.id);
                                    }}
                                >
                                    {p.isFollowing ? "Pratim" : p.followStatus === 'pending' ? "Zahtjev poslan" : "Prati"}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="profile-info">
                        {!isEditing ? (
                            <div className="view-mode">
                                <h2>
                                    {p.displayName || p.username} 
                                    {p.isPrivate && <span className="lock-icon"> 🔒</span>}
                                </h2>
                                <p className="handle">@{p.username}</p>
                                <p className="bio">{p.bio || "Nema biografije."}</p>
                                
                                <div className="profile-stats">
                                    <span className={canSeeContent ? "stat-link" : "stat-disabled"} onClick={() => openUserModal('following')}>
                                        <strong>{p.followingCount || 0}</strong> Prati
                                    </span>
                                    <span className={canSeeContent ? "stat-link" : "stat-disabled"} onClick={() => openUserModal('followers')}>
                                        <strong>{p.followersCount || 0}</strong> Pratitelja
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <form className="edit-form" onSubmit={handleUpdate}>
                                <div className="input-group">
                                    <label>Ime prikaza</label>
                                    <input type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} placeholder="DisplayName" />
                                </div>
                                <div className="input-group">
                                    <label>Biografija</label>
                                    <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Biografija" />
                                </div>
                                
                                <div className="privacy-toggle">
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.isPrivate} 
                                            onChange={e => setFormData({...formData, isPrivate: e.target.checked})} 
                                        />
                                        Privatan profil 🔒
                                    </label>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <div className="profile-tweets-section">
                    <h3 className="section-title">Objave</h3>
                    {canSeeContent ? (
                        <div className="tweets-list">
                            {p.Tweets?.length > 0 ? (
                                p.Tweets.map((t) => (
                                    <Tweet
                                        key={t.id}
                                        // Šaljemo tweet i "ubrizgavamo" User podatke iz objekta p
                                        // kako bi Tweet komponenta mogla prikazati ime i avatar
                                        tweet={{
                                            ...t,
                                            User: {
                                                id: p.id,
                                                username: p.username,
                                                displayName: p.displayName,
                                                avatar: p.avatar
                                            }
                                        }}
                                        onOpen={setSelectedTweet}
                                        // Ažuriramo profil nakon lajka ili retweeta
                                        onLikeUpdate={() => isMyProfile ? userStore.fetchProfile() : userStore.fetchPublicProfile(username)}
                                        onRetweetUpdate={() => isMyProfile ? userStore.fetchProfile() : userStore.fetchPublicProfile(username)}
                                    />
                                ))
                            ) : (
                                <p className="no-tweets">Korisnik još nema objava.</p>
                            )}
                        </div>
                    ) : (
                        <div className="private-account-message">
                            <div className="lock-circle">🔒</div>
                            <h4>Ovaj račun je privatan</h4>
                            <p>Zapratite korisnika kako biste vidjeli njegove objave i medijske sadržaje.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default Profile;