import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { faker } from '@faker-js/faker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User, Tweet, Comment, Follow } from '../models/index.js';

export const seedDatabase = async () => {
  try {
    // PROVJERA: Ako već imamo korisnike, ne seedaj ponovo
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log("ℹ️ Baza već sadrži podatke, preskačem seedanje.");
      return;
    }

    console.log("--- Počinje seedanje baze podataka ---");

    // 1. KREIRAJ KORISNIKE
    const usersData = Array.from({ length: 100 }).map(() => ({
      username: faker.internet.userName().substring(0, 30),
      displayName: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'password123', 
      bio: faker.lorem.sentence(),
      avatar: faker.image.avatar(),
      isVerified: faker.datatype.boolean(0.8),
    }));
    
    const users = await User.bulkCreate(usersData);
    console.log(`✅ Kreirano ${users.length} korisnika.`);

    // 2. KREIRAJ TWEETOVE
    const tweetsData = [];
    users.forEach(user => {
      const tweetCount = faker.number.int({ min: 2, max: 5 });
      for (let i = 0; i < tweetCount; i++) {
        tweetsData.push({
          userId: user.id,
          content: faker.lorem.sentence({ min: 5, max: 15 }).substring(0, 280),
          image: faker.datatype.boolean(0.3) ? faker.image.url() : null,
        });
      }
    });
    const tweets = await Tweet.bulkCreate(tweetsData);
    console.log(`✅ Kreirano ${tweets.length} tweetova.`);

    // 3. KREIRAJ FOLLOWERE
    const followsData = [];
    users.forEach(user => {
      const toFollow = faker.helpers.arrayElements(
        users.filter(u => u.id !== user.id), 
        { min: 3, max: 8 }
      );
      toFollow.forEach(target => {
        followsData.push({
          follower_id: user.id,
          following_id: target.id,
          notify: faker.datatype.boolean(0.1)
        });
      });
    });
    await Follow.bulkCreate(followsData, { ignoreDuplicates: true });
    console.log("✅ Kreirani follow odnosi.");

    // 4. KREIRAJ KOMENTARE
    const commentsData = [];
    tweets.slice(0, 50).forEach(tweet => {
      const commentCount = faker.number.int({ min: 1, max: 3 });
      for (let i = 0; i < commentCount; i++) {
        commentsData.push({
          content: faker.lorem.sentence(),
          tweetId: tweet.id,
          userId: faker.helpers.arrayElement(users).id
        });
      }
    });
    await Comment.bulkCreate(commentsData);
    console.log("--- Seedanje završeno uspješno! ---");
    
    // OVDJE VIŠE NEMA process.exit(0)
  } catch (error) {
    console.error("❌ Greška pri seedanju:", error);
    // Ne gasimo proces, samo dopuštamo inicijalizaciji da javi grešku
    throw error; 
  }
};