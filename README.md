# DreamCut

DreamCut is a powerful web application for creating and managing multimedia content, featuring voice generation, charts/infographics creation, and advanced content management capabilities. Built with Next.js, TypeScript, and Supabase, it offers a robust platform for content creators and developers.

## Features

- **Voice Generation**: Create and manage custom voices using ElevenLabs integration
- **Charts & Infographics**: Generate beautiful visualizations using Manim and custom chart rendering
- **Content Management**: Comprehensive content creation and management interface
- **Authentication**: Secure user authentication system
- **Storage Integration**: Efficient file storage and management
- **Health System**: Automated system health monitoring and maintenance

## Prerequisites

- Node.js (v18 or higher)
- pnpm
- Python 3.11 or higher (for Manim and chart generation)
- Supabase CLI (for database management)

## Environment Setup

1. Clone the repository
2. Copy the environment variables template:
   ```bash
   cp env.example .env
   ```
3. Fill in the required environment variables in `.env`

## Installation

```bash
# Install dependencies
pnpm install

# Install Python dependencies for Modal functions
pip install -r modal_functions/requirements.txt

# Set up the database
supabase init
supabase start
```

## Development

To run the development server:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Testing

The project uses Jest for testing. To run the tests:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Project Structure

- `/app` - Next.js application routes and API endpoints
- `/components` - React components
- `/lib` - Core utilities and business logic
- `/modal_functions` - Python functions for chart generation
- `/hooks` - Custom React hooks
- `/public` - Static assets
- `/styles` - Global styles and CSS modules
- `/supabase` - Database migrations and configuration

## Key Components

- **Voice Creation Interface**: Manage and create custom voices
- **Charts Generator**: Create infographics and visualizations
- **Content Management**: Handle multimedia content
- **Authentication System**: Secure user access
- **Health System**: Monitor and maintain system health

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please open an issue in the repository.