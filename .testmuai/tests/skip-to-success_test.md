---
mode: testing
url: "{{app_url}}/success.html"
max_steps: 20
tags: [checkout, navigation, attack]
variables:
  app_url: http://127.0.0.1:4173
---

# Skip straight to the success screen

## Go directly to the success page without ordering

Go to {{app_url}}/success.html in the browser, without visiting the store or placing any order first.

## No order must be shown

The page must show the heading "No order placed" and the text "No order placed." It must NOT show an order number and must NOT show an order total. There should be a link back to the ShipGate Store.
