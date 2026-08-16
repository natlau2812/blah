/* ============================================================
   BATCH 28 CONFIGURATION
============================================================ */

/*
Replace this with your Google Apps Script Web App URL
AFTER you create the Apps Script.

Example:

const GOOGLE_SCRIPT_URL =
"https://script.google.com/macros/s/XXXXX/exec";
*/

const GOOGLE_SCRIPT_URL =
"YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";


/* ============================================================
   CART / ORDER VARIABLES
============================================================ */

let cart = [];

let collections = [];

let currentOrder = null;


/* ============================================================
   INITIALISE
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  // Set the exact same panda image used by the logo first,
  // so the cart / PayNow / confirmation panda is always loaded.
  const logoPanda = document.querySelector(".logo-panda img");
  const pandaStates = document.querySelectorAll(".exact-panda-state");

  if (logoPanda && pandaStates.length) {
    const pandaSrc = logoPanda.getAttribute("src");

    pandaStates.forEach(img => {
      img.src = pandaSrc;
    });
  }

  loadCollections();
  renderCart();
  updateBrowniePrice();

});


/* ============================================================
   HAMBURGER MENU
============================================================ */

function toggleMobileMenu() {

  const menu =
    document.getElementById("mobileMenu");

  menu.classList.toggle("open");

}


function closeMobileMenu() {

  const menu =
    document.getElementById("mobileMenu");

  menu.classList.remove("open");

}


/* ============================================================
   PRODUCT CART
============================================================ */

function addToCart(id, name, price) {

  const existing =
    cart.find(item => item.id === id);

  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({
      id,
      name,
      price,
      quantity: 1
    });

  }

  renderCart();

  showToast(
    `${name} added to cart 🍪`
  );

}


/* ============================================================
   BROWNIE SELECTOR
============================================================ */

function updateBrowniePrice() {

  const selector =
    document.getElementById(
      "brownieSelector"
    );

  if (!selector) return;

  const selected =
    selector.options[
      selector.selectedIndex
    ];

  const price =
    Number(
      selected.dataset.price
    );

  const priceDisplay =
    document.getElementById(
      "browniePrice"
    );

  if (!priceDisplay) return;

  if (
    selector.selectedIndex === 0
  ) {

    priceDisplay.textContent =
      "From $10.80";

  } else {

    priceDisplay.textContent =
      `$${price.toFixed(2)}`;

  }

}


function addSelectedBrownie() {

  const selector =
    document.getElementById(
      "brownieSelector"
    );

  if (!selector) return;

  const selected =
    selector.options[
      selector.selectedIndex
    ];

  const id =
    selected.value;

  const name =
    selected.dataset.name;

  const price =
    Number(
      selected.dataset.price
    );

  addToCart(
    id,
    name,
    price
  );

}


/* ============================================================
   QUANTITY
============================================================ */

function changeQuantity(id, change) {

  const item =
    cart.find(
      product => product.id === id
    );

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {

    cart =
      cart.filter(
        product => product.id !== id
      );

  }

  renderCart();

}


/* ============================================================
   CART TOTAL
============================================================ */

function getCartTotal() {

  return cart.reduce(
    (total, item) =>
      total +
      item.price *
      item.quantity,
    0
  );

}


/* ============================================================
   RENDER CART
============================================================ */

function renderCart() {

  const cartItems =
    document.getElementById(
      "cartItems"
    );

  const emptyCart =
    document.getElementById(
      "emptyCart"
    );

  const cartSummary =
    document.getElementById(
      "cartSummary"
    );

  const cartCount =
    document.getElementById(
      "cartCount"
    );

  const cartTotal =
    document.getElementById(
      "cartTotal"
    );


  if (
    !cartItems ||
    !emptyCart ||
    !cartSummary ||
    !cartCount ||
    !cartTotal
  ) {

    return;

  }


  const itemCount =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );


  cartCount.textContent =
    itemCount;


  if (cart.length === 0) {

    cartItems.innerHTML = "";

    emptyCart.classList.remove(
      "hidden"
    );

    cartSummary.classList.add(
      "hidden"
    );

    return;

  }


  emptyCart.classList.add(
    "hidden"
  );

  cartSummary.classList.remove(
    "hidden"
  );


  cartItems.innerHTML =
    cart.map(item => `

      <div class="cart-item">

        <div>

          <strong>
            ${escapeHtml(item.name)}
          </strong>

          <small>
            $${item.price.toFixed(2)} each
          </small>

          <div class="quantity-controls">

            <button
              type="button"
              onclick="changeQuantity(
                '${item.id}',
                -1
              )"
            >
              −
            </button>

            <strong>
              ${item.quantity}
            </strong>

            <button
              type="button"
              onclick="changeQuantity(
                '${item.id}',
                1
              )"
            >
              +
            </button>

          </div>

        </div>

        <strong>
          $${(
            item.price *
            item.quantity
          ).toFixed(2)}
        </strong>

      </div>

    `).join("");


  cartTotal.textContent =
    getCartTotal().toFixed(2);

}


/* ============================================================
   CART DRAWER
============================================================ */

function openCart() {

  document
    .getElementById("cartDrawer")
    .classList.add("open");

}


function closeCart() {

  const confirmation =
    document.getElementById(
      "confirmation"
    );

  const emptyCart =
    document.getElementById(
      "emptyCart"
    );

  /*
     If the customer has just completed payment,
     the confirmation screen is a temporary view
     inside the drawer.

     Closing the drawer returns it to the normal
     empty-cart state, so reopening the cart shows:

     "Your cart is empty 🍪"
  */

  if (
    confirmation &&
    confirmation.classList.contains("show")
  ) {

    confirmation.classList.remove(
      "show"
    );

    if (emptyCart) {

      emptyCart.classList.remove(
        "hidden"
      );

    }

  }


  document
    .getElementById("cartDrawer")
    .classList.remove("open");

}


/* ============================================================
   COLLECTIONS
============================================================ */

function loadCollections() {

  /*
  Batch 28 automatically calculates the next
  5 Sundays from the customer's current date/time.

  Sunday itself is skipped because that collection
  date is already considered past once the day has started.
  */

  const today =
    new Date();

  collections = [];


  for (
    let i = 0;
    i < 5;
    i++
  ) {

    const sunday =
      getNextSunday(
        today,
        i
      );


    collections.push({

      id:
        `C${String(
          i + 1
        ).padStart(
          3,
          "0"
        )}`,

      date:
        formatDateForInput(
          sunday
        ),

      displayDate:
        formatFriendlyDate(
          sunday
        ),

      time:
        "2:00 PM – 5:00 PM",

      address:
        "Collection address will be provided",

      status:
        isCollectionOpen(
          formatDateForInput(
            sunday
          )
        )
          ? "OPEN"
          : "CLOSED"

    });

  }


  renderCollectionOptions();

  renderCollectionPreview();

  setupCustomDatePicker();

}


/* ============================================================
   GET NEXT SUNDAY
============================================================ */

function getNextSunday(
  date,
  weeksAhead
) {

  const result =
    new Date(date);

  const day =
    result.getDay();


  /*
  If today is Sunday,
  start from next Sunday.

  Otherwise start from
  the upcoming Sunday.
  */

  let daysUntilSunday =
    (7 - day) % 7;


  if (day === 0) {

    daysUntilSunday = 7;

  }


  result.setDate(
    result.getDate() +
    daysUntilSunday +
    (
      weeksAhead * 7
    )
  );


  return result;

}


/* ============================================================
   CHECK COLLECTION DEADLINE
============================================================ */

function isCollectionOpen(
  collectionDate
) {

  const date =
    new Date(
      collectionDate +
      "T23:59:59"
    );


  /*
  Thursday immediately before
  the Sunday collection.
  */

  const cutoff =
    new Date(date);


  cutoff.setDate(
    cutoff.getDate() - 3
  );


  cutoff.setHours(
    23,
    59,
    59,
    999
  );


  return new Date() <= cutoff;

}


/* ============================================================
   COLLECTION OPTIONS
============================================================ */

function renderCollectionOptions() {

  const container =
    document.getElementById(
      "collectionOptions"
    );


  if (!container) return;


  const openCollections =
    collections.filter(
      collection =>
        collection.status === "OPEN" &&
        isCollectionOpen(
          collection.date
        )
    );


  if (
    openCollections.length === 0
  ) {

    container.innerHTML = `

      <div class="status-note">

        The upcoming Sunday dates
        have closed.

        Please choose a different
        Sunday using the date picker below.

      </div>

    `;

    return;

  }


  container.innerHTML =
    openCollections
      .map(
        (
          collection,
          index
        ) => `

        <div class="collection-option">

          <input
            type="radio"
            name="collection"
            id="collection-${collection.id}"
            value="${collection.id}"
            ${
              index === 0
                ? "checked"
                : ""
            }
            onchange="clearCustomCollectionDate()"
          >

          <label
            class="collection-label"
            for="collection-${collection.id}"
          >

            <strong>
              ${escapeHtml(
                collection.displayDate
              )}
            </strong>

            <span>
              ${escapeHtml(
                collection.time
              )}
            </span>

            <span>
              Order by Thursday 11:59 PM
            </span>

          </label>

        </div>

      `
      )
      .join("");

}


/* ============================================================
   COLLECTION PREVIEW
============================================================ */

function renderCollectionPreview() {

  const container =
    document.getElementById(
      "collectionPreview"
    );


  if (!container) return;


  container.innerHTML =
    collections
      .map(
        collection => {

          const open =
            collection.status === "OPEN" &&
            isCollectionOpen(
              collection.date
            );


          return `

            <div class="collection-card">

              <strong>
                ${escapeHtml(
                  collection.displayDate
                )}
              </strong>

              <div>
                ${escapeHtml(
                  collection.time
                )}
              </div>

              <div
                class="${
                  open
                    ? ""
                    : "collection-preview-closed"
                }"
              >

                ${
                  open
                    ? "Pre-orders close Thursday at 11:59 PM"
                    : "Pre-orders closed"
                }

              </div>

            </div>

          `;

        }
      )
      .join("");

}


/* ============================================================
   CUSTOM DATE PICKER
============================================================ */

function setupCustomDatePicker() {

  const input =
    document.getElementById(
      "customCollectionDate"
    );


  if (!input) return;


  /*
  Minimum date is tomorrow.

  JavaScript validation below additionally
  requires the chosen date to be a Sunday.
  */

  const minDate =
    new Date();


  minDate.setDate(
    minDate.getDate() + 1
  );


  input.min =
    formatDateForInput(
      minDate
    );

}


/* ============================================================
   TOGGLE CUSTOM DATE PICKER
============================================================ */

function toggleCustomDatePicker() {

  const picker =
    document.getElementById(
      "customDatePicker"
    );


  if (!picker) return;


  picker.classList.toggle(
    "show"
  );

}


/* ============================================================
   CLEAR CUSTOM COLLECTION DATE
============================================================ */

function clearCustomCollectionDate() {

  const input =
    document.getElementById(
      "customCollectionDate"
    );


  if (input) {

    input.value = "";

  }

}


/* ============================================================
   SELECT CUSTOM COLLECTION DATE
============================================================ */

function selectCustomCollectionDate() {

  const input =
    document.getElementById(
      "customCollectionDate"
    );


  if (
    !input ||
    !input.value
  ) {

    return;

  }


  const selectedDate =
    new Date(
      input.value +
      "T12:00:00"
    );


  /*
  Sunday = 0.
  */

  if (
    selectedDate.getDay() !== 0
  ) {

    showToast(
      "Please choose a Sunday for collection."
    );


    input.value = "";


    return;

  }


  /*
  Remove any selected preset Sunday
  so the custom date becomes the
  active selection.
  */

  document
    .querySelectorAll(
      'input[name="collection"]'
    )
    .forEach(
      radio => {

        radio.checked =
          false;

      }
    );


  showToast(
    `Collection selected: ${formatFriendlyDate(
      selectedDate
    )}`
  );

}


/* ============================================================
   GET SELECTED COLLECTION
============================================================ */

function getSelectedCollection() {

  const customInput =
    document.getElementById(
      "customCollectionDate"
    );


  /*
  CUSTOM SUNDAY
  */

  if (
    customInput &&
    customInput.value
  ) {

    const customDate =
      new Date(
        customInput.value +
        "T12:00:00"
      );


    if (
      customDate.getDay() !== 0
    ) {

      return {

        error:
          "Please choose a Sunday for collection."

      };

    }


    if (
      !isCollectionOpen(
        customInput.value
      )
    ) {

      return {

        error:
          "Sorry, that collection Sunday has already closed. Please choose another Sunday."

      };

    }


    return {

      collection: {

        id:
          `CUSTOM-${customInput.value}`,

        date:
          customInput.value,

        displayDate:
          formatFriendlyDate(
            customDate
          ),

        time:
          "2:00 PM – 5:00 PM",

        address:
          "Collection address will be provided",

        status:
          "OPEN"

      }

    };

  }


  /*
  PRESET SUNDAY

  IMPORTANT:
  We directly check the selected radio button here.

  We DO NOT call getSelectedCollection()
  again because that would create an infinite
  recursive loop.
  */

  const selected =
    document.querySelector(
      'input[name="collection"]:checked'
    );


  if (!selected) {

    return {

      error:
        "Please select a collection Sunday."

    };

  }


  const collection =
    collections.find(
      item =>
        item.id === selected.value
    );


  if (!collection) {

    return {

      error:
        "Please select a valid collection date."

    };

  }


  if (
    !isCollectionOpen(
      collection.date
    )
  ) {

    return {

      error:
        "Sorry, that collection Sunday has already closed. Please choose another Sunday."

    };

  }


  return {

    collection

  };

}


/* ============================================================
   CHECKOUT
============================================================ */

function showCheckout() {

  setupCustomDatePicker();


  if (
    cart.length === 0
  ) {

    showToast(
      "Your cart is empty."
    );


    return;

  }


  document
    .getElementById(
      "checkout"
    )
    .classList.add(
      "show"
    );


  document
    .getElementById(
      "checkout"
    )
    .scrollIntoView({
      behavior:
        "smooth"
    });

}


/* ============================================================
   CREATE ORDER
============================================================ */

async function createOrder() {

  /*
  Get customer name.
  */

  const name =
    document
      .getElementById(
        "customerName"
      )
      .value
      .trim();


  /*
  Get WhatsApp number.
  */

  const whatsapp =
    document
      .getElementById(
        "whatsapp"
      )
      .value
      .trim();


  /*
  Get optional order notes.
  */

  const notes =
    document
      .getElementById(
        "notes"
      )
      .value
      .trim();


  /*
  Validate name.
  */

  if (!name) {

    showToast(
      "Please enter your name."
    );


    return;

  }


  /*
  Validate WhatsApp.
  */

  if (!whatsapp) {

    showToast(
      "Please enter your WhatsApp number."
    );


    return;

  }


  /*
  THIS IS THE IMPORTANT FIX.

  Get the selected collection BEFORE
  trying to use selectedCollection.error.
  */

  const selectedCollection =
    getSelectedCollection();


  /*
  Validate collection.
  */

  if (
    selectedCollection.error
  ) {

    showToast(
      selectedCollection.error
    );


    return;

  }


  /*
  Get the actual collection object.
  */

  const collection =
    selectedCollection.collection;


  /*
  Generate order ID.
  */

  const orderId =
    generateOrderId();


  /*
  Calculate total.
  */

  const total =
    getCartTotal();


  /*
  Prepare order items.
  */

  const items =
    cart.map(
      item => ({

        productId:
          item.id,

        name:
          item.name,

        quantity:
          item.quantity,

        price:
          item.price,

        lineTotal:
          Number(
            (
              item.price *
              item.quantity
            ).toFixed(2)
          )

      })
    );


  /*
  Create order object.
  */

  currentOrder = {

    orderId,

    timestamp:
      new Date().toISOString(),

    customerName:
      name,

    whatsapp:
      whatsapp,

    collectionId:
      collection.id,

    collectionDate:
      collection.date,

    collectionTime:
      collection.time,

    collectionAddress:
      collection.address,

    items,

    subtotal:
      total,

    total,

    paymentStatus:
      "PENDING",

    orderStatus:
      "AWAITING PAYMENT",

    notes

  };


  /*
  Send order to Google Apps Script.

  If the URL has not been configured yet,
  the website will still continue to the
  PayNow screen.
  */

  if (
    GOOGLE_SCRIPT_URL &&
    !GOOGLE_SCRIPT_URL.includes(
      "YOUR_GOOGLE"
    )
  ) {

    try {

      await fetch(
        GOOGLE_SCRIPT_URL,
        {

          method:
            "POST",

          mode:
            "no-cors",

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify(
              currentOrder
            )

        }
      );

    } catch (error) {

      console.error(
        "Could not submit order:",
        error
      );

    }

  }


  /*
  Display order ID in PayNow section.
  */

  document
    .getElementById(
      "paynowOrderId"
    )
    .textContent =
    orderId;


  /*
  Display amount in PayNow section.
  */

  document
    .getElementById(
      "paynowAmount"
    )
    .textContent =
    total.toFixed(2);


  /*
  Show PayNow section.
  */

  document
    .getElementById(
      "paynow"
    )
    .classList.add(
      "show"
    );


  /*
  Scroll to PayNow section.
  */

  document
    .getElementById(
      "paynow"
    )
    .scrollIntoView({
      behavior:
        "smooth"
    });

}


/* ============================================================
   CUSTOMER MARKS PAYMENT
============================================================ */

function markCustomerPaid() {

  if (!currentOrder) {

    return;

  }


  /*
  IMPORTANT:

  This does NOT set payment to PAID.

  It only tells the spreadsheet that
  the customer says they have paid.

  You manually verify the actual
  PayNow payment.
  */

  currentOrder.customerMarkedPaid =
    true;


  /*
  Tell Google Apps Script that the
  customer says payment has been made.
  */

  if (
    GOOGLE_SCRIPT_URL &&
    !GOOGLE_SCRIPT_URL.includes(
      "YOUR_GOOGLE"
    )
  ) {

    fetch(
      GOOGLE_SCRIPT_URL,
      {

        method:
          "POST",

        mode:
          "no-cors",

        headers: {

          "Content-Type":
            "text/plain;charset=utf-8"

        },

        body:
          JSON.stringify({

            action:
              "customerMarkedPaid",

            orderId:
              currentOrder.orderId

          })

      }
    );

  }


  /*
  Show order received screen.
  */

  showConfirmation();

}


/* ============================================================
   CONFIRMATION
============================================================ */

function showConfirmation() {

  /*
  Hide the normal empty-cart state
  while the confirmation screen is shown.
  */

  document
    .getElementById(
      "emptyCart"
    )
    .classList.add(
      "hidden"
    );


  /*
  Clear cart items.
  */

  document
    .getElementById(
      "cartItems"
    )
    .innerHTML =
    "";


  /*
  Hide cart summary.
  */

  document
    .getElementById(
      "cartSummary"
    )
    .classList.add(
      "hidden"
    );


  /*
  Build confirmation details.
  */

  const card =
    document.getElementById(
      "confirmationCard"
    );


  card.innerHTML = `

    <div>

      <strong>
        Order:
      </strong>

      ${escapeHtml(
        currentOrder.orderId
      )}

    </div>


    <div>

      <strong>
        Name:
      </strong>

      ${escapeHtml(
        currentOrder.customerName
      )}

    </div>


    <div>

      <strong>
        Total:
      </strong>

      $${currentOrder.total.toFixed(2)}

    </div>


    <div>

      <strong>
        Collection:
      </strong>

      ${escapeHtml(
        formatFriendlyDate(
          new Date(
            currentOrder.collectionDate +
            "T12:00:00"
          )
        )
      )}

    </div>


    <div>

      <strong>
        Time:
      </strong>

      ${escapeHtml(
        currentOrder.collectionTime
      )}

    </div>

  `;


  /*
  Hide PayNow.
  */

  document
    .getElementById(
      "paynow"
    )
    .classList.remove(
      "show"
    );


  /*
  Hide checkout.
  */

  document
    .getElementById(
      "checkout"
    )
    .classList.remove(
      "show"
    );


  /*
  Show confirmation.
  */

  document
    .getElementById(
      "confirmation"
    )
    .classList.add(
      "show"
    );


  /*
  Empty the actual cart.
  */

  cart = [];


  renderCart();


  /*
  renderCart() normally shows the empty-cart
  state when cart is empty.

  During confirmation view, keep it hidden.
  */

  document
    .getElementById(
      "emptyCart"
    )
    .classList.add(
      "hidden"
    );

}


/* ============================================================
   HELPERS
============================================================ */

function generateOrderId() {

  const random =
    Math.floor(
      1000 +
      Math.random() * 9000
    );


  return `B28-${random}`;

}


/* ============================================================
   FORMAT DATE FOR INPUT
============================================================ */

function formatDateForInput(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


/* ============================================================
   FORMAT FRIENDLY DATE
============================================================ */

function formatFriendlyDate(
  date
) {

  return date.toLocaleDateString(
    "en-SG",
    {

      weekday:
        "long",

      day:
        "numeric",

      month:
        "long",

      year:
        "numeric"

    }
  );

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHtml(
  value
) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* ============================================================
   TOAST
============================================================ */

function showToast(
  message
) {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) return;


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    2500
  );

}
