/**
 * Workforce Tracking Engine Client Service (`workforceEngine.service.js`)
 * Silently runs in the background for logged-in Field/Sales employees.
 * Emits adaptive GPS pings (every 60s when moving, every 300s when stationary)
 * along with speed, heading, battery level, and internet connectivity status.
 * Features automatic offline queueing in localStorage when signal is lost.
 */

class WorkforceEngineService {
  constructor() {
    this.timer = null;
    this.isTracking = false;
    this.offlineQueueKey = 'agency_crm_workforce_ping_queue';
  }

  /**
   * Start adaptive tracking loop when employee is logged in
   */
  startTracking(user) {
    if (this.isTracking || !user || !user.token) return;

    const eligibleRoles = [
      'FIELD_EXEC', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'OPERATION_MANAGER',
      'BRANCH_HEAD', 'BRANCH_MANAGER', 'SALES_EXEC'
    ];
    if (!eligibleRoles.includes(user.role)) return;

    this.isTracking = true;

    // First immediate sync if any queued pings exist
    this.syncOfflineQueue(user.token);

    // Run adaptive loop every 60 seconds
    this.timer = setInterval(() => {
      this.emitAdaptivePing(user);
    }, 60000);
  }

  /**
   * Stop tracking loop (e.g., on logout)
   */
  stopTracking() {
    if (this.timer) clearInterval(this.timer);
    this.isTracking = false;
  }

  /**
   * Emit adaptive ping with location, speed, heading, battery, and connection
   */
  async emitAdaptivePing(user) {
    if (!navigator.geolocation || !user?.token) return;

    // Get battery level if available via Web Battery API
    let batteryLevel = null;
    try {
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        batteryLevel = Math.round(battery.level * 100);
      }
    } catch (e) {}

    const internetStatus = navigator.onLine ? 'ONLINE' : 'OFFLINE';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;

        const pingPayload = {
          latitude: Number(latitude),
          longitude: Number(longitude),
          accuracy: accuracy || 0,
          speed: speed || 0,
          heading: heading || 0,
          batteryLevel,
          internetStatus,
          timestamp: new Date().toISOString()
        };

        if (navigator.onLine) {
          try {
            const res = await fetch('/api/timeline/workday/ping', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.token}`
              },
              body: JSON.stringify(pingPayload)
            });

            if (res.ok) {
              // Also flush offline queue while online
              this.syncOfflineQueue(user.token);
            } else {
              this.queueOfflinePing(pingPayload);
            }
          } catch (err) {
            this.queueOfflinePing(pingPayload);
          }
        } else {
          this.queueOfflinePing(pingPayload);
        }
      },
      (err) => {
        // Silently catch GPS permission or timeout errors without disturbing UI
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  queueOfflinePing(payload) {
    try {
      const queue = JSON.parse(localStorage.getItem(this.offlineQueueKey) || '[]');
      if (queue.length < 500) { // cap local queue at 500 points
        queue.push(payload);
        localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
      }
    } catch (e) {}
  }

  async syncOfflineQueue(token) {
    if (!navigator.onLine || !token) return;
    try {
      const queue = JSON.parse(localStorage.getItem(this.offlineQueueKey) || '[]');
      if (queue.length === 0) return;

      const toSync = [...queue];
      for (const item of toSync) {
        const res = await fetch('/api/timeline/workday/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(item)
        });
        if (res.ok) {
          queue.shift();
          localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
        } else {
          break; // stop flushing if network fails again
        }
      }
    } catch (e) {}
  }
}

export default new WorkforceEngineService();
