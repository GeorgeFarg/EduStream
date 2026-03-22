// Don't use "dotenv/config" here! It breaks in the browser (e.g., 'fs' not found).
// Just use the NEXT_PUBLIC_ variables provided by Next.js.

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
export const socketBaseUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
