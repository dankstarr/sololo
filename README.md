# Sololo - AI Travel Companion 🌍

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/sololo)

Sololo is a modern, responsive web app designed as a web-first product that can later be easily converted into a mobile app. It's an AI-powered travel companion that helps users plan trips effortlessly, explore optimized circular routes, listen to hands-free audio guides, and connect with other travelers.

## 🚀 Live Demo

Visit the live application: [https://sololo.vercel.app](https://sololo.vercel.app)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [Contributing](#contributing)
- [License](#license)

## Features

### Marketing Website
- Sticky header with smooth scroll animations
- Hero section with animated map background
- How It Works section
- Features grid with hover effects
- Group Travel promotion
- Pricing section
- Footer with working links

### Web App
- **Onboarding**: Minimal intro with Google Sign-In option
- **Trip Creation**: Comprehensive form with destination, dates, interests, travel mode, pace, and accessibility options
- **Location Selection**: AI-generated locations with drag-and-drop reordering, include/exclude, and replace options
- **Itinerary Overview**: Day-wise collapsible sections with time, distance, pace warnings, and notes
- **Map View**: Full-screen map with day-wise routes, filters, and Google Maps integration
- **Location Detail**: Modal with photos, description, opening hours, crowd estimates, and audio guide
- **Audio Guide**: Minimal, audio-first UI with large controls, background play, and lock screen support
- **Group Discovery**: Find or create travel groups with similar dates
- **Group Chat**: Real-time chat with pinned itinerary, shared locations, and icebreaker prompts
- **Discover Page**: Public feed of trips, audio guides, and routes with likes, saves, and views

## Accessibility

The application follows WCAG 2.1 AA standards with:
- ✅ Semantic HTML5 elements
- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader support
- ✅ Skip links
- ✅ Reduced motion support
- ✅ Proper color contrast
- ✅ Form labels and descriptions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: Zustand
- **Testing**: Jest + React Testing Library

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sololo.git
cd sololo
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Create a `.env.local` file (optional for development):
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build
4. Add environment variables if needed
5. Deploy!

Or use Vercel CLI:
```bash
npm i -g vercel
vercel
```

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:
- **Netlify**: Connect your GitHub repo
- **Railway**: One-click deploy
- **AWS Amplify**: Connect repository
- **Docker**: Use the included Dockerfile (if created)

## 📊 Performance

See [Performance Guide](./docs/guides/PERFORMANCE.md) for detailed optimization information.

Expected Lighthouse scores:
- Performance: 90-100
- Accessibility: 95-100
- Best Practices: 95-100
- SEO: 95-100

## Project Structure

```
sololo/
├── app/                    # Next.js app directory
│   ├── app/               # Web app pages
│   ├── about/             # Marketing pages
│   ├── contact/
│   ├── privacy/
│   ├── terms/
│   └── discover/          # Discover page
├── components/
│   ├── marketing/         # Marketing website components
│   ├── app/               # Web app components
│   └── common/            # Shared components
├── __tests__/             # Test files
├── store/                 # State management
└── public/                # Static assets
```

## Key Features

- **Responsive Design**: Desktop-first, mobile-ready layouts
- **Smooth Animations**: Scroll-based reveals, hover effects, 3D tilts, glitch effects
- **Guest Mode**: Users can generate up to 20 itineraries for free
- **Offline Ready**: Structure supports offline maps, routes, and audio guides
- **Social Features**: Group discovery, chat, and trip sharing
- **AI Integration**: Placeholder structure for AI itinerary generation
- **Accessibility**: WCAG 2.1 AA compliant

## Future Enhancements

- Google Maps API integration
- Real-time group chat with WebSockets
- Audio guide generation and playback
- Offline mode with service workers
- User authentication (Google Sign-In, email)
- Payment integration for Pro subscriptions
- Mobile app conversion (React Native)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Animations by [Framer Motion](https://www.framer.com/motion/)

---

Made with ❤️ by the Sololo team
