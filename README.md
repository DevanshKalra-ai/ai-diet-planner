# AI Diet Planner

An AI-powered diet plan generator that creates personalized meal plans with detailed macro breakdowns, nutrition charts, and smart recommendations.

## Live Demo

[https://devanshkalra-ai.github.io/ai-diet-planner/](https://devanshkalra-ai.github.io/ai-diet-planner/)

## Features

- **AI-Powered Meal Plans** — Generates personalized daily meal plans using Google Gemini 2.0 Flash
- **Macro Tracking** — Detailed per-meal and daily macro breakdowns (calories, protein, carbs, fat)
- **Interactive Charts** — Doughnut chart for macro split + bar chart for per-meal calorie comparison
- **3 View Modes** — Daily View, Weekly Overview, and Meal Cards
- **PDF Export** — Download your complete diet plan as a PDF
- **Dark/Light Theme** — Toggle between themes with persistent preference
- **Responsive Design** — Works on desktop, tablet, and mobile

## How to Use

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Enter your API key (stored locally in your browser)
3. Fill in your profile, diet preferences, and optional details
4. Click "Generate Diet Plan"
5. View your plan with charts, switch between view modes, or download as PDF

## Tech Stack

- HTML, CSS, JavaScript (no framework)
- Google Gemini 2.0 Flash API
- Chart.js for nutrition charts
- html2pdf.js for PDF export
- GitHub Pages for hosting

## Privacy

Your API key is stored in your browser's local storage and is only sent to Google's Gemini API. No data is collected or stored on any server.

## License

This project is licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).
