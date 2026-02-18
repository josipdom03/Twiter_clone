import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { faker } from '@faker-js/faker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User, Tweet, Comment, Follow } from '../models/index.js';

// Lista hashtagova za seedanje
const popularHashtags = [
    '#priroda', '#coding', '#javascript', '#react', '#travel', 
    '#food', '#sport', '#fitness', '#news', '#music'
];

export const seedDatabase = async () => {
    try {
        const existingUsers = await User.count();
        if (existingUsers > 0) {
            console.log("ℹ️ Baza već sadrži podatke, preskačem seedanje.");
            return;
        }

        console.log("--- Počinje seedanje baze podataka ---");

        // --------------------------------------------------------
        // 1. KREIRAJ KORISNIKE
        // --------------------------------------------------------
        const usersData = Array.from({ length: 100 }).map(() => ({
            username: faker.internet.userName().substring(0, 30),
            displayName: faker.person.fullName(),
            email: faker.internet.email(),
            password: 'password123',
            bio: faker.lorem.sentence(),
            avatar: faker.image.urlPicsumPhotos({ width: 200, height: 200 }),
            isVerified: faker.datatype.boolean(0.8),
        }));

        const users = await User.bulkCreate(usersData);
        console.log(`✅ Kreirano ${users.length} korisnika.`);

        // --------------------------------------------------------
        // 2. KREIRAJ TWEETOVE (S HASHTAGOVIMA)
        // --------------------------------------------------------
        const tweetsData = [];
        users.forEach(user => {
            const tweetCount = faker.number.int({ min: 2, max: 5 });
            for (let i = 0; i < tweetCount; i++) {
                let content = faker.lorem.sentence({ min: 5, max: 15 });

                // Šansa od 40% da tweet dobije hashtagove
                if (faker.datatype.boolean(0.4)) {
                    const selectedHashtags = faker.helpers.arrayElements(popularHashtags, { min: 1, max: 4 });
                    content += ` ${selectedHashtags.join(' ')}`;
                }

                tweetsData.push({
                    userId: user.id,
                    content: content.substring(0, 280),
                    image: faker.datatype.boolean(0.3)
                        ? faker.image.urlPicsumPhotos({ width: 600, height: 400 })
                        : null,
                });
            }
        });

        const tweets = await Tweet.bulkCreate(tweetsData);
        console.log(`✅ Kreirano ${tweets.length} tweetova s hashtagovima.`);

        // --------------------------------------------------------
        // 3. KREIRAJ FOLLOW ODNOS
        // --------------------------------------------------------
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

        // --------------------------------------------------------
        // 4. KREIRAJ KOMENTARE
        // --------------------------------------------------------
        const commentsData = [];
        tweets.forEach(tweet => {
            const commentCount = faker.number.int({ min: 1, max: 5 });
            for (let i = 0; i < commentCount; i++) {
                commentsData.push({
                    content: faker.lorem.sentence(),
                    tweetId: tweet.id,
                    userId: faker.helpers.arrayElement(users).id
                });
            }
        });

        const comments = await Comment.bulkCreate(commentsData);
        console.log(`💬 Kreirano ${comments.length} komentara.`);

        // --------------------------------------------------------
        // 5. KREIRAJ TWEET LAJKOVE
        // --------------------------------------------------------
        const tweetLikes = [];
        tweets.forEach(tweet => {
            const likeCount = faker.number.int({ min: 5, max: 20 });
            const likedUsers = faker.helpers.arrayElements(users, likeCount);

            likedUsers.forEach(user => {
                tweetLikes.push({
                    tweet_id: tweet.id,
                    user_id: user.id
                });
            });
        });

        await Tweet.sequelize.models.TweetLikes.bulkCreate(tweetLikes, {
            ignoreDuplicates: true
        });
        console.log(`❤️ Dodano ${tweetLikes.length} lajkova na tweetove.`);

        // --------------------------------------------------------
        // 6. KREIRAJ COMMENT LAJKOVE
        // --------------------------------------------------------
        const commentLikes = [];
        comments.forEach(comment => {
            const likeCount = faker.number.int({ min: 2, max: 10 });
            const likedUsers = faker.helpers.arrayElements(users, likeCount);

            likedUsers.forEach(user => {
                commentLikes.push({
                    comment_id: comment.id,
                    user_id: user.id
                });
            });
        });

        await Comment.sequelize.models.CommentLikes.bulkCreate(commentLikes, {
            ignoreDuplicates: true
        });
        console.log(`👍 Dodano ${commentLikes.length} lajkova na komentare.`);

        console.log("--- Seedanje završeno uspješno! ---");

    } catch (error) {
        console.error("❌ Greška pri seedanju:", error);
        throw error;
    }
};