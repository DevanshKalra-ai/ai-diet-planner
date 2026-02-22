const GeminiAPI = (() => {
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

    function getApiKey() {
        return localStorage.getItem('dietPlanner_apiKey') || '';
    }

    function setApiKey(key) {
        localStorage.setItem('dietPlanner_apiKey', key.trim());
    }

    function buildPrompt(formData) {
        return `You are an expert nutritionist and meal planning specialist. Create a detailed, personalized daily diet plan based on the user's profile.

USER PROFILE:
- Age: ${formData.age}
- Gender: ${formData.gender}
- Weight: ${formData.weight} kg
- Height: ${formData.height} cm
- Activity Level: ${formData.activityLevel}
- Goal: ${formData.goal}
- Dietary Preference: ${formData.dietaryPreference}
- Meals Per Day: ${formData.mealsPerDay}
- Allergies/Restrictions: ${formData.allergies || 'None'}
- Budget: ${formData.budget || 'No preference'}
- Cooking Skill: ${formData.cookingSkill}
- Additional Notes: ${formData.additionalNotes || 'None'}

IMPORTANT FORMATTING RULES:
1. Respond ONLY with valid JSON — no markdown, no backticks, no explanation.
2. All numeric values must be numbers, not strings.
3. Macros must be realistic and consistent (calories = protein*4 + carbs*4 + fat*9, approximately).
4. Each meal must have at least 2-3 food items.
5. The number of meals must match the requested "${formData.mealsPerDay}" meals per day.
6. Provide exactly the following JSON structure:

{
  "planName": "A descriptive name for this diet plan",
  "overview": "2-3 sentence overview explaining the plan and why it suits the user",
  "dailyTotals": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0
  },
  "meals": [
    {
      "name": "Meal Name (e.g. Breakfast)",
      "time": "Suggested time (e.g. 7:00 AM)",
      "foods": [
        {
          "item": "Food item name",
          "portion": "Portion size description",
          "calories": 0,
          "protein": 0,
          "carbs": 0,
          "fat": 0
        }
      ],
      "mealTotals": {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0
      }
    }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "shoppingList": ["Item 1", "Item 2", "Item 3"]
}

Make sure daily totals equal the sum of all meal totals. Be specific with food items and portions. Generate exactly ${formData.mealsPerDay} meals.`;
    }

    async function generateDietPlan(formData) {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error('Please enter your Gemini API key first.');
        }

        const prompt = buildPrompt(formData);

        const response = await fetch(`${API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                },
            }),
        });

        if (!response.ok) {
            if (response.status === 400 || response.status === 403) {
                throw new Error('Invalid API key. Please check and try again.');
            }
            if (response.status === 429) {
                throw new Error('API rate limit exceeded. Please wait a minute and try again, or check your quota at ai.google.dev.');
            }
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Unexpected response from Gemini API.');
        }

        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        try {
            return JSON.parse(text);
        } catch {
            throw new Error('Failed to parse diet plan. Please try again.');
        }
    }

    return { getApiKey, setApiKey, generateDietPlan };
})();
