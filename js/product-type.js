const productLinks = document.querySelectorAll("[data-product]");

productLinks.forEach((link) => {
  link.addEventListener("click", () => {
    sessionStorage.setItem("woodstockProductType", link.dataset.product);
  });
});