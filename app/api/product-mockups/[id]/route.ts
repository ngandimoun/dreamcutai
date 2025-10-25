import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/product-mockups/[id] - Get a specific product mockup
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productMockupId = params.id

    if (!productMockupId) {
      return NextResponse.json({ error: 'Product mockup ID is required' }, { status: 400 })
    }

    // Fetch the specific product mockup
    const { data: productMockup, error } = await supabase
      .from('product_mockups')
      .select('*')
      .eq('id', productMockupId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ Error fetching product mockup:', error)
      return NextResponse.json({ error: 'Product mockup not found' }, { status: 404 })
    }

    // Regenerate expired signed URLs from storage_paths (same pattern as list endpoint)
    if (productMockup.storage_paths && productMockup.storage_paths.length > 0) {
      // Regenerate fresh signed URLs from storage paths
      const freshUrls: string[] = []
      for (const storagePath of productMockup.storage_paths) {
        const { data: signedUrlData } = await supabase.storage
          .from('dreamcut')
          .createSignedUrl(storagePath, 86400) // 24 hour expiry
        if (signedUrlData?.signedUrl) {
          freshUrls.push(signedUrlData.signedUrl)
        }
      }
      // Replace expired URLs with fresh ones
      if (freshUrls.length > 0) {
        productMockup.generated_images = freshUrls
      }
    }

    return NextResponse.json(productMockup, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'max-age=30'
      }
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/product-mockups/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
