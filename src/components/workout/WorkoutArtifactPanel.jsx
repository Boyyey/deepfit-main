import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Dumbbell,
  Star,
  StarOff,
  Save,
  Trash2,
  Clock,
  ListChecks,
  Sparkle,
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { useArtifactPanel } from '../../context/ArtifactPanelContext';
import { useWorkout } from '../../WorkoutContext';

const statusCopy = {
  draft: { label: 'Draft', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  saved: { label: 'Saved', tone: 'bg-green-50 text-green-700 border-green-200' },
  archived: { label: 'Archived', tone: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const WorkoutArtifactPanel = () => {
  const {
    conversationArtifacts,
    panelState,
    selectArtifact,
    markArtifact,
    removeArtifact,
    closeArtifactPanel,
    clearConversationArtifacts,
  } = useArtifactPanel();
  const { createWorkout, workouts } = useWorkout();

  const conversationId = panelState.conversationId;
  const entry = conversationId ? conversationArtifacts[conversationId] : null;
  const artifacts = Array.isArray(entry?.artifacts) ? entry.artifacts : [];
  const activeArtifactId = entry?.activeArtifactId || artifacts[0]?.id || null;

  const notify = panelState.extras?.notify;
  const conversationTitle = panelState.extras?.conversationTitle;
  const fallbackUsed = panelState.extras?.fallbackUsed;

  useEffect(() => {
    if (!panelState.isOpen) {
      return;
    }

    if (!conversationId) {
      return;
    }

    if (!artifacts.length && !fallbackUsed) {
      // Keep the panel open to show the empty state instead of closing it immediately.
      return;
    }
  }, [artifacts.length, closeArtifactPanel, conversationId, panelState.isOpen, fallbackUsed]);

  const sortedArtifacts = useMemo(() => {
    return [...artifacts].sort((a, b) => (b?.updatedAt || 0) - (a?.updatedAt || 0));
  }, [artifacts]);

  const allArtifacts = useMemo(() => {
    return Object.entries(conversationArtifacts)
      .flatMap(([convId, entry]) =>
        (Array.isArray(entry?.artifacts) ? entry.artifacts : []).map((artifact) => ({
          ...artifact,
          conversationId: artifact.conversationId || convId,
        }))
      )
      .filter(Boolean)
      .sort((a, b) => (b?.updatedAt || 0) - (a?.updatedAt || 0));
  }, [conversationArtifacts]);

  const activeArtifact = useMemo(() => {
    return sortedArtifacts.find((artifact) => artifact?.id === activeArtifactId) || sortedArtifacts[0] || null;
  }, [sortedArtifacts, activeArtifactId]);

  const [nameDraft, setNameDraft] = useState(activeArtifact?.name || '');

  useEffect(() => {
    setNameDraft(activeArtifact?.name || '');
  }, [activeArtifact?.id, activeArtifact?.name]);

  const isValidated = activeArtifact?.status === 'saved';

  const sendNotification = useCallback((message, duration = 2500) => {
    if (typeof notify === 'function') {
      notify(message, duration);
    }
  }, [notify]);

  const handleCommitName = useCallback(() => {
    if (!conversationId || !activeArtifact) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(activeArtifact.name || '');
      return;
    }
    if (trimmed === activeArtifact.name) {
      return;
    }

    markArtifact(conversationId, activeArtifact.id, {
      name: trimmed,
      payload: {
        ...activeArtifact.payload,
        name: trimmed,
      },
    });
    sendNotification('Workout renamed.');
  }, [activeArtifact, conversationId, markArtifact, nameDraft, sendNotification]);

  const handleSaveToLibrary = () => {
    if (!conversationId || !activeArtifact) return;

    const baseWorkout = {
      ...activeArtifact.payload,
      name: nameDraft.trim() || activeArtifact.payload?.name || 'Workout Plan',
      createdBy: 'Max AI Coach',
    };

    const savedWorkout = createWorkout(baseWorkout);
    markArtifact(conversationId, activeArtifact.id, {
      status: 'saved',
      payload: {
        ...activeArtifact.payload,
        name: baseWorkout.name,
      },
      linkedWorkoutId: savedWorkout?.id,
      savedAt: Date.now(),
      source: 'user',
    });
    sendNotification('Workout saved to My Workouts.');
  };

  const handleToggleFavorite = () => {
    if (!conversationId || !activeArtifact) return;
    markArtifact(conversationId, activeArtifact.id, {
      isFavorite: !activeArtifact.isFavorite,
    });
    sendNotification(activeArtifact.isFavorite ? 'Removed from favorites.' : 'Marked as favorite.');
  };

  const handleDelete = () => {
    if (!conversationId || !activeArtifact) return;
    const confirmed = window.confirm('Remove this workout from the conversation workspace?');
    if (!confirmed) return;

    const result = removeArtifact(conversationId, activeArtifact.id);
    sendNotification('Workout removed.');
    if (!result?.entry?.artifacts?.length) {
      closeArtifactPanel();
    }
  };

  const handleSelectArtifact = (artifactId) => {
    if (!conversationId || artifactId === activeArtifactId) return;
    selectArtifact(conversationId, artifactId);
  };

  const handleClose = () => {
    closeArtifactPanel();
  };

  const currentStatus = statusCopy[activeArtifact?.status] || statusCopy.draft;

  const handleRemoveAllDrafts = () => {
    if (!allArtifacts.length) return;
    const confirmed = window.confirm('Remove all workout drafts from the workspace? This cannot be undone.');
    if (!confirmed) return;

    Object.entries(conversationArtifacts).forEach(([convId, entry]) => {
      if (!entry?.artifacts?.length) return;
      entry.artifacts.forEach((artifact) => {
        removeArtifact(convId, artifact.id);
      });
      clearConversationArtifacts(convId);
    });
  };

  const hasArtifacts = artifacts.length > 0;

  if (!conversationId) {
    return null;
  }

  return (
    <AnimatePresence>
      {panelState.isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black z-40"
            onClick={handleClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'tween',
              ease: 'easeInOut',
              duration: 0.28,
            }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white border-l border-[#B8D8F8] shadow-2xl z-50 flex flex-col"
            role="complementary"
            aria-label="Workout workspace"
          >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#B8D8F8] bg-[#E8F4FF]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#B8D8F8]">
                  <Dumbbell className="w-5 h-5 text-[#4A90E2]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Max workout workspace</p>
                  <p className="text-xs text-gray-600">Review, rename, and save your AI-generated plans.</p>
                </div>
              </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-full text-[#4A90E2] hover:bg-white"
          aria-label="Close workout panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {!hasArtifacts ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <Sparkle className="w-10 h-10 text-[#4A90E2] mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No workouts yet</h3>
                  <p className="text-sm text-gray-600">
                    Ask Max for a training plan—each one will live here so you can compare, rename, and save them without losing the conversation flow.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                  <div className="flex items-center justify-between text-xs text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-2 rounded-lg">
                    <span className="font-semibold truncate">Viewing: {conversationTitle || `Conversation ${conversationId.slice(-6)}`}</span>
                    {fallbackUsed && (
                      <span className="text-[#B45309]">Showing latest saved workouts</span>
                    )}
                  </div>

                  {activeArtifact && (
                    <section className="border border-[#E0EEFF] rounded-2xl bg-[#F7FBFF] p-4 space-y-4">
                      <header className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <input
                      className="w-full bg-white border border-[#C7DCF7] focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm"
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      onBlur={handleCommitName}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleCommitName();
                        }
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          setNameDraft(activeArtifact.name || '');
                        }
                      }}
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${currentStatus.tone}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {currentStatus.label}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Updated {new Date(activeArtifact.updatedAt || Date.now()).toLocaleString()}
                      </span>
                      {activeArtifact.isFavorite && (
                        <span className="inline-flex items-center gap-1 text-[#F59E0B]">
                          <Star className="w-3 h-3" /> Favorite
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleSaveToLibrary}
                      className="flex items-center gap-2 px-3 py-2 bg-[#4A90E2] text-white text-xs font-semibold rounded-lg hover:bg-[#357ABD]"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </header>

                  <AnimatePresence initial={false} mode="wait">
                    {!isValidated ? (
                      <motion.div
                        key="actions"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-3"
                      >
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={handleSaveToLibrary}
                            className="flex items-center gap-2 px-3 py-2 bg-[#4A90E2] text-white text-xs font-semibold rounded-lg hover:bg-[#357ABD]"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleToggleFavorite}
                            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#F59E0B] bg-[#FEF3C7] border border-[#FCD34D] rounded-lg hover:bg-[#FDE68A]"
                          >
                            {activeArtifact.isFavorite ? (
                              <Star className="w-4 h-4" />
                            ) : (
                              <StarOff className="w-4 h-4" />
                            )}
                            {activeArtifact.isFavorite ? 'Unfavorite' : 'Favorite'}
                          </button>
                          <button
                            onClick={handleDelete}
                            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#DC2626] bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg hover:bg-[#FECACA]"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                          <button
                            onClick={() => markArtifact(conversationId, activeArtifact.id, { status: 'draft' })}
                            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#2563EB] bg-white border border-[#93C5FD] rounded-lg hover:bg-[#EFF6FF]"
                          >
                            <Edit3 className="w-4 h-4" />
                            Mark as draft
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="validated"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Saved to your workout library.
                      </motion.div>
                    )}
                  </AnimatePresence>

                <div className="bg-white border border-[#DCE9FB] rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-[#4A90E2]" />
                    Session structure
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {(activeArtifact.payload?.exercises || []).map((exercise, index) => (
                      <div key={`${exercise.name}-${index}`} className="border border-[#E7F0FF] rounded-lg p-3 bg-[#F9FBFF]">
                        <div className="font-semibold text-sm text-gray-800 mb-1">{exercise.name}</div>
                        <ul className="text-xs text-gray-600 space-y-1">
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
                </div>
              </section>
            )}

            <section className="border border-[#E0EEFF] rounded-2xl bg-white p-4">
              <header className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-[#4A90E2]" />
                  <h4 className="text-sm font-semibold text-gray-800">Conversation history</h4>
                </div>
                <span className="text-xs text-gray-500">{sortedArtifacts.length} plan{sortedArtifacts.length === 1 ? '' : 's'}</span>
              </header>
              <ul className="space-y-2">
                {sortedArtifacts.map((artifact) => {
                  const isActive = artifact.id === activeArtifact?.id;
                  const status = statusCopy[artifact.status] || statusCopy.draft;
                  return (
                    <li
                      key={artifact.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                        isActive ? 'border-[#4A90E2] bg-[#F5FAFF]' : 'border-[#E0EEFF] bg-white hover:bg-[#F8FBFF]'
                      }`}
                    >
                      <button
                        onClick={() => handleSelectArtifact(artifact.id)}
                        className="flex-1 text-left"
                      >
                        <p className="text-sm font-medium text-gray-800 truncate flex items-center gap-2">
                          {artifact.name || 'Untitled workout'}
                          {artifact.isFavorite && <Star className="w-3 h-3 text-[#F59E0B]" />}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${status.tone}`}>
                            {status.label}
                          </span>
                          <span>
                            Updated {new Date(artifact.updatedAt || Date.now()).toLocaleTimeString()}
                          </span>
                        </p>
                      </button>
                      <button
                        onClick={() => {
                          const result = removeArtifact(conversationId, artifact.id);
                          sendNotification('Workout removed.');
                          if (!result?.entry?.artifacts?.length) {
                            closeArtifactPanel();
                          }
                        }}
                        className="ml-3 text-xs text-[#DC2626] hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="border border-[#E0EEFF] rounded-2xl bg-white p-4">
              <header className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-[#4A90E2]" />
                  <h4 className="text-sm font-semibold text-gray-800">All drafts</h4>
                </div>
                {allArtifacts.length > 0 && (
                  <button
                    onClick={handleRemoveAllDrafts}
                    className="text-xs font-medium text-[#DC2626] hover:underline"
                  >
                    Delete all
                  </button>
                )}
              </header>
              {allArtifacts.length === 0 ? (
                <p className="text-xs text-gray-600">No drafts stored in the workspace.</p>
              ) : (
                <ul className="space-y-2">
                  {allArtifacts.map((artifact) => {
                    const status = statusCopy[artifact.status] || statusCopy.draft;
                    return (
                      <li
                        key={`${artifact.conversationId || 'global'}-${artifact.id}`}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#E0EEFF] bg-[#F9FBFF] hover:bg-[#F1F7FF] transition-colors"
                      >
                        <button
                          onClick={() => artifact.conversationId && selectArtifact(artifact.conversationId, artifact.id)}
                          className="flex-1 text-left"
                        >
                          <p className="text-sm font-medium text-gray-800 truncate flex items-center gap-2">
                            {artifact.name || 'Untitled workout'}
                            {artifact.isFavorite && <Star className="w-3 h-3 text-[#F59E0B]" />}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${status.tone}`}>
                              {status.label}
                            </span>
                            {artifact.conversationId && (
                              <span>Conversation: {artifact.conversationId.slice(-8)}</span>
                            )}
                            <span>
                              Updated {new Date(artifact.updatedAt || Date.now()).toLocaleTimeString()}
                            </span>
                          </p>
                        </button>
                        <button
                          onClick={() => artifact.conversationId && removeArtifact(artifact.conversationId, artifact.id)}
                          className="ml-3 text-xs text-[#DC2626] hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="border border-[#E0EEFF] rounded-2xl bg-[#F7FBFF] p-4">
              <header className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-4 h-4 text-[#4A90E2]" />
                <h4 className="text-sm font-semibold text-gray-800">Saved workouts</h4>
              </header>
              {workouts.length === 0 ? (
                <p className="text-xs text-gray-600">
                  Saved plans will appear here once you add a workout to your library.
                </p>
              ) : (
                <ul className="space-y-2">
                  {workouts.slice(0, 3).map((workout) => (
                    <li
                      key={workout.id}
                      className="flex items-center justify-between bg-white border border-[#DCE9FB] rounded-lg px-3 py-2"
                    >
                      <span className="text-xs font-medium text-gray-800 truncate pr-2">
                        {workout.name || 'Untitled workout'}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(workout.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                  {workouts.length > 3 && (
                    <li className="text-xs text-[#4A90E2] font-medium">
                      …and {workouts.length - 3} more in your library.
                    </li>
                  )}
                </ul>
              )}
            </section>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default WorkoutArtifactPanel;
