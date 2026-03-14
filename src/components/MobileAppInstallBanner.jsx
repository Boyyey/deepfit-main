import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronRight, Dumbbell, Activity, UserCircle } from 'lucide-react';

const MobileAppInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installSource, setInstallSource] = useState('auto'); // 'auto' or 'manual'
  
  useEffect(() => {
    // Check if user is on mobile
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check if the app is already installed (in standalone mode or PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');
    
    // Only show banner if on mobile and not already installed
    if (isMobile && !isStandalone) {
      // Check for returning users (more aggressive promotion)
      const isReturningUser = localStorage.getItem('max_coach_visited');
      const lastPrompt = localStorage.getItem('max_coach_last_prompt');
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Set as visited
      localStorage.setItem('max_coach_visited', 'true');
      
      // Wait before showing the banner (shorter time for returning users)
      const timer = setTimeout(() => {
        setShowBanner(true);
        setInstallSource('auto');
        localStorage.setItem('max_coach_last_prompt', currentDate);
      }, isReturningUser && lastPrompt !== currentDate ? 1500 : 3000);
      
      return () => clearTimeout(timer);
    }
    
    // Listen for beforeinstallprompt event to capture the deferred prompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the banner
      setShowBanner(true);
      setInstallSource('browser');
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Handle the install action
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      // We've used the prompt, and can't use it again, discard it
      setDeferredPrompt(null);
      
      // Analytics
      const installAction = {
        outcome,
        source: installSource,
        timestamp: new Date().toISOString()
      };
      
      // Save install attempt data locally
      const attempts = JSON.parse(localStorage.getItem('max_coach_install_attempts') || '[]');
      attempts.push(installAction);
      localStorage.setItem('max_coach_install_attempts', JSON.stringify(attempts));
      
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      setShowBanner(false);
      // If iOS, show a hint how to add to home screen
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isIOS) {
        alert("To install Max AI Coach on your iOS device: tap the share icon at the bottom of your screen, then 'Add to Home Screen'. You'll get full-screen experience and offline access to your workout data.");
      }
    }
  };
  
  if (!showBanner) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl z-50"
        role="alert"
        aria-labelledby="install-banner-title"
      >
        <div className="p-4 flex items-center">
          <div className="mr-4">
            <div className="bg-[#4A90E2] text-white p-2 rounded-full">
              <Download className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 id="install-banner-title" className="font-semibold text-gray-800">Install Max AI Coach</h3>
            <p className="text-sm text-gray-600">Add to home screen for offline access, workout tracking, and progress analytics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowBanner(false)} 
              className="p-2 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss installation prompt"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
            
            <button 
              onClick={handleInstallClick}
              className="bg-[#4A90E2] text-white px-4 py-2 rounded-lg flex items-center gap-1"
              aria-label="Install Max AI Coach as a home screen app"
            >
              Install <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        
        <div className="px-4 pb-3 flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
          <div className="flex items-center">
            <Dumbbell className="w-3 h-3 mr-1" aria-hidden="true" />
            <span>Workout tracking</span>
          </div>
          <div className="flex items-center">
            <Activity className="w-3 h-3 mr-1" aria-hidden="true" />
            <span>Progress analytics</span>
          </div>
          <div className="flex items-center">
            <UserCircle className="w-3 h-3 mr-1" aria-hidden="true" />
            <span>Offline access</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileAppInstallBanner;