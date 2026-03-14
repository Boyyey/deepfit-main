// src/components/workout/modals/ExerciseSelectionModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell, Plus } from 'lucide-react';

const ExerciseSelectionModal = ({ 
  showExerciseModal, 
  setShowExerciseModal, 
  selectedCategory, 
  setSelectedCategory, 
  handleAddExercise, 
  EXERCISE_DATABASE,
  setShowCustomExerciseModal,
  isExerciseDataLoading,
  exerciseDataError
}) => {
  const categories = Object.keys(EXERCISE_DATABASE || {});
  const selectedExercises = selectedCategory && EXERCISE_DATABASE
    ? EXERCISE_DATABASE[selectedCategory] || []
    : [];
  const isCategorySelected = Boolean(selectedCategory);

  const renderExerciseContent = () => {
    if (exerciseDataError) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500 font-medium">{exerciseDataError}</p>
          <p className="text-sm text-gray-500 mt-2">
            You can still create custom exercises for your plan.
          </p>
        </div>
      );
    }

    if (isExerciseDataLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading exercise library…</p>
        </div>
      );
    }

    if (isCategorySelected && selectedExercises.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">No exercises are available for this category yet.</p>
        </div>
      );
    }

    if (isCategorySelected) {
      return selectedExercises.map((exercise, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => handleAddExercise(exercise)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-800">{exercise.name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                Target: {exercise.muscleGroups.join(', ')}
              </p>
            </div>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {exercise.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-[#E8F4FF] text-[#4A90E2] rounded-full">
              {exercise.equipment.join(', ')}
            </span>
          </div>
        </div>
      ));
    }

    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Select a muscle group to view exercises</p>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {showExerciseModal && (
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
              <h3 className="text-xl font-semibold text-gray-800">Add Exercise</h3>
              <button
                onClick={() => setShowExerciseModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                {/* Custom Exercise Button */}
                <button
                  onClick={() => {
                    setShowExerciseModal(false);
                    setShowCustomExerciseModal(true);
                  }}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-[#E8F4FF] text-[#4A90E2] hover:bg-[#D1E8FF] flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Create Custom
                </button>

                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      category === selectedCategory
                        ? 'bg-[#4A90E2] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {renderExerciseContent()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExerciseSelectionModal;
