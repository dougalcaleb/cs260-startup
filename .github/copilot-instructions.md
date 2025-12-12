# Parallel - Copilot Instructions

## Project Overview
Parallel is a photo-sharing app that finds connections between users by cross-referencing GPS metadata from photo libraries. Users discover shared locations and time periods with others nearby in real-time.

**Note**: This is a CS260 proof-of-concept project currently being converted to a static mockup. You may see commented-out code - this represents the transition from a live AWS-backed application to a static demonstration.

**Tech Stack:** React (Vite + Tailwind CSS v4), Express.js, AWS (S3, DynamoDB, Cognito), WebSockets, Google Maps API

## Architecture

### Frontend (`src/parallel/`)
- **React + Vite**: Mobile-first SPA with client-side routing via `react-router-dom`
- **Tailwind CSS v4**: Uses `@tailwindcss/vite` plugin (not PostCSS config)
- **State Management**: Centralized via `StateProvider.jsx` context - use `useGlobalState()` hook to access/update shared state (library images, connected user data, websocket connections)
- **Authentication**: AWS Cognito via `react-oidc-context`. Auth flow happens in [root.jsx](src/parallel/src/components/root.jsx) with session storage for user profile
- **Custom Hook Pattern**: `useAuthUser()` hook wraps Cognito auth state - use this instead of directly accessing auth context

### Backend (`src/service/`)
- **Express Router Pattern**: Endpoints organized in `modules/` ([imageAPI.js](src/service/modules/imageAPI.js), [userAPI.js](src/service/modules/userAPI.js))
- **Auth Middleware**: `requireAuth()` and `optionalAuth()` from [cognitoAuth.js](src/service/common/cognitoAuth.js) verify JWT tokens via JWKS
- **AWS Services**:
  - S3: Image storage with presigned URLs (see [imageAPI.js](src/service/modules/imageAPI.js))
  - DynamoDB: Three tables - `userdata`, `image-metadata`, `user-data-summary`
  - Cognito: User pool authentication (pool ID: `us-east-1_CeNWRAhjI`)

### Critical Async Processing Queues
The service uses rate-limited queues to handle external API calls efficiently:

1. **Geocode Queue** ([geocodeQueue.js](src/service/common/geocodeQueue.js)): 
   - Processes GPS coords → readable locations via Google Maps API at 45 req/sec
   - Auto-batches requests, respects rate limits
   - Updates DynamoDB `image-metadata` table and triggers summary queue
   
2. **Summary Queue** ([summaryQueue.js](src/service/common/summaryQueue.js)):
   - Aggregates user location/date data into `user-data-summary` table
   - Used for real-time nearby user matching

**When adding image metadata features**: Enqueue geocode jobs rather than making synchronous API calls. See [imageAPI.js](src/service/modules/imageAPI.js#L40-L45) for pattern.

### WebSocket Architecture
Custom pub/sub WebSocket manager in [websocket.js](src/service/common/websocket.js):

- **Connection Types**: Each client opens typed connections (`WS_UPLOAD`, `WS_NEARBY`, `WS_ADD_LOC`)
- **User Mapping**: Tracks userId → Map<type, WebSocket> for targeted messaging
- **Event System**: Subscribe to connection events (e.g., `WS_NEARBY_OPEN`, `WS_NEARBY_CLOSE`)
- **Nearby Users**: [nearbyUsers.js](src/service/common/nearbyUsers.js) broadcasts connected user data for real-time matching

**Pattern**: Frontend opens WS via [api.js](src/parallel/src/mixins/api.js) `openWebSocket()`, server pushes updates (upload progress, geocoding, nearby users).

## Developer Workflows

### Local Development
```bash
# Frontend (from src/parallel/)
npm install
npm run dev           # Vite dev server on localhost:5173

# Backend (from src/service/)
npm install
node index.js         # Express server on port 4000
```

**Environment**: Frontend expects backend at `http://localhost:4000` in dev, `https://startup.dougalcaleb.click` in prod (see [api.js](src/parallel/src/mixins/api.js#L3-L5))

### Build & Deploy
Production build via [build.bat](src/build.bat):
1. Generates version timestamp in `src/version.js`
2. Runs `npm run build` in `parallel/` (outputs to `dist/`)
3. Copies build to target directory with `public/` structure
4. **SPA Routing**: Backend serves `index.html` for all non-API routes ([index.js](src/service/index.js#L52-L56))

**Deploy**: [deploy.bat](dev/deploy.bat) SCPs built files to production server via SSH

### Version Tracking
Build system stamps versions: `VERSION_STAMP` env var (Unix timestamp) injected during build, logged on app load ([main.jsx](src/parallel/src/main.jsx#L20)). Dev mode shows `"DEV"`.

## Code Conventions

### Import Organization
- **mixins/**: Reusable utilities (`api.js` for fetch wrappers, `constants.js` for app-wide constants, `format.js` for formatters)
- **Use named exports**: Constants like `WS_UPLOAD_OPEN`, `ALERTS.SUCCESS` from [constants.js](src/parallel/src/mixins/constants.js)

### API Calls
Always use wrappers from [api.js](src/parallel/src/mixins/api.js):
- `authFetch()` / `authPost()`: Authenticated requests with JWT bearer token
- `openWebSocket(type, userID, onMessage)`: Typed WebSocket connections

### Alert System
Use `AlertContext` via `useAlert()` hook:
```jsx
const { launchAlert } = useAlert();
launchAlert(ALERTS.ERROR, "Upload failed. Please try again.");
```

### State Updates
Always use `setLibImages`, `setUsername`, etc. from `useGlobalState()` - never mutate state directly. Library images stored as array of objects with metadata maps.

### CORS Configuration
Backend allows origins: `http://localhost:5173` and `https://startup.dougalcaleb.click` ([index.js](src/service/index.js#L23-L28))

## Project-Specific Patterns

### Image Upload Flow
1. User selects images → [library.jsx](src/parallel/src/components/pages/library.jsx) validates & shows preview
2. Optional: Manual location assignment via LocationPicker
3. POST to `/api/image/upload` with FormData + optional location data
4. Backend extracts EXIF (GPS, timestamp) via `exifr` → stores in S3 + DynamoDB
5. Geocode queue processes GPS → readable location (async)
6. Summary queue updates user's location/date aggregates
7. WebSocket pushes upload progress + geocode results to client

### Nearby Matching
- Users connect via WebSocket (`WS_NEARBY_OPEN`)
- [nearbyUsers.js](src/service/common/nearbyUsers.js) fetches their summary data (locations, dates)
- Broadcasts all connected users → clients do fuzzy matching client-side
- Comparison logic in [nearby.jsx](src/parallel/src/components/pages/nearby.jsx) finds shared locations/dates

### File Structure Note
- `src-v1/`, `src-v2/`: Legacy HTML/CSS prototypes - ignore for active development
- Active codebase: `src/parallel/` (frontend) and `src/service/` (backend)
- Commented code: Represents transition to static mockup - keep for reference but don't rely on commented-out AWS integrations

## Common Pitfalls

1. **Don't bypass auth wrappers**: Always use `authFetch()`/`authPost()` - they handle token injection and error responses
2. **Tailwind v4 differences**: Uses Vite plugin, not PostCSS. Import in CSS with `@import "tailwindcss";`
3. **WebSocket cleanup**: Always close WebSocket connections in `useEffect` cleanup to prevent memory leaks
4. **Geocode rate limits**: Never call Google Maps API directly - use geocode queue to avoid hitting 50 req/sec hard limit
5. **Session storage keys**: Use constants from [constants.js](src/parallel/src/mixins/constants.js) (`DID_LOGIN_KEY`, `USER_PROFILE_KEY`) - don't hardcode

## Legacy Code
- **MongoDB**: Temporary integration no longer in use - ignore `userAPIMongo.js` and commented MongoDB imports
- Backend now uses AWS DynamoDB exclusively for data persistence
