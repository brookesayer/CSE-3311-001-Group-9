# Travel Discovery Web App

A modern, responsive travel discovery application built with React + Vite and TailwindCSS. Explore amazing destinations, plan trips, and manage your travel wishlist with an beautiful, adventurous interface.

![Travel Discovery App](https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

## ✨ Features

### 🏠 **Home Page**
- Stunning hero carousel with sliding adventure images
- Featured destinations showcase
- Category filtering with animated chips
- Responsive design with smooth transitions

### 🗺️ **Browse Destinations**
- Comprehensive destination catalog with 20 sample places
- Advanced filtering by category, rating, and price level
- Real-time search functionality
- Card-based layout with hover animations

### 📍 **Place Details**
- Detailed destination information with large hero images
- Rating, price level, and category information
- Add to trip functionality with trip selection
- Responsive design with sticky trip planner sidebar

### 🧳 **Trip Planner**
- Create and manage multiple trips
- Add/remove destinations from trips
- Drag and drop reordering (visual feedback)
- Export/import trips as JSON files
- localStorage persistence

### 📸 **Photo Gallery**
- Masonry-style layout with category filtering
- Lightbox with keyboard navigation
- Smooth animations using Framer Motion
- Mobile-optimized touch interactions

### ℹ️ **About Page**
- Project information and tech stack details
- Feature highlights with icons
- Modern design with gradients and animations

## 🚀 Tech Stack

- **React 18** - Modern JavaScript library for building user interfaces
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **React Router** - Declarative routing for React applications
- **Swiper.js** - Modern mobile touch slider with hardware accelerated transitions
- **Framer Motion** - Production-ready motion library for React
- **Heroicons** - Beautiful hand-crafted SVG icons

## 📁 Project Structure

```
travel-app/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── data/
    │   └── places.json
    ├── components/
    │   ├── Header.jsx
    │   ├── Footer.jsx
    │   ├── HeroCarousel.jsx
    │   ├── CategoryChips.jsx
    │   ├── PlaceCard.jsx
    │   ├── TripPlanner.jsx
    │   └── Toast.jsx
    ├── pages/
    │   ├── Home.jsx
    │   ├── Browse.jsx
    │   ├── PlaceDetails.jsx
    │   ├── Trips.jsx
    │   ├── Gallery.jsx
    │   └── About.jsx
    ├── styles/
    │   └── index.css
    └── lib/
        └── storage.js
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   # If using git
   git clone <repository-url>
   cd travel-discovery-app

   # Or extract the provided files to a directory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The app should load with the home page and hero carousel

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks

## 🎨 Design Features

### Modern Adventurous Aesthetic
- **Color Palette**: Adventure-themed blues with carefully chosen accent colors
- **Typography**: Inter font family for clean, modern readability
- **Imagery**: High-quality travel photography from Unsplash
- **Layout**: Card-based design with consistent spacing and shadows

### Animations & Interactions
- **Page Transitions**: Smooth fade and slide animations between routes
- **Hover Effects**: Scale and color transformations on interactive elements
- **Loading States**: Skeleton screens and loading indicators
- **Micro-interactions**: Button hover states, image zoom effects

### Responsive Design
- **Mobile-First**: Designed for mobile devices first, then enhanced for larger screens
- **Breakpoints**: Tailored for phones, tablets, and desktop computers
- **Touch-Friendly**: Large touch targets and gesture support
- **Accessibility**: Proper contrast ratios and keyboard navigation

## 💾 Data Management

### Local Storage
- **Trips**: All trip data is stored in browser localStorage
- **Persistence**: Data survives browser restarts and page reloads
- **Import/Export**: JSON-based backup and restore functionality

### Sample Data
- **20 Destinations**: Curated list of world-famous travel destinations
- **Categories**: Beach, Mountain, Historical, Nature, Wildlife, City, Desert
- **Rich Metadata**: Ratings, price levels, descriptions, and high-quality images

## 🎯 Key Functionalities

### Trip Management
1. **Create Trip**: Add new trip with name and description
2. **Edit Trip**: Modify existing trip details
3. **Delete Trip**: Remove trips with confirmation
4. **Add Places**: Add destinations to trips from any page
5. **Remove Places**: Remove destinations from trip with visual feedback
6. **Export/Import**: Backup and restore trip data

### Search & Filter
1. **Text Search**: Search by destination name, city, or description
2. **Category Filter**: Filter by destination type
3. **Rating Filter**: Filter by minimum rating (4.5+, 4.0+, etc.)
4. **Price Filter**: Filter by budget level (1-4 dollar signs)
5. **Real-time Results**: Instant filtering without page reload

### Visual Features
1. **Hero Carousel**: Auto-playing slideshow with navigation controls
2. **Image Gallery**: Masonry layout with lightbox functionality
3. **Toast Notifications**: User feedback for all actions
4. **Loading States**: Smooth transitions and feedback
5. **Responsive Images**: Optimized for different screen sizes

## 🔮 Future Roadmap

### Potential Enhancements
- **User Authentication**: Login/signup with profile management
- **Real API Integration**: Connect to travel APIs for live data
- **Social Features**: Share trips and follow other travelers
- **Advanced Mapping**: Interactive maps with route planning
- **Reviews System**: User-generated content and ratings
- **Booking Integration**: Direct booking with travel partners
- **Offline Support**: PWA features for offline functionality
- **AI Recommendations**: Personalized destination suggestions

### Technical Improvements
- **TypeScript**: Add type safety for better development experience
- **Testing Suite**: Unit and integration tests with Jest/Vitest
- **Performance**: Code splitting and lazy loading
- **SEO**: Server-side rendering with Next.js
- **Analytics**: User behavior tracking and insights
- **CDN**: Image optimization and global delivery

## 🐛 Known Issues & Limitations

- Images are loaded from external URLs (Unsplash) - may require internet connection
- No real-time data - all destinations are static sample data
- LocalStorage has browser-specific size limits
- No user authentication or multi-user support
- No backend API - all data is client-side only

## 📄 License & Credits

This is a demo project created for educational and portfolio purposes.

**Image Credits**: All images are sourced from Unsplash.com with appropriate licenses
**Icons**: Heroicons by the makers of Tailwind CSS
**Fonts**: Inter font family from Google Fonts

---

**Built with ❤️ using modern web technologies**

For questions or feedback, please refer to the project documentation or contact the development team.