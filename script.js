/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

/* Array to store selected products */
let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProducts.some((p) => p.id === product.id);
      return `
        <div class="product-card${
          isSelected ? " selected" : ""
        }" data-product-id="${product.id}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <button class="desc-toggle-btn" aria-expanded="false" aria-controls="desc-${
              product.id
            }">Show Description</button>
            <div class="product-description" id="desc-${product.id}" hidden>
              ${
                product.description
                  ? product.description
                  : "No description available."
              }
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Add click event listeners to all product cards (except when clicking the desc button)
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("desc-toggle-btn")) return;
      const productId = parseInt(card.dataset.productId);
      toggleProductSelection(productId, products);
    });
  });

  // Add event listeners for description toggle buttons
  const descButtons = document.querySelectorAll(".desc-toggle-btn");
  descButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const descId = btn.getAttribute("aria-controls");
      const descDiv = document.getElementById(descId);
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        descDiv.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "Show Description";
      } else {
        descDiv.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = "Hide Description";
      }
    });
  });
}

/* Toggle product selection when clicked */
function toggleProductSelection(productId, products) {
  const product = products.find((p) => p.id === productId);
  const isSelected = selectedProducts.some((p) => p.id === productId);

  if (isSelected) {
    /* Remove product from selection */
    selectedProducts = selectedProducts.filter((p) => p.id !== productId);
  } else {
    /* Add product to selection */
    selectedProducts.push(product);
  }

  /* Update visual state of product cards */
  updateProductCardVisuals();
  /* Update selected products display */
  displaySelectedProducts();
}

/* Update visual appearance of product cards based on selection */
function updateProductCardVisuals() {
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    const productId = parseInt(card.dataset.productId);
    const isSelected = selectedProducts.some((p) => p.id === productId);

    if (isSelected) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

/* Display selected products in the dedicated section */
function displaySelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p style="color: #666; font-style: italic;">
        No products selected yet. Click on product cards to add them.
      </p>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product-item">
        <span>${product.name}</span>
        <button class="remove-btn" data-product-id="${product.id}" title="Remove product">
          ×
        </button>
      </div>
    `
    )
    .join("");

  /* Add click handlers to remove buttons */
  const removeButtons = selectedProductsList.querySelectorAll(".remove-btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const productId = parseInt(button.dataset.productId);
      removeProductFromSelection(productId);
    });
  });
}

/* Remove a product from selection */
function removeProductFromSelection(productId) {
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);
  updateProductCardVisuals();
  displaySelectedProducts();
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
  /* Maintain visual state of selected products after category change */
  updateProductCardVisuals();
});

/* Initialize selected products display */
displaySelectedProducts();

/* Generate routine button click handler */
generateRoutineBtn.addEventListener("click", () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `
      <p style="color: #e74c3c;">
        Please select at least one product to generate a routine.
      </p>
    `;
    return;
  }

  const productNames = selectedProducts.map((p) => p.name).join(", ");
  chatWindow.innerHTML = `
    <p>
      <strong>Selected Products:</strong> ${productNames}
    </p>
    <p style="margin-top: 10px;">
      Connect to the OpenAI API to generate a personalized routine with these products!
    </p>
  `;
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
