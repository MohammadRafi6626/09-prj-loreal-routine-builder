/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const workerUrl = "https://loreal-worker.mxr5784.workers.dev/";

/* Array to store selected products */
let selectedProducts = [];

/* Array to store conversation history for context */
let conversationHistory = [];

/* Variables to track current search and filter state */
let allProducts = [];
let currentSearch = "";
let currentCategory = "";

/* Load selected products from localStorage on page load */
function loadSelectedProductsFromStorage() {
  const savedProducts = localStorage.getItem("selectedProducts");
  if (savedProducts) {
    try {
      selectedProducts = JSON.parse(savedProducts);
    } catch (error) {
      console.error("Error loading selected products from storage:", error);
      selectedProducts = [];
    }
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  try {
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
  } catch (error) {
    console.error("Error saving selected products to storage:", error);
  }
}

/* Initial loading message */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Loading products...
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  try {
    const response = await fetch("products.json");
    const data = await response.json();
    allProducts = data.products; // Store all products for filtering
    displayProducts(allProducts); // Display all products initially
    setupEventListeners(); // Setup search and filter listeners
  } catch (error) {
    console.error("Error loading products:", error);
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Error loading products. Please try refreshing the page.
      </div>
    `;
  }
}

/* Setup event listeners for search and category filter */
function setupEventListeners() {
  // Category filter
  categoryFilter.addEventListener("change", (e) => {
    currentCategory = e.target.value;
    filterProducts();
  });

  // Search input with debounce for better performance
  const searchInput = document.getElementById("productSearch");
  let searchTimeout;

  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.toLowerCase().trim();

    // Clear previous timeout to avoid multiple rapid searches
    clearTimeout(searchTimeout);

    // Set new timeout for debounced search (waits 300ms after user stops typing)
    searchTimeout = setTimeout(() => {
      filterProducts();
    }, 300);
  });
}

/* Filter products based on category and search query */
function filterProducts() {
  let filteredProducts = allProducts;

  // Filter by category if selected
  if (currentCategory) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.category.toLowerCase() === currentCategory.toLowerCase()
    );
  }

  // Filter by search query if entered
  if (currentSearch) {
    filteredProducts = filteredProducts.filter((product) => {
      // Search in product name, brand, category, and description
      const searchText = [
        product.name,
        product.brand,
        product.category,
        product.description,
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(currentSearch);
    });
  }

  // Display results or "no results" message
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found matching your search criteria.
        <br><br>
        <button onclick="clearFilters()" class="clear-filters-btn">Clear Filters</button>
      </div>
    `;
  } else {
    displayProducts(filteredProducts);
  }
}

/* Clear all filters and show all products */
function clearFilters() {
  currentSearch = "";
  currentCategory = "";

  // Reset form inputs
  document.getElementById("productSearch").value = "";
  document.getElementById("categoryFilter").value = "";

  // Show all products
  displayProducts(allProducts);
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

  /* Save to localStorage */
  saveSelectedProductsToStorage();

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

  selectedProductsList.innerHTML =
    selectedProducts
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
      .join("") +
    `
    <div style="width: 100%; margin-top: 15px;">
      <button id="clearAllBtn" class="clear-all-btn" title="Clear all selected products">
        <i class="fa-solid fa-trash"></i> Clear All
      </button>
    </div>
  `;

  /* Add click handlers to remove buttons */
  const removeButtons = selectedProductsList.querySelectorAll(".remove-btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const productId = parseInt(button.dataset.productId);
      removeProductFromSelection(productId);
    });
  });

  /* Add click handler to clear all button */
  const clearAllBtn = document.getElementById("clearAllBtn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", clearAllSelectedProducts);
  }
}

/* Remove a product from selection */
function removeProductFromSelection(productId) {
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  updateProductCardVisuals();
  displaySelectedProducts();
}

/* Clear all selected products */
function clearAllSelectedProducts() {
  /* Show confirmation dialog */
  const confirmed = confirm(
    "Are you sure you want to clear all selected products?"
  );

  if (confirmed) {
    selectedProducts = [];

    /* Save to localStorage */
    saveSelectedProductsToStorage();

    /* Clear conversation history when clearing products */
    conversationHistory = [];

    updateProductCardVisuals();
    displaySelectedProducts();

    /* Clear chat window */
    chatWindow.innerHTML = "";
  }
}

/* Initialize the application */
loadProducts();
loadSelectedProductsFromStorage();
displaySelectedProducts();

/* RTL Language Support */
let isRTL = false;

/* Language toggle functionality */
function setupLanguageToggle() {
  const toggleBtn = document.getElementById("toggleRTL");
  const languageText = document.getElementById("languageText");
  const htmlElement = document.documentElement;

  toggleBtn.addEventListener("click", () => {
    isRTL = !isRTL;

    if (isRTL) {
      // Switch to RTL mode
      htmlElement.setAttribute("dir", "rtl");
      htmlElement.setAttribute("lang", "ar"); // Arabic as default RTL language
      languageText.textContent = "English";

      // Update placeholders for RTL
      updatePlaceholdersForRTL();
    } else {
      // Switch to LTR mode
      htmlElement.setAttribute("dir", "ltr");
      htmlElement.setAttribute("lang", "en");
      languageText.textContent = "العربية / עברית";

      // Update placeholders for LTR
      updatePlaceholdersForLTR();
    }

    // Save language preference
    localStorage.setItem("isRTL", isRTL.toString());
  });
}

/* Update placeholders and text for RTL */
function updatePlaceholdersForRTL() {
  const searchInput = document.getElementById("productSearch");
  const chatInput = document.getElementById("userInput");
  const categoryFilter = document.getElementById("categoryFilter");

  // Update placeholders
  searchInput.placeholder = "ابحث عن المنتجات بالاسم أو العلامة التجارية...";
  chatInput.placeholder = "اسأل عن المنتجات أو الروتينات...";

  // Update category options (keeping English for simplicity, but you could translate these)
  const options = categoryFilter.options;
  options[0].textContent = "اختر فئة";
}

/* Update placeholders and text for LTR */
function updatePlaceholdersForLTR() {
  const searchInput = document.getElementById("productSearch");
  const chatInput = document.getElementById("userInput");
  const categoryFilter = document.getElementById("categoryFilter");

  // Update placeholders
  searchInput.placeholder = "Search products by name, brand, or keywords...";
  chatInput.placeholder = "Ask me about products or routines…";

  // Update category options
  const options = categoryFilter.options;
  options[0].textContent = "Choose a Category";
}

/* Load saved language preference */
function loadLanguagePreference() {
  const savedRTL = localStorage.getItem("isRTL");
  if (savedRTL === "true") {
    // Trigger RTL mode
    document.getElementById("toggleRTL").click();
  }
}

/* Initialize language toggle when page loads */
document.addEventListener("DOMContentLoaded", () => {
  setupLanguageToggle();
  loadLanguagePreference();
});

/* Test function to check worker response - you can call this in browser console */
window.testWorker = async function () {
  try {
    console.log("Testing worker at:", workerUrl);

    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: "Say hello in one sentence.",
          },
        ],
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    const data = await response.json();
    console.log("Response data:", data);

    return data;
  } catch (error) {
    console.error("Worker test failed:", error);
    return error;
  }
};

/* Generate routine button click handler */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `
      <p style="color: #e74c3c;">
        Please select at least one product to generate a routine.
      </p>
    `;
    return;
  }

  /* Show loading state while generating routine */
  chatWindow.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 20px; height: 20px; border: 2px solid #ccc; border-top: 2px solid #000; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p>Generating your personalized routine...</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  try {
    /* Prepare the selected products data to send to the worker */
    const productsData = selectedProducts.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    }));

    /* Send request to the Cloudflare Worker */
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful L'Oréal beauty assistant. Create detailed, step-by-step beauty routines using the provided products. Focus on order of application, frequency, and helpful tips.",
          },
          {
            role: "user",
            content: `Create a personalized skincare/beauty routine using these selected products: ${JSON.stringify(
              productsData
            )}. Please provide step-by-step instructions on how to use these products together effectively, including the order of application, frequency, and any tips for best results.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    /* Enhanced logging for debugging */
    console.log("Full API Response:", data);
    console.log("Response Status:", response.status);
    console.log("Response Headers:", response.headers);

    if (data.choices) {
      console.log("Choices found:", data.choices.length);
      console.log("First choice:", data.choices[0]);
    }

    /* Handle different response formats - with or without web search */
    let routineContent = "";

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const message = data.choices[0].message;

      /* Check if it's a regular message */
      if (message.content) {
        routineContent = message.content;
      } else if (message.tool_calls && message.tool_calls.length > 0) {
        /* Check if it's a web search response with tool calls */
        /* Handle web search tool calls */
        routineContent =
          "Searching for current information... Please try again in a moment.";
      } else {
        /* Check for any other content format */
        routineContent =
          "I'm having trouble generating your routine right now. Please try again.";
      }
    } else if (data.error) {
      /* Handle error responses */
      throw new Error(data.error.message || "API returned an error");
    } else {
      /* Handle completely unexpected format */
      console.error("Unexpected API response format:", data);
      throw new Error("The API returned an unexpected response format");
    }

    /* Add the routine to conversation history */
    conversationHistory.push({
      role: "assistant",
      content: routineContent,
    });

    /* Display the AI-generated routine in the chat window */
    chatWindow.innerHTML = `
      <div class="ai-message">
        <h3 style="margin-bottom: 15px; color: #2d5016; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-sparkles"></i>
          Your Personalized Routine
        </h3>
        <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
          ${routineContent}
        </div>
      </div>
    `;

    /* Scroll to show the new content */
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    /* Handle any errors that occur during the API call */
    console.error("Error generating routine:", error);
    chatWindow.innerHTML = `
      <div style="color: #e74c3c;">
        <h3 style="margin-bottom: 10px;">Error Generating Routine</h3>
        <p>Sorry, there was an error generating your routine. Please try again later.</p>
        <p style="margin-top: 10px; font-size: 14px; color: #666;">
          Error: ${error.message}
        </p>
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer; color: #666;">Debug Information</summary>
          <pre style="background: #f5f5f5; padding: 10px; margin-top: 5px; font-size: 12px; overflow-x: auto;">
            ${JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </div>
    `;
  }
});

/* Chat form submission handler - enables follow-up questions */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();

  /* Check if user entered a message */
  if (!userMessage) {
    return;
  }

  /* Check if the question is related to allowed topics */
  const allowedTopics = [
    "skincare",
    "haircare",
    "makeup",
    "fragrance",
    "beauty",
    "routine",
    "cleanser",
    "moisturizer",
    "serum",
    "sunscreen",
    "foundation",
    "mascara",
    "shampoo",
    "conditioner",
    "perfume",
    "cologne",
    "face",
    "skin",
    "hair",
    "eyes",
    "lips",
    "acne",
    "wrinkles",
    "dryness",
    "oily",
    "sensitive",
    "application",
    "order",
    "frequency",
    "tips",
    "ingredients",
    "product",
    "loreal",
    "l'oreal",
    "cerave",
    "lancome",
    "ysl",
    "urban decay",
  ];

  const isRelevantTopic =
    allowedTopics.some((topic) =>
      userMessage.toLowerCase().includes(topic.toLowerCase())
    ) || conversationHistory.length > 0; // Allow follow-ups if conversation has started

  if (!isRelevantTopic) {
    chatWindow.innerHTML += `
      <div style="margin-top: 20px; padding: 10px; background: #e8f4f8; border-left: 4px solid #2196F3; border-radius: 4px;">
        <strong>You:</strong> ${userMessage}
      </div>
      <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; color: #856404;">
        <strong>L'Oréal Assistant:</strong><br>
        <div style="margin-top: 5px;">
          I'm here to help with beauty and skincare questions! Please ask me about skincare routines, haircare, makeup, fragrance, or your selected products. I'd be happy to provide tips and advice on these topics.
        </div>
      </div>
    `;
    userInput.value = "";
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  }

  /* Add user's message to chat window and conversation history */
  const currentContent = chatWindow.innerHTML;
  chatWindow.innerHTML =
    currentContent +
    `
    <div style="margin-top: 20px; padding: 10px; background: #e8f4f8; border-left: 4px solid #2196F3; border-radius: 4px;">
      <strong>You:</strong> ${userMessage}
    </div>
  `;

  /* Add user message to conversation history */
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  /* Clear the input field */
  userInput.value = "";

  /* Show loading indicator for AI response */
  chatWindow.innerHTML += `
    <div id="ai-loading" style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
      <div style="width: 16px; height: 16px; border: 2px solid #ccc; border-top: 2px solid #000; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span>AI is thinking...</span>
    </div>
  `;

  /* Scroll to bottom of chat window */
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    /* Prepare context with selected products for better follow-up responses */
    const productsContext =
      selectedProducts.length > 0
        ? `\n\nSelected products: ${selectedProducts
            .map((p) => `${p.name} by ${p.brand} (${p.category})`)
            .join(", ")}.`
        : "";

    /* Build conversation messages with full history */
    const messages = [
      {
        role: "system",
        content: `You are a helpful L'Oréal beauty assistant specializing in skincare, haircare, makeup, and fragrance advice. Only respond to questions related to beauty, personal care, cosmetics, and product usage. If asked about unrelated topics, politely redirect the conversation back to beauty and skincare topics.${productsContext}`,
      },
      ...conversationHistory,
    ];

    /* Send follow-up question with full conversation history to the Cloudflare Worker */
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    /* Remove loading indicator */
    const loadingElement = document.getElementById("ai-loading");
    if (loadingElement) {
      loadingElement.remove();
    }

    /* Display AI response */
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      const aiResponse = data.choices[0].message.content;

      /* Add AI response to conversation history */
      conversationHistory.push({
        role: "assistant",
        content: aiResponse,
      });

      chatWindow.innerHTML += `
        <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px;">
          <strong>L'Oréal Assistant:</strong><br>
          <div style="margin-top: 5px; white-space: pre-wrap; line-height: 1.6;">
            ${aiResponse}
          </div>
        </div>
      `;
    } else {
      throw new Error("Unexpected response format from API");
    }
  } catch (error) {
    /* Remove loading indicator if error occurs */
    const loadingElement = document.getElementById("ai-loading");
    if (loadingElement) {
      loadingElement.remove();
    }

    /* Display error message */
    console.error("Error getting AI response:", error);
    chatWindow.innerHTML += `
      <div style="margin-top: 10px; padding: 10px; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px; color: #721c24;">
        <strong>Error:</strong> Sorry, I couldn't process your question right now. Please try again later.
      </div>
    `;
  }

  /* Scroll to bottom of chat window */
  chatWindow.scrollTop = chatWindow.scrollHeight;
});
