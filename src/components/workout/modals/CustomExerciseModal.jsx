// src/components/workout/modals/CustomExerciseModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus } from 'lucide-react';

const CustomExerciseModal = ({ 
  showCustomExerciseModal, 
  setShowCustomExerciseModal,
  addCustomExercise
}) => {
  const [newExercise, setNewExercise] = useState({
    name: '',
    equipment: [''],
    muscleGroups: [''],
    difficulty: 'Beginner'
  });
  
  const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];
  
  const handleAddEquipment = () => {
    setNewExercise({
      ...newExercise,
      equipment: [...newExercise.equipment, '']
    });
  };
  
  const handleRemoveEquipment = (index) => {
    const updatedEquipment = [...newExercise.equipment];
    updatedEquipment.splice(index, 1);
    setNewExercise({
      ...newExercise,
      equipment: updatedEquipment
    });
  };
  
  const handleEquipmentChange = (index, value) => {
    const updatedEquipment = [...newExercise.equipment];
    updatedEquipment[index] = value;
    setNewExercise({
      ...newExercise,
      equipment: updatedEquipment
    });
  };
  
  const handleAddMuscleGroup = () => {
    setNewExercise({
      ...newExercise,
      muscleGroups: [...newExercise.muscleGroups, '']
    });
  };
  
  const handleRemoveMuscleGroup = (index) => {
    const updatedMuscleGroups = [...newExercise.muscleGroups];
    updatedMuscleGroups.splice(index, 1);
    setNewExercise({
      ...newExercise,
      muscleGroups: updatedMuscleGroups
    });
  };
  
  const handleMuscleGroupChange = (index, value) => {
    const updatedMuscleGroups = [...newExercise.muscleGroups];
    updatedMuscleGroups[index] = value;
    setNewExercise({
      ...newExercise,
      muscleGroups: updatedMuscleGroups
    });
  };
  
  const handleSave = () => {
    // Filter out empty fields
    const cleanedExercise = {
      ...newExercise,
      equipment: newExercise.equipment.filter(item => item.trim()),
      muscleGroups: newExercise.muscleGroups.filter(item => item.trim())
    };
    
    if (cleanedExercise.name.trim() && 
        cleanedExercise.equipment.length > 0 && 
        cleanedExercise.muscleGroups.length > 0) {
      addCustomExercise(cleanedExercise);
      setShowCustomExerciseModal(false);
      // Reset form
      setNewExercise({
        name: '',
        equipment: [''],
        muscleGroups: [''],
        difficulty: 'Beginner'
      });
    }
  };
  
  return (
    <AnimatePresence>
      {showCustomExerciseModal && (
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
            className="bg-white rounded-2xl overflow-hidden shadow-xl max-w-lg w-full"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Create Custom Exercise</h3>
              <button
                onClick={() => setShowCustomExerciseModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name</label>
                <input
                  type="text"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                  placeholder="e.g., Cable Hamstring Curl"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
                {newExercise.equipment.map((item, index) => (
                  <div key={`equipment-${index}`} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleEquipmentChange(index, e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="e.g., Cable Machine"
                    />
                    {newExercise.equipment.length > 1 && (
                      <button
                        onClick={() => handleRemoveEquipment(index)}
                        className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddEquipment}
                  className="flex items-center gap-1 text-sm text-[#4A90E2] hover:text-[#357ABD] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Equipment
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Muscle Groups</label>
                {newExercise.muscleGroups.map((item, index) => (
                  <div key={`muscle-${index}`} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleMuscleGroupChange(index, e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="e.g., Hamstrings"
                    />
                    {newExercise.muscleGroups.length > 1 && (
                      <button
                        onClick={() => handleRemoveMuscleGroup(index)}
                        className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddMuscleGroup}
                  className="flex items-center gap-1 text-sm text-[#4A90E2] hover:text-[#357ABD] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Muscle Group
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <div className="flex gap-2">
                  {difficultyOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setNewExercise({...newExercise, difficulty: option})}
                      className={`flex-1 p-3 rounded-lg border ${
                        newExercise.difficulty === option
                          ? 'bg-[#E8F4FF] border-[#4A90E2] text-[#4A90E2]'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCustomExerciseModal(false)}
                className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors flex items-center gap-2"
                disabled={!newExercise.name.trim()}
              >
                <Check className="w-5 h-5" />
                Create Exercise
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomExerciseModal;