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