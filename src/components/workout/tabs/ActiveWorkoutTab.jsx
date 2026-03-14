// src/components/workout/tabs/ActiveWorkoutTab.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Pause, Play, CheckCircle, RotateCcw, Plus, Save } from 'lucide-react';

const ActiveWorkoutTab = ({ 
  activeWorkout, 
  setActiveWorkout,
  stopwatchRunning, 
  setStopwatchRunning, 
  elapsedTime, 
  formatTime, 
  handleSetCompleted, 
  handleCancelWorkout, 
  handleCompleteWorkout,
  handleAddExerciseToActiveWorkout,
  handleAddSetToActiveWorkout,
  setShowExerciseModal,
  handleSaveActiveWorkout,
  weightUnit
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 w-full"
    >
      {/* Workout title and timer section */}
      <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
        <div className="w-full sm:w-auto">
          <input
            type="text"
            value={activeWorkout.name}
            onChange={(e) => setActiveWorkout(prev => ({ ...prev, name: e.target.value }))}
            className="bg-transparent border-b border-gray-300 focus:border-[#4A90E2] focus:outline-none px-2 py-1 text-xl font-semibold w-full sm:w-auto"
            placeholder="Name your workout"
          />
          <p className="text-sm text-gray-600 mt-1">Workout in progress</p>
        </div>
        
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="flex items-center gap-2 bg-[#E8F4FF] px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 text-[#4A90E2]" />
            <span className="font-mono font-medium text-[#4A90E2]">
              {formatTime(elapsedTime)}
            </span>
          </div>
          
          <button
            onClick={() => setStopwatchRunning(!stopwatchRunning)}
            className={`p-2 rounded-full ${
              stopwatchRunning 
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            } transition-colors`}
          >
            {stopwatchRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* No exercises state */}
      {activeWorkout.exercises.length === 0 ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors w-full"
          onClick={() => setShowExerciseModal(true)}
        >
          <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No exercises added yet</p>
          <p className="text-sm text-gray-500">Click to add exercises to your workout</p>
        </div>
      ) : (
        <div className="space-y-4 w-full">
          {activeWorkout.exercises.map((exercise, exerciseIndex) => {
            const completedSets = exercise.sets.filter(set => set.completed).length;
            return (
              <div key={exerciseIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm w-full">
                <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-800">{exercise.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {completedSets}/{exercise.sets.length} sets completed
                    </span>
                  </div>
                </div>
                
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="pb-3 pr-4 whitespace-nowrap">Set</th>
                        <th className="pb-3 pr-4 whitespace-nowrap">Weight</th>
                        <th className="pb-3 pr-4 whitespace-nowrap">Reps</th>
                        <th className="pb-3 pr-4 whitespace-nowrap">Actual</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set, setIndex) => (
                        <tr key={setIndex} className={set.completed ? 'bg-green-50' : ''}>
                          <td className="py-3 pr-4 whitespace-nowrap">{setIndex + 1} {set.type !== 'normal' && `(${set.type})`}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="0"
                                value={set.actualWeight}
                                onChange={(e) => {
                                  const newActiveWorkout = { ...activeWorkout };
                                  newActiveWorkout.exercises[exerciseIndex].sets[setIndex].actualWeight = parseFloat(e.target.value) || 0;
                                  setActiveWorkout(newActiveWorkout);
                                }}
                                className={`w-16 p-2 border rounded ${
                                  set.completed ? 'border-green-300 bg-green-50' : 'border-gray-300'
                                }`}
                                disabled={set.completed}
                                placeholder="0"
                              />
                              <span className="ml-1 text-gray-500 text-xs">{weightUnit}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">{set.reps || 0}</td>
                          <td className="py-3 pr-4">
                            <input
                              type="number"
                              min="0"
                              max={99}
                              value={set.actualReps || ''}
                              onChange={(e) => {
                                const newActiveWorkout = { ...activeWorkout };
                                newActiveWorkout.exercises[exerciseIndex].sets[setIndex].actualReps = parseInt(e.target.value, 10) || 0;
                                setActiveWorkout(newActiveWorkout);
                              }}
                              className={`w-16 p-2 border rounded ${
                                set.completed ? 'border-green-300 bg-green-50' : 'border-gray-300'
                              }`}
                              placeholder="0"
                              disabled={set.completed}
                            />
                          </td>
                          <td className="py-3">
                            {set.completed ? (
                              <button
                                onClick={() => handleSetCompleted(exerciseIndex, setIndex, false, 0, set.weight)}
                                className="p-2 text-green-600 hover:text-green-700 transition-colors"
                              >
                                <RotateCcw className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSetCompleted(exerciseIndex, setIndex, true, set.actualReps || 0, set.actualWeight)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => handleAddSetToActiveWorkout(exerciseIndex)}
                      className="flex items-center gap-1 text-sm text-[#4A90E2] hover:text-[#357ABD] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Set
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Exercise Button */}
      <div className="flex justify-center w-full">
        <button
          onClick={() => setShowExerciseModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#E8F4FF] text-[#4A90E2] rounded-lg hover:bg-[#D1E8FF] transition-colors w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add Exercise
        </button>
      </div>

      {/* Footer Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        <button
          onClick={handleSaveActiveWorkout}
          className="flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-[#E8F4FF] text-[#4A90E2] rounded-lg hover:bg-[#D1E8FF] transition-colors order-2 sm:order-1"
        >
          <Save className="w-5 h-5" />
          Save as Template
        </button>
        
        <button
          onClick={handleCompleteWorkout}
          className="flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors order-1 sm:order-2"
        >
          <CheckCircle className="w-5 h-5" />
          Complete Workout
        </button>
      </div>
      
      <button
        onClick={handleCancelWorkout}
        className="px-6 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
      >
        Cancel Workout
      </button>
    </motion.div>
  );
};

export default ActiveWorkoutTab;