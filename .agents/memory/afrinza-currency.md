---
name: Afrinza currency support
description: How per-country currency is derived and displayed across the Afrinza marketplace.
---

# Afrinza currency support

## Rule
Currency is derived dynamically from the existing `location` (city value) field on every listing — **no new DB column is needed**. The lookup chain is: `location value → getCountryForCity(location) → getCurrencyForCountry(country) → { code, symbol }`.

**Why:** Adding a currency column to every table would require migrations across Supabase and Drizzle schemas. Deriving from location is zero-migration, backward-compatible, and always consistent with the listing's geography.

## How to apply
- All helpers live in `artifacts/afrinza/src/lib/malaysia-locations.ts`.
- Use `formatPrice(amount, cityValue)` for product prices.
- Use `formatPricePerMonth(amount, cityValue)` for room rental prices.
- Use `getCurrencyForCity(cityValue).symbol` for inline use in JSX.
- Use `getCurrencyForCountry(countryName)` when you have a country state variable (e.g., in forms).
- Subscription fees (RM 10/month), order totals in admin, and cart/checkout totals intentionally stay as RM (platform-level MYR transactions).
- Currencies with no decimal subunits (JPY, KRW, VND, IDR) are handled via `NO_DECIMAL_CURRENCIES` set inside the module.

## Files with currency-aware price displays
- `product-card.tsx` — formatPrice
- `product-detail.tsx` — formatPrice
- `home.tsx` — formatPricePerMonth for room cards
- `services.tsx` — formatPricePerMonth + getCurrencyForCity for room cards/detail; form label uses getCurrencyForCountry(roomFormCountry)
- `dashboard.tsx` — formatPrice for product cards; getCurrencyForCity for room cards; form labels use getCurrencyForCountry(storeCountry / roomEditCountry)
- `admin.tsx` — formatPrice for product table; getCurrencyForCity for room table
