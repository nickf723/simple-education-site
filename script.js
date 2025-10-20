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

    function initializeHomepageCollapsibles() {
    const toggles = document.querySelectorAll('.subdomain-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            const list = toggle.nextElementSibling;
            if (list.style.maxHeight) {
                list.style.maxHeight = null;
            } else {
                list.style.maxHeight = list.scrollHeight + "px";
            }
        });
    });
}
}