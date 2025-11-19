# 🚀 Quick Start Guide

## Get SafeSpot Running in 3 Steps

### Step 1: Install Dependencies

```powershell
cd safespot
npm install
```

This will install:

- Next.js (React framework)
- TypeScript
- Tailwind CSS (styling)
- Leaflet (maps)
- Framer Motion (animations)
- Lucide React (icons)

### Step 2: Run Development Server

```powershell
npm run dev
```

Wait for the compilation to complete. You'll see:

```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

### Step 3: Open in Browser

Navigate to: **http://localhost:3000**

---

## 🎯 What You'll See

1. **Interactive Map** with color-coded safety markers

   - 🟢 Green = Safe locations
   - 🟡 Yellow = Moderate safety
   - 🔴 Red = Unsafe areas

2. **Search Bar** - Type to find locations

3. **Filter Buttons** - Quick filters:

   - All Places
   - Safe Only
   - Moderate
   - Trending (improving safety)
   - Popular (high traffic)

4. **Click any marker** to open the detailed panel with:
   - Overall safety score
   - Crime breakdown
   - Infrastructure ratings
   - User reviews
   - Elo calculation

---

## 📝 Sample Data Included

The app comes with 8 pre-loaded Chennai locations:

- Marina Beach
- T Nagar Commercial Area
- Anna Nagar Park
- Velachery Railway Station
- Phoenix Mall
- Mylapore Temple Area
- OMR IT Park
- Tambaram East Residential

---

## 🎨 Features to Try

### 1. Search

Type "Marina" in the search bar to find Marina Beach

### 2. Filter by Safety

Click "Safe Only" to see only high-rated locations

### 3. View Details

Click any map marker to open the side panel

### 4. Check Crime Stats

Scroll down in the panel to see crime breakdowns

### 5. Read Reviews

See what users say about safety, cleanliness, and police response

---

## 🛠️ Production Build

To create an optimized production build:

```powershell
npm run build
npm start
```

---

## 💡 Tips

- **TypeScript errors before install are normal** - they'll disappear after `npm install`
- **Map loads dynamically** - first load may take 2-3 seconds
- **Mobile responsive** - try it on different screen sizes
- **Smooth animations** - panel slides in with Framer Motion

---

## 🔧 Customization

### Add Your Own Places

Edit: `src/data/places.json`

### Change Colors

Edit: `tailwind.config.js` and `src/utils/safetyCalculations.ts`

### Modify Elo Formula

Edit: `src/utils/safetyCalculations.ts`

---

## ❓ Troubleshooting

**Port 3000 already in use?**

```powershell
npm run dev -- -p 3001
```

**Module not found errors?**

```powershell
rm -r node_modules
rm package-lock.json
npm install
```

---

**Enjoy SafeSpot! 🛡️**
