const Notification = require('../../domains/notifications/notification.model');

class NotificationWorkflowService {
  constructor() {
    this.io = null;
  }

  // To be called from server.js when socket.io is initialized
  setSocketIo(io) {
    this.io = io;
  }

  async sendNotification(data) {
    const { recipient, sender, type, title, message, link } = data;

    // 1. Save to database
    const notification = new Notification({
      recipient,
      sender,
      type,
      title,
      message,
      link
    });
    await notification.save();

    // 2. Emit via Socket.io if available
    if (this.io) {
      // Users join a room with 'user_userId' format
      const roomName = `user_${recipient.toString()}`;
      this.io.to(roomName).emit('new_notification', notification);
      
      // Also emit an event to trigger dashboard refresh
      this.io.to(roomName).emit('dashboard_update', {
        type: 'NOTIFICATION_RECEIVED',
        notification
      });
    }

    return notification;
  }

  async markAsRead(notificationId) {
    return await Notification.findByIdAndUpdate(
      notificationId, 
      { isRead: true, readAt: new Date() }, 
      { new: true }
    );
  }

  async broadcastToRole(role, data) {
    const User = require('../../domains/users/user.model');
    const users = await User.find({ role, status: 'ACTIVE' }).select('_id');
    
    const notifications = [];
    for (const user of users) {
      notifications.push(await this.sendNotification({
        ...data,
        recipient: user._id
      }));
    }
    return notifications;
  }
}

module.exports = new NotificationWorkflowService();
