# ShipGate

> The deploy gate that only Kane can open.

A demo storefront that ships to GitHub Pages only when Kane CLI passes every browser flow. The agent's word is worthless; only Kane's browser run can ship.

**Live demo:** https://georgeonweb3.github.io/shipgate/ (updates only on a Kane pass — a push *is* the deploy)

## Worked example

One of each item, coupon `KANE50`:

| Item | Price |
|---|---|
| Kane Hoodie | $25.00 |
| Sticker Pack | $5.00 |
| Deploy Token | $17.50 |
| **Subtotal** | **$47.50** |
| KANE50 — $5 off the whole order | −$5.00 |
| **Order total** | **$42.50** |

## How the gate works

`npm run ship` runs six Kane testmd flows against the local build in a real browser. If any flow fails, the gate exits 1, writes `.testmuai/last-failure-handoff.md` (failing flow, failing step, what the browser showed), and **nothing ships** — the live site is untouched. If all pass, the gate commits and pushes to `main`; GitHub Pages serves `docs/`, so the push is the deploy.

All money is decided by one deterministic module, `docs/verify.js` (`computeTotal()` recomputes the total from the price list only — it never trusts DOM or form values). The UI only proposes; the verifier owns the money decision. Refusals are visible on-screen errors plus a gate exit code, on the record in the Kane run log.

## The adversary test (read this before judging the bug)

**v1 contains one DELIBERATE planted bug**, labelled as such in the code (`docs/verify.js`) and here: the `KANE50` discount is applied **$5 off per line item** instead of once per order. With three lines that is $15 off, total **$32.50** — a **$10.00 leak**. It is not an accident and it is not hidden: it exists so Kane can catch it on camera. The `coupon-per-line` flow is written to catch exactly this. Every other guard is correct in v1: applying the coupon twice is refused, negative quantities are refused/clamped, empty-cart checkout is refused, and skipping to the success screen shows "No order placed".

The loop: Kane fails the coupon flow → the gate refuses to ship → the bug is fixed in one line (`discountCents = COUPON_DISCOUNT_CENTS`) → Kane re-runs → all pass → the fix ships.

## Eval table

| Flow | v1 (buggy) | v2 (fixed) |
|---|---|---|
| Happy path checkout | PENDING — Kane run not yet done | PENDING |
| Coupon twice | PENDING | PENDING |
| Negative quantity | PENDING | PENDING |
| Empty cart checkout | PENDING | PENDING |
| Skip to success | PENDING | PENDING |
| Coupon per line ($10 leak) | PENDING — expected FAIL ($32.50) | PENDING |
| **Total through** | PENDING | PENDING |

No Kane run has happened yet, so no run results are claimed here. The table is filled in from the real Kane logs after the runs, and the fix only ships on a Kane PASS re-run.

> **Note on the v1 happy path:** the planted bug fires on *any* coupon application, so the happy-path flow (which applies KANE50 and checks $42.50) is also expected to FAIL in v1 at $32.50, not just the coupon-per-line flow. The eval table above will record whatever Kane actually reports; if Kane fails both, that is the honest result and the win thesis updates to match it.

## Real vs simulated

| Layer | Real | Simulated / not real |
|---|---|---|
| Checkout money | No real money; test totals only, $0.00 moves | Prices are fixtures, not a payment processor |
| Browser verification | Real Kane CLI runs in a real Chrome, real pass/fail | — |
| Deploy | Real push to GitHub Pages on Kane pass | — |
| The bug | Real code defect in v1, really caught by Kane | Planted deliberately as an adversary test (labelled, not presented as accidental) |
| Agent | Muse (the coding agent) wrote the app | The "Breaker" is a persona/prompt, not a separate agent process |
| Weakness (named honestly) | Kane flows are plain-English and slow (~1–3 min per flow); the gate adds minutes to a deploy. Mitigation: flows run in sequence here; the slowness is the price of a real browser verdict. | — |

## Criterion table

| Criterion (25% each) | How ShipGate clears it |
|---|---|
| Ships | `npm run ship` is one command; on a Kane pass the live GitHub Pages site updates. |
| Verified | Kane runs six flows in a real browser; the $10.00 coupon leak is caught with a FAIL log, a fix commit, and a PASS re-run. |
| Closed loop | Gate parses Kane's `--agent` NDJSON output; failures land in `.testmuai/last-failure-handoff.md` and feed the fix; the gate re-runs until green. |
| Craft | Zero dependencies, no build step, static `docs/`; one-command install and run; README opens with the hook, the number, and the live link. |

## How to run it

```bash
npm install          # zero runtime dependencies; installs nothing
npm start            # serve the store at http://127.0.0.1:4173
npm run test:unit    # offline unit checks for verify.js (no browser needed)
npm run test:kane    # run the Kane flows only — never deploys
npm run ship         # run the Kane flows; deploy (git push) only if ALL pass
```

Prerequisites for the Kane commands: Kane CLI installed and authenticated, and the store running (`npm start`) in another terminal. `npm run ship` refuses to deploy if the app is not reachable.

## Repo

`georgeonweb3/shipgate` — Kane CLI Online Hackathon entry (TestMu AI). Solo entry by George Agbe ([@georgeonweb3](https://github.com/georgeonweb3)). Deadline Nov 26, 2026 19:29 WAT.
