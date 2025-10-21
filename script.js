document.addEventListener("DOMContentLoaded", function() {
    initializePage();
});

function initializePage() {
    fetch("sidebar.html")
        .then(response => {
            if (!response.ok) throw new Error('Sidebar not found');
            return response.text();
        })
                .then(data => {
            document.getElementById("sidebar-container").innerHTML = data;
            activateCurrentMenuItem();
            initializeMenuToggle();
            initializeCollapsibleMenu();
            initializeHomepageCollapsibles();
            buildPageTOC();
            renderBreadcrumbs();
        })
        .catch(error => console.error("Sidebar loading error:", error))
        .finally(() => {
            // This function will now wait for the renderer to be ready.
            renderMathWhenReady();
        });
}

/**
 * NEW: This function checks if the KaTeX renderer is available.
 * If not, it waits a short moment and checks again. This prevents race conditions.
 */
function renderMathWhenReady(attempts = 0) {
    if (typeof renderMathInElement === 'function') {
        // KaTeX is ready, render the math!
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ]
        });
    } else if (attempts < 50) { // Try for up to 5 seconds
        // KaTeX not ready yet, check again in 100ms
        setTimeout(() => renderMathWhenReady(attempts + 1), 100);
    } else {
        console.error("KaTeX library failed to load after 5 seconds.");
    }
}

function activateCurrentMenuItem() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const allLinks = document.querySelectorAll('#sidebar-container a');
    let currentLink = null;

    allLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('current-page');
            currentLink = link;
        }
    });
    
    if (currentLink) {
        let parentLi = currentLink.closest('li');
        while (parentLi) {
            parentLi.classList.add('active');
            parentLi = parentLi.parentElement.closest('li');
        }
    }
}

function initializeMenuToggle() {
    const menuButton = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar-container');
    if (menuButton && sidebar) {
        menuButton.addEventListener('click', () => sidebar.classList.toggle('visible'));
    }
}

function initializeCollapsibleMenu() {
    const toggles = document.querySelectorAll('.menu-header');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const parentLi = toggle.closest('li');
            if (parentLi) {
                parentLi.classList.toggle('active');
            }
        });
    });
}
// Top-level: homepage collapsibles (fix ReferenceError)
function initializeHomepageCollapsibles() {
    const toggles = document.querySelectorAll('.subdomain-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            const list = toggle.nextElementSibling;
            if (list) {
                if (list.style.maxHeight) {
                    list.style.maxHeight = null;
                } else {
                    list.style.maxHeight = list.scrollHeight + "px";
                }
            }
        });
    });
}


// ===== Page mini-TOC and Breadcrumbs =====
function buildPageTOC() {
    try {
        const tocHost = document.querySelector('main.content');
        if (!tocHost) return;
        const headings = Array.from(tocHost.querySelectorAll('section.topic-article > h2'));
        if (headings.length < 2) return; // skip if too few
        const toc = document.createElement('nav');
        toc.className = 'page-toc';
        toc.innerHTML = '<h3>On this page</h3>';
        const ul = document.createElement('ul');
        headings.forEach(h => {
            const sec = h.closest('section');
            const id = sec && sec.id ? sec.id : h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-');
            if (sec && !sec.id) sec.id = id;
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#' + id; a.textContent = h.textContent.trim();
            li.appendChild(a); ul.appendChild(li);
        });
        toc.appendChild(ul);
        const overview = document.querySelector('article.topic-overview');
        if (overview && overview.parentNode) {
            overview.parentNode.insertBefore(toc, overview.nextSibling);
        }
    } catch (e) { console.error('TOC error', e); }
}

function renderBreadcrumbs() {
    try {
        const map = {
            'arithmetic.html': ['Home:index.html','Mathematics:mathematics.html','Arithmetic:arithmetic.html'],
            'algebra.html': ['Home:index.html','Mathematics:mathematics.html','Algebra:algebra.html'],
            'geometry.html': ['Home:index.html','Mathematics:mathematics.html','Geometry:geometry.html'],
            'calculus.html': ['Home:index.html','Mathematics:mathematics.html','Calculus:calculus.html'],
            'trigonometry.html': ['Home:index.html','Mathematics:mathematics.html','Trigonometry:trigonometry.html'],
            'statistics.html': ['Home:index.html','Mathematics:mathematics.html','Statistics:statistics.html'],
            'linear-algebra.html': ['Home:index.html','Mathematics:mathematics.html','Linear Algebra:linear-algebra.html'],
            'mathematics.html': ['Home:index.html','Mathematics:mathematics.html'],
            'glossary.html': ['Home:index.html','Glossary:glossary.html']
        };
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const trail = map[page]; if (!trail) return;
        const nav = document.createElement('div'); nav.className = 'breadcrumbs';
        nav.innerHTML = trail.map((t,i) => {
            const [label, href] = t.split(':');
            if (i === trail.length - 1) return label;
            return '<a href="' + href + '">' + label + '</a>';
        }).join(' \u203A ');
        const main = document.querySelector('main.content');
        if (main && main.firstElementChild) {
            main.insertBefore(nav, main.firstElementChild);
        }
    } catch (e) { console.error('Breadcrumb error', e); }
}


