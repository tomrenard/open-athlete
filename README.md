# OpenAthlete

An open-source, high-performance fitness platform built with Next.js 15, Supabase, and Leaflet.js.

## Features

- **Activity Tracking**: Upload FIT and GPX files from your sports watch
- **Social Feed**: Follow athletes and share your workouts
- **Beautiful Maps**: View your routes on OpenStreetMap with Leaflet.js
- **Analytics Dashboard**: Track your progress with PRs and contribution graphs
- **Modern Design**: Glassmorphism UI with responsive mobile-first design

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI
- **Backend**: Supabase (Auth, PostgreSQL + PostGIS, Storage)
- **Maps**: Leaflet.js with OpenStreetMap
- **File Parsing**: fit-file-parser for FIT files

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/openathlete/openathlete.git
cd openathlete
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment file:

```bash
cp env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Set up the database:

   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the contents of `supabase/schema.sql`

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Database Setup

The SQL schema in `supabase/schema.sql` includes:

- **profiles**: User profiles extending Supabase auth
- **activities**: Workout data with PostGIS support
- **gps_points**: Detailed GPS trackpoints
- **follows**: Social connections

Row Level Security (RLS) policies ensure data privacy based on your settings.

## API Endpoints

REST API for mobile app compatibility:

| Endpoint                       | Method | Description          |
| ------------------------------ | ------ | -------------------- |
| `/api/v1/activities`           | GET    | List activities      |
| `/api/v1/activities/[id]`      | GET    | Single activity      |
| `/api/v1/feed`                 | GET    | Social feed          |
| `/api/v1/athletes/[id]/stats`  | GET    | Athlete statistics   |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Protected dashboard pages
│   └── api/v1/          # REST API routes
├── actions/             # Server Actions
├── components/          # React components
│   ├── ui/             # Shadcn/UI components
│   ├── feed/           # Activity feed components
│   ├── maps/           # Leaflet map components
│   └── dashboard/      # Dashboard components
├── lib/                # Utilities and configurations
│   ├── supabase/       # Supabase clients
│   ├── parsers/        # FIT/GPX file parsers
│   └── utils/          # Helper functions
└── types/              # TypeScript definitions
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [Shadcn/UI](https://ui.shadcn.com) for the component library
- [OpenStreetMap](https://www.openstreetmap.org) for map tiles
- [Leaflet](https://leafletjs.com) for map rendering
