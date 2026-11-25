// app.js — ShipGate Store UI. Proposes only; verify.js decides money.
//
// The cart, coupon and checkout form are plain UI state. Every total shown
// on screen comes from ShipGateVerify.computeTotal(), recomputed from the
// price list — never from a DOM value or a form field.
(function () {
  'use strict';
  var V = window.ShipGateVerify;

  var PRODUCTS = {
    hoodie: { name: 'Kane Hoodie', price: 25.00 },
    sticker: { name: 'Sticker Pack', price: 5.00 },
    token: { name: 'Deploy Token', price: 17.50 },
  };

  var cart = { hoodie: 0, sticker: 0, token: 0 };
  var coupon = null;

  var cartLinesEl = document.getElementById('cart-lines');
  var emptyMsgEl = document.getElementById('empty-cart-message');
  var cartErrorEl = document.getElementById('cart-error');
  var couponInputEl = document.getElementById('coupon-input');
  var couponMsgEl = document.getElementById('coupon-message');
  var checkoutErrorEl = document.getElementById('checkout-error');

  function money(n) {
    return '$' + Number(n).toFixed(2);
  }

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }

  function hideError(el) {
    el.textContent = '';
    el.hidden = true;
  }

  function render() {
    // Rebuild cart lines from state.
    cartLinesEl.innerHTML = '';
    var hasItems = false;
    Object.keys(PRODUCTS).forEach(function (id) {
      if (!cart[id]) return;
      hasItems = true;
      var li = document.createElement('li');

      var name = document.createElement('span');
      name.className = 'line-name';
      name.textContent = PRODUCTS[id].name;
      li.appendChild(name);

      var price = document.createElement('span');
      price.className = 'line-price';
      price.textContent = money(PRODUCTS[id].price);
      li.appendChild(price);

      var qtyWrap = document.createElement('span');
      qtyWrap.className = 'qty';

      var minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.setAttribute('aria-label', 'Decrease quantity of ' + PRODUCTS[id].name);
      minus.addEventListener('click', function () {
        if (cart[id] <= 1) {
          showError(cartErrorEl, 'Quantity cannot go below 1. Remove the item by setting it aside — use the remove button instead.');
          return;
        }
        hideError(cartErrorEl);
        cart[id] -= 1;
        render();
      });
      qtyWrap.appendChild(minus);

      var input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.step = '1';
      input.value = String(cart[id]);
      input.setAttribute('aria-label', 'Quantity of ' + PRODUCTS[id].name);
      input.addEventListener('change', function () {
        var raw = Number(input.value);
        if (!Number.isInteger(raw) || raw < 1) {
          showError(cartErrorEl, 'Quantity must be a whole number of at least 1. It has been reset to 1.');
          cart[id] = 1;
        } else {
          hideError(cartErrorEl);
          cart[id] = raw;
        }
        render();
      });
      qtyWrap.appendChild(input);

      var plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.setAttribute('aria-label', 'Increase quantity of ' + PRODUCTS[id].name);
      plus.addEventListener('click', function () {
        hideError(cartErrorEl);
        cart[id] += 1;
        render();
      });
      qtyWrap.appendChild(plus);

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + PRODUCTS[id].name + ' from cart');
      remove.addEventListener('click', function () {
        hideError(cartErrorEl);
        cart[id] = 0;
        render();
      });
      qtyWrap.appendChild(remove);

      li.appendChild(qtyWrap);
      cartLinesEl.appendChild(li);
    });
    emptyMsgEl.hidden = hasItems;

    // Totals always come from the verifier, never from the DOM.
    var totals = V.computeTotal(cart, coupon);
    document.getElementById('subtotal').textContent = money(totals.subtotal);
    document.getElementById('discount').textContent = '−' + money(totals.discount);
    document.getElementById('order-total').textContent = money(totals.total);
  }

  // Add to cart.
  document.querySelectorAll('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      hideError(cartErrorEl);
      cart[btn.getAttribute('data-add')] += 1;
      render();
    });
  });

  // Coupon apply — one coupon per order; a second apply is refused.
  document.getElementById('apply-coupon').addEventListener('click', function () {
    var result = V.applyCoupon(coupon, couponInputEl.value);
    if (!result.ok) {
      couponMsgEl.textContent = result.reason;
      return;
    }
    coupon = result.coupon;
    couponMsgEl.textContent = 'Coupon ' + coupon + ' applied: $5.00 off your order.';
    render();
  });

  // Checkout — validated by the verifier before anything is "placed".
  document.getElementById('checkout-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var form = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      card: document.getElementById('card').value,
    };
    var check = V.validateCheckout(cart, form);
    if (!check.ok) {
      showError(checkoutErrorEl, check.reason);
      return;
    }
    hideError(checkoutErrorEl);
    var totals = V.computeTotal(cart, coupon);
    var order = {
      number: 'SG-' + Date.now().toString(36).toUpperCase(),
      total: totals.total,
      items: Object.assign({}, cart),
    };
    try { sessionStorage.setItem('shipgate-order', JSON.stringify(order)); } catch (e) { /* storage unavailable: still show success below */ }
    window.location.href = 'success.html';
  });

  render();
})();
