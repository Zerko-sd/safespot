# SafeSpot - Complete Project Structure

## 📂 Directory Tree

```
safespot/
│
├── 📄 package.json                    # Dependencies & scripts
├── 📄 tsconfig.json                   # TypeScript configuration
├── 📄 next.config.js                  # Next.js configuration
├── 📄 tailwind.config.js              # Tailwind CSS configuration
├── 📄 postcss.config.js               # PostCSS configuration
├── 📄 .eslintrc.json                  # ESLint rules
├── 📄 .eslintrc.js                    # Additional ESLint config
├── 📄 .gitignore                      # Git ignore rules
├── 📄 README.md                       # Full documentation
├── 📄 QUICKSTART.md                   # Quick start guide
│
└── src/
    ├── app/                           # Next.js App Router
    │   ├── page.tsx                   # 🏠 Main home page (Map + UI)
    │   ├── layout.tsx                 # Root layout wrapper
    │   └── globals.css                # Global styles + Tailwind
    │
    ├── components/                    # React Components
    │   ├── InteractiveMap.tsx         # 🗺️ Leaflet map with markers
    │   ├── PlaceDetailPanel.tsx       # 📱 Animated side panel
    │   ├── SafetyScoreBar.tsx         # 📊 Progress bar component
    │   ├── CrimeInfoSection.tsx       # 🚨 Crime statistics display
    │   ├── UserReviewSection.tsx      # 💬 User reviews feed
    │   └── InfrastructureSection.tsx  # 🏗️ Infrastructure metrics
    │
    ├── utils/
    │   └── safetyCalculations.ts      # 🧮 Elo formula & scoring
    │
    ├── types/
    │   └── index.ts                   # 📝 TypeScript interfaces
    │
    └── data/
        └── places.json                # 🗃️ Mock place data (8 locations)
```

---

## 🎯 Component Relationships

```
App (page.tsx)
├── InteractiveMap
│   ├── MapContainer (Leaflet)
│   ├── TileLayer (OpenStreetMap)
│   └── Markers (colored by safety)
│       └── Popup (mini preview)
│
└── PlaceDetailPanel (Framer Motion)
    ├── Header (gradient by tier)
    ├── SafetyScoreBar (x4)
    ├── CrimeInfoSection
    │   └── Crime cards with icons
    ├── InfrastructureSection
    │   └── CCTV, Lighting, Police
    └── UserReviewSection
        └── Review cards with tags
```

---

## 📦 Key Files Explained

### 1. **page.tsx** (Main App)

- State management (selected place, search, filters)
- Search bar & filter buttons
- Map integration
- Place detail panel trigger

### 2. **InteractiveMap.tsx**

- Leaflet map setup
- Custom colored markers (green/yellow/red)
- Click handlers
- Popup previews

### 3. **PlaceDetailPanel.tsx**

- Slide-in animation (Framer Motion)
- Gradient header (dynamic color)
- Full place details
- Elo formula display

### 4. **safetyCalculations.ts**

- Elo rating formula
- Safety tier calculation
- Color/gradient helpers
- Trend indicators

### 5. **places.json**

- 8 sample locations (Chennai)
- Crime data (violent, property, accident)
- Infrastructure (CCTV, lighting, police)
- Popularity, experience, trend
- User reviews with tags

---

## 🎨 Design System

### Colors

- **Safe**: `#10b981` (green)
- **Moderate**: `#f59e0b` (yellow/orange)
- **Unsafe**: `#ef4444` (red)
- **Primary**: Blue to purple gradient
- **Background**: Gray-50 to white

### Typography

- **Font**: Inter (fallback: SF Pro, system-ui)
- **Headings**: Bold, 18-32px
- **Body**: Regular, 14-16px
- **Small**: 12px

### Spacing

- **Cards**: Rounded-xl (12px)
- **Padding**: 4-6 (16-24px)
- **Gaps**: 2-4 (8-16px)

### Animations

- **Panel slide**: Spring animation (damping: 30)
- **Backdrop**: Fade in/out
- **Hover**: Scale 1.05
- **Transitions**: 200-300ms

---

## 🔧 Configuration Files

### package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "framer-motion": "^11.0.3",
    "lucide-react": "^0.344.0"
  }
}
```

### tailwind.config.js

- Custom colors (safe-green, moderate-yellow, unsafe-red)
- Custom animations (slide-up, fade-in)
- Inter font family

### tsconfig.json

- Path aliases: `@/*` → `./src/*`
- Strict mode enabled
- ES2020 target

---

## 📊 Data Flow

1. **App loads** → Fetch places from JSON
2. **User searches** → Filter places array
3. **User clicks filter** → Apply tier/trend filter
4. **User clicks marker** → Set selected place
5. **Panel opens** → Calculate metrics
6. **Display data** → Render components

---

## 🚀 Build & Deploy

### Development

```bash
npm run dev
```

Runs on http://localhost:3000

### Production

```bash
npm run build
npm start
```

Optimized build with SSR

### Deploy to Vercel

```bash
vercel
```

---

## 🔌 Future API Integration

To connect real backend:

```typescript
// Replace in page.tsx:
const places = await fetch("/api/places").then((r) => r.json());

// Create API route:
// src/app/api/places/route.ts
export async function GET() {
  const data = await db.places.findMany();
  return Response.json(data);
}
```

---

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (full-width panel)
- **Tablet**: 768-1024px (half panel)
- **Desktop**: > 1024px (fixed 480px panel)

---

## ✅ Complete Feature Checklist

✅ Interactive Leaflet map
✅ Color-coded safety markers
✅ Click to view details
✅ Animated side panel
✅ Search functionality
✅ Filter buttons (5 types)
✅ Elo-based rating system
✅ Crime breakdown display
✅ Infrastructure metrics
✅ User reviews with tags
✅ Trend indicators
✅ Responsive design
✅ TypeScript types
✅ Mock data (8 places)
✅ Smooth animations
✅ Apple-style UI
✅ Full documentation

---

**All components are complete and ready to run!** 🎉
