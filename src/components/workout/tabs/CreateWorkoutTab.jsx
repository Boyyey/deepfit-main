// src/components/workout/tabs/CreateWorkoutTab.jsx (updated version)
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Dumbbell, Save } from 'lucide-react';

const CreateWorkoutTab = ({ 
  newWorkout, 
  setNewWorkout, 
  handleSaveWorkout, 
  handleRemoveExercise,
  handleAddSet, 
  handleRemoveSet, 
  handleSetChange,
  setShowExerciseModal,
  setCurrentTab,
  weightUnit
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Create New Workout</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name</label>
          <input
            type="text"
            value={newWorkout.name}
            onChange={(e) => setNewWorkout(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            placeholder="My Awesome Workout"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            value={newWorkout.description}
            onChange={(e) => setNewWorkout(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            placeholder="Notes about this workout..."
            rows={2}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Exercises</label>
            <button
              onClick={() => setShowExerciseModal(true)}
              className="flex items-center gap-1 text-sm text-[#4A90E2] hover:text-[#357ABD] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Exercise
            </button>
          </div>

          {newWorkout.exercises.length === 0 ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setShowExerciseModal(true)}
            >
              <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No exercises added yet</p>
              <p className="text-sm text-gray-500">Click to add exercises to your workout</p>
            </div>
          ) : (
            <div className="space-y-4">
              {newWorkout.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-800">{exercise.name}</h3>
                    <button 
                      onClick={() => handleRemoveExercise(exerciseIndex)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600">
                            <th className="pb-3 pr-2">Set</th>
                            <th className="pb-3 pr-2">Weight</th>
                            <th className="pb-3 pr-2">Reps</th>
                            <th className="pb-3 pr-2">Type</th>
                            <th className="pb-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set, setIndex) => (
                            <tr key={setIndex}>
                              <td className="py-3 pr-2">{setIndex + 1}</td>
                              <td className="py-3 pr-2">
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={set.weight}
                                    onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                                    className="w-16 p-2 border border-gray-300 rounded"
                                  />
                                  <span className="ml-1 text-gray-500 text-xs">{weightUnit}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-2">
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={set.reps}
                                    onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', parseInt(e.target.value, 10) || 1)}
                                    className="w-16 p-2 border border-gray-300 rounded"
                                  />
                                  <span className="ml-1 text-gray-500 text-xs">reps</span>
                                </div>
                              </td>
                              <td className="py-3 pr-2">
                                <select
                                  value={set.type}
                                  onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'type', e.target.value)}
                                  className="p-2 border border-gray-300 rounded"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="warm-up">Warm-up</option>
                                  <option value="drop">Drop Set</option>
                                </select>
                              </td>
                              <td className="py-3">
                                <button 
                                  onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleAddSet(exerciseIndex)}
                        className="flex items-center gap-1 text-sm text-[#4A90E2] hover:text-[#357ABD] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Set
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            onClick={() => {
              setNewWorkout({
                name: "",
                exercises: [],
                description: ""
              });
              setCurrentTab("my-workouts");
            }}
            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveWorkout}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
            disabled={!newWorkout.name || newWorkout.exercises.length === 0}
          >
            <Save className="w-5 h-5" />
            Save Workout
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateWorkoutTab;