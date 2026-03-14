// src/components/workout/modals/QuickChatModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronDown, Clock, Info, X } from 'lucide-react';

const QuickChatModal = ({ 
  showChatModal, 
  setShowChatModal, 
  workoutSelectOpen, 
  setWorkoutSelectOpen, 
  selectedWorkoutForChat, 
  setSelectedWorkoutForChat, 
  quickMessage, 
  setQuickMessage, 
  handleChatWithMax, 
  activeWorkout, 
  workoutHistory, 
  formatTime, 
  elapsedTime 
}) => {
  return (
    <AnimatePresence>
      {showChatModal && (
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
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-[#4A90E2]" />
                <h3 className="text-xl font-semibold text-gray-800">Ask Max</h3>
              </div>
              
              {/* Workout Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share a workout (optional):
                </label>
                <div className="relative">
                  <button
                    onClick={() => setWorkoutSelectOpen(!workoutSelectOpen)}
                    className="w-full p-3 text-left border border-gray-300 rounded-lg flex justify-between items-center hover:border-[#4A90E2] transition-colors"
                  >
                    <span className="text-gray-700">
                      {selectedWorkoutForChat ? selectedWorkoutForChat.name : 'Select a workout'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </button>
                  
                  {/* Workout Dropdown */}
                  <AnimatePresence>
                    {workoutSelectOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        <div className="p-2">
                          <button
                            className="w-full p-2 text-left hover:bg-gray-50 rounded-md text-gray-500 text-sm"
                            onClick={() => {
                              setSelectedWorkoutForChat(null);
                              setWorkoutSelectOpen(false);
                            }}
                          >
                            No workout
                          </button>
                          
                          {/* Active Workout Option */}
                          {activeWorkout && (
                            <button
                              className="w-full p-2 text-left hover:bg-gray-50 rounded-md flex items-center justify-between"
                              onClick={() => {
                                setSelectedWorkoutForChat(activeWorkout);
                                setWorkoutSelectOpen(false);
                              }}
                            >
                              <div>
                              <div className="font-medium text-gray-800">{activeWorkout.name}</div>
                                <div className="text-xs text-green-600">Current Workout</div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTime(elapsedTime)}
                              </div>
                            </button>
                          )}
                          
                          {/* History Options */}
                          <div className="text-xs text-gray-500 mt-2 mb-1 px-2">History</div>
                          {workoutHistory.length === 0 ? (
                            <div className="text-sm text-gray-500 p-2">No workout history</div>
                          ) : (
                            workoutHistory.map((workout, index) => {
                              const startDate = new Date(workout.startTime);
                              return (
                                <button
                                  key={index}
                                  className="w-full p-2 text-left hover:bg-gray-50 rounded-md flex items-center justify-between"
                                  onClick={() => {
                                    setSelectedWorkoutForChat(workout);
                                    setWorkoutSelectOpen(false);
                                  }}
                                >
                                  <div>
                                    <div className="font-medium text-gray-800">{workout.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatTime(workout.duration)}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Preview Selected Workout */}
                <AnimatePresence>
                  {selectedWorkoutForChat && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                        <div className="font-medium text-gray-800">{selectedWorkoutForChat.name}</div>
                        <button
                          onClick={() => setSelectedWorkoutForChat(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3 text-sm">
                        <div className="text-gray-500 flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(selectedWorkoutForChat.duration)}</span>
                        </div>
                        <div className="space-y-1">
                          {selectedWorkoutForChat.exercises.map((exercise, i) => {
                            const completedSets = exercise.sets.filter(set => set.completed).length;
                            return (
                              <div key={i} className="text-gray-700">
                                {exercise.name} ({completedSets}/{exercise.sets.length} sets)
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <textarea
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent h-32"
                placeholder={selectedWorkoutForChat 
                  ? "Ask about this workout..." 
                  : "Ask a question about your workout or fitness journey..."}
              />
              
              <div className="mt-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Quick questions Max can help with:
                </span>
                <ul className="ml-6 mt-2 list-disc space-y-1">
                  <li>How can I improve my {selectedWorkoutForChat ? selectedWorkoutForChat.name : "workout"} routine?</li>
                  <li>What's the right form for {selectedWorkoutForChat && selectedWorkoutForChat.exercises.length > 0 
                    ? selectedWorkoutForChat.exercises[0].name 
                    : "bench press"}?</li>
                  <li>How can I progress with this routine?</li>
                </ul>
              </div>
            </div>
            
            <div className="p-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowChatModal(false);
                  setSelectedWorkoutForChat(null);
                  setQuickMessage("");
                }}
                className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChatWithMax}
                className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors"
                disabled={!quickMessage.trim() && !selectedWorkoutForChat}
              >
                Chat with Max
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickChatModal;