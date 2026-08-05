# Consumer Migration Report

## Scope
This report documents the specific refactoring applied to runtime consumers of Redis and BullMQ to decouple them from the infrastructure layer.

## Migrated Consumers

### 1. `guards/auth.guard.js`
- **Before**: `const { getCache, setCache } = require('../services/cache/redis.service');`
- **After**: `const { getCache, setCache } = require('../services/cache/cacheFactory');`
- **Impact**: Permission checks now automatically route to memory when Redis is disabled, preventing ECONNREFUSED errors during authentication.

### 2. `services/queues/queueManager.js`
- **Before**: Imported `bullmq` directly, instantiated `Queue` and `Worker` classes directly. Passed raw `redisClient` connection.
- **After**: Imports `queueFactory.js`. Calls `queueFactory.getQueue()` and `queueFactory.createWorker()`. 
- **Impact**: The Admin board logic and queue instantiation are now securely conditionally wrapped, allowing smooth startup in fallback environments.

### 3. `services/queues/communicationQueue.js`
- **Before**: Mixed BullMQ imports and raw FallbackQueue instantiation.
- **After**: Simplified to request queues from `queueFactory.js`.
- **Impact**: Cleaner code, separation of concerns maintained.

### 4. `api/controllers/health.controller.js`
- **Before**: Checked `mongoose` and hardcoded `queueManager.connection.status`.
- **After**: Polls `cacheFactory._getStatus()` and reports active providers (`memory` / `fallback`).
- **Impact**: Health endpoint accurately reflects active configuration without failing when Redis is disabled.
