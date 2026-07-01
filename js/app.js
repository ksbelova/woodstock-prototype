const detailedModeLink = document.querySelector(".mode-card--active");

detailedModeLink.addEventListener("click", () => {
  sessionStorage.setItem("woodstockCalcMode", "detailed");
});