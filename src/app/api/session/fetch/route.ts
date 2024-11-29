import { type NextRequest } from 'next/server'
import { TwitterApi, ApiResponseError } from 'twitter-api-v2'

export async function GET(request: NextRequest) {
  try {
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!)
    
    // Get tweet ID from request
    const { searchParams } = new URL(request.url)
    const tweetId = searchParams.get('tweetId')

    if (!tweetId) {
      return Response.json(
        { error: 'Tweet ID is required' },
        { status: 400 }
      )
    }

    try {
      const tweet = await client.v2.tweet(tweetId)
      return Response.json(tweet)
    } catch (twitterError: unknown) {
      // Type guard for ApiResponseError
      if (twitterError instanceof ApiResponseError) {
        // Handle specific Twitter API errors
        if (twitterError.code === 400) {
          return Response.json(
            { error: 'Tweet not found or inaccessible' },
            { status: 404 }
          )
        }
        
        // Handle rate limiting
        if (twitterError.code === 429) {
          return Response.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          )
        }
      }

      throw twitterError // Re-throw unexpected errors
    }

  } catch (error) {
    console.error('Twitter API error:', error)
    return Response.json(
      { error: 'Failed to fetch tweet' },
      { status: 500 }
    )
  }
}