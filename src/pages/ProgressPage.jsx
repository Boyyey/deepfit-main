import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart2,
  Calendar,
  Dumbbell,
  LineChart,
  TrendingUp,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  Calendar as CalendarIcon,
  Zap,
  Clock as ClockIcon,
  Target,
  Users,
  AlertTriangle,
  Ruler,
  Scale,
  Percent,
  MessageSquare
} from 'lucide-react';

// Measurement trend component
const MeasurementTrend = ({ history, label, color = '#4A90E2' }) => {
  if (!history || history.length < 2) return null;
  
  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const maxValue = Math.max(...sortedHistory.map(entry => parseFloat(entry.value)));
  const minValue = Math.min(...sortedHistory.map(entry => parseFloat(entry.value)));
  const range = maxValue - minValue;
  const padding = range * 0.1; // 10% padding
  
  const getY = (value) => {
    // Normalize to 0-100 range for percentage height
    if (range === 0) return 50; // If all values are the same
    return 100 - ((value - minValue + padding/2) / (range + padding) * 100);
  };
  
  const points = sortedHistory.map((entry, index) => {
    const x = (index / (sortedHistory.length - 1)) * 100;
    const y = getY(parseFloat(entry.value));
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="mt-2">
      <div className="text-sm font-medium text-gray-700 mb-1">{label} Trend</div>
      <div className="relative h-16 w-full bg-gray-50 border border-gray-100 rounded overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="absolute bottom-1 right-2 text-xs text-gray-500">
          {sortedHistory.length} entries
        </div>
      </div>
    </div>
  );
};

const ProgressPage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('all'); // all, month, week
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [uniqueExercises, setUniqueExercises] = useState([]);
  const [muscleGroupData, setMuscleGroupData] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState([]);
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  
  // Body Composition states
  const [showWeightHistory, setShowWeightHistory] = useState(false);
  const [showBodyFatHistory, setShowBodyFatHistory] = useState(false);
  const [showMeasurementHistory, setShowMeasurementHistory] = useState({
    chest: false,
    waist: false,
    hips: false,
    thighs: false,
    arms: false
  });

  // Function to share progress data with Max
  const handleShareWithMax = () => {
    // Collect data based on active tab
    let progressData = {
      type: 'progress',
      tab: activeTab,
      timeRange: timeRange,
      stats: getWorkoutStats(),
      title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Progress`
    };
    
    // Add tab-specific data
    if (activeTab === 'overview') {
      progressData.muscleGroupData = muscleGroupData;
      progressData.weeklyWorkouts = weeklyWorkouts;
    } 
    else if (activeTab === 'exercises') {
      progressData.selectedExercise = selectedExercise;
      progressData.exerciseProgressData = getExerciseProgressData();
    }
    else if (activeTab === 'records') {
      progressData.personalRecords = personalRecords;
    }
    else if (activeTab === 'bodyComp') {
      progressData.bodyMeasurements = userProfile?.bodyMeasurements;
      progressData.weightHistory = userProfile?.weightHistory;
      progressData.bodyFatHistory = userProfile?.bodyFatHistory;
      progressData.measurementHistory = userProfile?.measurementHistory;
    }
    
    // Navigate to chat with the data
    navigate('/chat', { 
      state: { 
        progressShared: true,
        message: `I'd like to discuss my ${activeTab} progress data.`,
        progressData: progressData
      } 
    });
  };

  // Load user profile and workout history on component mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setUserProfile(profile);

      const storedHistory = localStorage.getItem(`workout_history_${profile.id}`);
      if (storedHistory) {
        const history = JSON.parse(storedHistory);
        setWorkoutHistory(history);
        processWorkoutData(history);
      }
    }
    setLoading(false);
  }, []);

  // Process workout data to extract analytics
  const processWorkoutData = (history) => {
    if (!history || history.length === 0) return;

    // Extract unique exercises
    const exercises = new Set();
    history.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercises.add(exercise.name);
      });
    });
    setUniqueExercises(Array.from(exercises));
    
    // If no exercise is selected, select the first one
    if (!selectedExercise && exercises.size > 0) {
      setSelectedExercise(Array.from(exercises)[0]);
    }

    // Calculate muscle group focus
    const muscleGroups = {};
    history.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const muscleTargets = exercise.muscleGroups || ['Uncategorized'];
        muscleTargets.forEach(muscle => {
          muscleGroups[muscle] = (muscleGroups[muscle] || 0) + 1;
        });
      });
    });

    const muscleGroupArray = Object.entries(muscleGroups).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);
    
    setMuscleGroupData(muscleGroupArray);

    // Calculate personal records
    const records = [];
    const exerciseMaxes = {};

    history.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.completed) {
            const weight = parseFloat(set.actualWeight);
            if (!isNaN(weight) && weight > 0) {
              if (!exerciseMaxes[exercise.name] || weight > exerciseMaxes[exercise.name]) {
                exerciseMaxes[exercise.name] = weight;
                records.push({
                  exercise: exercise.name,
                  weight,
                  date: new Date(workout.startTime).toLocaleDateString(),
                  reps: set.actualReps
                });
              }
            }
          }
        });
      });
    });

    // Keep only the highest weight for each exercise
    const uniqueRecords = Object.values(
      records.reduce((acc, record) => {
        if (!acc[record.exercise] || record.weight > acc[record.exercise].weight) {
          acc[record.exercise] = record;
        }
        return acc;
      }, {})
    ).sort((a, b) => b.weight - a.weight);

    setPersonalRecords(uniqueRecords);

    // Calculate weekly workout frequency
    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const fourWeeksAgo = new Date(now.getTime() - (4 * oneWeek));
    
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(fourWeeksAgo.getTime() + (i * oneWeek));
      const weekEnd = new Date(weekStart.getTime() + oneWeek);
      
      const weekWorkouts = history.filter(workout => {
        const workoutDate = new Date(workout.startTime);
        return workoutDate >= weekStart && workoutDate < weekEnd;
      });
      
      weeks.push({
        week: `Week ${i + 1}`,
        count: weekWorkouts.length,
        totalDuration: weekWorkouts.reduce((acc, workout) => acc + workout.duration, 0)
      });
    }
    
    setWeeklyWorkouts(weeks);
  };

  // Filter workout history based on selected time range
  const getFilteredHistory = () => {
    if (timeRange === 'all') return workoutHistory;
    
    const now = new Date();
    let cutoffDate;
    
    if (timeRange === 'month') {
      cutoffDate = new Date(now);
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === 'week') {
      cutoffDate = new Date(now);
      cutoffDate.setDate(now.getDate() - 7);
    }
    
    return workoutHistory.filter(workout => new Date(workout.startTime) >= cutoffDate);
  };

  // Get exercise progress data for charts
  const getExerciseProgressData = () => {
    if (!selectedExercise) return [];
    
    const filteredHistory = getFilteredHistory();
    const progressData = [];
    
    filteredHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.name === selectedExercise) {
          // Find the heaviest completed set
          let maxWeight = 0;
          let volume = 0;
          
          exercise.sets.forEach(set => {
            if (set.completed) {
              const weight = parseFloat(set.actualWeight);
              const reps = parseInt(set.actualReps);
              
              if (!isNaN(weight) && !isNaN(reps)) {
                if (weight > maxWeight) maxWeight = weight;
                volume += weight * reps;
              }
            }
          });
          
          if (maxWeight > 0) {
            progressData.push({
              date: new Date(workout.startTime).toLocaleDateString(),
              timestamp: new Date(workout.startTime).getTime(),
              weight: maxWeight,
              volume: volume
            });
          }
        }
      });
    });
    
    // Sort by date
    return progressData.sort((a, b) => a.timestamp - b.timestamp);
  };

  // Format time from seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate workout statistics
  const getWorkoutStats = () => {
    const filteredHistory = getFilteredHistory();
    
    if (filteredHistory.length === 0) {
      return {
        totalWorkouts: 0,
        avgDuration: 0,
        totalDuration: 0,
        completionRate: 0,
        mostFrequentExercise: 'N/A'
      };
    }
    
    const totalWorkouts = filteredHistory.length;
    const totalDuration = filteredHistory.reduce((acc, workout) => acc + workout.duration, 0);
    const avgDuration = totalDuration / totalWorkouts;
    
    // Calculate set completion rate
    let completedSets = 0;
    let totalSets = 0;
    
    filteredHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          totalSets++;
          if (set.completed) completedSets++;
        });
      });
    });
    
    const completionRate = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    
    // Find most frequent exercise
    const exerciseCounts = {};
    filteredHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1;
      });
    });
    
    let mostFrequentExercise = 'N/A';
    let maxCount = 0;
    
    Object.entries(exerciseCounts).forEach(([exercise, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentExercise = exercise;
      }
    });
    
    return {
      totalWorkouts,
      avgDuration,
      totalDuration,
      completionRate,
      mostFrequentExercise
    };
  };

  // Toggle history visibility for body composition sections
  const toggleHistoryVisibility = (type, key = null) => {
    if (type === 'weight') {
      setShowWeightHistory(prev => !prev);
    } else if (type === 'bodyFat') {
      setShowBodyFatHistory(prev => !prev);
    } else if (type === 'measurement' && key) {
      setShowMeasurementHistory(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  // Format history entries for display
  const renderHistoryEntries = (history, unit = "") => {
    if (!history || history.length === 0) {
      return <div className="text-sm text-gray-500 italic">No history entries yet</div>;
    }
    
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return (
      <div className="max-h-32 overflow-y-auto mt-1">
        {sortedHistory.map((entry, index) => (
          <div key={index} className="text-sm text-gray-600 flex justify-between border-b border-gray-100 py-1">
            <span>{new Date(entry.date).toLocaleDateString()}</span>
            <span>{entry.value} {entry.unit || unit}</span>
          </div>
        ))}
      </div>
    );
  };

  // Format height for display
  const formatHeight = (profile) => {
    if (!profile) return 'Not set';
    
    if (profile.heightUnit === 'cm' && profile.height) {
      return `${profile.height} cm`;
    } else if (profile.heightUnit === 'ft/in' && profile.heightFeet) {
      return `${profile.heightFeet}' ${profile.heightInches || 0}"`;
    }
    
    return 'Not set';
  };

  // If no user profile exists, show redirect to profile creation
  if (!userProfile && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] to-[#D1E9FF] py-12 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-[#E8F4FF] rounded-full mx-auto flex items-center justify-center mb-6">
            <Activity className="w-12 h-12 text-[#4A90E2]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Create Your Profile</h1>
          <p className="text-gray-600 mb-6">
            Before you can track your progress, you need to create an athlete profile. This helps us personalize your analytics.
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

  // If no workout history, show message to start tracking
  if (workoutHistory.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] to-[#D1E9FF] py-12 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-[#E8F4FF] rounded-full mx-auto flex items-center justify-center mb-6">
            <Calendar className="w-12 h-12 text-[#4A90E2]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Workout Data Yet</h1>
          <p className="text-gray-600 mb-6">
            Complete your first workout to start tracking your progress. Your analytics will appear here after you've logged some training sessions.
          </p>
          <button
            onClick={() => navigate('/workout')}
            className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg font-medium hover:bg-[#357ABD] transition-colors shadow-md mx-auto"
          >
            Start Tracking Workouts
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] to-[#D1E9FF] py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4A90E2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4A90E2] font-medium">Loading your progress data...</p>
        </div>
      </div>
    );
  }

  // Main stats from workout data
  const stats = getWorkoutStats();
  const exerciseProgressData = getExerciseProgressData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] to-[#D1E9FF] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#E8F4FF] p-3 rounded-full">
                <Activity className="w-8 h-8 text-[#4A90E2]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Progress Analytics</h1>
                <p className="text-gray-600">Track your fitness journey, {userProfile?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Time filter button */}
              <div className="relative">
                <button
                  onClick={() => setShowTimeFilter(!showTimeFilter)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  {timeRange === 'all' ? 'All Time' : timeRange === 'month' ? 'Last Month' : 'Last Week'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                <AnimatePresence>
                  {showTimeFilter && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                    >
                      <button
                        onClick={() => {
                          setTimeRange('all');
                          setShowTimeFilter(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        All Time
                      </button>
                      <button
                        onClick={() => {
                          setTimeRange('month');
                          setShowTimeFilter(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        Last Month
                      </button>
                      <button
                        onClick={() => {
                          setTimeRange('week');
                          setShowTimeFilter(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        Last Week
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Share with Max button */}
              <button
                onClick={handleShareWithMax}
                className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Share with Max
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              className={`flex-1 py-4 px-3 sm:px-6 font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'overview' ? "text-[#4A90E2] border-b-2 border-[#4A90E2]" : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`flex-1 py-4 px-3 sm:px-6 font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'exercises' ? "text-[#4A90E2] border-b-2 border-[#4A90E2]" : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab('exercises')}
            >
              Exercise Progress
            </button>
            <button
              className={`flex-1 py-4 px-3 sm:px-6 font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'records' ? "text-[#4A90E2] border-b-2 border-[#4A90E2]" : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab('records')}
            >
              Personal Records
            </button>
            <button
              className={`flex-1 py-4 px-3 sm:px-6 font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'bodyComp' ? "text-[#4A90E2] border-b-2 border-[#4A90E2]" : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab('bodyComp')}
            >
              Body Composition
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Key Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="text-gray-600 text-sm">Total Workouts</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats.totalWorkouts}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {timeRange === 'all' ? 'All time' : timeRange === 'month' ? 'Last 30 days' : 'Last 7 days'}
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <ClockIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-gray-600 text-sm">Avg. Workout Time</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {formatTime(stats.avgDuration)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total: {formatTime(stats.totalDuration)}
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <Target className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="text-gray-600 text-sm">Completion Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stats.completionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Sets completed vs. planned
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Dumbbell className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="text-gray-600 text-sm">Top Exercise</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800 truncate">
                      {stats.mostFrequentExercise}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Most frequently performed
                    </div>
                  </motion.div>
                </div>

                {/* Weekly Progress Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#4A90E2]" />
                    Weekly Workout Frequency
                  </h2>
                  
                  <div className="h-64 mt-6">
                    {weeklyWorkouts.length > 0 ? (
                      <div className="flex h-full items-end space-x-4">
                        {weeklyWorkouts.map((week, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex justify-center mb-2">
                              <div
                                className="bg-[#4A90E2] rounded-t-lg"
                                style={{
                                  height: `${Math.max(20, (week.count / 7) * 100)}%`,
                                  width: '60%',
                                  minHeight: '20px'
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-600">{week.week}</div>
                            <div className="text-sm font-semibold">{week.count}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No weekly data available</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Muscle Group Focus */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#4A90E2]" />
                    Muscle Group Focus
                  </h2>
                  
                  {muscleGroupData.length > 0 ? (
                    <div className="space-y-4">
                      {muscleGroupData.slice(0, 5).map((group, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{group.name}</span>
                            <span className="text-gray-600">{group.count} exercises</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                              className="bg-[#4A90E2] h-2.5 rounded-full"
                              style={{ width: `${(group.count / muscleGroupData[0].count) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No muscle group data available</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Exercise Progress Tab */}
            {activeTab === 'exercises' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Exercise Selector */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Exercise</h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {uniqueExercises.map((exercise, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedExercise(exercise)}
                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedExercise === exercise
                            ? 'bg-[#4A90E2] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {exercise}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Weight Progress</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    {selectedExercise ? `Tracking max weight for ${selectedExercise}` : 'Select an exercise to see progress'}
                  </p>
                  
                  <div className="h-64">
                    {exerciseProgressData.length > 0 ? (
                      <div className="h-full">
                        {/* Simplified chart visualization */}
                        <div className="flex h-full items-end space-x-2">
                          {exerciseProgressData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center group relative">
                              <div 
                                className="w-full flex justify-center mb-2 relative"
                                style={{ height: '100%' }}
                              >
                                <div
                                  className="bg-[#4A90E2] rounded-t-lg w-4/5"
                                  style={{
                                    height: `${(data.weight / Math.max(...exerciseProgressData.map(d => d.weight))) * 100}%`,
                                    minHeight: '20px'
                                  }}
                                ></div>
                                
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-800 text-white py-1 px-2 rounded text-xs whitespace-nowrap transition-opacity">
                                  {data.weight} lbs on {data.date}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 truncate w-full text-center">
                                {data.date.split('/').slice(0, 2).join('/')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">
                          {selectedExercise 
                            ? `No progress data available for ${selectedExercise}` 
                            : 'Select an exercise to view progress'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Volume Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Volume Progress</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Total volume (weight × reps) over time
                  </p>
                  
                  <div className="h-64">
                    {exerciseProgressData.length > 0 ? (
                      <div className="h-full">
                        {/* Simplified volume chart visualization */}
                        <div className="flex h-full items-end space-x-2">
                          {exerciseProgressData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center group relative">
                              <div 
                                className="w-full flex justify-center mb-2 relative"
                                style={{ height: '100%' }}
                              >
                                <div
                                  className="bg-green-500 rounded-t-lg w-4/5"
                                  style={{
                                    height: `${(data.volume / Math.max(...exerciseProgressData.map(d => d.volume))) * 100}%`,
                                    minHeight: '20px'
                                  }}
                                ></div>
                                
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-800 text-white py-1 px-2 rounded text-xs whitespace-nowrap transition-opacity">
                                  Volume: {data.volume} on {data.date}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 truncate w-full text-center">
                                {data.date.split('/').slice(0, 2).join('/')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">
                          {selectedExercise 
                            ? `No volume data available for ${selectedExercise}` 
                            : 'Select an exercise to view volume progress'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Suggestions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#4A90E2]" />
                    Improvement Suggestions
                  </h2>
                  
                  {selectedExercise && exerciseProgressData.length > 0 ? (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                        <h3 className="text-blue-800 font-medium">Progressive Overload</h3>
                        <p className="text-blue-700 text-sm mt-1">
                          Try increasing weight by 5-10% or adding 1-2 more reps to your {selectedExercise} to keep making progress.
                        </p>
                      </div>
                      
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                        <h3 className="text-green-800 font-medium">Training Frequency</h3>
                        <p className="text-green-700 text-sm mt-1">
                          Consider training {selectedExercise} 2-3 times per week with sufficient recovery for optimal strength gains.
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                        <h3 className="text-purple-800 font-medium">Technique Focus</h3>
                        <p className="text-purple-700 text-sm mt-1">
                          As weights increase, ensure your {selectedExercise} form remains strict for safety and effectiveness.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-gray-600">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <p>More data needed for personalized suggestions</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Personal Records Tab */}
            {activeTab === 'records' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-[#4A90E2]" />
                  Your Personal Records
                </h2>
                
                {personalRecords.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {personalRecords.map((record, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800 truncate" title={record.exercise}>
                              {record.exercise}
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">
                              {record.date}
                            </p>
                          </div>
                          <div className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-sm">
                            PR
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-end gap-2">
                          <span className="text-2xl font-bold text-gray-800">{record.weight}</span>
                          <span className="text-gray-600 mb-0.5">lbs</span>
                          <span className="text-gray-500 text-sm ml-auto">
                            {record.reps} reps
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No personal records yet</p>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                      Complete more workouts with challenging weights to establish your personal records.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Body Composition Tab */}
            {activeTab === 'bodyComp' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Ruler className="w-6 h-6 text-[#4A90E2]" />
                  Body Composition Tracking
                </h2>

                {/* Basic stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Ruler className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-gray-600 text-sm">Height</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {formatHeight(userProfile)}
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Scale className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-gray-600 text-sm">Current Weight</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {userProfile?.weight ? `${userProfile.weight} ${userProfile.weightUnit || 'kg'}` : 'Not set'}
                    </div>
                    {userProfile?.weightHistory && userProfile.weightHistory.length > 0 && (
                      <div 
                        onClick={() => toggleHistoryVisibility('weight')}
                        className="text-xs text-[#4A90E2] mt-1 cursor-pointer flex items-center"
                      >
                        {showWeightHistory ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                        {userProfile.weightHistory.length} entries
                      </div>
                    )}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Percent className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-gray-600 text-sm">Body Fat</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {userProfile?.bodyFat ? `${userProfile.bodyFat}%` : 'Not set'}
                    </div>
                    {userProfile?.bodyFatHistory && userProfile.bodyFatHistory.length > 0 && (
                      <div 
                        onClick={() => toggleHistoryVisibility('bodyFat')}
                        className="text-xs text-[#4A90E2] mt-1 cursor-pointer flex items-center"
                      >
                        {showBodyFatHistory ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                        {userProfile.bodyFatHistory.length} entries
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Weight History */}
                {userProfile?.weightHistory && userProfile.weightHistory.length > 0 && showWeightHistory && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-[#4A90E2]" />
                      Weight History
                    </h3>
                    
                    {/* Weight History Trend */}
                    <MeasurementTrend 
                      history={userProfile.weightHistory} 
                      label="Weight" 
                      color="#22c55e" 
                    />
                    
                    {/* Weight History Table */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">History Entries</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        {renderHistoryEntries(userProfile.weightHistory, userProfile.weightUnit)}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Body Fat History */}
                {userProfile?.bodyFatHistory && userProfile.bodyFatHistory.length > 0 && showBodyFatHistory && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Percent className="w-5 h-5 text-[#4A90E2]" />
                      Body Fat History
                    </h3>
                    
                    {/* Body Fat History Trend */}
                    <MeasurementTrend 
                      history={userProfile.bodyFatHistory} 
                      label="Body Fat" 
                      color="#a855f7" 
                    />
                    
                    {/* Body Fat History Table */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">History Entries</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        {renderHistoryEntries(userProfile.bodyFatHistory, "%")}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Body Measurements Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-[#4A90E2]" />
                    Body Measurements
                  </h3>
                  
                  {userProfile?.bodyMeasurements ? (
                    <div className="space-y-8">
                      {/* Measurements Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {['chest', 'waist', 'hips', 'thighs', 'arms'].map((part) => (
                          <div key={part} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 capitalize mb-1">{part}</h4>
                            <div className="text-xl font-bold text-gray-800">
                              {userProfile.bodyMeasurements[part] ? `${userProfile.bodyMeasurements[part]} cm` : '-'}
                            </div>
                            {userProfile.measurementHistory && 
                             userProfile.measurementHistory[part] && 
                             userProfile.measurementHistory[part].length > 0 && (
                              <div 
                                onClick={() => toggleHistoryVisibility('measurement', part)}
                                className="text-xs text-[#4A90E2] mt-1 cursor-pointer flex items-center"
                              >
                                {showMeasurementHistory[part] ? 
                                  <ChevronUp className="w-3 h-3 mr-1" /> : 
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                }
                                History
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Measurement History Sections */}
                      {['chest', 'waist', 'hips', 'thighs', 'arms'].map((part) => (
                        userProfile.measurementHistory && 
                        userProfile.measurementHistory[part] && 
                        userProfile.measurementHistory[part].length > 0 &&
                        showMeasurementHistory[part] && (
                          <div key={`history-${part}`} className="border-t border-gray-200 pt-4">
                            <h4 className="text-md font-medium text-gray-800 capitalize mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-[#4A90E2] rounded-full"></div>
                              {part} Measurement History
                            </h4>
                            
                            {/* Measurement Trend */}
                            <MeasurementTrend 
                              history={userProfile.measurementHistory[part]} 
                              label={part.charAt(0).toUpperCase() + part.slice(1)} 
                              color="#4A90E2" 
                            />
                            
                            {/* Measurement History Table */}
                            <div className="mt-3 bg-gray-50 rounded-lg p-3">
                              {renderHistoryEntries(userProfile.measurementHistory[part], "cm")}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No body measurement data available</p>
                      <button
                        onClick={() => navigate('/profile')}
                        className="mt-4 px-4 py-2 bg-[#4A90E2] text-white rounded-lg text-sm"
                      >
                        Add Measurements
                      </button>
                    </div>
                  )}
                </motion.div>
                
                {/* Composition Improvements */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#4A90E2]" />
                    Body Composition Insights
                  </h3>
                  
                  {(userProfile?.weightHistory?.length > 1 || 
                    userProfile?.bodyFatHistory?.length > 1 || 
                    Object.values(userProfile?.measurementHistory || {}).some(arr => arr.length > 1)) ? (
                    <div className="space-y-4">
                      {/* Show insights based on available data */}
                      {userProfile?.weightHistory?.length > 1 && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                          <h4 className="text-blue-800 font-medium">Weight Trend</h4>
                          <p className="text-blue-700 text-sm mt-1">
                            {userProfile.weightHistory[userProfile.weightHistory.length - 1].value > 
                             userProfile.weightHistory[0].value ? 
                              "You've been gaining weight over time. If this aligns with your goals, keep it up!" : 
                              "You've been losing weight over time. If this aligns with your goals, you're on the right track!"}
                          </p>
                        </div>
                      )}
                      
                      {userProfile?.bodyFatHistory?.length > 1 && (
                        <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                          <h4 className="text-purple-800 font-medium">Body Composition Changes</h4>
                          <p className="text-purple-700 text-sm mt-1">
                            {userProfile.bodyFatHistory[userProfile.bodyFatHistory.length - 1].value < 
                             userProfile.bodyFatHistory[0].value ? 
                              "Your body fat percentage is decreasing. Great progress on improving your body composition!" : 
                              "Your body fat percentage is increasing. Consider adjusting your nutrition and training if fat loss is a goal."}
                          </p>
                        </div>
                      )}
                      
                      {userProfile?.measurementHistory?.waist?.length > 1 && (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                          <h4 className="text-green-800 font-medium">Waist Measurement</h4>
                          <p className="text-green-700 text-sm mt-1">
                            {userProfile.measurementHistory.waist[userProfile.measurementHistory.waist.length - 1].value < 
                             userProfile.measurementHistory.waist[0].value ? 
                              "Your waist measurement is decreasing, which is often a good indicator of fat loss." : 
                              "Your waist measurement is increasing. This could be related to your current training and nutrition approach."}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-gray-600">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <p>More measurements needed for personalized insights</p>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-medium text-gray-800 mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-4 h-4 text-[#4A90E2] mt-0.5 flex-shrink-0" />
                        <span>Track your measurements consistently (every 2-4 weeks) for the most accurate progress tracking</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-4 h-4 text-[#4A90E2] mt-0.5 flex-shrink-0" />
                        <span>Take measurements at the same time of day, preferably in the morning before eating</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-4 h-4 text-[#4A90E2] mt-0.5 flex-shrink-0" />
                        <span>Remember that body composition changes may be more meaningful than scale weight alone</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;