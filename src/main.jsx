import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Homepage from './homepage';
import AIChatAssistant from './AIChatAssistant';
import ProfileCreation from './ProfileCreation';
import NavigationMenu from './components/NavigationMenu';
import WorkoutPage from './pages/WorkoutPage';
import ProgressPage from './pages/ProgressPage';
import { WorkoutProvider } from './WorkoutContext';
import { ArtifactPanelProvider } from './context/ArtifactPanelContext';
import MobileAppInstallBanner from './components/MobileAppInstallBanner';
import WorkoutArtifactPanel from './components/workout/WorkoutArtifactPanel';

// Meta tag component for SEO
const PageTitle = () => {
  const location = useLocation();
  
  // Define page-specific meta information
  const getPageMeta = () => {
    const path = location.pathname;
    
    const baseMeta = {
      title: "Max AI Coach - Personal AI Fitness Trainer | Jordan Montée (AlikelDev)",
      description: "Transform your fitness journey with Max AI Coach. Get personalized workouts, form analysis, and expert guidance tailored to your fitness level.",
      keywords: "AI fitness coach, personal trainer, workout tracker, strength training"
    };
    
    switch (path) {
      case '/':
        return {
          ...baseMeta,
          title: "Max AI Coach - AI-Powered Fitness Training | Alikearn Studio",
          description: "Your personal AI fitness trainer for customized workouts, form analysis, and progress tracking. Transform your fitness journey today.",
          keywords: "AI fitness coach, personal trainer, workout planner, fitness app"
        };
      case '/chat':
        return {
          ...baseMeta,
          title: "Chat with Max - AI Fitness Advice | Max AI Coach",
          description: "Get real-time fitness advice, form guidance, and personalized workout help from Max, your AI fitness coach.",
          keywords: "AI fitness advice, workout guidance, exercise form, fitness help"
        };
      case '/workout':
        return {
          ...baseMeta,
          title: "Workout Tracker & Planner | Max AI Coach",
          description: "Create, track, and optimize your workout routines with intelligent exercise tracking and form guidance.",
          keywords: "workout tracker, fitness planner, strength training log, exercise tracker"
        };
      case '/profile':
        return {
          ...baseMeta,
          title: "Athlete Profile Setup | Max AI Coach",
          description: "Customize your fitness profile for personalized workout recommendations based on your goals and equipment.",
          keywords: "fitness profile, athlete settings, workout personalization"
        };
      case '/progress':
        return {
          ...baseMeta,
          title: "Fitness Progress Analytics | Max AI Coach",
          description: "Track your fitness journey with detailed analytics, progress charts, and body composition tracking.",
          keywords: "fitness analytics, workout progress, strength gains, body composition"
        };
      default:
        return baseMeta;
    }
  };
  
  const meta = getPageMeta();
  
  // Generate structured data for current page
  const getStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": meta.title,
      "description": meta.description
    };
    
    if (location.pathname === '/') {
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Max AI Coach",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "AI personal trainer providing personalized workouts and form analysis"
      });
    }
    
    return JSON.stringify(baseData);
  };
  
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={`https://max-ai-coach.com${location.pathname}`} />
      <link rel="canonical" href={`https://max-ai-coach.com${location.pathname}`} />
      <script type="application/ld+json">{getStructuredData()}</script>
    </Helmet>
  );
};

// Register service worker
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Request notification permission
        if ('Notification' in window) {
          Notification.requestPermission();
        }
        
        // Register for periodic sync if available
        if ('periodicSync' in registration) {
          try {
            await registration.periodicSync.register('sync-workouts', {
              minInterval: 24 * 60 * 60 * 1000 // Once a day
            });
            console.log('Periodic sync registered');
          } catch (error) {
            console.error('Periodic sync registration failed:', error);
          }
        }
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
      }
    });
  }
};

const App = () => {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();
    
    // Track page views for analytics
    const trackPageView = () => {
      const pageViews = JSON.parse(localStorage.getItem('max_coach_page_views') || '{}');
      const path = window.location.pathname;
      
      pageViews[path] = (pageViews[path] || 0) + 1;
      localStorage.setItem('max_coach_page_views', JSON.stringify(pageViews));
      
      // Here you would normally send to an analytics service
      console.log('Page view:', path);
    };
    
    // Track initial page view
    trackPageView();
    
    // Set up page view tracking
    const originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      trackPageView();
    };
    
    return () => {
      // Restore original history.pushState
      history.pushState = originalPushState;
    };
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <WorkoutProvider>
          <ArtifactPanelProvider>
            <div className="flex flex-col min-h-screen">
            <PageTitle />
            <NavigationMenu />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/chat" element={
                  <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <AIChatAssistant />
                  </div>
                } />
                <Route path="/workout" element={<WorkoutPage />} />
                <Route path="/profile" element={<ProfileCreation />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="*" element={
                  <div className="container mx-auto px-4 py-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
                    <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
                    <a href="/" className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors">
                      Return Home
                    </a>
                  </div>
                } />
              </Routes>
            </main>
            <MobileAppInstallBanner />
            <footer className="py-6 bg-[#D1E8FF] mt-auto">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <p className="text-sm text-gray-700 mb-4 md:mb-0">
                      <strong>Max AI Coach</strong> - Your personal AI fitness trainer developed by 
                      <a href="https://github.com/AliKelDev" className="text-[#4A90E2] hover:underline ml-1">Jordan Montée (AlikelDev)</a>
                    </p>
                    <div className="flex space-x-4">
                      <a href="https://deep-chef.netlify.app/" className="text-sm text-[#4A90E2] hover:underline">DeepChef</a>
                      <a href="https://pixelle3-alikearn.com/" className="text-sm text-[#4A90E2] hover:underline">Pixelle3</a>
                      <a href="https://linkforge-alikeldev.netlify.app/" className="text-sm text-[#4A90E2] hover:underline">LinkForge</a>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center md:text-left">
                    Max AI Coach offers personalized workout plans, strength training guidance, progress tracking and analytics, 
                    form analysis, and body composition monitoring for fitness enthusiasts of all levels.
                  </p>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    © 2023-2025 Alikearn Studio. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
            <WorkoutArtifactPanel />
            </div>
          </ArtifactPanelProvider>
        </WorkoutProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container element not found');
}

let root = window.__MAX_ROOT__ || null;
if (!root) {
  root = ReactDOM.createRoot(container);
  window.__MAX_ROOT__ = root;
}

console.log('[main] rendering app with existing root:', Boolean(window.__MAX_ROOT__));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
