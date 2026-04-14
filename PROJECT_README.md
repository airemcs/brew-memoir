# Brew Memoir

## Project Overview

**Brew Memoir** is a cafe beverage journal and tracker designed for Philippine cafe hoppers. It allows users to log, rate, and evaluate their drinks across different cafes — tracking everything from tasting notes and flavor intensity to add-on costs and spending habits. Think of it as an expense tracker meets beverage diary, wrapped in a warm, aesthetic UI that the cafe-hopping community will love using.

This is intended to become a real product with real users. V1 is scoped, and the design screens are complete. This document contains everything needed to build it.

---

## Target Audience

- Filipino cafe hoppers (20s–30s) who frequent specialty cafes
- People who care about aesthetics and want a beautiful app experience
- Users who want to track what they drink, where they drink it, how much they spend, and how much they enjoyed it
- Philippines-only for V1 — currency is PHP (₱), cafes are local

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | MongoDB Atlas (free tier) + Mongoose |
| Auth | Auth.js (NextAuth.js) — Google sign-in + email/password |
| Image Storage | Cloudinary (free tier) — for beverage photos |
| Deployment | Vercel |
| PWA (future) | next-pwa plugin (not required for V1, but architecture should not prevent it) |

**Single codebase, single deployment.** API routes live inside Next.js (`app/api/`). No separate backend server.

---

## Architecture Notes

- **Solo developer** building this — keep the architecture simple and maintainable
- **Mobile-first design** — all screens are designed for mobile viewports first; desktop is secondary
- **Light mode only** — no dark mode toggle needed
- **Private usage only** — users log their own drinks privately; no social features, no public feeds, no sharing
- **No real-time features** — standard request/response patterns are sufficient
- **Image uploads** — beverage photos are uploaded to Cloudinary; store the Cloudinary URL in MongoDB, not the image itself
- **PWA-ready** — the app should be structured so that adding a service worker and manifest later is trivial, but don't implement PWA for V1

---

## Design Direction & Branding

### Voice & Tone

Brew Memoir uses a **warm, poetic branding voice** that treats coffee and tea drinking as a ritual. The language is intentionally cutesy and expressive — the target audience appreciates aesthetic, elevated language. Examples from the design:

- A logged entry is called a **"Ritual"** (e.g., "Ritual Recorded")
- Confirmation copy: *"Your sensory journey has been added to the archive."*
- Tasting notes section: **"Sommelier Notes"**
- Price label: **"Investment per Ritual"**
- Add-ons: **"Add-Ons & Upgrades"** with sub-copy *"Customize your brew profile with artisanal enhancements."*
- Entry form header: **"The Ritual Details"**
- Cafe name field label: **"Café Name"**
- Section headers use **ALL-CAPS letter-spaced labels** (e.g., `MONTHLY OVERVIEW`, `TOP CHOICE`, `CONSUMPTION`, `CAPTURE THE MOMENT`, `OVERALL PALATE`, `FLAVOR INTENSITY`, `TASTING NOTES`, `THE VENUE`, `EXTRACTION PROFILE`)

This voice should be consistent across all UI copy — labels, empty states, tooltips, confirmation dialogs, onboarding.

### Color Palette — "Warm Latte"

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#FAF7F2` | Page background, warm cream |
| Surface / Cards | `#FFFFFF` | Card backgrounds with subtle warm shadow |
| Primary Accent | `#B8845F` | Caramel/latte brown — buttons, active states, key actions |
| Secondary Accent | `#7A9E7E` | Muted sage green — tags, success states |
| Tertiary | `#C4A882` | Light tan — hover states, borders, subtle highlights |
| Text Primary | `#2C2420` | Deep espresso — headings, body text |
| Text Secondary | `#8C7B6B` | Muted warm gray — labels, timestamps, secondary info |
| Subtle Highlight | `#EDE7DF` | Warm off-white — selected states, dividers, input backgrounds |
| Pop Color | `#D48B8B` | Dusty rose — sparingly, for favorites or top-rated indicators |
| CTA / Buttons | `#6B4C3B` | Dark brown — primary action buttons (e.g., "Complete Entry", "Back to Journal") |

### Typography

- **Body / UI text:** Clean sans-serif — Inter or DM Sans
- **Headings / Display:** Soft serif or rounded display font — Playfair Display, Fraunces, or Outfit
- **Section labels:** All-caps, letter-spaced (tracking-widest in Tailwind), small text size, using Text Secondary color
- **Prices:** Displayed with the ₱ symbol prefix, no space (e.g., `₱225.00`)

### UI Style

- **Rounded corners** — `rounded-lg` to `rounded-xl` on cards, `rounded-full` on pills and tags
- **Generous whitespace** — the design breathes; avoid cramming elements
- **Subtle warm shadows** — cards feel slightly elevated, like paper menu cards
- **Pill-shaped tags** — for categories, tasting notes, flavor tags
- **Star ratings** — filled/unfilled stars for the 1–5 satisfaction rating
- **Slider** — for flavor intensity (Mellow → Medium → Vibrant / Delicate → Balanced → Robust)
- **Bottom sheet modals** — for category selection, upgrade adding (slide up from bottom with drag handle)
- **Segmented controls** — for category selection on the entry form
- **One-column layout** on mobile, breathing card-based layout

---

## Navigation

**Three-tab bottom navigation bar:**

| Tab | Label | Description |
|-----|-------|-------------|
| 1 | **Journal** | Home screen — monthly overview, stats, recent logs feed |
| 2 | **Cafes** | Cafe directory — list of visited cafes with visit counts, spending, tags |
| 3 | **Profile** | User profile — brew history, analytics, settings, account management |

The nav bar uses clean line icons, with the active tab highlighted using the Primary Accent color.

---

## Screens & Features

### 1. Journal (Home)

The main landing screen. Shows a monthly overview and recent entries.

**Components:**
- **Monthly Overview header** — displays current month name prominently, with:
  - Total Spend (e.g., `₱212.80`)
  - Average per Drink (e.g., `₱5.85`)
- **Consumption card** — total beverages logged this month, with a percentage breakdown by category (e.g., "65% Coffee, 35% Tea & Specialty")
- **Top Choice card** — pill tags showing the user's most-ordered drinks this month (e.g., "Ceremonial Matcha", "Hojicha Latte", "Ethiopian Pour Over")
- **Recent Logs feed** — scrollable list of recent entries, each showing:
  - Small beverage category icon (colored, rounded square)
  - Cafe name (bold)
  - Beverage name (subtitle)
  - Star rating
  - Price (right-aligned)
  - Date/time (right-aligned, below price)
- **"View History"** link at the top of the Recent Logs section
- **Floating Action Button (FAB)** — bottom right, "+" icon, opens the new entry form

### 2. New Entry / Edit Entry Form

A full-screen form for logging a new beverage. Header shows "The Daily Brew" with an X (close) and "SAVE" action.

**Form fields (in order):**

1. **Café Name** — text input with label "CAFÉ NAME"
2. **Category** — segmented pill selector (see Categories below)
3. **Beverage Name** — text input
4. **Date** — date picker (`mm/dd/yyyy`)
5. **Base Price (₱)** — number input with ₱ prefix
6. **Add-Ons & Upgrades** — dynamic list with "+ ADD NEW" button; each add-on shows:
   - Icon based on upgrade category
   - Item name
   - Upgrade category label (e.g., "ALTERNATIVE", "INTENSITY")
   - Price
   - Delete button (red trash icon)
7. **Photo** — large upload area with "CAPTURE THE MOMENT / Add Photo" overlay text; shows preview when uploaded
8. **Overall Palate** — 1–5 star rating with optional short text note in italics below (e.g., *"A very balanced and smooth extraction."*)
9. **Flavor Intensity** — horizontal slider from Mellow to Vibrant (or Delicate to Robust), with label showing current value (e.g., "Bold", "Balanced")
10. **Tasting Notes** — pill tag selector with "+ Add Note" button (e.g., "Caramel", "Nutty", "Floral")
11. **Investment per Ritual** — auto-calculated total (base price + all add-ons), displayed prominently
12. **"Complete Entry"** button — full-width primary CTA

### 3. Add Upgrade Modal (Bottom Sheet)

Slides up from the bottom when user taps "+ ADD NEW" on the entry form.

**Fields:**
- **Upgrade Category** — pill selector with options:
  - Alternative (milk alternatives: Oat, Almond, Soy, Coconut, Fresh/Whole Milk)
  - Intensity (Extra Shot, Double Shot, Decaf swap)
  - Syrup (Vanilla, Hazelnut, Caramel, Brown Sugar, Muscovado, Honey)
  - Temperature (Iced upgrade, Hot-to-Iced conversion)
  - Topping (Pearls/Boba, Cream Cheese Foam, Whipped Cream, Coffee Jelly, Pudding, Crushed Oreo)
  - Size (Upsize to Medium, Upsize to Large)
  - Customization (Less Ice, Less Sugar, Extra Hot, Oat Cream top)
- **Item Name** — text input with placeholder "e.g., Oat Milk, Extra Shot"
- **Price (₱)** — number input
- **Cancel / Add** buttons

### 4. Entry Confirmation Screen

Shown after successfully saving an entry.

**Components:**
- Checkmark icon with subtle decorative dots
- **"Ritual Recorded"** heading
- Sub-copy: *"Your sensory journey has been added to the archive."*
- Summary card showing: beverage name, price badge, cafe/location name, thumbnail + short tasting quote
- **"Back to Journal"** — full-width primary CTA
- **"View History"** and **"Share Ritual"** secondary links (Note: "Share Ritual" is in the design but social/sharing is not in V1 scope — this can be a placeholder or omitted)

### 5. Entry Detail View

Expanded view of a single logged entry. Header: back arrow + "Order Details" + share icon.

**Sections (in order):**
1. **Hero photo** — full-width beverage photo with rounded corners
2. **Beverage name** — large heading with category label above (e.g., "EXCLUSIVE BREW")
3. **Star rating** + numerical score (e.g., `★★★★★ 5.0`)
4. **Price** — total price displayed below the rating
5. **The Venue** — cafe name, address/neighborhood, "View on map →" link
6. **Journaled On** — date, time, and a contextual tag (e.g., "MORNING RITUAL")
7. **Extraction Profile** — flavor intensity slider (read-only) + tasting note pills (e.g., "Umami", "Vegetal", "Creamy")
8. **Sommelier Notes** — user's personal notes in italic, or placeholder text if none
9. **Price Breakdown** — line items: Base Price, each Add-on with price, and bold Total

### 6. Cafes Directory

A browsable list of all cafes the user has visited.

**Header:** "Cafes" with search icon and user avatar

**Components:**
- **Title section** — "CURATED COLLECTION / The Directory" with sub-copy: *"A chronological archive of the spaces where every extraction tells a unique story."*
- **Tab filters** — All Visited / Favorites / Nearby + filter/sort icon
- **Cafe cards** — each showing:
  - Cafe name (bold, large)
  - Address / neighborhood
  - Visit count (large number, right-aligned)
  - Last visited drink + date
  - Ambiance tags in pills (e.g., "BOTANICAL", "QUIET")
  - Total spent at that cafe (for some cards)
- **Highlight card** — a featured/most-visited cafe shown in a darker accent card at the bottom with larger typography, visit count, and total spent

### 7. Cafe Profile / Detail

Detailed view of a single cafe's history and stats.

**Components:**
- Cafe name + address as header
- **Total Investment** — total amount spent at this cafe, with month-over-month change percentage
- **Visit Frequency** — average visits per week with a day-of-week bar chart (Mon–Sun)
- **Peak Hour** — most common order time with contextual note (e.g., "Usually ordered before morning sprint meetings.")
- **Brew History** — scrollable list of all entries at this cafe, each showing:
  - Beverage category icon
  - Beverage name + description
  - Date
  - Star rating
  - Price
- **"View Full Archive"** expandable link

### 8. Browse History / Search

Full history view with search and filtering.

**Components:**
- **Search bar** — placeholder: "Search cafes, coffee, or tea."
- **Category filter pills** — All Items / Coffee / Tea / Matcha / Specialty (horizontal scroll)
- **Entries grouped by month** (e.g., "OCTOBER 2023", "SEPTEMBER 2023")
- **Entry cards** (different layout from journal feed) — two-column key-value style:
  - DATE / CAFE
  - BEVERAGE / RATING
  - Category tag pill
  - PRICE
  - Chevron for detail navigation

### 9. Analytics (nested under Profile)

**Must-have for V1.** Specific screens not yet designed, but should include:
- Monthly/weekly spending trends (line or bar chart)
- Top cafes by visit count and spend
- Category breakdown (pie or donut chart — how much coffee vs. matcha vs. tea etc.)
- Average rating over time
- Most expensive vs. cheapest drink
- Favorite tasting notes (most frequently used tags)

---

## Data Models

### User

```
{
  _id: ObjectId
  name: string
  email: string (unique)
  image?: string (profile photo URL)
  authProvider: "google" | "credentials"
  createdAt: Date
  updatedAt: Date
}
```

### Entry (Beverage Log)

```
{
  _id: ObjectId
  userId: ObjectId (ref: User)
  cafeName: string
  cafeId?: ObjectId (ref: Cafe) — linked after first entry at a cafe
  beverageName: string
  category: string (enum — see Categories)
  date: Date
  basePrice: number (PHP)
  addOns: [
    {
      name: string
      category: "alternative" | "intensity" | "syrup" | "temperature" | "topping" | "size" | "customization"
      price: number
    }
  ]
  totalPrice: number (computed: basePrice + sum of addOn prices)
  photoUrl?: string (Cloudinary URL)
  rating: number (1–5)
  ratingNote?: string (short text, e.g., "A very balanced and smooth extraction.")
  flavorIntensity?: number (1–100 scale, mapped to Mellow→Vibrant on the slider)
  tastingNotes: string[] (e.g., ["Caramel", "Nutty", "Floral"])
  personalNotes?: string (longer free-text "Sommelier Notes")
  createdAt: Date
  updatedAt: Date
}
```

### Cafe

```
{
  _id: ObjectId
  userId: ObjectId (ref: User) — each user has their own cafe records
  name: string
  address?: string
  neighborhood?: string
  tags: string[] (e.g., ["Botanical", "Quiet", "Industrial"])
  isFavorite: boolean (default: false)
  createdAt: Date
  updatedAt: Date
}
```

Cafe stats (total visits, total spent, last visited, peak hour, visit frequency) should be **computed from entries at query time or via aggregation**, not stored as denormalized fields — keeps the data consistent without sync issues.

### Suggested Tasting Notes (reference data, can be hardcoded)

```
Caramel, Nutty, Floral, Fruity, Chocolatey, Earthy, Spicy, Smoky,
Citrus, Berry, Honey, Vanilla, Creamy, Umami, Vegetal, Herbal,
Malty, Toasty, Bright, Clean
```

---

## Categories

These are the beverage categories used throughout the app — in the entry form selector, filter pills, and analytics breakdowns:

| Category | Description |
|----------|-------------|
| Coffee | Standard brewed coffee, americano, etc. |
| Espresso & Milk | Lattes, cappuccinos, flat whites, Spanish lattes |
| Matcha | All matcha-based drinks |
| Hojicha | All hojicha-based drinks |
| Tea | Tea lattes, loose leaf, chai, herbal teas |
| Chocolate | Hot chocolate, tablea-based drinks, mocha variants |
| Frappe & Blended | Frappes, smoothies, blended ice drinks |
| Fruit & Refresher | Yuzu, calamansi, fruit sodas, lemonades |
| Specialty | Anything that doesn't fit above — unique/seasonal drinks |

---

## Upgrade Categories (for Add-Ons)

| Category | Common Items |
|----------|-------------|
| Alternative | Oat Milk, Almond Milk, Soy Milk, Coconut Milk, Fresh/Whole Milk |
| Intensity | Extra Shot, Double Shot, Decaf Swap |
| Syrup | Vanilla, Hazelnut, Caramel, Brown Sugar, Muscovado, Honey |
| Temperature | Iced Upgrade, Hot-to-Iced Conversion |
| Topping | Pearls/Boba, Cream Cheese Foam, Whipped Cream, Coffee Jelly, Pudding |
| Size | Upsize to Medium, Upsize to Large |
| Customization | Less Ice, Less Sugar, Extra Hot, Oat Cream Top |

---

## API Routes (Suggested Structure)

```
app/api/
├── auth/
│   └── [...nextauth]/route.ts    — Auth.js handler
├── entries/
│   ├── route.ts                  — GET (list with filters), POST (create)
│   └── [id]/route.ts             — GET (single), PUT (update), DELETE
├── cafes/
│   ├── route.ts                  — GET (list), POST (create)
│   └── [id]/
│       ├── route.ts              — GET (detail with stats), PUT, DELETE
│       └── entries/route.ts      — GET (entries for this cafe)
├── analytics/
│   ├── spending/route.ts         — GET (spending trends, monthly totals)
│   ├── categories/route.ts       — GET (category breakdown)
│   └── overview/route.ts         — GET (dashboard stats)
└── upload/
    └── route.ts                  — POST (Cloudinary image upload)
```

---

## Folder Structure (Suggested)

```
brew-memoir/
├── app/
│   ├── layout.tsx                — Root layout with nav, providers
│   ├── page.tsx                  — Journal (home) page
│   ├── entry/
│   │   ├── new/page.tsx          — New entry form
│   │   └── [id]/page.tsx         — Entry detail view
│   ├── cafes/
│   │   ├── page.tsx              — Cafe directory
│   │   └── [id]/page.tsx         — Cafe profile
│   ├── profile/
│   │   ├── page.tsx              — Profile overview
│   │   ├── history/page.tsx      — Full browse history with search
│   │   └── analytics/page.tsx    — Analytics dashboard
│   └── api/                      — (see API Routes above)
├── components/
│   ├── ui/                       — Reusable primitives (Button, Card, Input, Modal, Tag, StarRating, Slider, BottomSheet)
│   ├── journal/                  — Journal-specific components (MonthlyOverview, RecentLogCard, ConsumptionCard, TopChoiceCard)
│   ├── entry/                    — Entry form components (EntryForm, UpgradeModal, PhotoUpload, TastingNotePicker, FlavorSlider)
│   ├── cafes/                    — Cafe components (CafeCard, CafeProfile, BrewHistoryList)
│   ├── analytics/                — Chart and analytics components
│   └── layout/                   — Nav, BottomTabBar, PageHeader
├── lib/
│   ├── db.ts                     — MongoDB connection via Mongoose
│   ├── models/                   — Mongoose schemas (User, Entry, Cafe)
│   ├── auth.ts                   — Auth.js configuration
│   ├── cloudinary.ts             — Cloudinary upload helper
│   └── utils.ts                  — Formatting helpers (currency, dates, etc.)
├── types/
│   └── index.ts                  — Shared TypeScript types/interfaces
├── public/
│   └── icons/                    — App icons, category icons
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── .env.local                    — MongoDB URI, Cloudinary keys, Auth secrets
```

---

## Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## V1 Scope Summary

**In scope:**
- User authentication (Google + email/password)
- Full entry CRUD (create, read, update, delete beverage logs)
- Photo upload per entry
- Category, tasting notes, flavor intensity, rating, add-ons tracking
- Auto-calculated total price (base + add-ons)
- Cafe directory with computed stats (visits, spending, frequency)
- Browse/search history with filters
- Analytics dashboard (spending trends, category breakdown, top cafes, ratings)
- Mobile-first responsive design
- Light mode only

**Out of scope for V1 (future considerations):**
- Dark mode
- Social features (sharing, public profiles, following)
- PWA / offline support
- App Store distribution (Capacitor wrapping)
- Multi-currency / multi-region support
- Notifications / reminders
- Export data (CSV, PDF)
- Cafe recommendations / discovery
- Map integration for nearby cafes

---

## Design Reference

The complete UI has been designed across 9 screens (available as a PDF). Key screens are:

1. **Journal home** — monthly overview + recent logs
2. **New entry form** — full beverage logging form
3. **Category selector** — bottom sheet modal
4. **Add upgrade modal** — bottom sheet for add-ons
5. **Entry confirmation** — "Ritual Recorded" success screen
6. **Entry detail** — full order details view
7. **Cafe directory** — list of visited cafes
8. **Cafe profile** — single cafe detail with stats and history
9. **Browse history** — searchable, filterable log history

When building components, refer to the design PDF for exact layout, spacing, and visual hierarchy. The design is the source of truth for UI decisions.
