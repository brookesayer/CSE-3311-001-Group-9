# DFW Travel Discovery App

A modern, responsive web application for discovering and planning trips across the Dallas-Fort Worth-Arlington (DFW) Metroplex. Built with React, Vite, and Tailwind CSS.

## Features

- **Browse DFW Destinations**: Explore 20+ curated places across Dallas, Fort Worth, and Arlington
- **Smart Filtering**: Filter by city, category, rating, and price level with debounced search
- **Trip Planning**: Create, manage, and organize multiple trips
- **Active Trip Management**: Set an active trip for quick destination additions
- **Share Trips**: Generate shareable links for your planned itineraries
- **Responsive Design**: Mobile-first design tested at 360px, 768px, and 1200px
- **Local Storage Fallback**: Fully functional offline with localStorage when backend is unavailable
- **Accessible**: ARIA labels, keyboard navigation, and semantic HTML

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS 3
- **Routing**: React Router DOM 6
- **Carousel**: Swiper.js
- **Icons**: Heroicons
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
cd simpleapp
npm install
```

### Running the App

```bash
npm run dev
```

The app will start at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
simpleapp/
├── public/                   # Static assets (DFW images)
│   ├── dallas-1612499_1280.jpg
│   ├── att-stadium-5201668_1280.jpg
│   ├── reunion-4100557_1280.jpg
│   └── ...
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── HeroCarousel.jsx   # DFW hero carousel with Swiper
│   │   ├── CategoryChips.jsx   # Filterable category buttons
│   │   ├── PlaceCard.jsx       # Place display card
│   │   ├── TripPlanner.jsx     # Trip management component
│   │   ├── Toast.jsx           # Toast notifications
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── Home.jsx           # Landing page with hero
│   │   ├── Browse.jsx         # Browse DFW destinations
│   │   ├── Trips.jsx          # Trip management page
│   │   ├── Share.jsx          # Shared trip viewer
│   │   └── ...
│   ├── lib/                 # Utilities and API layer
│   │   ├── api.js            # Centralized API with fallback
│   │   └── storage.js        # localStorage helpers
│   ├── data/                # Static data
│   │   ├── dfwPlaces.js      # DFW destinations dataset (20 places)
│   │   └── heroSlides.js     # Hero carousel slides
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

## Key Features Explained

### API Layer with Fallback

The app uses a centralized API layer (`src/lib/api.js`) that:
1. Attempts to connect to backend API (`/api/dfw-places`, `/api/trips`, etc.)
2. Automatically falls back to local JSON data if backend is unavailable
3. Provides consistent interface regardless of data source

**Note**: This frontend uses local data and localStorage if backend is not available.

### Trip Management

- **Create Trips**: Simple form to create new trips with name and description
- **Active Trip**: Set one trip as "active" for quick destination additions from Browse page
- **Add to Trip**: Click "+ Add to Trip" on any place card to add it to your active trip
- **Share Trips**: Generate shareable links that encode trip data in the URL (works offline)
- **Import/Export**: Export trips as JSON or import from saved files

### Filtering System

The Browse page includes:
- **City Selector**: Quick buttons to filter by Dallas, Fort Worth, or Arlington
- **Category Chips**: Museum, Park, Landmark, Stadium, Outdoors, Family, Neighborhood, Nightlife, Food
- **Search**: 300ms debounced search across name, city, neighborhood, and description
- **Advanced Filters**: Minimum rating (4.5+, 4.0+, 3.5+) and maximum price level (1-4)

### Responsive Design

Mobile-first approach with breakpoints:
- **Mobile**: < 640px (single column grid, stacked controls)
- **Tablet**: 640-1024px (2 column grid)
- **Desktop**: 1024px+ (3-4 column grid)

Tested at 360px, 768px, and 1200px viewports.

## Local Storage

This frontend works fully with localStorage if the backend is not available. Data is stored in:
- `travel_app_trips`: All user trips (array of trip objects)
- `travel_app_active_trip`: Currently active trip ID

## Environment Variables

Create a `.env` file (optional):

```env
VITE_API_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000` and falls back to local data on error.

## Bug Fixes Implemented

### 1. Trip Creation Not Persisting ✅
**Problem**: Trips were created but not saved to localStorage, or state wasn't updating properly.

**Root Cause**:
- Trip IDs were not unique enough causing overwrites
- localStorage wasn't being called after state updates
- No fallback mechanism when backend was unavailable

**Fix**:
- Enhanced `storage.createTrip()` to generate unique IDs using `local-${Date.now()}`
- Ensured `storage.saveTrips()` is called immediately after trip array modification
- Added automatic active trip selection for the first trip created
- Updated TripPlanner component to properly reload trips from storage after creation
- API layer now returns properly formatted trip objects for both backend and localStorage paths

**Location**: `simpleapp/src/lib/storage.js:52-71`, `simpleapp/src/components/TripPlanner.jsx:43-63`

### 2. Category Chips Not Clickable ✅
**Problem**: Category filter chips appeared clickable with hover states but onClick events weren't firing.

**Root Causes**:
- Chips were sometimes implemented as `<div>` instead of `<button>` elements
- Missing `type="button"` attribute caused form submission interference
- CSS `pointer-events` or z-index issues blocked click events
- Event handlers weren't properly bound to the click event

**Fix**:
- Converted all chips to proper `<button>` elements with `type="button"`
- Added explicit `onClick={() => onCategorySelect(category)}` handlers
- Removed any CSS that could block pointer events (`pointer-events: none`)
- Added proper ARIA attributes (`aria-pressed`, `aria-label`) for accessibility
- Ensured parent component properly handles `onCategorySelect` callback and updates state

**Location**: `simpleapp/src/components/CategoryChips.jsx:16-36`, `simpleapp/src/pages/Browse.jsx:236-240`

### 3. Add to Trip Not Saving Reliably ✅
**Problem**: Clicking "Add to Trip" sometimes didn't persist places to the trip, or added to wrong trip.

**Root Causes**:
- No concept of "active trip" - unclear which trip to add to
- Race conditions between storage.addPlaceToTrip and state updates
- Duplicate checking wasn't working properly
- No user feedback about which trip was being modified

**Fix**:
- Implemented **active trip** concept stored in `localStorage.getItem('travel_app_active_trip')`
- Added `storage.getActiveTrip()` and `storage.setActiveTrip(tripId)` helpers
- Enhanced `storage.addPlaceToTrip()` to properly check for duplicate places by ID
- Added clear UI indicators showing which trip is currently active
- Added "Set as Active" button in trip management interface
- Show warning toast if no active trip is selected when trying to add a place
- Display "Adding to: [Trip Name]" in Browse page header
- Updated state immediately after adding to show success/failure

**Location**: `simpleapp/src/lib/storage.js:15-40`, `simpleapp/src/components/TripPlanner.jsx:65-70`, `simpleapp/src/pages/Browse.jsx:67-93`

## Testing

### Manual Testing Checklist

- [x] Hero carousel auto-plays and pauses on hover
- [x] City selector (Dallas, Fort Worth, Arlington) filters places
- [x] Category chips filter correctly and are clickable
- [x] Search input filters with 300ms debounce
- [x] Creating a trip persists to localStorage
- [x] Active trip indicator shows in Trips page
- [x] Add to Trip button adds place to active trip
- [x] Setting active trip updates UI immediately
- [x] Share button generates link and copies to clipboard
- [x] Share page decodes token and displays trip
- [x] Responsive at 360px, 768px, 1200px
- [x] Keyboard navigation works throughout
- [x] App works fully offline (localStorage fallback)

### Testing with Backend

If backend is running at `http://localhost:8000`:
1. App will try backend APIs first
2. If successful, uses backend data
3. If backend fails, automatically falls back to local data
4. No user intervention needed

### Testing without Backend

1. App detects backend is unavailable within 2 seconds
2. Falls back to `src/data/dfwPlaces.js` local data
3. All trip management uses localStorage
4. Share links use URL-encoded tokens (no backend needed)

## DFW Dataset

The app includes 20 curated DFW destinations:

**Dallas** (9 places):
- Klyde Warren Park, Reunion Tower, Perot Museum, Dallas Arboretum, Sixth Floor Museum, Dallas Museum of Art, Deep Ellum, Bishop Arts District, White Rock Lake Park

**Fort Worth** (7 places):
- Fort Worth Stockyards, Kimbell Art Museum, Fort Worth Water Gardens, The Modern Art Museum, Sundance Square, Fort Worth Zoo, Sundance Square

**Arlington** (4 places):
- AT&T Stadium, River Legacy Parks, Texas Live!, Levitt Pavilion Arlington

Plus Trinity Groves (Dallas-West Dallas)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

## Contributing

This project is part of CSE-3311-001-Group-9. For any issues or improvements, please open an issue or pull request.

---

**Built with React + Vite + Tailwind CSS**
Frontend-only application with localStorage fallback for offline functionality.
