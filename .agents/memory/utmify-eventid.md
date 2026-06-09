---
name: UTMify eventID sync
description: UTMify server-side CAPI events use the eventID passed to fbq(); without one it self-generates, breaking deduplication
---

## The Rule
Always pass an explicit `eventID` to every `fbq('track', ...)` call. UTMify intercepts the fbq call and captures the eventID to use in its own server-side CAPI request to Facebook.

## Why
Without an explicit eventID:
- Browser fires fbq → Facebook auto-generates an internal ID
- UTMify server fires CAPI → generates its own `ob3_plugin-set_xxxx` ID
- The two IDs never match → 0% deduplication coverage

With an explicit eventID:
- Browser fires `fbq('track', 'PageView', {}, { eventID: 'pv_111' })`
- UTMify captures `pv_111` and uses it server-side
- Facebook sees matching IDs → deduplicates correctly

## How to Apply
For every fbq event in the codebase, the 4th argument must include `{ eventID: someUniqueId }`:
- PageView: `pv_${Date.now()}_${Math.random().toString(36).substr(2,9)}`
- InitiateCheckout: `checkout_${txId}`
- Purchase: `${txId}` (raw Lumina transaction ID)
