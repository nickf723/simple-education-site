document.addEventListener("DOMContentLoaded", function() {
    fetch("sidebar.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("sidebar-container").innerHTML = data;
            
            // Initialize all our features after the sidebar is loaded
            activateCurrentMenuItem();
            initializeMenuToggle();
            initializeCollapsibleMenu(); // <-- New function call
        })
        .catch(error => console.error("Error loading sidebar:", error));
});

function activateCurrentMenuItem() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const allLinks = document.querySelectorAll('#sidebar-container a');
    let currentLink = null;

    // First, find the exact link for the current page
    allLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('current-page');
            currentLink = link;
        }
    });
    
    // If the current link was found, traverse up its parents
    if (currentLink) {
        let parentLi = currentLink.closest('li');
        
        // Loop upwards through parent <li> elements, adding 'active' to them
        // This will open every parent folder of the current page.
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

// NEW: This function handles the expand/collapse clicks
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