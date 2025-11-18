import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './auth/AuthContext';
import HeaderWithAuth from './auth/HeaderWithAuth';
import Footer from './components/Footer';
import Home from './pages/Home';
import Browse from './pages/Browse';
import PlaceDetails from './pages/PlaceDetails';
import Trips from './pages/Trips';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Profile from './pages/Profile';
import Login from './auth/Login';
import Register from './auth/Register';
import SharedTrip from './pages/SharedTrip';

function AppWithAuth() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <HeaderWithAuth />
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Home /></motion.div>} />
                <Route path="/browse" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Browse /></motion.div>} />
                <Route path="/place/:id" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><PlaceDetails /></motion.div>} />
                <Route path="/trips" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Trips /></motion.div>} />
                <Route path="/gallery" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Gallery /></motion.div>} />
                <Route path="/about" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><About /></motion.div>} />
                {/* New sharing route using backend shareToken */}
                <Route path="/shared/:shareToken" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><SharedTrip /></motion.div>} />
                {/* Legacy encoded-share route kept for backward compatibility */}
                <Route path="/share/:token" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><SharedTrip /></motion.div>} />
                <Route path="/profile" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Profile /></motion.div>} />
                <Route path="/login" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Login /></motion.div>} />
                <Route path="/register" element={<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><Register /></motion.div>} />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default AppWithAuth;
