// src/pages/WorkoutPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import Header from '../components/workout/Header';
import TabNavigation from '../components/workout/TabNavigation';
import MyWorkoutsTab from '../components/workout/tabs/MyWorkoutsTab';
import CreateWorkoutTab from '../components/workout/tabs/CreateWorkoutTab';
import HistoryTab from '../components/workout/tabs/HistoryTab';
import ActiveWorkoutTab from '../components/workout/tabs/ActiveWorkoutTab.jsx';
import ExerciseSelectionModal from '../components/workout/modals/ExerciseSelectionModal';
import CustomExerciseModal from '../components/workout/modals/CustomExerciseModal';
import QuickChatModal from '../components/workout/modals/QuickChatModal';

// Import the exercise database

const WorkoutPage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [currentTab, setCurrentTab] = useState("my-workouts");
  
  // Updated timer implementation
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [pausedTime, setPausedTime] = useState(0); // Store accumulated time when paused
  const [displayTime, setDisplayTime] = useState(0);
  const timerInterval = useRef(null);
  
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [quickMessage, setQuickMessage] = useState("");
  const [selectedWorkoutForChat, setSelectedWorkoutForChat] = useState(null);
  const [workoutSelectOpen, setWorkoutSelectOpen] = useState(false);
  const [weightUnit, setWeightUnit] = useState('lbs');
  const [isAddingSet, setIsAddingSet] = useState(false);
  const [exerciseDatabase, setExerciseDatabase] = useState({});
  const [exerciseDataError, setExerciseDataError] = useState(null);
  const [isExerciseDataLoading, setIsExerciseDataLoading] = useState(true);

  // New workout form state
  const [newWorkout, setNewWorkout] = useState({
    name: "",
    exercises: [],
    description: ""
  });

  // Load user profile and workouts from localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }

    const storedWorkouts = localStorage.getItem(`workouts_${JSON.parse(storedProfile)?.id}`);
    if (storedWorkouts) {
      setWorkouts(JSON.parse(storedWorkouts));
    }

    const storedHistory = localStorage.getItem(`workout_history_${JSON.parse(storedProfile)?.id}`);
    if (storedHistory) {
      setWorkoutHistory(JSON.parse(storedHistory));
    }
    
    // Load active workout and timer state
    const profileId = JSON.parse(storedProfile)?.id;
    if (profileId) {
      const storedActiveWorkout = localStorage.getItem(`active_workout_${profileId}`);
      if (storedActiveWorkout) {
        setActiveWorkout(JSON.parse(storedActiveWorkout));
        
        // Restore timer state
        const storedStartTime = localStorage.getItem(`workout_start_time_${profileId}`);
        const storedPausedTime = localStorage.getItem(`workout_paused_time_${profileId}`);
        const storedTimerRunning = localStorage.getItem(`workout_timer_running_${profileId}`);
        
        if (storedStartTime && storedTimerRunning === 'true') {
          setWorkoutStartTime(parseInt(storedStartTime, 10));
          setPausedTime(parseInt(storedPausedTime || '0', 10));
          setStopwatchRunning(true);
          setCurrentTab("active");
        } else if (storedPausedTime) {
          setPausedTime(parseInt(storedPausedTime, 10));
          setDisplayTime(parseInt(storedPausedTime, 10));
          setCurrentTab("active");
        }
      }
    }
  }, []);

  useEffect(() => {
    const loadExerciseDatabase = async () => {
      try {
        const response = await fetch('/exercises.json', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load exercises: ${response.status}`);
        }
        const data = await response.json();
        setExerciseDatabase(data);
        setExerciseDataError(null);
      } catch (error) {
        console.error('Failed to load exercise database:', error);
        setExerciseDataError('Unable to load the exercise library. You can still create custom entries.');
      } finally {
        setIsExerciseDataLoading(false);
      }
    };

    loadExerciseDatabase();
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
    if (userProfile && activeWorkout) {
      localStorage.setItem(`active_workout_${userProfile.id}`, JSON.stringify(activeWorkout));
    } else if (userProfile) {
      localStorage.removeItem(`active_workout_${userProfile.id}`);
    }
  }, [activeWorkout, userProfile]);
  
  // Save timer state
  useEffect(() => {
    if (!userProfile) return;
    
    if (workoutStartTime) {
      localStorage.setItem(`workout_start_time_${userProfile.id}`, workoutStartTime.toString());
    } else {
      localStorage.removeItem(`workout_start_time_${userProfile.id}`);
    }
    
    localStorage.setItem(`workout_paused_time_${userProfile.id}`, pausedTime.toString());
    localStorage.setItem(`workout_timer_running_${userProfile.id}`, stopwatchRunning.toString());
  }, [workoutStartTime, pausedTime, stopwatchRunning, userProfile]);

  // Updated timer logic using timestamps
  useEffect(() => {
    if (stopwatchRunning && workoutStartTime) {
      // Update the display time immediately
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - workoutStartTime) / 1000) + pausedTime;
        setDisplayTime(elapsed);
      };
      
      // Initial update
      updateTimer();
      
      // Then set up the interval to update the display
      timerInterval.current = setInterval(updateTimer, 1000);
    } else {
      clearInterval(timerInterval.current);
    }

    return () => clearInterval(timerInterval.current);
  }, [stopwatchRunning, workoutStartTime, pausedTime]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format workout data to a readable string for Max
  const formatWorkoutForAI = (workout) => {
    if (!workout) return "";
    
    const startDate = new Date(workout.startTime);
    let formattedData = `Workout: ${workout.name}\n`;
    formattedData += `Date: ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
    formattedData += `Duration: ${formatTime(workout.duration)}\n\n`;
    
    workout.exercises.forEach((exercise, index) => {
      const completedSets = exercise.sets.filter(set => set.completed).length;
      formattedData += `Exercise ${index + 1}: ${exercise.name} (${completedSets}/${exercise.sets.length} sets completed)\n`;
      
      exercise.sets.forEach((set, setIndex) => {
        const setType = set.type !== 'normal' ? ` (${set.type})` : '';
        if (set.completed) {
          formattedData += `  Set ${setIndex + 1}${setType}: ${set.actualWeight}${weightUnit} × ${set.actualReps} reps\n`;
        } else {
          formattedData += `  Set ${setIndex + 1}${setType}: ${set.weight}${weightUnit} × ${set.reps} reps (not completed)\n`;
        }
      });
      formattedData += '\n';
    });
    
    return formattedData;
  };

  // Toggle timer
  const toggleStopwatch = () => {
    if (stopwatchRunning) {
      // Pause: store accumulated time
      const currentElapsed = Math.floor((Date.now() - workoutStartTime) / 1000) + pausedTime;
      setPausedTime(currentElapsed);
      setDisplayTime(currentElapsed);
      setWorkoutStartTime(null);
      setStopwatchRunning(false);
    } else {
      // Resume: start a new reference time, keeping the accumulated paused time
      setWorkoutStartTime(Date.now());
      setStopwatchRunning(true);
    }
  };

  // Quick Start Workout functionality
  const handleQuickStartWorkout = () => {
    // Create an empty workout with today's date
    const today = new Date();
    const formattedDate = today.toLocaleDateString();
    
    const emptyWorkout = {
      id: Date.now().toString(),
      name: `Workout - ${formattedDate}`,
      exercises: [],
      description: "",
      startTime: today.toISOString(),
      isCompleted: false
    };
    
    // Reset and start the timer
    setPausedTime(0);
    setWorkoutStartTime(Date.now());
    setStopwatchRunning(true);
    
    // Set as active workout
    setActiveWorkout(emptyWorkout);
    setCurrentTab("active");
  };

  const handleStartWorkout = (workout) => {
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
    
    // Reset and start the timer
    setPausedTime(0);
    setWorkoutStartTime(Date.now());
    setStopwatchRunning(true);
    
    setActiveWorkout(workoutWithTracking);
    setCurrentTab("active");
  };

  const handleCompleteWorkout = () => {
    if (!activeWorkout) return;
    
    // Calculate total duration
    const totalDuration = stopwatchRunning
      ? Math.floor((Date.now() - workoutStartTime) / 1000) + pausedTime
      : pausedTime;
    
    // Create a history entry
    const completedWorkout = {
      ...activeWorkout,
      endTime: new Date().toISOString(),
      duration: totalDuration,
      isCompleted: true
    };
    
    setWorkoutHistory(prev => [completedWorkout, ...prev]);
    setActiveWorkout(null);
    setStopwatchRunning(false);
    setWorkoutStartTime(null);
    setPausedTime(0);
    setDisplayTime(0);
    setCurrentTab("my-workouts");
    
    // Clean up localStorage timer values
    if (userProfile) {
      localStorage.removeItem(`workout_start_time_${userProfile.id}`);
      localStorage.removeItem(`workout_paused_time_${userProfile.id}`);
      localStorage.removeItem(`workout_timer_running_${userProfile.id}`);
    }
  };

  const handleCancelWorkout = () => {
    if (confirm("Are you sure you want to cancel this workout? Progress will not be saved.")) {
      setActiveWorkout(null);
      setStopwatchRunning(false);
      setWorkoutStartTime(null);
      setPausedTime(0);
      setDisplayTime(0);
      setCurrentTab("my-workouts");
      
      // Clean up localStorage timer values
      if (userProfile) {
        localStorage.removeItem(`workout_start_time_${userProfile.id}`);
        localStorage.removeItem(`workout_paused_time_${userProfile.id}`);
        localStorage.removeItem(`workout_timer_running_${userProfile.id}`);
      }
    }
  };

  const handleSetCompleted = (exerciseIndex, setIndex, completed, actualReps, actualWeight) => {
    setActiveWorkout(prev => {
      const newWorkout = { ...prev };
      newWorkout.exercises[exerciseIndex].sets[setIndex].completed = completed;
      newWorkout.exercises[exerciseIndex].sets[setIndex].actualReps = actualReps;
      newWorkout.exercises[exerciseIndex].sets[setIndex].actualWeight = actualWeight;
      return newWorkout;
    });
  };

  const handleAddExercise = (exercise) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        name: exercise.name,
        sets: [{ reps: 10, weight: 0, type: 'normal' }],
        notes: "",
        equipment: exercise.equipment,
        muscleGroups: exercise.muscleGroups
      }]
    }));
    setShowExerciseModal(false);
  };

  const handleAddExerciseToActiveWorkout = (exercise) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        exercises: [...prev.exercises, {
          name: exercise.name,
          sets: [{ 
            reps: 10, 
            weight: 0, 
            type: 'normal',
            completed: false,
            actualReps: 0,
            actualWeight: 0
          }],
          notes: "",
          equipment: exercise.equipment,
          muscleGroups: exercise.muscleGroups
        }]
      };
    });
    setShowExerciseModal(false);
  };

  const handleAddCustomExercise = (customExercise) => {
    // Add the custom exercise to either the active workout or new workout being created
    if (activeWorkout) {
      handleAddExerciseToActiveWorkout(customExercise);
    } else {
      handleAddExercise(customExercise);
    }
  };

  const handleRemoveExercise = (index) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleAddSet = (exerciseIndex) => {
    if (isAddingSet) return; // Prevent multiple rapid clicks
    
    setIsAddingSet(true);
    
    setNewWorkout(prev => {
      const newExercises = [...prev.exercises];
      const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
      newExercises[exerciseIndex].sets.push({
        reps: lastSet.reps,
        weight: lastSet.weight,
        type: lastSet.type
      });
      return { ...prev, exercises: newExercises };
    });
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsAddingSet(false);
    }, 300);
  };

  const handleAddSetToActiveWorkout = (exerciseIndex) => {
    if (isAddingSet) return; 
    
    setIsAddingSet(true);
    
    setActiveWorkout(prev => {
      const newExercises = [...prev.exercises];
      const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
      newExercises[exerciseIndex].sets.push({
        reps: lastSet.reps,
        weight: lastSet.weight,
        type: lastSet.type,
        completed: false,
        actualReps: 0,
        actualWeight: lastSet.weight
      });
      return { ...prev, exercises: newExercises };
    });
    
    setTimeout(() => {
      setIsAddingSet(false);
    }, 300);
  };

  const handleRemoveSet = (exerciseIndex, setIndex) => {
    setNewWorkout(prev => {
      const newExercises = [...prev.exercises];
      if (newExercises[exerciseIndex].sets.length > 1) {
        newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
      }
      return { ...prev, exercises: newExercises };
    });
  };

  const handleSetChange = (exerciseIndex, setIndex, field, value) => {
    setNewWorkout(prev => {
      const newExercises = [...prev.exercises];
      newExercises[exerciseIndex].sets[setIndex][field] = value;
      return { ...prev, exercises: newExercises };
    });
  };

  const handleSaveWorkout = () => {
    if (!newWorkout.name.trim()) {
      alert("Please give your workout a name");
      return;
    }
  
    if (newWorkout.exercises.length === 0) {
      alert("Please add at least one exercise to your workout");
      return;
    }
  
    const workoutToSave = {
      ...newWorkout,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
  
    // First update state
    const updatedWorkouts = [...workouts, workoutToSave];
    setWorkouts(updatedWorkouts);
    
    // Save to localStorage immediately to avoid race conditions
    if (userProfile) {
      localStorage.setItem(`workouts_${userProfile.id}`, JSON.stringify(updatedWorkouts));
    }
    
    // Reset form and switch tabs
    setNewWorkout({
      name: "",
      exercises: [],
      description: ""
    });
    setCurrentTab("my-workouts");
  };

  const handleSaveActiveWorkout = () => {
    if (!activeWorkout) return;
    
    // Create a template version of the active workout
    const workoutToSave = {
      name: activeWorkout.name,
      exercises: activeWorkout.exercises.map(exercise => ({
        name: exercise.name,
        sets: exercise.sets.map(set => ({
          reps: set.actualReps || set.reps,
          weight: set.actualWeight || set.weight,
          type: set.type
        })),
        notes: exercise.notes,
        equipment: exercise.equipment,
        muscleGroups: exercise.muscleGroups
      })),
      description: activeWorkout.description,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
  
    const updatedWorkouts = [...workouts, workoutToSave];
    setWorkouts(updatedWorkouts);
    
    // Save to localStorage
    if (userProfile) {
      localStorage.setItem(`workouts_${userProfile.id}`, JSON.stringify(updatedWorkouts));
    }
    
    // Show confirmation to user
    alert("Workout saved to your templates!");
  };

  const handleDeleteWorkout = (workoutId) => {
    if (confirm("Are you sure you want to delete this workout?")) {
      setWorkouts(prev => prev.filter(workout => workout.id !== workoutId));
    }
  };

  const handleChatWithMax = () => {
    // Prepare data to pass to the chat screen
    const chatData = {
      message: quickMessage.trim(),
      workout: selectedWorkoutForChat ? {
        name: selectedWorkoutForChat.name,
        date: new Date(selectedWorkoutForChat.startTime).toLocaleDateString(),
        time: new Date(selectedWorkoutForChat.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: formatTime(selectedWorkoutForChat.duration),
        exercises: selectedWorkoutForChat.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets.length,
          completed: ex.sets.filter(set => set.completed).length
        }))
      } : null,
      workoutDetails: selectedWorkoutForChat ? formatWorkoutForAI(selectedWorkoutForChat) : ""
    };
    
    // Navigate to chat with this data
    navigate('/chat', { state: chatData });
    
    // Reset the modal state
    setShowChatModal(false);
    setSelectedWorkoutForChat(null);
    setQuickMessage("");
  };

  // If no profile exists, show redirect to profile creation
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] to-[#D1E9FF] py-12 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-[#E8F4FF] rounded-full mx-auto flex items-center justify-center mb-6">
            <Dumbbell className="w-12 h-12 text-[#4A90E2]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Create Your Profile</h1>
          <p className="text-gray-600 mb-6">
            Before you can start training, you need to create an athlete profile. This helps Max personalize your workouts.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg font-medium hover:bg-[#357ABD] transition-colors shadow-md mx-auto"
          >
            Create Profile
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] to-[#D1E9FF]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <Header 
          userProfile={userProfile}
          setShowChatModal={setShowChatModal}
          weightUnit={weightUnit}
          setWeightUnit={setWeightUnit}
        />

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 w-full">
          <TabNavigation 
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            activeWorkout={activeWorkout}
          />

          {/* Tab Content */}
          <div className="p-4 sm:p-6 w-full flex">
            <div className="w-full">
              {currentTab === "my-workouts" && (
                <MyWorkoutsTab 
                  workouts={workouts}
                  handleStartWorkout={handleStartWorkout}
                  handleDeleteWorkout={handleDeleteWorkout}
                  setCurrentTab={setCurrentTab}
                  handleQuickStartWorkout={handleQuickStartWorkout}
                />
              )}

              {currentTab === "create" && (
                <CreateWorkoutTab 
                  newWorkout={newWorkout}
                  setNewWorkout={setNewWorkout}
                  handleSaveWorkout={handleSaveWorkout}
                  handleRemoveExercise={handleRemoveExercise}
                  handleAddSet={handleAddSet}
                  handleRemoveSet={handleRemoveSet}
                  handleSetChange={handleSetChange}
                  setShowExerciseModal={setShowExerciseModal}
                  setCurrentTab={setCurrentTab}
                  weightUnit={weightUnit}
                />
              )}

              {currentTab === "history" && (
                <HistoryTab 
                  workoutHistory={workoutHistory}
                  formatTime={formatTime}
                  weightUnit={weightUnit}
                  setCurrentTab={setCurrentTab}
                  workouts={workouts}
                />
              )}

              {currentTab === "active" && activeWorkout && (
                <ActiveWorkoutTab 
                  activeWorkout={activeWorkout}
                  setActiveWorkout={setActiveWorkout}
                  stopwatchRunning={stopwatchRunning}
                  setStopwatchRunning={toggleStopwatch} // Use the new toggle function
                  elapsedTime={displayTime} // Use the new display time
                  formatTime={formatTime}
                  handleSetCompleted={handleSetCompleted}
                  handleCancelWorkout={handleCancelWorkout}
                  handleCompleteWorkout={handleCompleteWorkout}
                  handleAddExerciseToActiveWorkout={handleAddExerciseToActiveWorkout}
                  handleAddSetToActiveWorkout={handleAddSetToActiveWorkout}
                  setShowExerciseModal={setShowExerciseModal}
                  handleSaveActiveWorkout={handleSaveActiveWorkout}
                  weightUnit={weightUnit}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExerciseSelectionModal 
        showExerciseModal={showExerciseModal}
        setShowExerciseModal={setShowExerciseModal}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        handleAddExercise={activeWorkout ? handleAddExerciseToActiveWorkout : handleAddExercise}
        EXERCISE_DATABASE={exerciseDatabase}
        setShowCustomExerciseModal={setShowCustomExerciseModal}
        isExerciseDataLoading={isExerciseDataLoading}
        exerciseDataError={exerciseDataError}
      />

      <CustomExerciseModal 
        showCustomExerciseModal={showCustomExerciseModal}
        setShowCustomExerciseModal={setShowCustomExerciseModal}
        addCustomExercise={handleAddCustomExercise}
      />

      <QuickChatModal 
        showChatModal={showChatModal}
        setShowChatModal={setShowChatModal}
        workoutSelectOpen={workoutSelectOpen}
        setWorkoutSelectOpen={setWorkoutSelectOpen}
        selectedWorkoutForChat={selectedWorkoutForChat}
        setSelectedWorkoutForChat={setSelectedWorkoutForChat}
        quickMessage={quickMessage}
        setQuickMessage={setQuickMessage}
        handleChatWithMax={handleChatWithMax}
        activeWorkout={activeWorkout}
        workoutHistory={workoutHistory}
        formatTime={formatTime}
        elapsedTime={displayTime} // Use the new display time
      />
    </div>
  );
};

export default WorkoutPage;
