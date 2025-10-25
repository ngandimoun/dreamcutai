import Replicate from 'replicate'

export function getReplicateClient() {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not set')
  }
  return new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  })
}
