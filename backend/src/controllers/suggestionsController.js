import { Op, literal } from 'sequelize';
import { User, Follow } from '../models/index.js'; // Provjeri putanju

export const getSuggestions = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Dohvati ljude koje korisnik već prati
        const currentUser = await User.findByPk(userId, {
            include: [{ model: User, as: 'Following', attributes: ['id'] }]
        });
        
        // Mapiramo ID-ove ili vraćamo praznu listu ako nikoga ne prati
        const followingIds = currentUser?.Following?.map(u => u.id) || [];
        const excludedIds = [...followingIds, userId];

        // 2. Pronađi prijedloge
        const suggestions = await User.findAll({
            where: {
                id: { [Op.notIn]: excludedIds },
                isPrivate: false 
            },
            attributes: [
                'id', 
                'username', 
                'displayName', 
                'avatar',
                // Ispravljen SQL upit prema tvojim asocijacijama:
                // Tablica: follows
                // Stupci: follower_id, following_id
                [
                    literal(`(
                        SELECT COUNT(*)
                        FROM follows AS f1
                        JOIN follows AS f2 ON f1.follower_id = f2.following_id
                        WHERE f1.following_id = User.id
                        AND f2.follower_id = ${userId}
                    )`), 
                    'mutualCount'
                ]
            ],
            order: [
                [literal('mutualCount'), 'DESC'], 
                [literal('RAND()'), 'ASC']
            ],
            limit: 21
        });

        res.json(suggestions);
    } catch (error) {
        console.error("Greška pri dohvaćanju prijedloga:", error);
        res.status(500).json({ message: 'Greška na serveru', error: error.message });
    }
};


export const getMentionSuggestions = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search) {
            return res.json([]);
        }

        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { username: { [Op.like]: `%${search}%` } },
                    { displayName: { [Op.like]: `%${search}%` } }
                ]
            },
            attributes: ['id', 'username', 'displayName', 'avatar'],
            limit: 5 // Ne želimo previše rezultata odjednom
        });

        res.json(users);
    } catch (error) {
        console.error("Greška pri dohvatu prijedloga:", error);
        res.status(500).json({ error: "Interna greška servera" });
    }
};