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

Read what the page actually shows right now: the number in the Kane Hoodie quantity field, the text of any error message in the cart, and the "Order total" text. Check those displayed values: the quantity field must show 1, an error message must be visible saying the quantity must be at least 1, and the Order total must read $25.00. The total must never be negative or lower than $25.00.
