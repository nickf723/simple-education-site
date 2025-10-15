// This function runs when the entire HTML document is ready
document.addEventListener("DOMContentLoaded", function() {
    // Fetch the sidebar's HTML content
    fetch("/sidebar.html")
        .then(response => {
            // Check if the file was found
            if (!response.ok) {
                throw new Error("sidebar.html not found");
            }
            return response.text();
        })
        .then(data => {
            // Put the sidebar HTML into its container
            document.getElementById("sidebar-container").innerHTML = data;
            
            // Now that the sidebar exists, make its links and menu button work
            activateCurrentMenuItem();
            initializeMenuToggle();
        })
        .catch(error => {
            // If the fetch fails, log an error to the console
            console.error("Error loading sidebar:", error);
        });
});

// This function finds the link for the current page and highlights it
function activateCurrentMenuItem() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const sidebarLinks = document.querySelectorAll('#sidebar-container a');

    sidebarLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('current-page');
            const parentSubmenu = link.closest('.submenu');
            if (parentSubmenu) {
                parentSubmenu.parentElement.classList.add('active');
            }
        }
    });
}

// This function makes the hamburger menu button work on mobile
function initializeMenuToggle() {
    const menuButton = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar-container');

    if (menuButton && sidebar) {
        menuButton.addEventListener('click', function() {
            sidebar.classList.toggle('visible');
        });
    }
}