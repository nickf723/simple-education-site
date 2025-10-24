/**
 * ===================================================================
 * 1. Graphics Utility Library
 * A collection of reusable functions for drawing on an HTML5 canvas.
 * ===================================================================
 */
const Graphics = {
    /**
     * Creates a canvas element inside a container and returns its 2D context.
     * @param {HTMLElement} container The div where the canvas should be placed.
     * @param {number} width The width of the canvas in pixels.
     * @param {number} height The height of the canvas in pixels.
     * @returns {CanvasRenderingContext2D} The 2D drawing context.
     */
    setupCanvas: (container, width = 400, height = 320) => {
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        // Make canvas square for 1-to-1 aspect ratio
        const size = Math.min(container.getBoundingClientRect().width, width);
        canvas.width = size;
        canvas.height = size;
        
        canvas.style.backgroundColor = 'var(--primary-bg, #1a1a1a)';
        canvas.style.border = '1px solid var(--borders-low-contrast, #444)';
        canvas.style.borderRadius = '8px';

        return canvas.getContext('2d');
    },

    /**
     * Draws a standard Cartesian coordinate system.
     * @param {CanvasRenderingContext2D} ctx The canvas context.
     * @param {object} options Defines the drawing parameters and scale.
     */
    drawAxes: (ctx, options) => {
        const { width, height } = ctx.canvas;
        const { xMin, xMax, yMin, yMax } = options.scale;

        const sx = (x) => (x - xMin) / (xMax - xMin) * width;
        const sy = (y) => (1 - (y - yMin) / (yMax - yMin)) * height;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Inter, sans-serif';
        ctx.lineWidth = 1;

        // Draw grid lines
        for (let i = Math.ceil(xMin); i <= Math.floor(xMax); i++) {
            if (i === 0) continue;
            ctx.beginPath();
            ctx.moveTo(sx(i), 0);
            ctx.lineTo(sx(i), height);
            ctx.stroke();
            ctx.fillText(i, sx(i) + 4, sy(0) - 4);
        }
        for (let j = Math.ceil(yMin); j <= Math.floor(yMax); j++) {
            if (j === 0) continue;
            ctx.beginPath();
            ctx.moveTo(0, sy(j));
            ctx.lineTo(width, sy(j));
            ctx.stroke();
            ctx.fillText(j, sx(0) + 4, sy(j) - 4);
        }

        // Draw main X and Y axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx(xMin), sy(0));
        ctx.lineTo(sx(xMax), sy(0));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx(0), sy(yMin));
        ctx.lineTo(sx(0), sy(yMax));
        ctx.stroke();

        return { sx, sy };
    }
};


/**
 * ===================================================================
 * 2. Applets
 * ===================================================================
 */
function initializeParabolaApplet(container) {
    container.innerHTML = `
        <div class="applet-controls">
            <label data-param-color="a">a: <input type="range" data-param="a" min="-3" max="3" step="0.05" value="1"> <span data-value="a">1.00</span></label>
            <label data-param-color="h">h: <input type="range" data-param="h" min="-8" max="8" step="0.1" value="0"> <span data-value="h">0.0</span></label>
            <label data-param-color="k">k: <input type="range" data-param="k" min="-8" max="8" step="0.1" value="0"> <span data-value="k">0.0</span></label>
        </div>
        <div class="applet-canvas-container"></div>
        <div class="applet-info" id="parabola-info"></div>
    `;

    const canvasContainer = container.querySelector('.applet-canvas-container');
    const infoDisplay = container.querySelector('#parabola-info');
    const sliders = container.querySelectorAll('input[type="range"]');
    
    let activeParam = null; 
    const paramColors = {
        a: getComputedStyle(document.documentElement).getPropertyValue('--param-a-color').trim(),
        h: getComputedStyle(document.documentElement).getPropertyValue('--param-h-color').trim(),
        k: getComputedStyle(document.documentElement).getPropertyValue('--param-k-color').trim(),
        default: getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim()
    };

    const ctx = Graphics.setupCanvas(canvasContainer, 450, 450);
    const scale = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
    
    function draw() {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const { sx, sy } = Graphics.drawAxes(ctx, { scale });
        
        const params = {
            a: parseFloat(container.querySelector('[data-param="a"]').value),
            h: parseFloat(container.querySelector('[data-param="h"]').value),
            k: parseFloat(container.querySelector('[data-param="k"]').value)
        };
        
        container.querySelector('[data-value="a"]').textContent = params.a.toFixed(2);
        container.querySelector('[data-value="h"]').textContent = params.h.toFixed(1);
        container.querySelector('[data-value="k"]').textContent = params.k.toFixed(1);

        ctx.strokeStyle = paramColors[activeParam] || paramColors.default;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
            const x = (px / width) * (scale.xMax - scale.xMin) + scale.xMin;
            
            // **THE FIX IS HERE:** Scale the 'a' value for plotting to keep it visible.
            const plot_a = params.a / 5;
            const y = plot_a * Math.pow(x - params.h, 2) + params.k;
            
            const py = sy(y);
            (px === 0) ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.fillStyle = paramColors.h;
        ctx.beginPath();
        ctx.arc(sx(params.h), sy(params.k), 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = paramColors.k;
        ctx.beginPath();
        ctx.arc(sx(params.h), sy(params.k), 2.5, 0, 2 * Math.PI);
        ctx.fill();
        
        infoDisplay.innerHTML = `y = <span style="color:${paramColors.a}">${params.a.toFixed(2)}</span>(x - <span style="color:${paramColors.h}">${params.h.toFixed(1)}</span>)² + <span style="color:${paramColors.k}">${params.k.toFixed(1)}</span>`;
    }

    sliders.forEach(slider => {
        slider.addEventListener('input', draw);
        slider.addEventListener('mousedown', () => { activeParam = slider.dataset.param; draw(); });
        slider.addEventListener('touchstart', () => { activeParam = slider.dataset.param; draw(); });
    });
    document.addEventListener('mouseup', () => { if (activeParam) { activeParam = null; draw(); } });
    document.addEventListener('touchend', () => { if (activeParam) { activeParam = null; draw(); } });

    draw();
}

function initializePolynomialGrapher(container) {
    container.innerHTML = `
        <div class="applet-controls">
            <p>A simple graph of the polynomial <span class="math-chip">y = x(x-3)(x+2)</span></p>
        </div>
        <div class="applet-canvas-container"></div>
        <div class="applet-info">Roots are at x = 0, 3, and -2</div>
    `;

    const canvasContainer = container.querySelector('.applet-canvas-container');
    const ctx = Graphics.setupCanvas(canvasContainer, 450, 450);
    const scale = { xMin: -5, xMax: 5, yMin: -10, yMax: 10 };

    function draw() {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const { sx, sy } = Graphics.drawAxes(ctx, { scale });
        
        // Define the polynomial: y = x(x-3)(x+2) = x^3 - x^2 - 6x
        const poly = (x) => Math.pow(x, 3) - Math.pow(x, 2) - 6*x;
        
        ctx.strokeStyle = 'var(--accent-color, #e040fb)';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
            const x = (px / width) * (scale.xMax - scale.xMin) + scale.xMin;
            const y = poly(x);
            const py = sy(y);
            (px === 0) ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    
    draw(); // Initial draw
}

function loadSimplifierApplet(container) {
    let steps = [];
    let currentStep = 0;

    // Helper to get random integers
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Main function to generate the problem and steps
    function buildProblem() {
        // 1. Generate random numbers
        const a = getRandomInt(2, 5);
        const b = getRandomInt(1, 6);
        const c = getRandomInt(1, 5); // Can be 1, for - (x - d)
        const d = getRandomInt(1, 6);

        // 2. Calculate intermediate and final values
        const ab = a * b;
        const neg_c = -1 * c;
        const neg_c_neg_d = neg_c * (-1 * d); // -c * -d
        
        const final_a = a - c;
        const final_b = ab + neg_c_neg_d;

        // 3. Dynamically build the steps array
        //    NOTE: All backslashes \ must be doubled \\ for JavaScript strings
        steps = [
            {
                expression: `$$ ${a}(x + ${b}) - ${c}(x - ${d}) $$`,
                message: "First, let's apply the <strong>Distributive Property</strong> to both sets of parentheses.",
                buttonText: "Distribute"
            },
            {
                // This is where the \\cdot fix is
                expression: `$$ (${a} \\cdot x + ${a} \\cdot ${b}) + (${neg_c} \\cdot x + ${neg_c} \\cdot ${-d}) $$`,
                message: "Great! Now let's perform the multiplication within the parentheses.",
                buttonText: "Multiply"
            },
            {
                expression: `$$ ${a}x + ${ab} ${neg_c}x + ${neg_c_neg_d} $$`,
                message: "Excellent. Now, use the <strong>Commutative Property</strong> to group the 'like terms' together.",
                buttonText: "Group Like Terms"
            },
            {
                expression: `$$ (${a}x ${neg_c}x) + (${ab} + ${neg_c_neg_d}) $$`,
                message: "Perfect! Finally, <strong>Combine Like Terms</strong> to get the simplified answer.",
                buttonText: "Combine"
            },
            {
                expression: `$$ ${final_a}x + ${final_b} $$`,
                message: "All done! The expression is fully simplified. Click Reset for a new problem.",
                buttonText: "Reset"
            }
        ];

        // Reset step
        currentStep = 0;
        
        // 4. Update the DOM
        updateDOM();
        buildButtons();
    }

    // 2. Create the applet's inner HTML (only needs to be done once)
    container.innerHTML = `
        <div class="simplifier-container">
            <div class="simplifier-display">
                <div class="equation-box" id="simplifier-expression-${container.id}">
                    </div>
            </div>
            <div class="simplifier-message" id="simplifier-message-${container.id}">
                </div>
            <div class="simplifier-steps" id="simplifier-controls-${container.id}">
                </div>
        </div>
    `;

    const expressionEl = container.querySelector(`#simplifier-expression-${container.id}`);
    const messageEl = container.querySelector(`#simplifier-message-${container.id}`);
    const controlsEl = container.querySelector(`#simplifier-controls-${container.id}`);

    // 3. Function to build the buttons
    function buildButtons() {
        controlsEl.innerHTML = ''; // Clear old buttons
        steps.forEach((step, index) => {
            if (index < steps.length - 1) { // All buttons except "Reset"
                const button = document.createElement('button');
                button.dataset.step = index;
                button.textContent = step.buttonText;
                button.disabled = (index !== currentStep);
                controlsEl.appendChild(button);
            }
        });

        // Add reset button separately
        if (currentStep === steps.length - 1) {
            const resetButton = document.createElement('button');
            resetButton.dataset.step = "reset";
            resetButton.textContent = steps[steps.length - 1].buttonText;
            resetButton.classList.add('reset-button');
            controlsEl.appendChild(resetButton);
        }
    }
    
    // Helper to update text and re-render KaTeX
    function updateDOM() {
        expressionEl.innerHTML = steps[currentStep].expression;
        messageEl.innerHTML = steps[currentStep].message;

        // Re-render the math with KaTeX
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(expressionEl, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ]
            });
        }
    }

    // 4. Handle Clicks
    controlsEl.addEventListener('click', (e) => {
        if (!e.target.matches('button')) return;

        const stepIndex = e.target.dataset.step;

        if (stepIndex === "reset") {
            buildProblem(); // Re-generate a new problem
            return;
        }

        const step = parseInt(stepIndex);
        if (step === currentStep) {
            currentStep++;
            updateDOM();
            buildButtons();

            // Little flash effect
            messageEl.className = 'simplifier-message success';
            setTimeout(() => {
                messageEl.className = 'simplifier-message';
            }, 300);
        }
    });

    // 5. Initial build
    buildProblem();
}

function loadFunctionMachine(container) {
    // 1. Create the applet's inner HTML
    container.innerHTML = `
        <div class="function-machine-container">
            <div class="fm-box fm-input-box">
                <label for="fm-input-${container.id}">Input (x)</label>
                <div class="fm-input-controls">
                    <input type="number" id="fm-input-${container.id}" value="3">
                    <button id="fm-run-btn-${container.id}">Run All</button>
                </div>
                <div id="fm-main-message-${container.id}" class="fm-message"></div>
            </div>
            
            <div class="fm-arrow">⬇️</div>
        
            <div class="fm-triple-grid">
                <div class="fm-machine-column">
                    <div class="fm-box fm-rule-box fm-rule-f">
                        <label for="fm-rule-f-${container.id}">Function 1: f(x) =</label>
                        <input type="text" id="fm-rule-f-${container.id}" value="2*x + 1">
                    </div>
                    <div class="fm-arrow">⬇️</div>
                    <div class="fm-box fm-output-box">
                        <label>Output f(x)</label>
                        <div id="fm-output-f-${container.id}" class="fm-output-display">?</div>
                    </div>
                    <div id="fm-message-f-${container.id}" class="fm-message"></div>
                </div>
                
                <div class="fm-machine-column">
                    <div class="fm-box fm-rule-box fm-rule-g">
                        <label for="fm-rule-g-${container.id}">Function 2: g(x) =</label>
                        <input type="text" id="fm-rule-g-${container.id}" value="x^2">
                    </div>
                    <div class="fm-arrow">⬇️</div>
                    <div class="fm-box fm-output-box">
                        <label>Output g(x)</label>
                        <div id="fm-output-g-${container.id}" class="fm-output-display">?</div>
                    </div>
                    <div id="fm-message-g-${container.id}" class="fm-message"></div>
                </div>

                <div class="fm-machine-column">
                    <div class="fm-box fm-rule-box fm-rule-h">
                        <label for="fm-rule-h-${container.id}">Function 3: h(x) =</label>
                        <input type="text" id="fm-rule-h-${container.id}" value="x - 5">
                    </div>
                    <div class="fm-arrow">⬇️</div>
                    <div class="fm-box fm-output-box">
                        <label>Output h(x)</label>
                        <div id="fm-output-h-${container.id}" class="fm-output-display">?</div>
                    </div>
                    <div id="fm-message-h-${container.id}" class="fm-message"></div>
                </div>
            </div>
        </div>
    `;

    // 2. Get references to the DOM elements
    const inputEl = container.querySelector(`#fm-input-${container.id}`);
    const runBtn = container.querySelector(`#fm-run-btn-${container.id}`);
    const mainMessageEl = container.querySelector(`#fm-main-message-${container.id}`);

    const machines = [
        {
            ruleEl: container.querySelector(`#fm-rule-f-${container.id}`),
            outputEl: container.querySelector(`#fm-output-f-${container.id}`),
            messageEl: container.querySelector(`#fm-message-f-${container.id}`),
            name: "f"
        },
        {
            ruleEl: container.querySelector(`#fm-rule-g-${container.id}`),
            outputEl: container.querySelector(`#fm-output-g-${container.id}`),
            messageEl: container.querySelector(`#fm-message-g-${container.id}`),
            name: "g"
        },
        {
            ruleEl: container.querySelector(`#fm-rule-h-${container.id}`),
            outputEl: container.querySelector(`#fm-output-h-${container.id}`),
            messageEl: container.querySelector(`#fm-message-h-${container.id}`),
            name: "h"
        }
    ];

    // 3. Helper function to evaluate a single rule
    function evaluateRule(rule, x) {
        // Security check
        if (/[^x\d\s\+\-\*\/\^\(\)\.]/.test(rule)) {
            return { error: 'Invalid characters. Use only numbers, "x", +, -, *, /, ^, ( ).' };
        }
        
        // Replace 'x' and '^' for JS evaluation
        const expression = rule.replace(/x/g, `(${x})`).replace(/\^/g, '**');
        
        try {
            const result = new Function('return ' + expression)();
            if (isNaN(result) || !isFinite(result)) {
                return { error: 'Not a valid number (e.g., div by zero).' };
            }
            return { result: result }; // Success
        } catch (e) {
            return { error: 'Syntax error in rule.' };
        }
    }

    // 4. Main "run" function
    function runAllMachines() {
        const x = parseFloat(inputEl.value);
        
        // Clear main message
        mainMessageEl.textContent = '';
        mainMessageEl.className = 'fm-message';

        // Check for valid number input
        if (isNaN(x)) {
            mainMessageEl.textContent = 'Input "x" must be a number.';
            mainMessageEl.className = 'fm-message error';
            
            // Clear all outputs
            machines.forEach(machine => {
                machine.outputEl.textContent = '?';
                machine.outputEl.classList.remove('success', 'error');
                machine.messageEl.textContent = '';
                machine.messageEl.classList.remove('success', 'error');
            });
            return;
        }

        // Process each machine individually
        machines.forEach(machine => {
            const rule = machine.ruleEl.value.toLowerCase();
            
            // Clear previous state
            machine.outputEl.textContent = '?';
            machine.outputEl.classList.remove('success', 'error');
            machine.messageEl.textContent = '';
            machine.messageEl.classList.remove('success', 'error');

            const eval = evaluateRule(rule, x);
            
            if (eval.error) {
                // Show error message for this specific machine
                machine.messageEl.textContent = eval.error;
                machine.messageEl.classList.add('error');
                machine.outputEl.classList.add('error');
            } else {
                // Show success for this machine
                machine.outputEl.textContent = eval.result;
                machine.outputEl.classList.add('success');
                machine.messageEl.textContent = `${machine.name}(${x}) = ${eval.result}`;
                machine.messageEl.classList.add('success');
            }
        });
    }

    // 5. Attach event listeners
    runBtn.addEventListener('click', runAllMachines);
    
    inputEl.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            runAllMachines();
        }
    });
}

function loadVerticalLineTester(container) {
    // 1. Create the applet's inner HTML
    container.innerHTML = `
        <div class="vlt-grid">
            <div class="vlt-container" id="vlt-pass-${container.id}">
                <div class="vlt-graph">
                    <div class="vlt-curve-pass"></div>
                    <div class="vlt-line"></div>
                </div>
                <div class="vlt-status-box" data-status="pass">
                    <span>PASS</span>
                    <span class="vlt-intersections">Intersections: 1</span>
                </div>
            </div>
            
            <div class="vlt-container" id="vlt-fail-${container.id}">
                <div class="vlt-graph">
                    <div class="vlt-curve-fail"></div>
                    <div class="vlt-line"></div>
                </div>
                <div class="vlt-status-box" data-status="fail">
                    <span>FAIL</span>
                    <span class="vlt-intersections">Intersections: ?</span>
                </div>
            </div>
        </div>
    `;

    // 2. Get references
    const passContainer = container.querySelector(`#vlt-pass-${container.id}`);
    const failContainer = container.querySelector(`#vlt-fail-${container.id}`);
    
    // 3. Event handler for mouse movement (Smoother Logic)
    function handleMouseMove(e, container) {
        const line = container.querySelector('.vlt-line');
        const statusBox = container.querySelector('.vlt-status-box');
        const intersections = container.querySelector('.vlt-intersections');
        const graph = container.querySelector('.vlt-graph');
        
        const rect = graph.getBoundingClientRect();
        let x = e.clientX - rect.left; // Get mouse X relative to graph
        
        // Clamp X to be within the graph bounds
        x = Math.max(0, Math.min(x, rect.width));
        
        line.style.left = `${x}px`;
        line.style.opacity = '1';

        // Logic for intersection count
        if (container.id.includes('fail')) {
            const graphMidpoint = rect.width / 2;
            
            // The vertex is at the midpoint.
            // We add a 2px buffer for the vertex itself.
            if (x > graphMidpoint + 2) {
                intersections.textContent = 'Intersections: 2';
                statusBox.dataset.status = 'fail';
            } else if (x < graphMidpoint - 2) {
                intersections.textContent = 'Intersections: 0';
                statusBox.dataset.status = 'pass';
            } else {
                intersections.textContent = 'Intersections: 1'; // At the vertex
                statusBox.dataset.status = 'pass';
            }
        }
    }
    
    // 4. Reset line opacity on mouse leave
    function handleMouseLeave(container) {
        container.querySelector('.vlt-line').style.opacity = '0';
    }

    // 5. Attach listeners
    passContainer.querySelector('.vlt-graph').addEventListener('mousemove', (e) => handleMouseMove(e, passContainer));
    passContainer.querySelector('.vlt-graph').addEventListener('mouseleave', () => handleMouseLeave(passContainer));
    
    failContainer.querySelector('.vlt-graph').addEventListener('mousemove', (e) => handleMouseMove(e, failContainer));
    failContainer.querySelector('.vlt-graph').addEventListener('mouseleave', () => handleMouseLeave(failContainer));
}

function loadDomainRangeViz(container) {
    // 1. Create the applet's inner HTML
    container.innerHTML = `
        <div class="dr-viz-grid">
            
            <div class="dr-viz-container">
                <div class="dr-viz-graph">
                    <div class="dr-axis dr-axis-x"></div>
                    <div class="dr-axis dr-axis-y"></div>
                    <div class="dr-curve-quadratic"></div>
                    <div class="dr-viz-shadow dr-shadow-x" style="width: 100%; left: 0;"></div>
                    <div class="dr-viz-shadow dr-shadow-y" style="height: 75%; bottom: 25%;"></div>
                    <div class="dr-viz-label-title">Quadratic Function: $y = x^2 - 3$</div>
                    <div class="dr-viz-label-domain">Domain: $(-\\infty, \\infty)$</div>
                    <div class="dr-viz-label-range">Range: $[-3, \\infty)$</div>
                </div>
            </div>

            <div class="dr-viz-container">
                <div class="dr-viz-graph">
                    <div class="dr-axis dr-axis-x"></div>
                    <div class="dr-axis dr-axis-y"></div>
                    <div class="dr-curve-sqrt"></div>
                    <div class="dr-viz-shadow dr-shadow-x" style="width: 75%; left: 25%;"></div>
                    <div class="dr-viz-shadow dr-shadow-y" style="height: 75%; bottom: 25%;"></div>
                    <div class="dr-viz-label-title">Square Root Function: $y = \\sqrt{x-1} + 1$</div>
                    <div class="dr-viz-label-domain">Domain: $[1, \\infty)$</div>
                    <div class="dr-viz-label-range">Range: $[1, \\infty)$</div>
                </div>
            </div>

        </div>
    `;

    // 2. We need to tell KaTeX to render the new labels
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(container, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ]
        });
    }
}

function loadAlgebraScale(container) {
    let state = {
        leftX: 2,
        leftConst: 3,
        rightConst: 7,
        solved: false
    };

    // 1. Create the applet's inner HTML
    container.innerHTML = `
        <div class="scale-container">
            <div class="scale-beam" id="scale-beam-${container.id}">
                <div class="scale-pan scale-left" id="scale-left-pan-${container.id}"></div>
                <div class="scale-pan scale-right" id="scale-right-pan-${container.id}"></div>
            </div>
            <div class="scale-base"></div>
            <div class="scale-equation" id="scale-equation-${container.id}"></div>
            <div class="scale-message" id="scale-message-${container.id}">Keep the scale balanced!</div>
        </div>
        <div class="scale-controls" id="scale-controls-${container.id}">
            <button data-op="add" data-val="1">+1</button>
            <button data-op="sub" data-val="1">-1</button>
            <button data-op="div" data-val="2">÷2</button>
            <button data-op="reset">Reset</button>
        </div>
    `;

    // 2. Get references
    const leftPan = container.querySelector(`#scale-left-pan-${container.id}`);
    const rightPan = container.querySelector(`#scale-right-pan-${container.id}`);
    const beam = container.querySelector(`#scale-beam-${container.id}`);
    const equationEl = container.querySelector(`#scale-equation-${container.id}`);
    const messageEl = container.querySelector(`#scale-message-${container.id}`);
    const controls = container.querySelector(`#scale-controls-${container.id}`);

    // 3. Render function
    function renderState() {
        // Render items in pans
        leftPan.innerHTML = '';
        rightPan.innerHTML = '';
        
        for (let i = 0; i < state.leftX; i++) {
            leftPan.innerHTML += '<div class="scale-item item-x">x</div>';
        }
        for (let i = 0; i < state.leftConst; i++) {
            leftPan.innerHTML += '<div class="scale-item item-const">1</div>';
        }
        for (let i = 0; i < state.rightConst; i++) {
            rightPan.innerHTML += '<div class="scale-item item-const">1</div>';
        }

        // Render equation
        let leftEq = (state.leftX > 0 ? `${state.leftX}x` : '');
        if (state.leftConst > 0) {
            leftEq += (leftEq ? ' + ' : '') + state.leftConst;
        }
        if (!leftEq) leftEq = '0';
        
        equationEl.innerHTML = `$$${leftEq} = ${state.rightConst}$$`;
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(equationEl);
        }

        // Update scale balance
        // We use the known solution (x=2) for the visual weight.
        const leftWeight = state.leftX * 2 + state.leftConst;
        const rightWeight = state.rightConst;
        
        beam.classList.remove('tilt-left', 'tilt-right', 'balanced');
        if (leftWeight > rightWeight) {
            beam.classList.add('tilt-left');
            messageEl.textContent = "Unbalanced! Too heavy on the left.";
            messageEl.className = 'scale-message error';
        } else if (rightWeight > leftWeight) {
            beam.classList.add('tilt-right');
            messageEl.textContent = "Unbalanced! Too heavy on the right.";
            messageEl.className = 'scale-message error';
        } else {
            beam.classList.add('balanced');
            if (state.leftX === 1 && state.leftConst === 0) {
                messageEl.textContent = `Solved! x = ${state.rightConst}`;
                messageEl.className = 'scale-message success';
                state.solved = true;
            } else {
                messageEl.textContent = "Balanced! What's the next step?";
                messageEl.className = 'scale-message';
            }
        }
    }

    // 4. Handle clicks
    controls.addEventListener('click', (e) => {
        if (!e.target.matches('button')) return;

        // Freeze controls if solved, until reset
        if (state.solved && e.target.dataset.op !== 'reset') return;

        const op = e.target.dataset.op;
        const val = parseInt(e.target.dataset.val);

        switch (op) {
            case 'add':
                state.leftConst += val;
                state.rightConst += val;
                break;
            case 'sub':
                state.leftConst = Math.max(0, state.leftConst - val);
                state.rightConst = Math.max(0, state.rightConst - val);
                break;
            case 'div':
                if (state.leftX % val === 0 && state.leftConst % val === 0 && state.rightConst % val === 0) {
                    state.leftX /= val;
                    state.leftConst /= val;
                    state.rightConst /= val;
                } else {
                    messageEl.textContent = "Cannot divide all terms evenly by 2!";
                    messageEl.className = 'scale-message error';
                    return; // Don't re-render if it's an invalid op
                }
                break;
            case 'reset':
                state = { leftX: 2, leftConst: 3, rightConst: 7, solved: false };
                break;
        }
        renderState();
    });

    // 5. Initial render
    renderState();
}

function loadInequalityShader(container) {
    // 1. Create the applet's inner HTML
    container.innerHTML = `
        <div class="inequality-controls">
            <button id="show-and-${container.id}" class="active">"AND" (Intersection)</button>
            <button id="show-or-${container.id}">"OR" (Union)</button>
        </div>
        <div class="inequality-display">
            
            <div class="inequality-graph-container" id="graph-and-${container.id}">
                <div class="inequality-label">Example: $$ -2 \\le x < 3 $$</div>
                <div class="number-line">
                    <div class="nl-tick" style="left: 0%;"><span class="nl-label">-5</span></div>
                    <div class="nl-tick" style="left: 20%;"><span class="nl-label">-3</span></div>
                    <div class="nl-tick nl-major" style="left: 30%;"><span class="nl-label">-2</span></div>
                    <div class="nl-tick" style="left: 50%;"><span class="nl-label">0</span></div>
                    <div class="nl-tick nl-major" style="left: 80%;"><span class="nl-label">3</span></div>
                    <div class="nl-tick" style="left: 100%;"><span class="nl-label">5</span></div>
                    
                    <div class="nl-shade" style="left: 30%; width: 50%;"></div>
                    <div class="nl-circle nl-closed" style="left: 30%;"></div>
                    <div class="nl-circle nl-open" style="left: 80%;"></div>
                </div>
            </div>

            <div class="inequality-graph-container" id="graph-or-${container.id}" style="display: none;">
                <div class="inequality-label">Example: $$ x < -3 \\text{ or } x \\ge 1 $$</div>
                <div class="number-line">
                    <div class="nl-tick" style="left: 0%;"><span class="nl-label">-5</span></div>
                    <div class="nl-tick nl-major" style="left: 20%;"><span class="nl-label">-3</span></div>
                    <div class="nl-tick" style="left: 40%;"><span class="nl-label">-1</span></div>
                    <div class="nl-tick nl-major" style="left: 60%;"><span class="nl-label">1</span></div>
                    <div class="nl-tick" style="left: 80%;"><span class="nl-label">3</span></div>
                    <div class="nl-tick" style="left: 100%;"><span class="nl-label">5</span></div>
                    
                    <div class="nl-shade nl-ray-left" style="width: 20%;"></div>
                    <div class="nl-shade nl-ray-right" style="left: 60%; width: 40%;"></div>
                    <div class="nl-circle nl-open" style="left: 20%;"></div>
                    <div class="nl-circle nl-closed" style="left: 60%;"></div>
                </div>
            </div>

        </div>
    `;

    // 2. Render KaTeX
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(container);
    }

    // 3. Get references and add listeners
    const andBtn = container.querySelector(`#show-and-${container.id}`);
    const orBtn = container.querySelector(`#show-or-${container.id}`);
    const andGraph = container.querySelector(`#graph-and-${container.id}`);
    const orGraph = container.querySelector(`#graph-or-${container.id}`);

    andBtn.addEventListener('click', () => {
        andGraph.style.display = 'block';
        orGraph.style.display = 'none';
        andBtn.classList.add('active');
        orBtn.classList.remove('active');
    });

    orBtn.addEventListener('click', () => {
        andGraph.style.display = 'none';
        orGraph.style.display = 'block';
        orBtn.classList.add('active');
        andBtn.classList.remove('active');
    });
}

/**
 * ===================================================================
 * 3. The Main Applet Engine
 * ===================================================================
 */
const AppletEngine = {
    initializers: {},
    register: function(id, initFn) {
        this.initializers[id] = initFn;
    },
    run: function() {
        const appletPlaceholders = document.querySelectorAll('[data-applet-id]');
        appletPlaceholders.forEach(placeholder => {
            const appletId = placeholder.dataset.appletId;
            if (this.initializers[appletId]) {
                this.initializers[appletId](placeholder);
            } else {
                console.warn(`No initializer found for applet ID: ${appletId}`);
            }
        });
    }
};

AppletEngine.register('parabola-explorer', initializeParabolaApplet);
AppletEngine.register('polynomial-grapher', initializePolynomialGrapher);
AppletEngine.register('simplifier-applet', loadSimplifierApplet);
AppletEngine.register('function-machine', loadFunctionMachine);
AppletEngine.register('vertical-line-tester', loadVerticalLineTester);
AppletEngine.register('domain-range-viz', loadDomainRangeViz);
AppletEngine.register('algebra-scale', loadAlgebraScale);
AppletEngine.register('inequality-shader', loadInequalityShader);
// AppletEngine.register('inequality-line', initializeInequalityApplet); // Future applets here

document.addEventListener('DOMContentLoaded', () => AppletEngine.run());

/**
 * ===================================================================
 * 4. Glossary Filter
 * Handles search and tag filtering for the glossary page.
 * ===================================================================
 */
function initializeGlossary() {
    const glossaryContainer = document.getElementById('glossary-list');
    if (!glossaryContainer) return; // Only run on the glossary page

    const searchInput = document.getElementById('glossary-search');
    const tagsContainer = document.getElementById('glossary-tags');
    const clearButton = document.getElementById('glossary-clear');
    const countDisplay = document.getElementById('glossary-count');
    const emptyMessage = document.getElementById('glossary-empty');
    const items = Array.from(glossaryContainer.querySelectorAll('.glossary-item'));
    const selectedTags = new Set();

    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        let visibleCount = 0;

        items.forEach(item => {
            const term = item.dataset.term.toLowerCase();
            const tags = (item.dataset.tags || '').split(',');
            const textContent = item.textContent.toLowerCase();

            // Check if the item matches all selected tags
            const tagsMatch = [...selectedTags].every(selectedTag => tags.includes(selectedTag));

            // Check if the item's text matches the search query
            const searchMatch = !query || term.includes(query) || textContent.includes(query);

            if (tagsMatch && searchMatch) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Update UI elements
        countDisplay.textContent = `${visibleCount} of ${items.length} terms shown`;
        emptyMessage.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Event listener for tag clicks
    tagsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag-chip')) {
            const tag = e.target.dataset.tag;
            e.target.classList.toggle('active');
            if (selectedTags.has(tag)) {
                selectedTags.delete(tag);
            } else {
                selectedTags.add(tag);
            }
            applyFilters();
        }
    });

    // Event listeners for search and clear
    searchInput.addEventListener('input', applyFilters);
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        selectedTags.clear();
        tagsContainer.querySelectorAll('.tag-chip.active').forEach(tagEl => {
            tagEl.classList.remove('active');
        });
        applyFilters();
    });

    // Initial filter application on page load
    applyFilters();
}

// IMPORTANT: Make sure to call this new function when the page loads.
// Add `initializeGlossary();` to the DOMContentLoaded listener in applets.js
document.addEventListener('DOMContentLoaded', () => {
    AppletEngine.run();
    initializeGlossary(); // Add this line
});