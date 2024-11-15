# Sacred Terminal

A mysterious terminal-style web application built with Next.js, featuring real-time chat interactions, authentication, and cryptic messaging systems.

## 🌟 Features

- Interactive terminal interface with typewriter effects
- Real-time binary rain animation
- Authentication system with Twitter integration
- SQLite database integration
- Redis caching
- Telegram bot integration
- Wallet integration (Solana & NEAR)
- Custom styling with TailwindCSS
- Responsive design with retro aesthetics

## 🚀 Tech Stack

- **Framework**: Next.js 15.0.1
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: SQLite (better-sqlite3)
- **Caching**: Redis
- **Authentication**: NextAuth.js
- **APIs Integration**:
  - Twitter API
  - OpenAI API
  - Solana Web3
  - NEAR API
- **Other Tools**:
  - UUID for unique identifiers
  - Press Start 2P font for retro styling

## 📦 Installation

1. Clone the repository:
git clone <repository-url>
cd terminal

2. Install dependencies:

```bash
npm install
or
yarn install
or
pnpm install
or
bun install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add the necessary environment variables (see `.env.example` for required variables).

4. Run the development server:

```bash
npm run dev
or
yarn dev
or
pnpm dev
or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

src/
├── app/ # Next.js app directory
│ ├── api/ # API routes
│ ├── auth/ # Authentication pages
│ └── terminal/ # Terminal interface
├── components/ # React components
├── constants/ # Constants and messages
├── hooks/ # Custom React hooks
├── lib/ # Utility functions and database
├── types/ # TypeScript type definitions
└── utils/ # Helper functions


## 🔧 Configuration

The project uses several configuration files:

- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `tsconfig.json` - TypeScript configuration
- `postcss.config.mjs` - PostCSS configuration
- `.eslintrc.json` - ESLint configuration

## 🔐 Authentication

The application uses NextAuth.js for authentication with Twitter integration. Make sure to set up the required environment variables for authentication to work properly.

## 💾 Database

The project uses SQLite for data persistence with the following main tables:
- user_sessions
- referral_codes
- message_tracking
- schema_migrations

Database migrations can be found in `src/lib/migrations/`.

## 🎨 Styling

The application uses a custom theme with retro-style effects including:
- Scanline effects
- Glowing text
- Binary rain animation
- Pixel borders
- Custom scrollbars
- Ancient terminal aesthetics

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment platform
- All contributors and maintainers

## 📞 Contact

[nayugrowgami@gmail.com](mailto:nayugrowgami@gmail.com)
