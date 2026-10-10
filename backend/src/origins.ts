/**
 * Browser origins allowed to call this API: the Vite dev server for the
 * frontend. Shared by the HTTP CORS policy and the WebSocket `allowedOrigins`
 * check, because global middleware (CORS included) never runs on a WebSocket
 * upgrade request.
 */
export const FRONTEND_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
] as const;
