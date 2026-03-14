// src/components/workout/TabNavigation.jsx
import React from 'react';

const TabNavigation = ({ currentTab, setCurrentTab, activeWorkout }) => {
  return (
    <div className="flex border-b border-gray-200">
      <button
        className={`flex-1 py-4 px-6 font-medium transition-colors ${
          currentTab === "my-workouts" ? "text-[#4A90E2] border-b-2 border-[#4A90E2]" : "text-gray-600 hover:bg-gray-50"
        }`}
        onClick={() => setCurrentTab("my-workouts")}
      >
        My Workouts
      </button>
      <button
        className={`flex-1 py-4 px-6 font-medium transition-colors ${
          currentTab === "create" ? "text-[#4A90E2] border-b-2 border-[#4A90E2]" : "text-gray-600 hover:bg-gray-50"
        }`}
        onClick={() => setCurrentTab("create")}
      >
        Create Workout
      </button>
      <button
        className={`flex-1 py-4 px-6 font-medium transition-colors ${
          currentTab === "history" ? "text-[#4A90E2] border-b-2 border-[#4A90E2]" : "text-gray-600 hover:bg-gray-50"
        }`}
        onClick={() => setCurrentTab("history")}
      >
        History
      </button>
      {activeWorkout && (
        <button
          className={`flex-1 py-4 px-6 font-medium transition-colors ${
            currentTab === "active" ? "text-[#4A90E2] border-b-2 border-[#4A90E2]" : "text-red-500 hover:bg-red-50"
          }`}
          onClick={() => setCurrentTab("active")}
        >
          Active Workout
        </button>
      )}
    </div>
  );
};

export default TabNavigation;