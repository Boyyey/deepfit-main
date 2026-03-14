import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, X, Send, ImagePlus, XCircle, Plus, Menu,
  Trash2, MessageSquare, UserCircle, Dumbbell, ArrowRight, Camera,
  Clock, ChevronRight, AlertCircle, Activity, PanelRightOpen
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import ProgressDataContent from './components/progress/ProgressDataContent';
import { useArtifactPanel } from './context/ArtifactPanelContext';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%234A90E2'/%3E%3Cpath d='M20 21C23.3137 21 26 18.3137 26 15C26 11.6863 23.3137 9 20 9C16.6863 9 14 11.6863 14 15C14 18.3137 16.6863 21 20 21ZM20 23C14.4772 23 10 27.4772 10 33H30C30 27.4772 25.5228 23 20 23Z' fill='white'/%3E%3C/svg%3E";

const thinkingMessages = [
  "Analyzing your workout needs...",
  "Planning your next move...",
  "Checking training protocols...",
  "Preparing your response...",
  "Getting your fitness plan ready..."
];

const ACTION_MARKERS = {
  CREATE_WORKOUT: {
    start: '[[CREATE_WORKOUT]]',
    end: '[[/CREATE_WORKOUT]]',
    type: 'create_workout'
  },
  UPDATE_WORKOUT: {
    start: '[[UPDATE_WORKOUT]]',
    end: '[[/UPDATE_WORKOUT]]',
    type: 'update_workout'
  },
  DELETE_WORKOUT: {
    start: '[[DELETE_WORKOUT]]',
    end: '[[/DELETE_WORKOUT]]',
    type: 'delete_workout'
  }
};

const ACTION_TOKEN_PATTERN = /\[\[(CREATE_WORKOUT|UPDATE_WORKOUT|DELETE_WORKOUT)\]\]([\s\S]*?)\[\[\/\1\]\]/g;

const ACTION_TYPE_MAP = {
  CREATE_WORKOUT: 'create_workout',
  UPDATE_WORKOUT: 'update_workout',
  DELETE_WORKOUT: 'delete_workout',
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeActionPayload = (block) => {
  if (typeof block !== 'string') {
    throw new Error('Action payload is not text');
  }

  let candidate = block.trim();

  if (candidate.startsWith('```')) {
    candidate = candidate
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  try {
    return JSON.parse(candidate);
  } catch (firstError) {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
      const sliced = candidate.slice(start, end + 1);
      return JSON.parse(sliced);
    }

    throw firstError;
  }
};

const extractActionsFromContent = (text) => {
  if (typeof text !== 'string' || !text) {
    return { cleanedText: '', actions: [] };
  }

  const actions = [];

  const cleanedText = text.replace(ACTION_TOKEN_PATTERN, (_, tokenType, block) => {
    const actionType = ACTION_TYPE_MAP[tokenType];
    if (!actionType) {
      return '';
    }

    try {
      const payload = normalizeActionPayload(block);
      actions.push({ type: actionType, payload });
    } catch (error) {
      console.error(`Failed to parse ${actionType} payload:`, error.message);
    }
    return '';
  });

  return { cleanedText, actions };
};

const generateId = (prefix = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeWorkoutArtifact = (artifact) => {
  if (!artifact || typeof artifact !== 'object') {
    return null;
  }

  const safePayload = artifact.payload && typeof artifact.payload === 'object'
    ? { ...artifact.payload }
    : {};

  const artifactId = artifact.id || safePayload.id || generateId('workout');
  if (!safePayload.id) {
    safePayload.id = artifactId;
  }

  return {
    id: artifactId,
    name: safePayload.name || artifact.name || 'Untitled workout',
    payload: safePayload,
    status: artifact.status || 'draft',
    source: artifact.source || 'assistant',
    createdAt: artifact.createdAt || Date.now(),
    updatedAt: artifact.updatedAt || artifact.createdAt || Date.now(),
    version: artifact.version || 1,
    history: Array.isArray(artifact.history) ? artifact.history : [],
    isFavorite: Boolean(artifact.isFavorite),
  };
};

const createWorkoutArtifact = (payload, options = {}) => {
  const basePayload = typeof payload === 'object' && payload !== null ? { ...payload } : {};
  const artifactId = options.id || basePayload.id || generateId('workout');

  if (!basePayload.id) {
    basePayload.id = artifactId;
  }

  const timestamp = Date.now();

  return {
    id: artifactId,
    name: basePayload.name || options.name || 'Untitled workout',
    payload: basePayload,
    status: options.status || 'draft',
    source: options.source || 'assistant',
    createdAt: options.createdAt || timestamp,
    updatedAt: timestamp,
    version: options.version || 1,
    history: Array.isArray(options.history) ? options.history : [],
    isFavorite: Boolean(options.isFavorite),
  };
};

const normalizeConversationRecord = (conversation) => {
  if (!conversation || typeof conversation !== 'object') {
    return null;
  }

  const normalizedArtifacts = Array.isArray(conversation.workoutArtifacts)
    ? conversation.workoutArtifacts
        .map(normalizeWorkoutArtifact)
        .filter(Boolean)
    : [];

  return {
    ...conversation,
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
    workoutArtifacts: normalizedArtifacts,
    activeArtifactId: conversation.activeArtifactId || null,
  };
};

// Function to resize and compress image before storage
const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
    };
  });
};

const ProfilePicture = ({ src, size = "medium", className = "" }) => {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-10 h-10",
    large: "w-12 h-12"
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-[#4A90E2] ${className}`}>
      <img
        src={src || DEFAULT_AVATAR}
        alt="Profile"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

const NoProfileScreen = ({ onNavigateToProfile }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-[#E8F4FF] to-[#D1E8FF] p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-xl text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="w-20 h-20 bg-[#E8F4FF] rounded-full mx-auto flex items-center justify-center">
            <UserCircle className="w-12 h-12 text-[#4A90E2]" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-2xl font-bold text-gray-800 mb-4"
        >
          Welcome to Max
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-gray-600 mb-8"
        >
          Before we start your fitness journey, let's create your athlete profile to personalize your experience.
        </motion.p>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNavigateToProfile}
          className="bg-[#4A90E2] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#357ABD] transition-colors shadow-md flex items-center justify-center gap-2 mx-auto"
        >
          Create Your Profile
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const WelcomeScreen = ({ onStartConversation }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-[#E8F4FF] to-[#D1E8FF] p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-xl text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="w-20 h-20 bg-[#E8F4FF] rounded-full mx-auto flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-[#4A90E2]" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-2xl font-bold text-gray-800 mb-4"
        >
          Welcome to Your Fitness Journey
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-gray-600 mb-8"
        >
          I'm Max, your personal AI fitness coach. Let me help you discover workout routines, learn proper techniques, and achieve your fitness goals.
        </motion.p>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartConversation}
          className="bg-[#4A90E2] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#357ABD] transition-colors shadow-md"
        >
          Start Training Together
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const AIChatAssistant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  // For receiving workout messages from workout page
  const [initialMessage, setInitialMessage] = useState('');

  // Profile-specific states
  const [hasProfile, setHasProfile] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [profileConversations, setProfileConversations] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);

  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [canSend, setCanSend] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [expandedWorkouts, setExpandedWorkouts] = useState({});
  const [expandedProgress, setExpandedProgress] = useState({});
  
  // New state for progress data processing tracking
  const [processingId, setProcessingId] = useState(null);
  
  // New state for notification/toast
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const notificationTimeoutRef = useRef(null);
  const workspaceContextRef = useRef({
    conversationId: null,
    summary: null,
    needsSync: false,
  });
  const lastWorkspaceSummariesRef = useRef({});

  const lastRequestTime = useRef(0);
  const REQUEST_COOLDOWN = 2000;
  const messagesEndRef = useRef(null);
  
  // Store the ID of the last processed data to prevent duplicate processing
  const lastProcessedDataIdRef = useRef(null);
  const {
    conversationArtifacts,
    panelState,
    upsertArtifact,
    removeArtifact,
    openArtifactPanel,
    updatePanelPayload,
    closeArtifactPanel,
    clearConversationArtifacts,
    seedConversationArtifacts,
    getConversationEntry,
  } = useArtifactPanel();

  const buildWorkspaceContext = useCallback(() => {
    const allArtifacts = Object.values(conversationArtifacts)
      .flatMap((entry) => Array.isArray(entry?.artifacts) ? entry.artifacts : [])
      .filter(Boolean);

    if (!allArtifacts.length) {
      return null;
    }

    const sorted = [...allArtifacts].sort((a, b) => (b?.updatedAt || 0) - (a?.updatedAt || 0));
    const lines = sorted.map((artifact, index) => {
      const parts = [
        `${index + 1}. ID: ${artifact.id}`,
        `Name: ${artifact.name || 'Untitled workout'}`,
        `Status: ${artifact.status || 'draft'}`,
        `Last updated: ${artifact.updatedAt ? new Date(artifact.updatedAt).toISOString() : 'unknown'}`,
      ];

      if (artifact.conversationId) {
        parts.push(`Conversation: ${artifact.conversationId}`);
      }

      if (artifact.isFavorite) {
        parts.push('Marked as favorite');
      }

      if (artifact.linkedWorkoutId) {
        parts.push(`Linked workout ID: ${artifact.linkedWorkoutId}`);
      }

      return parts.join(' | ');
    });

    return [
      'WORKOUT WORKSPACE SUMMARY:',
      ...lines,
      'When updating or deleting a workout, reference the exact ID shown above.',
    ].join('\n');
  }, [conversationArtifacts]);

  const markWorkspaceContextDirty = useCallback((conversationId) => {
    const summary = buildWorkspaceContext(conversationId);
    workspaceContextRef.current = {
      conversationId,
      summary,
      needsSync: Boolean(summary),
    };
  }, [buildWorkspaceContext]);

  const showToast = useCallback((message, duration = 3000) => {
    setNotificationMessage(message);
    setShowNotification(true);

    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    notificationTimeoutRef.current = setTimeout(() => {
      setShowNotification(false);
    }, duration);
  }, []);

  useEffect(() => {
    if (Object.keys(conversationArtifacts).length) {
      markWorkspaceContextDirty(null);
    }
  }, [conversationArtifacts, markWorkspaceContextDirty]);

  const findConversationWithArtifacts = useCallback((excludeId = null) => {
    const entries = Object.values(conversationArtifacts)
      .filter((entry) => entry?.artifacts?.length)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    if (!entries.length) {
      return null;
    }

    if (excludeId) {
      const exact = entries.find((entry) => entry.conversationId === excludeId);
      if (exact) {
        return exact.conversationId;
      }
    }

    return entries[0].conversationId;
  }, [conversationArtifacts]);

  const getConversationTitle = useCallback((conversationId) => {
    const title = profileConversations[conversationId]?.title;
    if (title) return title;
    const entry = conversationArtifacts[conversationId];
    if (entry?.artifacts?.length) {
      const latest = entry.artifacts[entry.artifacts.length - 1];
      if (latest?.name) {
        return `Draft: ${latest.name}`;
      }
    }
    return `Conversation ${conversationId?.slice(-6)}`;
  }, [conversationArtifacts, profileConversations]);

  const openConversationArtifactPanel = useCallback((conversationId, options = {}) => {
    if (!conversationId && !Object.keys(conversationArtifacts).length) {
      return;
    }

    const requestedId = conversationId || activeConversationId;
    const requestedEntry = requestedId ? getConversationEntry(requestedId, conversationArtifacts) : null;
    const hasRequestedArtifacts = !!requestedEntry?.artifacts?.length;

    let targetConversationId = requestedId;
    let fallbackUsed = false;

    if (!hasRequestedArtifacts) {
      const fallbackId = findConversationWithArtifacts(requestedId);
      if (fallbackId) {
        targetConversationId = fallbackId;
        fallbackUsed = true;
      }
    }

    if (!targetConversationId) {
      return;
    }

    const extras = {
      notify: showToast,
      conversationTitle: getConversationTitle(targetConversationId),
      fallbackUsed,
      ...options.extras,
    };

    if (panelState.isOpen && panelState.conversationId === targetConversationId) {
      updatePanelPayload(targetConversationId, {
        extras,
        isOpen: true,
        force: true,
      });
    } else {
      openArtifactPanel(targetConversationId, extras);
    }
  }, [
    activeConversationId,
    conversationArtifacts,
    findConversationWithArtifacts,
    getConversationEntry,
    getConversationTitle,
    openArtifactPanel,
    panelState.conversationId,
    panelState.isOpen,
    showToast,
    updatePanelPayload,
  ]);

  const callAiChat = async (payload) => {
    let response;
    try {
      response = await fetch('/.netlify/functions/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (networkError) {
      networkError.isNetworkError = true;
      throw networkError;
    }

    if (!response.ok) {
      const error = new Error('Chat request failed');
      error.status = response.status;
      throw error;
    }

    return response.json();
  };

  const getChatErrorMessage = (error) => {
    const message = (error?.message || '').toLowerCase();
    if (error?.isNetworkError || message.includes('failed to fetch') || message.includes('network request failed')) {
      return 'Connection failed. Please check your internet and try again.';
    }

    if (typeof error?.status === 'number' && error.status >= 500) {
      return "There's an issue with the server right now. Please try again in a few minutes.";
    }

    return 'Something went wrong. Please try again shortly.';
  };

  const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const updateConversationRecord = useCallback((conversationId, updater) => {
    if (!conversationId || typeof updater !== 'function') {
      return null;
    }

    let updatedConversation = null;

    setProfileConversations(prev => {
      const existingRaw = prev[conversationId];
      const existingNormalized = normalizeConversationRecord(existingRaw);

      const baseConversation = existingNormalized || normalizeConversationRecord({
        id: conversationId,
        title: existingRaw?.title || 'Conversation',
        messages: Array.isArray(existingRaw?.messages) ? existingRaw.messages : [],
        createdAt: existingRaw?.createdAt || Date.now(),
        lastUpdated: existingRaw?.lastUpdated || Date.now(),
        workoutArtifacts: Array.isArray(existingRaw?.workoutArtifacts) ? existingRaw.workoutArtifacts : [],
        activeArtifactId: existingRaw?.activeArtifactId || null,
      });

      if (!baseConversation) {
        console.warn('[updateConversationRecord] unable to bootstrap conversation state for', conversationId, 'keys:', Object.keys(prev));
        return prev;
      }

      const candidate = updater(baseConversation);
      if (!candidate) {
        console.warn('[updateConversationRecord] updater returned falsy value for', conversationId);
        return prev;
      }

      const nextConversation = normalizeConversationRecord(candidate) || null;
      if (!nextConversation) {
        console.warn('[updateConversationRecord] updater returned invalid conversation for', conversationId);
        return prev;
      }

      updatedConversation = nextConversation;
      return {
        ...prev,
        [conversationId]: nextConversation
      };
    });

    return updatedConversation;
  }, []);

  const appendAiMessage = (conversationId, content, extra = {}) => {
    if (!conversationId) return;
    const safeContent = typeof content === 'string' ? content : '';

    if (!safeContent && !extra.isError) {
      return;
    }

    updateConversationRecord(conversationId, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, {
        id: createMessageId(),
        type: 'ai',
        content: safeContent,
        ...extra,
      }],
      lastUpdated: Date.now(),
    }));
  };

  const processAiResponse = (conversationId, data) => {
    if (!data) return;

    const initialContent = typeof data.content === 'string' ? data.content : (data.message || '');
    const { cleanedText, actions: extractedActions } = extractActionsFromContent(initialContent);
    const payloadActions = Array.isArray(data.actions) && data.actions.length ? data.actions : extractedActions;
    const trimmedContent = cleanedText.trim();

    console.log('--- Full response from backend ---', data);
    console.log('--- Extracted payload actions ---', payloadActions);

    const createdArtifacts = [];
    const updatedArtifacts = [];
    const deletedArtifactIds = [];
    let entryAfterActions = null;

    payloadActions.forEach((action) => {
      if (!action || !action.type) {
        return;
      }

      if (action.type === 'create_workout' && action.payload) {
        const result = upsertArtifact(conversationId, {
          id: action.payload.id,
          name: action.payload.name,
          description: action.payload.description,
          payload: action.payload,
          status: 'draft',
          source: 'assistant',
        });
        if (result?.artifact) {
          console.log('[processAiResponse] create_workout', {
            conversationId,
            artifactId: result.artifact.id,
          });
          createdArtifacts.push(result.artifact);
          entryAfterActions = result.entry;
        }
        return;
      }

      if (action.type === 'update_workout' && action.payload) {
        const result = upsertArtifact(conversationId, {
          id: action.payload.id,
          name: action.payload.name,
          description: action.payload.description,
          payload: action.payload,
          source: 'assistant',
        });
        if (result?.artifact) {
          console.log('[processAiResponse] update_workout', {
            conversationId,
            artifactId: result.artifact.id,
          });
          updatedArtifacts.push(result.artifact);
          entryAfterActions = result.entry;
        }
        return;
      }

      if (action.type === 'delete_workout') {
        const targetId = action.payload?.id || action.id;
        if (!targetId) {
          console.warn('delete_workout action missing id payload');
          return;
        }
        const existingEntry = conversationArtifacts[conversationId];
        const result = removeArtifact(conversationId, targetId);
        if (result?.artifact) {
          console.log('[processAiResponse] delete_workout', {
            conversationId,
            deletedId: targetId,
            artifactsRemaining: result?.entry?.artifacts?.length || 0,
          });
          deletedArtifactIds.push(targetId);
          entryAfterActions = result.entry;
        } else {
          console.warn('[processAiResponse] delete_workout failed', {
            conversationId,
            targetId,
            available: Array.isArray(existingEntry?.artifacts)
              ? existingEntry.artifacts.map((artifact) => artifact.id)
              : [],
          });
        }
      }
    });

    if (!entryAfterActions) {
      entryAfterActions = getConversationEntry(conversationId, conversationArtifacts);
    }

    if (createdArtifacts.length || updatedArtifacts.length || deletedArtifactIds.length) {
      markWorkspaceContextDirty(conversationId);
    }

    if (createdArtifacts.length || updatedArtifacts.length) {
      openConversationArtifactPanel(conversationId);
    } else if (deletedArtifactIds.length && (!entryAfterActions || entryAfterActions.artifacts.length === 0)) {
      closeArtifactPanel();
    }

    if (createdArtifacts.length || updatedArtifacts.length || deletedArtifactIds.length) {
      let toastMessage = '';
      if (createdArtifacts.length && updatedArtifacts.length) {
        toastMessage = 'Workout drafted and updated—panel refreshed.';
      } else if (createdArtifacts.length) {
        toastMessage = 'Workout drafted—check the panel to review it.';
      } else if (updatedArtifacts.length) {
        toastMessage = 'Workout updated—panel refreshed.';
      } else if (deletedArtifactIds.length) {
        toastMessage = 'Workout removed from this conversation.';
      }

      if (toastMessage) {
        showToast(toastMessage, 2500);
      }
    }

    if (trimmedContent) {
      appendAiMessage(conversationId, trimmedContent);
    } else if (createdArtifacts.length || updatedArtifacts.length) {
      appendAiMessage(
        conversationId,
        "I've updated your workout workspace—check the panel when you're ready.",
      );
    }
  };

  // Check for message from workout page or progress page
  useEffect(() => {
    // Handle workout data
    if (activeConversationId && location.state && location.state.workout) {
      const message = location.state.message || '';
      const workoutDetails = location.state.workoutDetails || '';
      
      // Create structured workout message with proper formatting
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: `${message}\n\n${workoutDetails}`,
        workoutShared: true
      };
      
      // Add user message to conversation
      updateConversationRecord(activeConversationId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, userMessage],
        lastUpdated: Date.now(),
      }));
      
      // Auto-send the message to get AI response
      (async () => {
        setIsLoading(true);
        
        // Get current conversation state
        const currentConversations = JSON.parse(localStorage.getItem(`profile_${JSON.parse(localStorage.getItem('userProfile')).id}_conversations`) || '{}');
        const currentProfile = JSON.parse(localStorage.getItem('userProfile'));
        
        try {
          let summary = workspaceContextRef.current.summary;
          if (workspaceContextRef.current.needsSync || !summary) {
            summary = buildWorkspaceContext(activeConversationId);
            workspaceContextRef.current = {
              conversationId: activeConversationId,
              summary,
              needsSync: false,
            };
          }
          const shouldIncludeContext = Boolean(summary);
          const data = await callAiChat({
            messages: [...(currentConversations[activeConversationId]?.messages || []), {
              ...userMessage,
              content: `${message}\n\n${workoutDetails}`
            }],
            userProfile: currentProfile,
            ...(shouldIncludeContext ? { conversationContext: summary } : {}),
          });

          if (shouldIncludeContext) {
            workspaceContextRef.current = {
              conversationId: activeConversationId,
              summary,
              needsSync: false,
            };
          }

          processAiResponse(activeConversationId, data);
          
        } catch (error) {
          console.error('Error auto-sending workout message:', error);
          const friendlyMessage = getChatErrorMessage(error);
          appendAiMessage(activeConversationId, friendlyMessage, { isError: true });
        } finally {
          setIsLoading(false);
        }
      })();
      
      navigate(location.pathname, { replace: true, state: {} });
    } 
    // Handle regular text messages if present (and not part of progress data)
    else if (activeConversationId && location.state && location.state.message && !location.state.progressShared) {
      setInitialMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, activeConversationId, navigate, buildWorkspaceContext]);

  // Handle progress data separately to fix the double-sending issue
  useEffect(() => {
    // Check if we have active conversation and progress data in location state
    if (activeConversationId && 
        location.state && 
        location.state.progressShared && 
        location.state.progressData) {
      
      // Generate a consistent ID for this progress data
      const progressDataId = location.state.progressData.id || 
                            `progress-${JSON.stringify(location.state.progressData).slice(0, 50)}`;
      
      // If we're already processing this data or have processed it before, skip
      if (processingId === progressDataId || 
          lastProcessedDataIdRef.current === progressDataId) {
        return;
      }
      
      // Mark as currently processing - this is state-based so React respects it across renders
      setProcessingId(progressDataId);
      // Also store as processed for future reference
      lastProcessedDataIdRef.current = progressDataId;
      
      // Clear the location state IMMEDIATELY to prevent re-processing in subsequent renders
      const message = location.state.message || "I'd like to discuss my progress data.";
      const progressData = {...location.state.progressData}; // Make a copy first
      navigate(location.pathname, { replace: true, state: {} });
      
      // Prepare the user message
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: JSON.stringify({
          text: message,
          progressData: progressData
        }),
        progressShared: true
      };
      
      // Add user message to conversation
      updateConversationRecord(activeConversationId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, userMessage],
        lastUpdated: Date.now(),
      }));
      
      // Show a toast notification that progress is being shared
      showToast("Sharing progress data with Max...");
      
      // Auto-send the message to get AI response
      (async () => {
        setIsLoading(true);
        
        try {
          const conversationMessages = profileConversations[activeConversationId]?.messages || [];
          let summary = workspaceContextRef.current.summary;
          let shouldIncludeContext = false;
          if (workspaceContextRef.current.needsSync) {
            if (!summary) {
              summary = buildWorkspaceContext(activeConversationId);
              workspaceContextRef.current = {
                conversationId: activeConversationId,
                summary,
                needsSync: Boolean(summary) && workspaceContextRef.current.needsSync,
              };
            }
            shouldIncludeContext = Boolean(summary);
          }
          const data = await callAiChat({
            messages: [...conversationMessages, userMessage],
            userProfile: activeProfile,
            ...(shouldIncludeContext ? { conversationContext: summary } : {}),
          });

          if (shouldIncludeContext) {
            workspaceContextRef.current.needsSync = false;
            workspaceContextRef.current.summary = summary;
          }

          processAiResponse(activeConversationId, data);
          showToast("Max has analyzed your progress data", 2000);
          
        } catch (error) {
          console.error('Error auto-sending message:', error);
          const friendlyMessage = getChatErrorMessage(error);
          appendAiMessage(activeConversationId, friendlyMessage, { isError: true });
          showToast(friendlyMessage, 3000);
          
        } finally {
          setIsLoading(false);
          setProcessingId(null); // Reset processing state regardless of outcome
        }
      })();
    }
  }, [location.state, activeConversationId, activeProfile, navigate, processingId, buildWorkspaceContext, profileConversations]);

  // Set the input field when initialMessage changes
  useEffect(() => {
    if (initialMessage) {
      setCurrentMessage(initialMessage);
      setInitialMessage(''); // Clear it after using it
    }
  }, [initialMessage]);

  // Update canSend state based on current message content - strictly require text
  useEffect(() => {
    // Only enable sending if there's text content
    setCanSend(currentMessage.trim().length > 0 && !isLoading);
  }, [currentMessage, isLoading]);

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  const handleToggleWorkoutPanel = () => {
    if (panelState.isOpen) {
      closeArtifactPanel();
    } else {
      openConversationArtifactPanel(activeConversationId);
    }
  };

  const activeConversationArtifacts = activeConversationId
    ? conversationArtifacts[activeConversationId]
    : null;
  const totalArtifactsCount = Object.values(conversationArtifacts)
    .reduce((acc, entry) => acc + (entry?.artifacts?.length || 0), 0);
  const isPanelOpenForActive = panelState.isOpen && panelState.conversationId === activeConversationId;

  useEffect(() => {
    Object.values(conversationArtifacts).forEach((entry) => {
      if (!entry?.conversationId) {
        return;
      }

      const serialized = (Array.isArray(entry.artifacts) ? entry.artifacts : []).map((artifact) => ({
        id: artifact.id,
        name: artifact.name,
        description: artifact.description,
        payload: artifact.payload,
        status: artifact.status,
        source: artifact.source,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
        version: artifact.version,
        isFavorite: artifact.isFavorite,
        linkedWorkoutId: artifact.linkedWorkoutId,
        savedAt: artifact.savedAt,
      }));

      updateConversationRecord(entry.conversationId, (conversation) => {
        const currentSerialized = Array.isArray(conversation.workoutArtifacts)
          ? conversation.workoutArtifacts
          : [];

        if (JSON.stringify(currentSerialized) === JSON.stringify(serialized)) {
          return conversation;
        }

        return {
          ...conversation,
          workoutArtifacts: serialized,
        };
      });
    });
  }, [conversationArtifacts, updateConversationRecord]);

  useEffect(() => {
    const summaries = { ...lastWorkspaceSummariesRef.current };
    let latestChangedConversation = null;
    Object.keys(conversationArtifacts).forEach((conversationId) => {
      const summary = buildWorkspaceContext(conversationId);
      if (summary && summaries[conversationId] !== summary) {
        summaries[conversationId] = summary;
        latestChangedConversation = conversationId;
        workspaceContextRef.current = {
          conversationId,
          summary,
          needsSync: true,
        };
      } else if (!summary && summaries[conversationId]) {
        delete summaries[conversationId];
        if (workspaceContextRef.current.conversationId === conversationId) {
          workspaceContextRef.current = {
            conversationId,
            summary: null,
            needsSync: false,
          };
        }
      }
    });

    lastWorkspaceSummariesRef.current = summaries;

    if (!latestChangedConversation && workspaceContextRef.current.needsSync) {
      const context = buildWorkspaceContext(workspaceContextRef.current.conversationId);
      if (!context) {
        workspaceContextRef.current.needsSync = false;
        workspaceContextRef.current.summary = null;
      } else {
        workspaceContextRef.current.summary = context;
      }
    }
  }, [conversationArtifacts, buildWorkspaceContext]);

  // Show notification/toast function
  // Load profile and check if first time
  useEffect(() => {
    const userProfile = localStorage.getItem('userProfile');
    if (!userProfile) {
      setHasProfile(false);
      return;
    }

    setHasProfile(true);
    const profile = JSON.parse(userProfile);
    setActiveProfile(profile);

    const hasStarted = localStorage.getItem(`profile_${profile.id}_hasStarted`);
    setIsFirstTime(!hasStarted);

    if (hasStarted) {
      // Load profile-specific conversations
      const profileChats = localStorage.getItem(`profile_${profile.id}_conversations`);
      if (profileChats) {
        const chats = JSON.parse(profileChats);
        const normalizedEntries = Object.entries(chats)
          .map(([id, conversation]) => {
            const normalized = normalizeConversationRecord(conversation);
            return normalized ? [id, normalized] : null;
          })
          .filter(Boolean);

        const normalizedMap = Object.fromEntries(normalizedEntries);
        setProfileConversations(normalizedMap);

        normalizedEntries.forEach(([conversationId, conversation]) => {
          if (Array.isArray(conversation.workoutArtifacts) && conversation.workoutArtifacts.length) {
            seedConversationArtifacts(conversationId, conversation.workoutArtifacts);
          }
        });

        const existingWithArtifacts = normalizedEntries.find(([, conversation]) =>
          Array.isArray(conversation.workoutArtifacts) && conversation.workoutArtifacts.length);
        if (existingWithArtifacts) {
          markWorkspaceContextDirty(existingWithArtifacts[0]);
        }

        // Set active conversation
        const lastActiveId = localStorage.getItem(`profile_${profile.id}_activeConversation`);
        if (lastActiveId && chats[lastActiveId]) {
          setActiveConversationId(lastActiveId);
        } else if (Object.keys(chats).length > 0) {
          setActiveConversationId(Object.keys(chats)[0]);
        }
      }
    }
  }, []);

  // Save conversations when they change
  useEffect(() => {
    if (activeProfile && Object.keys(profileConversations).length > 0) {
      localStorage.setItem(
        `profile_${activeProfile.id}_conversations`,
        JSON.stringify(profileConversations)
      );
      if (activeConversationId) {
        localStorage.setItem(
          `profile_${activeProfile.id}_activeConversation`,
          activeConversationId
        );
      }
    }
  }, [profileConversations, activeConversationId, activeProfile]);

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [profileConversations]);

  // Clean up notification timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const handleStartFirstConversation = () => {
    if (activeProfile) {
      localStorage.setItem(`profile_${activeProfile.id}_hasStarted`, 'true');
      setIsFirstTime(false);
      createNewConversation();
    }
  };

  const createNewConversation = () => {
    const newId = generateId('conv');
    const welcomeMessage = `**Hey ${activeProfile?.name}!** Ready to crush your fitness goals? What can I help you with today?`;

    const newConversation = {
      id: newId,
      title: 'New Conversation',
      messages: [{
        id: 'welcome',
        type: 'ai',
        content: welcomeMessage
      }],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      workoutArtifacts: [],
      activeArtifactId: null,
    };

    setProfileConversations(prev => ({
      ...prev,
      [newId]: normalizeConversationRecord(newConversation)
    }));
    setActiveConversationId(newId);
    setIsSidebarOpen(false);
    
    // Reset processing state when creating a new conversation
    setProcessingId(null);
    lastProcessedDataIdRef.current = null;
    closeArtifactPanel();
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setIsAnalyzing(true);
      
      try {
        // Create temporary preview URL for immediate display
        const tempUrl = URL.createObjectURL(file);
        setPreviewUrl(tempUrl);

        // Resize and compress image for storage
        const base64Image = await resizeImage(file);
        setSelectedImage({ file, base64: base64Image });
        setPreviewUrl(base64Image); // Update preview to use the base64 image
        
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    // Check if message is empty (no text)
    if (!currentMessage.trim()) {
      // Show toast notification if trying to send without text
      showToast(selectedImage 
        ? "Please add a message to send along with your image" 
        : "Please type a message before sending");
      return;
    }
    
    if (isLoading || !activeConversationId) return;

    const now = Date.now();
    if (now - lastRequestTime.current < REQUEST_COOLDOWN) {
      console.warn("Please wait before sending another message.");
      return;
    }
    lastRequestTime.current = now;
    setIsLoading(true);

    const imagePayload = selectedImage?.base64 || null;

    // Create user message with base64 image if present
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      imageUrl: imagePayload, // Store base64 image for persistence
      pendingResponse: true
    };

    // Update conversation with user message
    updateConversationRecord(activeConversationId, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, userMessage],
      lastUpdated: Date.now(),
    }));

    setCurrentMessage('');

    if (selectedImage) {
      clearSelectedImage();
    }

    const retryFetch = async (retries = 3, delay = 1000) => {
      const baseMessages = profileConversations[activeConversationId]?.messages || [];
    let conversationContext = workspaceContextRef.current.summary;
    if (workspaceContextRef.current.needsSync || !conversationContext) {
      conversationContext = buildWorkspaceContext(activeConversationId);
      workspaceContextRef.current = {
        conversationId: activeConversationId,
        summary: conversationContext,
        needsSync: false,
      };
    }
    const payload = {
      messages: [...baseMessages, userMessage],
      imageData: imagePayload,
      userProfile: activeProfile,
      ...(conversationContext ? { conversationContext } : {}),
    };

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await callAiChat(payload);
        } catch (error) {
          console.log(`Attempt ${attempt} failed:`, error.message);
          if (attempt === retries) throw error;

          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    };

    try {
      const data = await retryFetch();
      processAiResponse(activeConversationId, data);
    } catch (error) {
      console.error('Error sending message:', error);
      const friendlyMessage = getChatErrorMessage(error);
      appendAiMessage(activeConversationId, friendlyMessage, { isError: true });
      showToast(friendlyMessage, 3000);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setCanSend(currentMessage.trim().length > 0);  // Re-enable send button if text is present
      }, REQUEST_COOLDOWN);
    }
  };

  const generateThinkingMessage = () =>
    thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];

  return (
    <AnimatePresence>
      {!hasProfile ? (
        <NoProfileScreen onNavigateToProfile={handleNavigateToProfile} />
      ) : isFirstTime ? (
        <WelcomeScreen onStartConversation={handleStartFirstConversation} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 flex bg-gradient-to-b from-[#E8F4FF] to-[#D1E8FF]"
        >
          {/* Sidebar with profile info and conversations */}
          <AnimatePresence>
            {(isSidebarOpen || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 20 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-[#B8D8F8] flex flex-col z-30 lg:relative lg:translate-x-0"
              >
                {/* Profile Info */}
                {activeProfile && (
                  <div className="p-4 border-b border-[#B8D8F8] bg-[#E8F4FF]">
                    <div className="flex items-center gap-3">
                      <ProfilePicture
                        src={activeProfile.profileThumbnail}
                        size="medium"
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-gray-800 truncate">
                          {activeProfile.name}
                        </h2>
                        <p className="text-sm text-gray-600">
                          Level {activeProfile.fitnessLevel} Athlete
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {Object.values(profileConversations)
                    .sort((a, b) => b.lastUpdated - a.lastUpdated)
                    .map(conversation => (
                      <div
                        key={conversation.id}
                        className={`p-3 border-b border-[#B8D8F8] cursor-pointer hover:bg-[#E8F4FF] flex items-center justify-between transition-colors ${
                          conversation.id === activeConversationId ? 'bg-[#D1E8FF]' : ''
                        }`}
                        onClick={() => {
                          setActiveConversationId(conversation.id);
                          setIsSidebarOpen(false);
                          // Reset processing state when switching conversations
                          setProcessingId(null);
                          closeArtifactPanel();
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MessageSquare className={`w-5 h-5 ${conversation.id === activeConversationId ? 'text-[#4A90E2]' : 'text-gray-500'}`} />
                          <div className="truncate">
                            <div className="font-medium text-gray-800 truncate">
                              {conversation.title}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {conversation.messages[conversation.messages.length - 1]?.content.slice(0, 30)}...
                            </div>
                          </div>
                        </div>
                        {conversation.id !== 'welcome' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversationToDelete(conversation.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-1 hover:bg-[#D1E8FF] rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-[#4A90E2]" />
                          </button>
                        )}
                      </div>
                    ))}
                </div>

                {/* New Conversation Button */}
                <div className="p-4 border-t border-[#B8D8F8]">
                  <button
                    onClick={createNewConversation}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    New Conversation
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col relative">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#B8D8F8] bg-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-[#E8F4FF] rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5 text-[#4A90E2]" />
                </button>
                <span className="text-[#4A90E2] text-xl">💪</span>
                <h3 className="font-semibold text-gray-800">Max - Your Personal Coach</h3>
              </div>
              <button
                onClick={handleToggleWorkoutPanel}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isPanelOpenForActive
                    ? 'bg-[#4A90E2] text-white hover:bg-[#357ABD]'
                    : 'bg-white border border-[#C7DCF7] text-[#4A90E2] hover:bg-[#E8F4FF]'
                }`}
              >
                <PanelRightOpen className="w-4 h-4" />
                Workout Workspace
                {totalArtifactsCount > 0 && (
                  <span className={`text-xs font-semibold ${isPanelOpenForActive ? 'text-white/80' : 'text-[#1D4ED8]'}`}>
                    {totalArtifactsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
              {showNotification && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-[#FFF4CC] border border-[#FFD666] px-4 py-2 rounded-lg shadow-md z-50 flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                  <span className="text-[#B45309] text-sm">{notificationMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Overlay Background with Button */}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden flex"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {/* Right side button area */}
                  <div className="ml-72 flex-1 flex items-center justify-center">
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 rounded-lg py-2 px-4 flex items-center gap-2 text-sm"
                    >
                      <X className="w-4 h-4 text-white" />
                      <span className="text-white font-medium">Close</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeConversationId &&
                profileConversations[activeConversationId]?.messages.map((message) => {
                  // Check if message might contain workout data or progress data
                  let messageContent = message.content;
                  let workoutData = null;
                  let progressData = null;
                  
                  if (message.workoutShared && typeof message.content === 'string') {
                    try {
                      const parsedContent = JSON.parse(message.content);
                      if (parsedContent.workoutData && parsedContent.text) {
                        workoutData = parsedContent.workoutData;
                        messageContent = parsedContent.text || "";
                      }
                    } catch (e) {
                      // Not JSON or not in the expected format, use as is
                      console.log("Error parsing workout data", e);
                    }
                  }
                  
                  // Handle progress data
                  if (message.progressShared && typeof message.content === 'string') {
                    try {
                      const parsedContent = JSON.parse(message.content);
                      if (parsedContent.progressData && parsedContent.text) {
                        progressData = parsedContent.progressData;
                        messageContent = parsedContent.text || "";
                      }
                    } catch (e) {
                      console.log("Error parsing progress data", e);
                    }
                  }
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-2xl p-4 rounded-xl ${
                        message.type === 'user'
                          ? 'bg-white border border-[#B8D8F8] ml-12'
                          : 'bg-[#E8F4FF] border border-[#B8D8F8] mr-12'
                      } ${message.isError ? 'bg-red-50 border border-red-200' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {message.type === 'ai' ? (
                            <span className="text-[#4A90E2] text-lg">💪</span>
                          ) : (
                            <ProfilePicture
                              src={activeProfile?.profileThumbnail}
                              size="small"
                              className="ml-auto order-2"
                            />
                          )}
                          <span className={`text-sm font-medium text-gray-800 ${
                            message.type === 'user' ? 'order-1' : ''
                          }`}>
                            {message.type === 'user' ? activeProfile?.name || 'You' : 'Max'}
                          </span>
                        </div>
                        
                        {/* Render image if present */}
                        {message.type === 'user' && message.imageUrl && (
                          <div className="mb-3">
                            <img
                              src={message.imageUrl}
                              alt="User uploaded"
                              className="max-h-48 w-auto rounded-lg object-cover shadow-md"
                            />
                          </div>
                        )}
                        
                        {/* Render progress data if present */}
                        {progressData && (
                          <div className="mb-3">
                            <div 
                              className="bg-[#E8F4FF] border border-[#B8D8F8] rounded-lg overflow-hidden cursor-pointer"
                              onClick={() => setExpandedProgress(prev => ({
                                ...prev,
                                [message.id]: !prev[message.id]
                              }))}
                            >
                              <div className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-[#4A90E2]" />
                                  <span className="font-medium text-[#4A90E2]">
                                    {progressData.title} shared
                                  </span>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-[#4A90E2] transition-transform ${
                                  expandedProgress[message.id] ? 'rotate-90' : ''
                                }`} />
                              </div>
                              
                              {/* Expandable progress details */}
                              <AnimatePresence>
                                {expandedProgress[message.id] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-[#B8D8F8]"
                                  >
                                    <div className="p-3 text-sm">
                                      <ProgressDataContent data={progressData} />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                        
                        {/* Render workout data if present */}
                        {workoutData && (
                          <div className="mb-3">
                            <div 
                              className="bg-gradient-to-r from-[#E8F4FF] to-[#F0F7FF] border border-[#B8D8F8] rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 group"
                              onClick={() => setExpandedWorkouts(prev => ({
                                ...prev,
                                [workoutData.id]: !prev[workoutData.id]
                              }))}
                            >
                              {/* Compact Header */}
                              <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-[#4A90E2] rounded-full flex items-center justify-center shadow-sm">
                                    <Dumbbell className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-gray-800 text-sm">
                                      {workoutData.name}
                                    </span>
                                    <span className="text-xs text-gray-600">
                                      {workoutData.date} • {workoutData.duration}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="px-2 py-1 bg-[#4A90E2] bg-opacity-10 rounded-full">
                                    <span className="text-xs font-medium text-[#4A90E2]">
                                      Shared
                                    </span>
                                  </div>
                                  <ChevronRight className={`w-4 h-4 text-[#4A90E2] transition-all duration-200 group-hover:text-[#357ABD] ${
                                    expandedWorkouts[workoutData.id] ? 'rotate-90' : ''
                                  }`} />
                                </div>
                              </div>
                              
                              {/* Expandable workout details */}
                              <AnimatePresence>
                                {expandedWorkouts[workoutData.id] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="border-t border-[#B8D8F8]"
                                  >
                                    <div className="p-4 bg-white bg-opacity-50">
                                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                        <div className="text-sm text-gray-700 font-medium">
                                          Workout Details
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>{workoutData.time}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        {workoutData.exercises.map((ex, i) => (
                                          <div key={i} className="flex items-center justify-between p-2 bg-white bg-opacity-60 rounded-lg">
                                            <span className="text-sm font-medium text-gray-800">{ex.name}</span>
                                            <div className="flex items-center gap-2">
                                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                ex.completed === ex.sets 
                                                  ? 'bg-green-100 text-green-700' 
                                                  : 'bg-yellow-100 text-yellow-700'
                                              }`}>
                                                {ex.completed}/{ex.sets} sets
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                        
                        {/* Regular message content */}
                        <div className={`${message.isError ? 'text-red-600' : 'text-gray-700'}`}>
                          <ReactMarkdown
                            components={{
                              strong: ({children}) => <strong className="font-semibold text-[#4A90E2]">{children}</strong>,
                              em: ({children}) => <em className="italic text-gray-700">{children}</em>,
                              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({children}) => <li className="ml-2">{children}</li>,
                              code: ({inline, children}) =>
                                inline ? (
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                                ) : (
                                  <code className="block bg-gray-100 p-3 rounded-lg overflow-x-auto my-2 font-mono text-sm whitespace-pre-wrap">{children}</code>
                                ),
                              h1: ({children}) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                              h2: ({children}) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                              h3: ({children}) => <h3 className="text-md font-bold mb-2">{children}</h3>
                            }}
                          >
                            {messageContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-gray-600 p-4"
                >
                  <Loader2 className="w-5 h-5 animate-spin text-[#4A90E2]" />
                  <span>{generateThinkingMessage()}</span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area with Image Preview */}
            <div className="border-t border-[#B8D8F8] p-4 bg-white">
              {previewUrl && (
                <AnimatePresence>
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative inline-block">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-24 w-auto rounded-lg object-cover shadow-md"
                      />
                      <button
                        onClick={clearSelectedImage}
                        className="absolute -top-2 -right-2 bg-white rounded-full shadow-md hover:bg-[#E8F4FF] transition-colors"
                      >
                        <XCircle className="w-5 h-5 text-[#4A90E2]" />
                      </button>
                    </div>
                    {isAnalyzing && (
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#4A90E2]" />
                        Analyzing image...
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-[#E8F4FF] rounded-lg text-[#4A90E2] hover:bg-[#D1E8FF] transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>

                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={
                    selectedImage 
                      ? "Add a message to send with your image..." 
                      : "Ask Max about workouts or share a fitness question..."
                  }
                  className="flex-1 p-3 border border-[#B8D8F8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2] resize-none h-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />

                <motion.button
                  onClick={handleSendMessage}
                  className={`p-3 rounded-lg text-white shadow-md transition-colors ${
                    canSend && !isLoading
                      ? 'bg-[#4A90E2] hover:bg-[#357ABD] cursor-pointer' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  whileTap={canSend && !isLoading ? { scale: 0.95 } : {}}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteModal && (
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
                  className="bg-white rounded-lg p-6 max-w-sm w-full"
                >
                  <h3 className="text-lg font-semibold mb-2">Delete Conversation</h3>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to delete this conversation? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setProfileConversations(prev => {
                          const newConversations = { ...prev };
                          delete newConversations[conversationToDelete];

                          // If we're deleting the active conversation, switch to another one
                          if (conversationToDelete === activeConversationId) {
                            const remainingIds = Object.keys(newConversations);
                            if (remainingIds.length > 0) {
                              setActiveConversationId(remainingIds[0]);
                            } else {
                              createNewConversation();
                            }
                          }

                          return newConversations;
                      });
                        if (panelState.conversationId === conversationToDelete) {
                          closeArtifactPanel();
                        }
                        clearConversationArtifacts(conversationToDelete);
                        setShowDeleteModal(false);
                        setConversationToDelete(null);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIChatAssistant;
