// src/components/workout/Header.jsx
import React from 'react';
import { Dumbbell, MessageSquare } from 'lucide-react';

const Header = ({ userProfile, setShowChatModal, weightUnit, setWeightUnit }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#E8F4FF] p-3 rounded-full">
            <Dumbbell className="w-8 h-8 text-[#4A90E2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Workout Tracker</h1>
            <p className="text-gray-600">Hey {userProfile?.name}, let's crush your fitness goals!</p>
          </div>
          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-l-lg ${weightUnit === 'lbs' ? 'bg-[#4A90E2] text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setWeightUnit('lbs')}
                  style={{cursor: 'pointer'}}>
              lbs
            </span>
            <span className={`px-3 py-1 rounded-r-lg ${weightUnit === 'kg' ? 'bg-[#4A90E2] text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setWeightUnit('kg')}
                  style={{cursor: 'pointer'}}>
              kg
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setShowChatModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          Ask Max
        </button>
      </div>
    </div>
  );
};

export default Header;