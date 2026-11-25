---
mode: testing
url: "{{app_url}}"
max_steps: 30
tags: [checkout, quantity, attack]
variables:
  app_url: http://127.0.0.1:4173
---

# Negative quantity

## Open the ShipGate Store

Go to {{app_url}} and confirm the page shows the heading "ShipGate Store".

## Add the Kane Hoodie to the cart

Click the "Add to cart" button under "Kane Hoodie". The "Order total" should read $25.00.

## Set the quantity to -1

Find the quantity number field for "Kane Hoodie" in the cart and change its value to -1.

## The total must not drop

The "Order total" must not go below $25.00. Either the quantity is reset to 1 with a visible error message saying the quantity must be at least 1, or the change is refused. The total must never become negative or lower than the price of one hoodie.
