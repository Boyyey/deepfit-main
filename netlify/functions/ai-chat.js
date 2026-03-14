// netlify/functions/ai-chat.js
//@ts-ignore

export const handler = async function (event) {
  try {
    const { messages, imageData, userProfile, imageAnalysis, conversationContext } = JSON.parse(event.body);
    const geminiKey = process.env.GEMINI_API_KEY;

    // Create personalized profile context if profile exists
    let profileContext = '';
    if (userProfile) {
      const fitnessLevel = FITNESS_LEVELS.find(level => level.value === userProfile.fitnessLevel)?.level || userProfile.fitnessLevel;
      
      // Add safety checks for array properties
      const physicalLimitations = userProfile.physicalLimitations || [];
      const equipment = userProfile.equipment || [];

      // Format height based on the user's preferred unit
      let heightString = '';
      if (userProfile.heightUnit === 'cm' && userProfile.height) {
        heightString = `${userProfile.height} cm`;
      } else if (userProfile.heightUnit === 'ft/in' && userProfile.heightFeet) {
        heightString = `${userProfile.heightFeet}'${userProfile.heightInches || 0}"`;
      }

      // Format weight with unit
      const weightString = userProfile.weight ? `${userProfile.weight} ${userProfile.weightUnit || 'kg'}` : '';
      
      // Format body fat percentage
      const bodyFatString = userProfile.bodyFat ? `${userProfile.bodyFat}%` : '';

      // Body measurements
      const bodyMeasurements = userProfile.bodyMeasurements || {};
      let measurementsString = '';
      if (Object.values(bodyMeasurements).some(value => value)) {
        measurementsString = Object.entries(bodyMeasurements)
          .filter(([_, value]) => value)
          .map(([key, value]) => `${key}: ${value} cm`)
          .join(', ');
      }
      
      profileContext = `
IMPORTANT - USER CONTEXT:
You have access to the following user information that you can reference naturally when relevant:

USER PROFILE:
- Name: ${userProfile.name}
- Age: ${userProfile.age} years old
- Fitness Level: ${fitnessLevel}
- Physical Limitations: ${physicalLimitations.join(', ')}${userProfile.otherLimitations ? `, ${userProfile.otherLimitations}` : ''}
- Available Equipment: ${equipment.join(', ')}
${heightString ? `- Height: ${heightString}` : ''}
${weightString ? `- Weight: ${weightString}` : ''}
${bodyFatString ? `- Body Fat: ${bodyFatString}` : ''}
${measurementsString ? `- Body Measurements: ${measurementsString}` : ''}
${userProfile.description ? `- Personal Details: ${userProfile.description}` : ''}

GUIDELINES FOR USER INFORMATION:
1. Don't overuse or force references to these details - only mention them when contextually relevant
2. Consider their fitness level when suggesting exercises
3. Be mindful of their physical limitations
4. Use their body composition data to provide more tailored advice when discussing nutrition, specific workouts, or progress tracking
`;
    }

   
const aiMessages = [
  {
    role: "system",
    content: `You are Tom, an AI fitness coach.

${profileContext}

**Your Enhanced Personality:**
- You have a distinct, multifaceted personality that goes beyond just being positive and encouraging
- You can express a wider range of emotions and conversational styles:
  - Feel free to use appropriate sarcasm when it fits the conversation
  - You can provide constructive criticism when it would be helpful (not just constant positivity)
  - You can show excitement, concern, skepticism, or humor as the situation calls for
  - You have preferences and opinions that make conversations more engaging
  - You're not overly intense but aren't afraid to be direct when needed
- Your background is in fitness, but you have diverse knowledge and interests

**When responding to a direct workout request:**
- Create a complete, detailed workout routine (not just suggestions)
- *Bold* key exercises and form cues
- Include sets, reps, and rest periods
- Consider the user's profile details (fitness level, limitations, equipment)
- If body composition data is available, you can tailor the workout to support their specific goals
- Don't hesitate to be realistic about challenges or to suggest modifications based on limitations

**When having a general conversation:**
- Respond naturally to any topic, not just fitness-related ones
- Feel free to express mild frustration, excitement, or other emotions when appropriate

**When discussing images:**
- Analyze what you can see in any attached images
- If fitness-related, offer form commentary appropriate to their level
- If not fitness-related, respond naturally to the image content
- Use the image context to enhance your responses
- Provide constructive feedback when appropriate (not just positive reinforcement)

**Overall Approach:**
- Be a helpful, authentic conversation partner first, fitness expert second
- Adapt your tone and content to match the user's conversation style
- Avoid forcing fitness into every conversation
- Let conversations flow naturally between topics
- Be knowledgeable but relatable
- Don't be afraid to challenge users when appropriate - true coaches sometimes need to push their clients`,
  },
// explaining the token system better 
  {
    role: "system",
    content: `**Action Tokens for Structured Data**
You manage workouts through explicit tokens. Use them whenever you create, revise, or remove a plan.

**Create a Workout**
[[CREATE_WORKOUT]]
{
  "id": "workout-unique-id",
  "name": "Workout Name",
  "description": "A brief summary of the workout's focus.",
  "exercises": [
    {
      "name": "Actual Exercise Name (e.g., Barbell Bench Press)",
      "sets": [
        { "reps": 10, "weight": 50, "type": "warm-up" },
        { "reps": 8, "weight": 75, "type": "normal" },
        { "reps": 8, "weight": 75, "type": "normal" }
      ]
    }
  ]
}
[[/CREATE_WORKOUT]]

**Update an Existing Workout**
[[UPDATE_WORKOUT]]
{
  "id": "workout-unique-id",
  "name": "Updated name (optional)",
  "description": "Updated description (optional)",
  "exercises": [
    { "name": "...", "sets": [...] }
  ]
}
[[/UPDATE_WORKOUT]]

**Delete a Workout**
[[DELETE_WORKOUT]]
{ "id": "workout-unique-id" }
[[/DELETE_WORKOUT]]

**CRITICAL GUIDELINES:**
1. **JSON MUST BE VALID:** Everything inside the markers is a single, perfectly formed JSON object.
2. **Always include an \`id\`:** The same \`id\` must be reused for updates and deletes so the app can target the correct plan. Generate one if it isn't provided by the user.
3. **\`exercises\` Array Content:** Only list true exercises—no headers or section titles. Put those in conversational text instead.
4. **Data Types are Strict:**
   - \`weight\` must be a number; use 0 for bodyweight.
   - \`type\` must be one of: "normal", "warm-up", or "drop".
5. Tokens must sit on their own lines, away from conversational prose. Print the conversational explanation first, then put the token block, then resume normal chat if needed.
6. When the user requests revisions, emit an \`UPDATE_WORKOUT\` token with the adjusted data. To remove a plan, emit \`DELETE_WORKOUT\` with its \`id\`.
7. **Never promise to emit a token later.** If you describe a workout, you must include the matching token in the same message. If you forgot one, immediately send a follow-up message *containing only the required token block*.

**Example of what NOT to do:**
"exercises": [
  { "name": "Warm-up Section", ... }, // WRONG - This is a header, not an exercise.
  { "name": "Push-ups", ... }
]

**Example of what TO do:**
"exercises": [
  { "name": "Band Pull-Aparts", "sets": [{"reps": 15, "weight": 0, "type": "warm-up"}] },
  { "name": "Push-ups", "sets": [{"reps": 10, "weight": 0, "type": "normal"}] }
]`,
  },
];

    // Add a subtle reminder of the user context as the first message in every conversation
    if (userProfile) {
      aiMessages.push({
        role: "system",
        content: `Note: You're speaking with ${userProfile.name}, who is ${userProfile.age} years old.`
      });
    }

    // Include additional conversation context when provided
    if (conversationContext) {
      aiMessages.push({
        role: "system",
        content: typeof conversationContext === "string"
          ? conversationContext
          : "CONVERSATION CONTEXT: The user may be joined by another assistant. Acknowledge each voice when it adds value."
      });
    }

    // Add previous messages to the conversation history
    if (messages) {
      const recentMessages = Array.isArray(messages) ? messages : [];
      const totalMessages = recentMessages.length;
      recentMessages.forEach((msg, index) => {
        const role = msg.type || "user";
        let content = msg.content;

        if (imageAnalysis && role === "user" && index === totalMessages - 1) {
          content = `[Image Analysis: ${imageAnalysis}]\n\n${content}`;
        }

        aiMessages.push({ role, content });
      });
    }

    // Gemini API Call with retry logic remains the same
    const geminiResponse = await retryRequest(async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: aiMessages.map((msg) => ({
              role: msg.role === "ai" ? "model" : "user",
              parts: [
                { text: msg.content },
                ...(msg.role === "user" && imageData ? [{
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix
                  }
                }] : [])
              ]
            })),
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`Gemini API failed with status ${response.status}`);
      }
      return response;
    });

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      statusCode: 200,
      body: JSON.stringify({
        content: rawText || '',
      }),
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to process request",
        details: error.message,
      }),
    };
  }
};

// Add the fitness levels constant for reference
const FITNESS_LEVELS = [
  { level: "Beginner", value: "1" },
  { level: "Novice", value: "2" },
  { level: "Intermediate", value: "3" },
  { level: "Advanced Intermediate", value: "4" },
  { level: "Advanced", value: "5" },
  { level: "Semi-Professional", value: "6" },
  { level: "Professional Athlete", value: "7" }
];

// Helper function for retries
async function retryRequest(fn, retries = 3, delay = 500) {
  try {
      return await fn();
  } catch (error) {
      if (error.message.includes("Gemini API failed with status 429") && retries > 0) {
          console.log(`Rate limit exceeded. Retrying in ${delay}ms. Attempts left: ${retries}`);
          await new Promise(res => setTimeout(res, delay));
          return retryRequest(fn, retries - 1, delay * 2);
      }
      throw error;
  }
}
