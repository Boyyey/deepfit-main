import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
const WorkoutContext = createContext();

// Custom hook to use the workout context
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

// Provider component
export const WorkoutProvider = ({ children }) => {
  const [workouts, setWorkouts] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }
    
    // Only load workouts if a profile exists
    if (storedProfile) {
      const profileId = JSON.parse(storedProfile).id;
      
      const storedWorkouts = localStorage.getItem(`workouts_${profileId}`);
      if (storedWorkouts) {
        setWorkouts(JSON.parse(storedWorkouts));
      }
      
      const storedHistory = localStorage.getItem(`workout_history_${profileId}`);
      if (storedHistory) {
        setWorkoutHistory(JSON.parse(storedHistory));
      }
      
      const storedActiveWorkout = localStorage.getItem(`active_workout_${profileId}`);
      if (storedActiveWorkout) {
        setActiveWorkout(JSON.parse(storedActiveWorkout));
      }
    }
  }, []);

  // Listen for profile changes
  useEffect(() => {
    const handleProfileChange = () => {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      } else {
        setUserProfile(null);
      }
    };

    window.addEventListener('storage', handleProfileChange);
    return () => window.removeEventListener('storage', handleProfileChange);
  }, []);

  // Save workouts when they change
  useEffect(() => {
    if (userProfile && workouts.length > 0) {
      localStorage.setItem(`workouts_${userProfile.id}`, JSON.stringify(workouts));
    }
  }, [workouts, userProfile]);

  // Save workout history when it changes
  useEffect(() => {
    if (userProfile && workoutHistory.length > 0) {
      localStorage.setItem(`workout_history_${userProfile.id}`, JSON.stringify(workoutHistory));
    }
  }, [workoutHistory, userProfile]);

  // Save active workout when it changes
  useEffect(() => {
    if (userProfile) {
      if (activeWorkout) {
        localStorage.setItem(`active_workout_${userProfile.id}`, JSON.stringify(activeWorkout));
      } else {
        localStorage.removeItem(`active_workout_${userProfile.id}`);
      }
    }
  }, [activeWorkout, userProfile]);

  // Create a new workout
  const createWorkout = (workout) => {
    const newWorkout = {
      ...workout,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    setWorkouts(prev => [...prev, newWorkout]);
    return newWorkout;
  };

  // Update an existing workout
  const updateWorkout = (id, updatedData) => {
    setWorkouts(prev => 
      prev.map(workout => workout.id === id ? { ...workout, ...updatedData } : workout)
    );
  };

  // Delete a workout
  const deleteWorkout = (id) => {
    setWorkouts(prev => prev.filter(workout => workout.id !== id));
  };

  // Start a workout session
  const startWorkout = (workoutId) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return null;
    
    // Create a copy with additional tracking fields
    const workoutWithTracking = {
      ...workout,
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          completed: false,
          actualReps: 0,
          actualWeight: set.weight
        }))
      })),
      startTime: new Date().toISOString(),
      isCompleted: false
    };
    
    setActiveWorkout(workoutWithTracking);
    return workoutWithTracking;
  };

  // Complete a workout session
  const completeWorkout = () => {
    if (!activeWorkout) return;
    
    const completedWorkout = {
      ...activeWorkout,
      endTime: new Date().toISOString(),
      duration: (new Date() - new Date(activeWorkout.startTime)) / 1000,
      isCompleted: true
    };
    
    setWorkoutHistory(prev => [completedWorkout, ...prev]);
    setActiveWorkout(null);
    
    return completedWorkout;
  };

  // Update set data during an active workout
  const updateWorkoutSet = (exerciseIndex, setIndex, data) => {
    if (!activeWorkout) return;
    
    setActiveWorkout(prev => {
      const updatedWorkout = { ...prev };
      const updatedSet = { 
        ...updatedWorkout.exercises[exerciseIndex].sets[setIndex],
        ...data
      };
      
      updatedWorkout.exercises[exerciseIndex].sets[setIndex] = updatedSet;
      return updatedWorkout;
    });
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        workoutHistory,
        activeWorkout,
        userProfile,
        createWorkout,
        updateWorkout,
        deleteWorkout,
        startWorkout,
        completeWorkout,
        updateWorkoutSet,
        setActiveWorkout
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};