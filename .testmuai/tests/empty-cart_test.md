---
mode: testing
url: "{{app_url}}"
max_steps: 30
tags: [checkout, empty-cart, attack]
variables:
  app_url: http://127.0.0.1:4173
---

# Empty cart checkout

## Open the ShipGate Store

Go to {{app_url}} and confirm the page shows the heading "ShipGate Store" and the message "Your cart is empty."

## Fill in the checkout form without adding anything

Type "George Agbe" into the "Name" field, "george@example.com" into the "Email" field, and "4242 4242 4242 4242" into the "Card number" field. Do not add any product to the cart.

## Try to place the order

Click the "Place order" button.

## Checkout must be refused

A visible error message must appear saying the cart is empty. The page must NOT show "Order placed" and must NOT navigate to a success screen. You must still be on the store page.
