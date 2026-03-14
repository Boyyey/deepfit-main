// netlify/functions/process-request.js
const MOONDREAM_API_KEY = process.env.MOONDREAM_API_KEY;
const RECIPE_API_KEY = process.env.SPOONACULAR_API_KEY;
const MOONDREAM_API_URL = "https://api.moondream.ai/v1/query";
const RECIPE_API_URL = "https://api.spoonacular.com/recipes/findByIngredients";

// To convert this to a background function (with longer timeout), 
// rename the file to include "-background.js"

exports.handler = async function(event) {
  try {
    const { imageFile, messages } = JSON.parse(event.body);
    let ingredients = [];

    // Image-based flow: Extract ingredients from an image
    if (imageFile) {
      ingredients = await identifyIngredients(imageFile);
      if (ingredients.length === 0) {
        return {
          statusCode: 200,
          body: JSON.stringify({ content: "No ingredients found in the image." })
        };
      }
    }
    // Text-based flow: Extract ingredients via simple text parsing
    else if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1].content.toLowerCase();
      const ingredientKeywords = ["ingredients", "recipe", "make with", "cook with", "have some", "got some"];
      const ingredientsDetected = ingredientKeywords.some(keyword => lastMessage.includes(keyword));

      if (ingredientsDetected) {
        const parts = lastMessage.split(/,|\band\b|\s+/);
        const commonWords = [
          "i", "have", "some", "a", "the", "with", "and", "to", "of", "in",
          "for", "on", "ingredients", "recipe", "make", "cook", "got"
        ];
        ingredients = parts.filter(part => part.length > 1 && !commonWords.includes(part.toLowerCase()));
      }

      if (ingredients.length === 0) {
        return {
          statusCode: 200,
          body: JSON.stringify({ content: "No ingredients detected in your message." })
        };
      }
    }
    else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request: No imageFile or messages provided." })
      };
    }

    // Fetch recipes based on the detected ingredients
    const recipes = await fetchRecipes(ingredients);
    if (recipes.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ content: "No recipes found based on your ingredients." })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ ingredients, recipes })
    };

  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process request: " + error.message })
    };
  }
};

// Helper function to retry API requests with exponential backoff
async function retryRequest(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying request, attempts left: ${retries}`);
      await new Promise(res => setTimeout(res, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

async function identifyIngredients(imageBase64) {
  if (!MOONDREAM_API_KEY) {
    throw new Error("⚠️ Moondream API Key is missing");
  }

  const requestOptions = {
    image_url: `data:image/jpeg;base64,${imageBase64}`,
    question: "Ingredients in this image separated by commas",
    stream: false,
  };

  try {
    const response = await retryRequest(() =>
      fetch(MOONDREAM_API_URL, {
        method: "POST",
        headers: {
          "X-Moondream-Auth": MOONDREAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestOptions),
      })
    );

    if (response.ok) {
      const data = await response.json();
      let answer;
      if (data.response) answer = data.response;
      else if (data.text) answer = data.text;
      else if (data.answer) answer = data.answer;
      else if (Array.isArray(data) && data[0]?.response) answer = data[0].response;
      else if (Array.isArray(data) && data[0]?.text) answer = data[0].text;

      if (answer && answer.trim() !== "") {
        return answer.split(",").map(i => i.trim()).filter(Boolean);
      }
    }
    return [];
  } catch (error) {
    console.error("Error identifying ingredients:", error);
    throw error;
  }
}

async function fetchRecipes(ingredients) {
  if (!RECIPE_API_KEY) {
    throw new Error("⚠️ Spoonacular API Key is missing");
  }

  try {
    const url = new URL(RECIPE_API_URL);
    url.searchParams.set("ingredients", ingredients.join(","));
    url.searchParams.set("number", "5");
    url.searchParams.set("apiKey", RECIPE_API_KEY);

    const response = await retryRequest(() => fetch(url));
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
}
