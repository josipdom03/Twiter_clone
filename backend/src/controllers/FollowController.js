import { User, Notification, FollowRequest } from '../models/index.js';

/**
 * 1. Slanje zahtjeva ili automatsko praćenje
 */
export const followUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.id;

        if (followerId == followingId) {
            return res.status(400).json({ message: 'Ne možete pratiti sami sebe' });
        }

        const targetUser = await User.findByPk(followingId);
        if (!targetUser) return res.status(404).json({ message: 'Korisnik nije pronađen' });

        // Ako je profil privatan, kreiraj zahtjev
        if (targetUser.isPrivate) {
            const [request, created] = await FollowRequest.findOrCreate({
                where: { 
                    senderId: followerId, 
                    recipientId: followingId, // Usklađeno s respondToRequest
                    status: 'pending' 
                }
            });

            if (!created) return res.status(400).json({ message: 'Zahtjev je već poslan' });

            await Notification.create({
                recipientId: followingId,
                senderId: followerId,
                type: 'follow_request',
                content: 'vam je poslao zahtjev za praćenje.'
            });

            return res.json({ message: 'Zahtjev za praćenje poslan', status: 'pending' });
        }

        // Ako je javan profil, odmah dodaj u Follows
        const currentUser = await User.findByPk(followerId);
        await currentUser.addFollowing(targetUser);

        const followersCount = await targetUser.countFollowers();
        
        if (req.io) req.io.emit('update_followers', { userId: followingId, followersCount });

        res.json({ message: 'Uspješno zapraćeno', status: 'following', followersCount });
    } catch (error) {
        res.status(500).json({ message: 'Greška pri praćenju', error: error.message });
    }
};

/**
 * 2. Odgovor na zahtjev (Prihvati/Odbij)
 */
export const respondToRequest = async (req, res) => {
    try {
        const { requestId, action } = req.body;
        const recipientId = req.user.id;

        const request = await FollowRequest.findOne({ 
            where: { id: requestId, recipientId } 
        });

        if (!request) return res.status(404).json({ message: 'Zahtjev nije pronađen' });

        if (action === 'accept') {
            const user = await User.findByPk(recipientId);
            const sender = await User.findByPk(request.senderId);

            // Dodajemo vezu u pivot tablicu
            await user.addFollowers(sender);
            await request.destroy(); 

            return res.json({ message: 'Zahtjev prihvaćen' });
        }

        await request.destroy();
        res.json({ message: 'Zahtjev odbijen' });
    } catch (error) {
        res.status(500).json({ message: 'Greška', error: error.message });
    }
};

/**
 * 3. Otpraćivanje (Unfollow)
 */
export const unfollowUser = async (req, res) => {
    try {
        const currentUser = await User.findByPk(req.user.id);
        const targetUser = await User.findByPk(req.params.id);

        if (!targetUser) return res.status(404).json({ message: 'Korisnik nije pronađen' });

        await currentUser.removeFollowing(targetUser);
        const followersCount = await targetUser.countFollowers();

        if (req.io) req.io.emit('update_followers', { userId: targetUser.id, followersCount });

        res.json({ message: 'Uspješno otpraćeno', followersCount });
    } catch (error) {
        res.status(500).json({ message: 'Greška', error: error.message });
    }
};

/**
 * 4. Dohvaćanje listi (Followers/Following)
 */
export const getFollowLists = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [
                { as: 'Followers', model: User, attributes: ['id', 'username', 'displayName', 'avatar'] },
                { as: 'Following', model: User, attributes: ['id', 'username', 'displayName', 'avatar'] }
            ]
        });
        res.json({ followers: user.Followers, following: user.Following });
    } catch (error) {
        res.status(500).json({ message: 'Greška pri dohvaćanju listi' });
    }
};

/**
 * 5. Dohvaćanje zahtjeva za praćenje (POPRAVLJENO)
 */
export const getPendingRequests = async (req, res) => {
    try {
        // Koristimo FollowRequest model, a ne Follow
        const requests = await FollowRequest.findAll({
            where: { 
                recipientId: req.user.id, // Provjeravamo tko je primio zahtjev
                status: 'pending' 
            },
            include: [{ 
                model: User, 
                as: 'Sender', // Mora se podudarati s asocijacijom u models/index.js
                attributes: ['id', 'username', 'displayName', 'avatar'] 
            }]
        });
        res.json(requests);
    } catch (error) {
        console.error("Greška u getPendingRequests:", error);
        res.status(500).json({ message: "Greška pri dohvaćanju zahtjeva", error: error.message });
    }
};