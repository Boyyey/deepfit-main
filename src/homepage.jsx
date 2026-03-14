import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  MessageSquare, 
  ArrowRight, 
  UserCircle, 
  Activity, 
  BarChart2, 
  TrendingUp, 
  Calendar,
  Award,
  Shield,
  Zap,
  Clock
} from 'lucide-react';

const Homepage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] to-[#D1E9FF]">
      {/* Hero Section */}
      <section aria-labelledby="hero-heading" className="container mx-auto px-4 pt-16 pb-24">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6" aria-hidden="true">
            <Dumbbell className="w-20 h-20 text-[#2B6CB0]" />
          </div>
          <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold mb-6 text-gray-800">
            Meet Tom, Your AI Fitness Coach
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your personal AI fitness trainer for tracking workouts, measuring progress, and achieving your fitness goals with personalized guidance.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* Chat with Tom Card */}
          <Link to="/chat" className="group" aria-labelledby="chat-heading">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-[#BEE3F8] hover:border-[#2B6CB0] h-full">
              <div className="flex items-center gap-4 mb-4">
                <MessageSquare className="w-8 h-8 text-[#2B6CB0]" aria-hidden="true" />
                <h2 id="chat-heading" className="text-2xl font-semibold text-gray-800">Chat with Tom</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Get personalized advice, form guidance, and expert fitness tips from your AI sports coach trained on exercise science.
              </p>
              <div className="flex items-center text-[#2B6CB0] group-hover:translate-x-2 transition-transform">
                <span className="font-medium">Start Chatting</span>
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </div>
            </div>
          </Link>

          {/* Workout Tracker Card */}
          <Link to="/workout" className="group" aria-labelledby="workout-heading">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-[#BEE3F8] hover:border-[#2B6CB0] h-full relative overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                <Dumbbell className="w-8 h-8 text-[#2B6CB0]" aria-hidden="true" />
                <h2 id="workout-heading" className="text-2xl font-semibold text-gray-800">Workout Tracker</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Create and track custom workout routines, log your sets and reps, and monitor your strength gains over time with our intelligent tracker.
              </p>
              <div className="flex items-center text-[#2B6CB0] group-hover:translate-x-2 transition-transform">
                <span className="font-medium">Start Training</span>
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </div>
            </div>
          </Link>

          {/* Progress Analytics Card - NEW */}
          <Link to="/progress" className="group" aria-labelledby="progress-heading">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-[#2B6CB0] hover:border-[#2B6CB0] h-full relative overflow-hidden">
              {/* New badge */}
              <div className="absolute top-0 right-0">
                <div className="bg-[#2B6CB0] text-white text-xs font-bold px-3 py-1 transform rotate-0 translate-x-2 -translate-y-0">
                  NEW
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <Activity className="w-8 h-8 text-[#2B6CB0]" aria-hidden="true" />
                <h2 id="progress-heading" className="text-2xl font-semibold text-gray-800">Progress Analytics</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Visualize strength gains, track personal records, and analyze workout consistency with detailed charts and body composition tracking.
              </p>
              <div className="flex items-center text-[#2B6CB0] group-hover:translate-x-2 transition-transform">
                <span className="font-medium">View Analytics</span>
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </div>
            </div>
          </Link>

          {/* Profile Creation Card */}
          <Link to="/profile" className="group" aria-labelledby="profile-heading">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-[#BEE3F8] hover:border-[#2B6CB0] h-full">
              <div className="flex items-center gap-4 mb-4">
                <UserCircle className="w-8 h-8 text-[#2B6CB0]" aria-hidden="true" />
                <h2 id="profile-heading" className="text-2xl font-semibold text-gray-800">Athlete Profile</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Customize your fitness profile with physical capabilities, equipment access, and body measurements for workouts tailored to your specific needs.
              </p>
              <div className="flex items-center text-[#2B6CB0] group-hover:translate-x-2 transition-transform">
                <span className="font-medium">Personalize Experience</span>
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </div>
            </div>
          </Link>
        </div>

        {/* Analytics Showcase Section */}
        <section aria-labelledby="analytics-heading" className="mt-20 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="analytics-heading" className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Track Your Fitness Journey</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive analytics dashboard helps you visualize progress, identify improvement opportunities, and stay motivated with data-driven insights.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#BEE3F8]">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="bg-indigo-100 p-4 rounded-full mb-4" aria-hidden="true">
                  <BarChart2 className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Visual Progress Tracking</h3>
                <p className="text-gray-600">Track how your strength improves over time with intuitive charts and exercise-specific progress reports.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-amber-100 p-4 rounded-full mb-4" aria-hidden="true">
                  <Award className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Personal Records</h3>
                <p className="text-gray-600">Celebrate achievements with automatic personal record tracking for every exercise you perform.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 p-4 rounded-full mb-4" aria-hidden="true">
                  <TrendingUp className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Body Composition</h3>
                <p className="text-gray-600">Monitor weight, body fat percentage, and measurements to track physical changes beyond just strength.</p>
              </div>
            </div>
            
            <div className="mt-10 text-center">
              <Link to="/progress" className="inline-flex items-center gap-2 px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors shadow-md">
                Explore Analytics
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section aria-labelledby="benefits-heading" className="mt-24">
          <h2 id="benefits-heading" className="sr-only">Tom AI Coach Benefits</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto text-center">
            <div className="p-6">
              <Calendar className="w-8 h-8 text-[#4A90E2] mx-auto mb-3" aria-hidden="true" />
              <h3 className="font-semibold text-lg mb-2 text-gray-800">Workout Planning</h3>
              <p className="text-gray-600">Create custom workout routines with exercises tailored to your equipment and fitness level.</p>
            </div>
            <div className="p-6">
              <MessageSquare className="w-8 h-8 text-[#4A90E2] mx-auto mb-3" aria-hidden="true" />
              <h3 className="font-semibold text-lg mb-2 text-gray-800">Form Guidance</h3>
              <p className="text-gray-600">Get expert advice on proper exercise form to maximize results and prevent injuries.</p>
            </div>
            <div className="p-6">
              <Activity className="w-8 h-8 text-[#4A90E2] mx-auto mb-3" aria-hidden="true" />
              <h3 className="font-semibold text-lg mb-2 text-gray-800">Progress Tracking</h3>
              <p className="text-gray-600">Monitor your strength gains, body composition, and workout consistency over time.</p>
            </div>
            <div className="p-6">
              <UserCircle className="w-8 h-8 text-[#4A90E2] mx-auto mb-3" aria-hidden="true" />
              <h3 className="font-semibold text-lg mb-2 text-gray-800">Personalization</h3>
              <p className="text-gray-600">Receive workouts based on your unique profile, equipment access, and fitness goals.</p>
            </div>
          </div>
        </section>

        {/* Additional Features Section */}
        <section aria-labelledby="features-heading" className="mt-20 max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-[#BEE3F8]">
          <h2 id="features-heading" className="text-2xl font-bold text-gray-800 mb-8 text-center">Powered by Advanced AI Technology</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-[#4A90E2]" aria-hidden="true" />
                <h3 className="font-semibold text-lg text-gray-800">Privacy-Focused</h3>
              </div>
              <p className="text-gray-600">Your fitness data stays on your device with local storage, ensuring your personal information remains private.</p>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-[#4A90E2]" aria-hidden="true" />
                <h3 className="font-semibold text-lg text-gray-800">Offline Capability</h3>
              </div>
              <p className="text-gray-600">Track workouts even without internet connection. Your data syncs automatically when you're back online.</p>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-[#4A90E2]" aria-hidden="true" />
                <h3 className="font-semibold text-lg text-gray-800">Real-time Feedback</h3>
              </div>
              <p className="text-gray-600">Get immediate guidance on your training with our AI-powered coach that evolves with your fitness level.</p>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <Link to="/profile" className="inline-flex items-center gap-2 px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors shadow-md">
              Get Started Today
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* About Section */}
        <section aria-labelledby="about-heading" className="mt-24 max-w-6xl mx-auto text-center">
          <h2 id="about-heading" className="sr-only">About</h2>
          <p className="text-lg text-gray-700">
            Tom AI Coach - Your Personal Fitness Assistant
          </p>
        </section>
      </section>
    </div>
  );
};

export default Homepage;