import { Tweet, User, Comment } from '../models/index.js'; 

export const getAllTweets = async (req, res) => {
  try {
    const tweets = await Tweet.findAll({
      // Ovo puca ako relacije nisu učitane ili ako User model nije dostupan
      include: [{ 
        model: User, 
        attributes: ['username', 'displayName'] 
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(tweets);
  } catch (error) {
    // Dodaj ovo da u terminalu vidiš TOČAN opis greške (npr. "User is not associated to Tweet")
    console.error("SERVER ERROR:", error); 
    res.status(500).json({ message: error.message });
  }
};

export const createTweet = async (req, res) => {
  try {
    const { content, image } = req.body;
    const newTweet = await Tweet.create({
      content,
      image,
      userId: req.user.id // Koristi malo 'u' - userId
    });
    res.status(201).json(newTweet);
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
          attributes: ['username', 'displayName', 'avatar'] 
        },
        {
          model: Comment,
          include: [{ 
            model: User, 
            attributes: ['username', 'displayName', 'avatar'] // Tko je napisao komentar
          }],
          // Poredaj komentare tako da najnoviji budu na vrhu
          separate: true, 
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!tweet) return res.status(404).json({ message: "Objava nije pronađena" });
    res.json(tweet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};