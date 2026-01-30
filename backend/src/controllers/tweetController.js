import { Tweet, User } from '../models/index.js'; 

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