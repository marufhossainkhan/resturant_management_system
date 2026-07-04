const menuItems = [
  { id: 1, name: "Burger", price: 120 },
  { id: 2, name: "Pizza", price: 250 },
  { id: 3, name: "Rice", price: 180 }
];

let cart = [];

// MENU LOAD
function loadMenu() {
  let menuDiv = document.getElementById("menu");

  menuItems.forEach(item => {
    let div = document.createElement("div");

    div.innerHTML = `
      <p>
        ${item.name} - ৳${item.price}
        <button onclick="addToCart(${item.id})">Add</button>
      </p>
    `;

    menuDiv.appendChild(div);
  });
}

// ADD TO CART
function addToCart(id) {
  let item = menuItems.find(i => i.id === id);

  let exist = cart.find(i => i.id === id);

  if (exist) {
    exist.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  renderCart();
}

// INCREASE QTY
function increase(id) {
  let item = cart.find(i => i.id === id);
  item.qty++;
  renderCart();
}

// DECREASE QTY
function decrease(id) {
  let item = cart.find(i => i.id === id);

  item.qty--;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  renderCart();
}

// REMOVE ITEM
function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

// RENDER CART
function renderCart() {
  let cartDiv = document.getElementById("cart");
  let totalBox = document.getElementById("total");

  cartDiv.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;

    let div = document.createElement("div");

    div.innerHTML = `
      <p>
        ${item.name} - ৳${item.price} × ${item.qty}
      </p>

      <button onclick="increase(${item.id})">+</button>
      <button onclick="decrease(${item.id})">-</button>
      <button onclick="removeItem(${item.id})">Remove</button>
      <hr>
    `;

    cartDiv.appendChild(div);
  });

  totalBox.innerText = total;
}

// PLACE ORDER
function placeOrder() {
  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }

  alert("Order Placed Successfully 🎉");

  cart = [];
  renderCart();
}

loadMenu();