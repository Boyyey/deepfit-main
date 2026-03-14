import React, { useState } from 'react';
import { useWorkout } from '../WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Save, XCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const WorkoutPreview = ({ workoutData, onAction }) => {
  const { createWorkout } = useWorkout();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  if (!workoutData) {
    return null;
  }

  const handleClose = (payload = null) => {
    if (typeof onAction === 'function') {
      onAction(payload);
    }
  };

  const handleSave = () => {
    const newWorkoutPlan = createWorkout({
      ...workoutData,
      createdBy: 'Max AI Coach',
    });
    setIsSaved(true);
    handleClose(newWorkoutPlan);
    setTimeout(() => navigate('/workout'), 1200);
  };

  const handleDiscard = () => {
    handleClose(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border-2 border-[#4A90E2] rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-3 pb-3 border-b">
        <Dumbbell className="w-6 h-6 text-[#4A90E2]" />
        <div>
          <h4 className="font-bold text-lg text-gray-800">{workoutData.name || 'Workout Plan'}</h4>
          <p className="text-sm text-gray-600">AI-generated workout plan</p>
        </div>
      </div>

      {workoutData.description && (
        <p className="text-sm text-gray-700 mb-3">{workoutData.description}</p>
      )}

      <div className="max-h-48 overflow-y-auto space-y-3 pr-2 mb-4">
        {(workoutData.exercises || []).map((exercise, index) => (
          <div key={`${exercise.name}-${index}`} className="text-sm">
            <div className="font-semibold text-gray-800">{exercise.name}</div>
            <ul className="mt-1 space-y-1 text-gray-600">
              {(exercise.sets || []).map((set, setIndex) => (
                <li key={`${exercise.name}-set-${setIndex}`}>
                  Set {setIndex + 1}: {set.reps} reps @ {set.weight}{' '}
                  {set.weight === 0 ? 'bodyweight' : 'kg'}
                  {set.type ? ` (${set.type})` : ''}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        {isSaved ? (
          <div className="flex items-center gap-2 px-4 py-2 text-green-600 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            Saved! Navigating...
          </div>
        ) : (
          <>
            <button
              onClick={handleDiscard}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <XCircle className="w-5 h-5" />
              Discard
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD]"
            >
              <Save className="w-5 h-5" />
              Save to My Workouts
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default WorkoutPreview;
