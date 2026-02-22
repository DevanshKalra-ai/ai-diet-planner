(function () {
    // ========== DOM Elements ==========
    const themeToggle = document.getElementById('themeToggle');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
    const dietForm = document.getElementById('dietForm');
    const generateBtn = document.getElementById('generateBtn');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const previewContent = document.getElementById('previewContent');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const downloadBtn = document.getElementById('downloadBtn');
    const toastContainer = document.getElementById('toastContainer');

    let currentStep = 1;
    let macroChart = null;
    let mealChart = null;
    let currentPlanData = null;

    // ========== Theme ==========
    function initTheme() {
        const saved = localStorage.getItem('dietPlanner_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
    }

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('dietPlanner_theme', next);
        if (macroChart || mealChart) updateChartColors();
    });

    // ========== Toast ==========
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========== API Key ==========
    function initApiKey() {
        const saved = GeminiAPI.getApiKey();
        if (saved) {
            apiKeyInput.value = saved;
        }
    }

    saveApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            showToast('Please enter an API key.', 'error');
            return;
        }
        GeminiAPI.setApiKey(key);
        showToast('API key saved successfully!', 'success');
    });

    toggleKeyVisibility.addEventListener('click', () => {
        const isPassword = apiKeyInput.type === 'password';
        apiKeyInput.type = isPassword ? 'text' : 'password';
    });

    // ========== Step Navigation ==========
    const steps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step-indicator .step');

    function goToStep(step) {
        steps.forEach((s) => s.classList.remove('active'));
        stepIndicators.forEach((s) => s.classList.remove('active'));

        document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
        document.querySelector(`.step-indicator .step[data-step="${step}"]`).classList.add('active');

        // Mark previous steps as completed
        stepIndicators.forEach((s) => {
            const sNum = parseInt(s.dataset.step);
            if (sNum < step) {
                s.classList.add('completed');
            } else {
                s.classList.remove('completed');
            }
        });

        currentStep = step;
    }

    document.querySelectorAll('.btn-next').forEach((btn) => {
        btn.addEventListener('click', () => {
            const nextStep = parseInt(btn.dataset.next);
            if (validateStep(currentStep)) {
                goToStep(nextStep);
            }
        });
    });

    document.querySelectorAll('.btn-prev').forEach((btn) => {
        btn.addEventListener('click', () => {
            goToStep(parseInt(btn.dataset.prev));
        });
    });

    stepIndicators.forEach((ind) => {
        ind.addEventListener('click', () => {
            const target = parseInt(ind.dataset.step);
            if (target < currentStep || validateStep(currentStep)) {
                goToStep(target);
            }
        });
    });

    function validateStep(step) {
        const currentFormStep = document.querySelector(`.form-step[data-step="${step}"]`);
        const requiredFields = currentFormStep.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach((field) => {
            if (!field.value) {
                field.style.borderColor = 'var(--error)';
                valid = false;
                setTimeout(() => {
                    field.style.borderColor = '';
                }, 2000);
            }
        });

        if (!valid) {
            showToast('Please fill in all required fields.', 'error');
        }
        return valid;
    }

    // ========== Form Submit ==========
    dietForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateStep(1) || !validateStep(2)) {
            showToast('Please complete all required fields.', 'error');
            return;
        }

        if (!GeminiAPI.getApiKey()) {
            showToast('Please enter your Gemini API key first.', 'error');
            return;
        }

        const formData = {
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            weight: document.getElementById('weight').value,
            height: document.getElementById('height').value,
            activityLevel: document.getElementById('activityLevel').value,
            goal: document.getElementById('goal').value,
            dietaryPreference: document.getElementById('dietaryPreference').value,
            mealsPerDay: document.getElementById('mealsPerDay').value,
            allergies: document.getElementById('allergies').value,
            budget: document.getElementById('budget').value,
            cookingSkill: document.getElementById('cookingSkill').value,
            additionalNotes: document.getElementById('additionalNotes').value,
        };

        loadingOverlay.classList.add('active');
        generateBtn.disabled = true;

        try {
            const planData = await GeminiAPI.generateDietPlan(formData);
            currentPlanData = planData;
            renderPlan(planData);
            showToast('Diet plan generated successfully!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            loadingOverlay.classList.remove('active');
            generateBtn.disabled = false;
        }
    });

    // ========== Render Plan ==========
    function renderPlan(data) {
        previewPlaceholder.style.display = 'none';
        previewContent.style.display = 'block';

        // Plan header
        document.getElementById('planName').textContent = data.planName || 'Your Diet Plan';
        document.getElementById('planOverview').textContent = data.overview || '';

        // Macro summary cards
        const totals = data.dailyTotals || {};
        document.getElementById('totalCalories').textContent = totals.calories || 0;
        document.getElementById('totalProtein').textContent = totals.protein || 0;
        document.getElementById('totalCarbs').textContent = totals.carbs || 0;
        document.getElementById('totalFat').textContent = totals.fat || 0;

        // Charts
        renderCharts(data);

        // Meal views
        renderDailyView(data.meals);
        renderWeeklyView(data);
        renderCardsView(data.meals);

        // Tips
        if (data.tips && data.tips.length > 0) {
            document.getElementById('tipsSection').style.display = 'block';
            document.getElementById('tipsList').innerHTML = data.tips.map((t) => `<li>${t}</li>`).join('');
        }

        // Shopping list
        if (data.shoppingList && data.shoppingList.length > 0) {
            document.getElementById('shoppingSection').style.display = 'block';
            document.getElementById('shoppingList').innerHTML = data.shoppingList.map((i) => `<li>${i}</li>`).join('');
        }

        // Scroll to preview
        previewContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ========== Charts ==========
    function getChartColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            textColor: isDark ? '#e8e9ed' : '#1a1d27',
            gridColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        };
    }

    function renderCharts(data) {
        const totals = data.dailyTotals || {};
        const meals = data.meals || [];
        const colors = getChartColors();

        // Destroy existing charts
        if (macroChart) macroChart.destroy();
        if (mealChart) mealChart.destroy();

        // Pie / Doughnut chart — macro split
        const proteinCals = (totals.protein || 0) * 4;
        const carbsCals = (totals.carbs || 0) * 4;
        const fatCals = (totals.fat || 0) * 9;

        const macroCtx = document.getElementById('macroChart').getContext('2d');
        macroChart = new Chart(macroCtx, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fat'],
                datasets: [
                    {
                        data: [proteinCals, carbsCals, fatCals],
                        backgroundColor: ['#3b82f6', '#eab308', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colors.textColor,
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 12,
                            font: { size: 12, family: "'Inter', sans-serif" },
                            generateLabels: function (chart) {
                                const dataset = chart.data.datasets[0];
                                const total = dataset.data.reduce((a, b) => a + b, 0);
                                return chart.data.labels.map((label, i) => {
                                    const val = dataset.data[i];
                                    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                                    return {
                                        text: `${label} ${pct}%`,
                                        fillStyle: dataset.backgroundColor[i],
                                        hidden: false,
                                        index: i,
                                        pointStyle: 'circle',
                                    };
                                });
                            },
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                                return `${ctx.label}: ${ctx.raw} kcal (${pct}%)`;
                            },
                        },
                    },
                },
            },
        });

        // Bar chart — per-meal calories
        const mealCtx = document.getElementById('mealChart').getContext('2d');
        mealChart = new Chart(mealCtx, {
            type: 'bar',
            data: {
                labels: meals.map((m) => m.name),
                datasets: [
                    {
                        label: 'Calories',
                        data: meals.map((m) => m.mealTotals?.calories || 0),
                        backgroundColor: 'rgba(245, 158, 11, 0.7)',
                        borderColor: '#f59e0b',
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.raw} kcal`,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: { color: colors.textColor, font: { size: 11 } },
                        grid: { display: false },
                    },
                    y: {
                        ticks: { color: colors.textColor, font: { size: 11 } },
                        grid: { color: colors.gridColor },
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    function updateChartColors() {
        if (!currentPlanData) return;
        renderCharts(currentPlanData);
    }

    // ========== Daily View ==========
    function renderDailyView(meals) {
        const container = document.getElementById('dailyView');
        if (!meals || meals.length === 0) {
            container.innerHTML = '<p>No meals found.</p>';
            return;
        }

        container.innerHTML = meals
            .map((meal) => {
                const foodRows = (meal.foods || [])
                    .map(
                        (f) => `
                    <div class="food-row">
                        <div>
                            <div class="food-name">${f.item}</div>
                            <div class="food-portion">${f.portion}</div>
                        </div>
                        <div class="food-macro"><span>${f.calories}</span>kcal</div>
                        <div class="food-macro"><span>${f.protein}g</span>protein</div>
                        <div class="food-macro"><span>${f.carbs}g</span>carbs</div>
                        <div class="food-macro"><span>${f.fat}g</span>fat</div>
                    </div>`
                    )
                    .join('');

                const mt = meal.mealTotals || {};
                return `
                <div class="meal-table">
                    <div class="meal-table-header">
                        <h4>${meal.name}</h4>
                        <span class="meal-time">${meal.time || ''}</span>
                    </div>
                    <div class="meal-table-body">
                        ${foodRows}
                    </div>
                    <div class="meal-totals">
                        <div><strong>Meal Total</strong></div>
                        <div class="food-macro"><span>${mt.calories || 0}</span>kcal</div>
                        <div class="food-macro"><span>${mt.protein || 0}g</span>protein</div>
                        <div class="food-macro"><span>${mt.carbs || 0}g</span>carbs</div>
                        <div class="food-macro"><span>${mt.fat || 0}g</span>fat</div>
                    </div>
                </div>`;
            })
            .join('');
    }

    // ========== Weekly View ==========
    function renderWeeklyView(data) {
        const container = document.getElementById('weeklyView');
        const meals = data.meals || [];
        const totals = data.dailyTotals || {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        container.innerHTML = `
            <div class="weekly-grid">
                ${days
                    .map(
                        (day) => `
                    <div class="day-card">
                        <h4>${day}</h4>
                        <div class="day-summary">
                            <span><strong>${totals.calories || 0}</strong> kcal</span>
                            <span><strong>${totals.protein || 0}g</strong> protein</span>
                            <span><strong>${totals.carbs || 0}g</strong> carbs</span>
                            <span><strong>${totals.fat || 0}g</strong> fat</span>
                        </div>
                        <ul class="day-meals">
                            ${meals.map((m) => `<li><strong>${m.name}</strong> (${m.time || ''}) — ${m.mealTotals?.calories || 0} kcal</li>`).join('')}
                        </ul>
                    </div>`
                    )
                    .join('')}
            </div>`;
    }

    // ========== Cards View ==========
    function renderCardsView(meals) {
        const container = document.getElementById('cardsView');
        if (!meals || meals.length === 0) {
            container.innerHTML = '<p>No meals found.</p>';
            return;
        }

        container.innerHTML = `
            <div class="cards-grid">
                ${meals
                    .map((meal) => {
                        const mt = meal.mealTotals || {};
                        const foodItems = (meal.foods || [])
                            .map(
                                (f) => `
                            <div class="meal-card-food">
                                <div>
                                    <div class="meal-card-food-name">${f.item}</div>
                                    <div class="meal-card-food-detail">${f.portion}</div>
                                </div>
                                <div class="meal-card-food-detail">${f.calories} kcal</div>
                            </div>`
                            )
                            .join('');

                        return `
                        <div class="meal-card">
                            <div class="meal-card-header">
                                <h4>${meal.name}</h4>
                                <div class="meal-cals">${mt.calories || 0}<small> kcal</small></div>
                            </div>
                            <div class="meal-card-body">
                                ${foodItems}
                                <div class="meal-card-macros">
                                    <div class="macro-pill protein"><strong>${mt.protein || 0}g</strong>Protein</div>
                                    <div class="macro-pill carbs"><strong>${mt.carbs || 0}g</strong>Carbs</div>
                                    <div class="macro-pill fat"><strong>${mt.fat || 0}g</strong>Fat</div>
                                </div>
                            </div>
                        </div>`;
                    })
                    .join('')}
            </div>`;
    }

    // ========== View Selector ==========
    document.querySelectorAll('.view-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach((b) => b.classList.remove('active'));
            document.querySelectorAll('.meal-view').forEach((v) => v.classList.remove('active'));

            btn.classList.add('active');
            const viewId = btn.dataset.view + 'View';
            document.getElementById(viewId).classList.add('active');
        });
    });

    // ========== PDF Download ==========
    downloadBtn.addEventListener('click', () => {
        const content = document.getElementById('previewContent');
        if (!content || content.style.display === 'none') {
            showToast('Generate a diet plan first.', 'error');
            return;
        }

        showToast('Preparing PDF download...', 'info');

        // Hide download button during export
        const dlSection = document.querySelector('.download-section');
        dlSection.style.display = 'none';

        // Hide view selector for cleaner PDF
        const viewControls = document.querySelector('.view-controls .view-selector');
        viewControls.style.display = 'none';

        PDFGenerator.download(content, 'diet-plan.pdf')
            .then(() => {
                showToast('PDF downloaded!', 'success');
            })
            .catch(() => {
                showToast('Failed to generate PDF.', 'error');
            })
            .finally(() => {
                dlSection.style.display = '';
                viewControls.style.display = '';
            });
    });

    // ========== Init ==========
    initTheme();
    initApiKey();
})();
