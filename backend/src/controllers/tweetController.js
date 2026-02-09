import { Tweet, User, Comment } from '../models/index.js'; 

export const getAllTweets = async (req, res) => {
  try {
    const tweets = await Tweet.findAll({
      include: [
        { 
          model: User, 
          attributes: ['username', 'displayName', 'avatar'] 
        },
        // OVO JE DODANO: Uključujemo lajkove za svaki tweet
        {
          model: User,
          as: 'LikedByUsers',
          attributes: ['id'] // Treba nam samo ID da provjerimo isLiked na frontendu
        },
        // Dodajemo i komentare da bismo imali ispravan broj (lenght)
        {
          model: Comment,
          attributes: ['id']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tweets);
  } catch (error) {
    console.error("SERVER ERROR (getAllTweets):", error); 
    res.status(500).json({ message: error.message });
  }
};

export const createTweet = async (req, res) => {
  try {
    const { content, image } = req.body;
    const newTweet = await Tweet.create({
      content,
      image,
      userId: req.user.id 
    });
    
    // Vraćamo tweet s praznim nizovima da frontend ne puca odmah nakon objave
    res.status(201).json({
      ...newTweet.toJSON(),
      LikedByUsers: [],
      Comments: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTweetById = async (req, res) => {
  try {
    const { id } = req.params;
    const tweet = await Tweet.findByPk(id, {
      include: [
        { 
          model: User, 
          attributes: ['id', 'username', 'displayName', 'avatar'] 
        },
        {
          model: User,
          as: 'LikedByUsers',
          // OVDJE JE PROMJENA: Dodajemo username, displayName i avatar
          attributes: ['id', 'username', 'displayName', 'avatar'],
          through: { attributes: [] } // Ovo uklanja nepotrebne podatke iz vezne tablice
        },
        {
          model: Comment,
          include: [
            { 
              model: User, 
              attributes: ['id', 'username', 'displayName', 'avatar'] 
            },
            {
              model: User,
              as: 'LikedByUsers',
              // I ovdje dodajemo isto ako želiš tooltip na komentarima
              attributes: ['id', 'username', 'displayName', 'avatar'],
              through: { attributes: [] }
            }
          ],
          separate: true, 
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!tweet) return res.status(404).json({ message: "Objava nije pronađena" });
    res.json(tweet);
  } catch (error) {
    console.error("SERVER ERROR (getTweetById):", error);
    res.status(500).json({ message: error.message });
  }
};