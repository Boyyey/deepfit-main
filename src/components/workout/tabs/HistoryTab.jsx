// src/components/workout/tabs/HistoryTab.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Edit } from 'lucide-react';

const HistoryTab = ({ 
  workoutHistory, 
  formatTime, 
  weightUnit, 
  setCurrentTab, 
  workouts, 
  handleEditWorkout 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Workout History</h2>
      </div>

      {workoutHistory.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">You haven't completed any workouts yet.</p>
          {workouts.length > 0 && (
            <button
              onClick={() => setCurrentTab("my-workouts")}
              className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors"
            >
              Start a Workout
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {workoutHistory.map((workout, index) => {
            const startDate = new Date(workout.startTime);
            const endDate = new Date(workout.endTime);
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{workout.name}</h3>
                    <p className="text-sm text-gray-600">
                      {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-[#E8F4FF] px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4 text-[#4A90E2]" />
                      <span className="text-sm font-medium text-[#4A90E2]">
                        {formatTime(workout.duration)}
                      </span>
                    </div>
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditWorkout(workout, index)}
                      className="flex items-center gap-1 px-3 py-1 bg-[#E8F4FF] text-[#4A90E2] rounded-full hover:bg-[#D1E8FF] transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {workout.exercises.map((exercise, exerciseIndex) => {
                    const completedSets = exercise.sets.filter(set => set.completed).length;
                    return (
                      <div key={exerciseIndex} className="border-t border-gray-100 pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800">{exercise.name}</span>
                          <span className="text-sm text-gray-600">
                            {completedSets}/{exercise.sets.length} sets completed
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          {exercise.sets.map((set, setIndex) => (
                            <div 
                              key={setIndex} 
                              className={`p-2 rounded text-center ${
                                set.completed 
                                  ? 'bg-green-50 text-green-700' 
                                  : 'bg-gray-50 text-gray-500'
                              }`}
                            >
                              {set.completed ? set.actualWeight : set.weight}{weightUnit} × {set.completed ? set.actualReps : set.reps}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default HistoryTab;