// src/components/workout/modals/EditHistoryModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save } from 'lucide-react';

const EditHistoryModal = ({ 
  showEditModal, 
  setShowEditModal, 
  editingWorkout,
  setEditingWorkout,
  saveEditedWorkout,
  weightUnit
}) => {
  if (!editingWorkout) return null;
  
  return (
    <AnimatePresence>
      {showEditModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl overflow-hidden shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Edit Workout History</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name</label>
                <input
                  type="text"
                  value={editingWorkout.name}
                  onChange={(e) => setEditingWorkout({...editingWorkout, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                />
              </div>
              
              <div className="space-y-6">
                {editingWorkout.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <h4 className="font-medium text-gray-800">{exercise.name}</h4>
                    </div>
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-gray-600 text-sm">
                            <th className="pb-2">Set</th>
                            <th className="pb-2">Weight ({weightUnit})</th>
                            <th className="pb-2">Reps</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set, setIndex) => (
                            <tr key={setIndex}>
                              <td className="py-2">{setIndex + 1}</td>
                              <td className="py-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={set.actualWeight || set.weight}
                                  onChange={(e) => {
                                    const updatedExercises = [...editingWorkout.exercises];
                                    updatedExercises[exerciseIndex].sets[setIndex].actualWeight = parseFloat(e.target.value) || 0;
                                    setEditingWorkout({...editingWorkout, exercises: updatedExercises});
                                  }}
                                  className="w-16 p-2 border border-gray-300 rounded"
                                />
                              </td>
                              <td className="py-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={set.actualReps || set.reps}
                                  onChange={(e) => {
                                    const updatedExercises = [...editingWorkout.exercises];
                                    updatedExercises[exerciseIndex].sets[setIndex].actualReps = parseInt(e.target.value, 10) || 0;
                                    setEditingWorkout({...editingWorkout, exercises: updatedExercises});
                                  }}
                                  className="w-16 p-2 border border-gray-300 rounded"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <button
                        onClick={() => {
                          const updatedExercises = [...editingWorkout.exercises];
                          updatedExercises[exerciseIndex].sets.push({
                            weight: 0,
                            reps: 0,
                            type: "normal",
                            completed: true,
                            actualReps: 0,
                            actualWeight: 0
                          });
                          setEditingWorkout({...editingWorkout, exercises: updatedExercises});
                        }}
                        className="flex items-center gap-1 mt-3 text-sm text-[#4A90E2] hover:text-[#357ABD] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Set
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveEditedWorkout();
                  setShowEditModal(false);
                }}
                className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditHistoryModal;