const db = require('../db');

class SocketUserManager {
  constructor() {
    this.users = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // 5 min
  }

  async add(userId, socketId, userType) {
    let userName = 'Unknown';
    try {
      const table = userType === 'lawyer' ? 'lawyers' : 'users';
      const user = await db(table).select('name').where('id', userId).first();
      if (user) userName = user.name;
    } catch (error) {
      console.error('Error fetching user:', error);
    }

    this.users.set(userId, {
      socketId,
      userType,
      userName,
      inCall: false,
      lastSeen: Date.now()
    });
  }

  get(userId) {
    return this.users.get(userId);
  }

  updateCallStatus(userId, inCall, partnerId = null, partnerName = null) {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, {
        ...user,
        inCall,
        callStartTime: inCall ? Date.now() : null,
        partnerId,
        partnerName,
        lastSeen: Date.now()
      });
    }
  }

  removeBySocketId(socketId) {
    for (let [userId, userInfo] of this.users.entries()) {
      if (userInfo.socketId === socketId) {
        this.users.delete(userId);
        return userId;
      }
    }
    return null;
  }

  getActiveCalls() {
    return Array.from(this.users.entries())
      .filter(([, user]) => user.inCall)
      .map(([userId, user]) => ({
        userId,
        userName: user.userName,
        userType: user.userType,
        callStartTime: user.callStartTime,
        partnerId: user.partnerId,
        partnerName: user.partnerName
      }));
  }

  cleanup() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 min
    for (let [userId, user] of this.users.entries()) {
      if (now - user.lastSeen > timeout) {
        this.users.delete(userId);
        console.log(`Cleaned up stale user: ${userId}`);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.users.clear();
  }
}

module.exports = new SocketUserManager();
