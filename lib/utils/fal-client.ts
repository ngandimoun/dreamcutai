import { fal } from "@fal-ai/client"

let isInitialized = false

// Lazy initialization function
function initializeFalClient() {
  if (isInitialized) {
    return fal
  }

  // Only check environment variable on server side
  if (typeof window === 'undefined' && !process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable is required")
  }

  // Only configure if we have the key (server-side)
  if (typeof window === 'undefined' && process.env.FAL_KEY) {
    fal.config({
      credentials: process.env.FAL_KEY
    })
  }

  isInitialized = true
  return fal
}

// Export the lazy-initialized client
export const getFalClient = initializeFalClient
export { fal }
export default fal

