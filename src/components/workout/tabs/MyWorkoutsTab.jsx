// src/components/workout/tabs/MyWorkoutsTab.jsx (updated version)
import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Plus, Play, Trash2 } from 'lucide-react';

const MyWorkoutsTab = ({ workouts, handleStartWorkout, handleDeleteWorkout, setCurrentTab, handleQuickStartWorkout }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Your Workout Plans</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleQuickStartWorkout}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors"
          >
            <Play className="w-5 h-5" />
            Quick Start
          </button>
          <button
            onClick={() => setCurrentTab("create")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-[#E8F4FF] text-[#4A90E2] rounded-lg hover:bg-[#D1E8FF] transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Plan
          </button>
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">You haven't created any workout plans yet.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleQuickStartWorkout}
              className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors"
            >
              Quick Start Workout
            </button>
            <button
              onClick={() => setCurrentTab("create")}
              className="px-6 py-3 bg-[#E8F4FF] text-[#4A90E2] rounded-lg hover:bg-[#D1E8FF] transition-colors"
            >
              Create a Workout Plan
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map(workout => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-800">{workout.name}</h3>
                  <button 
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                </p>
                {workout.description && (
                  <p className="text-gray-500 text-sm mt-2">{workout.description}</p>
                )}
              </div>
              
              <div className="p-4 bg-gray-50">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Exercises:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {workout.exercises.slice(0, 3).map((exercise, index) => (
                      <li key={index}>{exercise.name} ({exercise.sets.length} sets)</li>
                    ))}
                    {workout.exercises.length > 3 && (
                      <li className="text-gray-500">+{workout.exercises.length - 3} more...</li>
                    )}
                  </ul>
                </div>
                
                <button
                  onClick={() => handleStartWorkout(workout)}
                  className="w-full mt-2 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Workout
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyWorkoutsTab;