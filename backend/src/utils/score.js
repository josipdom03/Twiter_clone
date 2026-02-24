export const calculateTweetScore = (tweet) => {
    const likes = tweet.LikedByUsers?.length || 0;
    const retweets = tweet.retweetCount || 0;
    const comments = tweet.Comments?.length || 0;
    
    // Vrijeme u satima od objave
    const hoursSinceCreated = (Date.now() - new Date(tweet.createdAt).getTime()) / (1000 * 60 * 60);
    
    // Osnovni score (ponderi po želji)
    const baseScore = (likes * 2) + (retweets * 3) + (comments * 1);
    
    // Gravity (vremenom score opada kako bi novi tweetovi izbili na vrh)
    const gravity = 1.8;
    return baseScore / Math.pow(hoursSinceCreated + 2, gravity);
};