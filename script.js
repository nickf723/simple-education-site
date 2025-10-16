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
    const sidebarLinks = document.querySelectorAll('#sidebar-container a');

    sidebarLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('current-page');
            const parentLi = link.closest('li');
            if (parentLi) {
                parentLi.classList.add('active'); // Keep the current section open
            }
        }
    });
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