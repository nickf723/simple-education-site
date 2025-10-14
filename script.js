document.addEventListener("DOMContentLoaded", function(){
    fetch("sidebar.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("sidebar-container").innerHTML = data;
        activateCurrentMenuItem();
    })
});

function activateCurrentMenuItem() {
    const currentPage = window.location.pathname.split("/").pop();
    const sidebarLinks = document.querySelectorAll('#sidebar-container a');
    sidebarLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage){
            link.classList.add('current-page');
            const parentSubmenu = link.closest('.submenu');
            if (parentSubmenu) {
                parentSubmenu.parentElement.classList.add('active');
            }
        }
    });
}