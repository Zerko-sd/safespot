# 🛡️ SafeSpot - Safety Rating Platform

**SafeSpot** is a modern, interactive web application that helps users check safety ratings, crime statistics, and reviews of any location before visiting. Built with Next.js, TypeScript, and Leaflet maps.

![SafeSpot](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4)

---

## ✨ Features

### 🗺️ Interactive Map

- **Color-coded markers** by safety level (Green = Safe, Yellow = Moderate, Red = Unsafe)
- **Click-to-view** detailed place information
- **Real-time filtering** and search
- Built with **Leaflet** for smooth map interactions

### 📊 Comprehensive Safety Analytics

- **Overall Safety Score** (0-100) based on multi-factor Elo rating system
- **Crime breakdown**: Violent crime, property crime, accidents
- **Infrastructure metrics**: CCTV coverage, street lighting, police density
- **Trend indicators**: Improving, neutral, or declining safety trends

### 🎯 Elo-Based Rating System

The safety score uses a sophisticated formula:

```
AttributeScore = 0.40 × SafetyScore +
                 0.30 × PopularityScore +
                 0.20 × ExperienceScore +
                 0.10 × TrendScore

PlaceElo = 1000 + 1400 × AttributeScore
FinalSafetyScore = AttributeScore × 100
```

### 💬 User Reviews & Tags

- Safety-focused reviews with detailed ratings
- Tags: "lit", "unsafe at night", "high police presence", "pickpockets", etc.
- Multi-dimensional ratings: Safety, cleanliness, police response

### 🔍 Smart Filtering

- **Safe Only** - Show only high-rated locations
- **Moderate** - Mixed safety areas
- **Trending** - Places with improving safety
- **Popular** - High-traffic areas
- **Real-time search** - Find places by name

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone or navigate to the project directory:**

```bash
cd safespot
```

2. **Install dependencies:**

```bash
npm install
```

3. **Run the development server:**

```bash
npm run dev
```

4. **Open your browser:**

```
http://localhost:3000
```

The app will automatically reload when you make changes.

---

## 📁 Project Structure

```
safespot/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Main home page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable React components
│   │   ├── InteractiveMap.tsx        # Leaflet map with markers
│   │   ├── PlaceDetailPanel.tsx      # Animated side panel
│   │   ├── SafetyScoreBar.tsx        # Progress bar component
│   │   ├── CrimeInfoSection.tsx      # Crime statistics display
│   │   ├── UserReviewSection.tsx     # Reviews feed
│   │   └── InfrastructureSection.tsx # Infrastructure metrics
│   ├── utils/
│   │   └── safetyCalculations.ts     # Elo formula & scoring logic
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   └── data/
│       └── places.json               # Mock place data
├── public/                    # Static assets
├── package.json              # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind CSS config
└── next.config.js          # Next.js config
```

---

## 🎨 UI/UX Design

### Design Philosophy

- **Apple-inspired** modern, minimal aesthetic
- **Glassmorphism** with backdrop blur effects
- **Smooth animations** using Framer Motion
- **Responsive** design for mobile and desktop
- **Gradient accents** for visual hierarchy

### Color Palette

- **Safe**: Green (#10b981)
- **Moderate**: Yellow/Orange (#f59e0b)
- **Unsafe**: Red (#ef4444)
- **Primary**: Blue to Purple gradient
- **Background**: Soft gray tones

---

## 🧩 Key Components

### InteractiveMap

Renders an interactive Leaflet map with color-coded safety markers.

**Props:**

- `places` - Array of place objects
- `selectedPlace` - Currently selected place
- `onPlaceSelect` - Callback when marker is clicked

### PlaceDetailPanel

Animated side panel showing comprehensive place details with smooth slide-in animation.

**Features:**

- Gradient header based on safety tier
- Score breakdown with progress bars
- Crime statistics
- Infrastructure metrics
- User reviews feed
- Elo formula explanation

### SafetyScoreBar

Reusable progress bar with gradient colors based on score value.

---

## 📊 Data Structure

### Place Object

```typescript
{
  id: string;
  name: string;
  lat: number;
  lng: number;
  crime: {
    violent: number;    // 0-100
    property: number;   // 0-100
    accident: number;   // 0-100
  };
  infra: {
    cctv: number;           // 0-100
    lighting: number;       // 0-100
    policeDensity: number;  // 0-100
  };
  popularity: number;  // 0-100
  experience: number;  // 0-100
  trend: number;      // -1 to +1
  reviews: Review[];
}
```

---

## 🔧 Customization

### Adding New Places

Edit `src/data/places.json` and add new place objects following the structure above.

### Modifying the Elo Formula

Update weights in `src/utils/safetyCalculations.ts`:

```typescript
const attributeScore =
  0.4 * (safetyScore / 100) +
  0.3 * (popularityScore / 100) +
  0.2 * (experienceScore / 100) +
  0.1 * (trendScore / 100);
```

### Changing Map Style

Update the tile layer URL in `src/components/InteractiveMap.tsx` to use different map styles (e.g., Mapbox, CartoDB).

---

## 🌐 API Integration (Future)

To connect to a real backend:

1. Replace JSON import in `src/app/page.tsx`:

```typescript
// Instead of:
import placesData from "@/data/places.json";

// Use:
const { data: places } = await fetch("/api/places");
```

2. Create API routes in `src/app/api/places/route.ts`

---

## 🛠️ Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Open-source map library
- **React Leaflet** - React components for Leaflet
- **Framer Motion** - Animation library
- **Lucide React** - Beautiful icon set

---

## 📱 Responsive Design

SafeSpot is fully responsive:

- **Desktop**: Full map with side panel
- **Tablet**: Optimized layout with bottom sheet
- **Mobile**: Touch-friendly interface with full-screen details

---

## 🚧 Future Enhancements

- [ ] User authentication and personal safety reports
- [ ] Real-time crime data integration
- [ ] Community-driven reviews and ratings
- [ ] Route safety checker
- [ ] Night mode with different safety metrics
- [ ] Push notifications for safety alerts
- [ ] Export safety reports as PDF
- [ ] Multi-city support with auto-detection

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 🙏 Acknowledgments

- Map data © OpenStreetMap contributors
- Icons by Lucide
- Inspired by modern safety and travel apps

---

**Built with ❤️ for safer communities**
