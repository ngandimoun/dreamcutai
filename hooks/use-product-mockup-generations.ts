import { useState, useCallback } from 'react'

export interface ProductMockupGeneration {
  id: string
  user_id: string
  generation_id: string
  prompt: string
  full_prompt?: string
  settings: Record<string, any>
  images: string[]
  metadata?: Record<string, any>
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface ProductMockupGenerationFilters {
  status?: 'processing' | 'completed' | 'failed'
  limit?: number
  offset?: number
}

export function useProductMockupGenerations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generations, setGenerations] = useState<ProductMockupGeneration[]>([])

  // Fetch product mockup generations
  const fetchGenerations = useCallback(async (filters: ProductMockupGenerationFilters = {}): Promise<ProductMockupGeneration[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/product-mockup-generation?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch product mockup generations')
      }

      const data = await response.json()
      const fetchedGenerations = data.generations || []
      setGenerations(fetchedGenerations)
      return fetchedGenerations
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Generate new product mockup
  const generateMockup = useCallback(async (generationData: any): Promise<{
    success: boolean
    images: string[]
    metadata: any
    error?: string
  }> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/product-mockup-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate product mockup')
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh generations list to include the new generation
        await fetchGenerations()
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return {
        success: false,
        images: [],
        metadata: {},
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [fetchGenerations])

  // Delete a generation
  const deleteGeneration = useCallback(async (generationId: string): Promise<boolean> => {
    setError(null)
    
    try {
      const response = await fetch(`/api/product-mockup-generation/${generationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete generation')
      }

      // Remove from local state
      setGenerations(prev => prev.filter(gen => gen.id !== generationId))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return false
    }
  }, [])

  // Get generation by ID
  const getGeneration = useCallback((generationId: string): ProductMockupGeneration | undefined => {
    return generations.find(gen => gen.id === generationId)
  }, [generations])

  // Get generations by status
  const getGenerationsByStatus = useCallback((status: 'processing' | 'completed' | 'failed'): ProductMockupGeneration[] => {
    return generations.filter(gen => gen.status === status)
  }, [generations])

  // Get recent generations
  const getRecentGenerations = useCallback((limit: number = 10): ProductMockupGeneration[] => {
    return generations
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }, [generations])

  return {
    loading,
    error,
    generations,
    fetchGenerations,
    generateMockup,
    deleteGeneration,
    getGeneration,
    getGenerationsByStatus,
    getRecentGenerations,
    setError
  }
}


