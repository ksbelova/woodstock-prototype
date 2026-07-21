const modeLinks = document.querySelectorAll("[data-mode]");

modeLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const selectedMode = link.dataset.mode;

    sessionStorage.setItem(
      "woodstockCalcMode",
      selectedMode
    );
  });
});