// toggle-theme.js
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggle");
  const body = document.body;

  toggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark-theme");
    body.classList.toggle("light-theme");
  });
  const hamburger = document.getElementById("hamburger");
const sideNav = document.getElementById("sideNav");

hamburger.addEventListener("click", () => {
  const isOpen = sideNav.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", isOpen);
  sideNav.setAttribute("aria-hidden", !isOpen);
});

});
