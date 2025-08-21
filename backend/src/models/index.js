// [EDIT] - 2024-01-15 - Created models index with relationships - Ediens Team
const User = require('./User');
const FoodPost = require('./FoodPost');
const Claim = require('./Claim');
const Message = require('./Message');

// User - FoodPost relationships
User.hasMany(FoodPost, { 
  foreignKey: 'userId', 
  as: 'foodPosts',
  onDelete: 'CASCADE'
});
FoodPost.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user'
});

// User - Claim relationships (as claimer)
User.hasMany(Claim, { 
  foreignKey: 'claimerId', 
  as: 'claims',
  onDelete: 'CASCADE'
});
Claim.belongsTo(User, { 
  foreignKey: 'claimerId', 
  as: 'claimer'
});

// FoodPost - Claim relationships
FoodPost.hasMany(Claim, { 
  foreignKey: 'foodPostId', 
  as: 'claims',
  onDelete: 'CASCADE'
});
Claim.belongsTo(FoodPost, { 
  foreignKey: 'foodPostId', 
  as: 'foodPost'
});

// User - Message relationships (as sender)
User.hasMany(Message, { 
  foreignKey: 'senderId', 
  as: 'sentMessages',
  onDelete: 'CASCADE'
});
Message.belongsTo(User, { 
  foreignKey: 'senderId', 
  as: 'sender'
});

// User - Message relationships (as receiver)
User.hasMany(Message, { 
  foreignKey: 'receiverId', 
  as: 'receivedMessages',
  onDelete: 'CASCADE'
});
Message.belongsTo(User, { 
  foreignKey: 'receiverId', 
  as: 'receiver'
});

// Message - Message relationships (replies)
Message.hasMany(Message, { 
  foreignKey: 'replyToId', 
  as: 'replies',
  onDelete: 'SET NULL'
});
Message.belongsTo(Message, { 
  foreignKey: 'replyToId', 
  as: 'replyTo'
});

// User - User relationships (followers/following for future social features)
User.belongsToMany(User, {
  through: 'user_followers',
  as: 'followers',
  foreignKey: 'followingId',
  otherKey: 'followerId'
});

User.belongsToMany(User, {
  through: 'user_followers',
  as: 'following',
  foreignKey: 'followerId',
  otherKey: 'followingId'
});

// User - FoodPost relationships (favorites for future features)
User.belongsToMany(FoodPost, {
  through: 'user_favorites',
  as: 'favoritePosts',
  foreignKey: 'userId',
  otherKey: 'foodPostId'
});

FoodPost.belongsToMany(User, {
  through: 'user_favorites',
  as: 'favoritedBy',
  foreignKey: 'foodPostId',
  otherKey: 'userId'
});

// User - User relationships (blocked users for moderation)
User.belongsToMany(User, {
  through: 'user_blocks',
  as: 'blockedUsers',
  foreignKey: 'blockerId',
  otherKey: 'blockedId'
});

User.belongsToMany(User, {
  through: 'user_blocks',
  as: 'blockedBy',
  foreignKey: 'blockedId',
  otherKey: 'blockerId'
});

module.exports = {
  User,
  FoodPost,
  Claim,
  Message
};