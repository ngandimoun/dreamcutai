// Test setup and global mocks

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  storage: {
    from: jest.fn(() => ({
      createSignedUrl: jest.fn(),
      upload: jest.fn(),
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
process.env.CRON_SECRET = 'test-secret'

// Global test utilities
export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
})

export const createMockLibraryItem = (overrides = {}) => ({
  id: 'test-item-id',
  user_id: 'test-user-id',
  content_type: 'comics',
  content_id: 'test-content-id',
  date_added_to_library: new Date().toISOString(),
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createMockStoragePath = (userId: string, contentId: string, extension: string = 'png') => {
  return `renders/comics/${userId}/${contentId}.${extension}`
}

export const createMockSignedUrl = (path: string) => {
  return `https://test.supabase.co/storage/v1/object/sign/dreamcut/${path}?token=mock-token`
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})



