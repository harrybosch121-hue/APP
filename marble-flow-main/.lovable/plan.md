
# Sri Balaji Marble & Tiles — Premium Mobile App

## Overview
A luxury-styled, mobile-first tile inventory management app for internal staff and managers. Inspired by marble textures with white, gold (#C9A646), and charcoal (#2B2B2B) palette, glassmorphism touches, and elegant typography.

## Screens & Features

### 1. Home Screen (Hero Experience)
- Full-screen tile preview using the uploaded marble image
- CSS 3D transform rotation on drag/swipe for interactive feel
- Subtle reflection overlay and soft lighting gradient
- App name "Sri Balaji Marble & Tiles" at top in elegant thin typography
- Three floating action buttons: "Add Stock", "Search", "Scan/Upload"

### 2. Bottom Navigation
- 4 tabs: Home, Search, Stock, Logs
- Gold active indicator, smooth tab transitions

### 3. Stock Management Screen (Add Stock)
- Premium form with: Tile Name, Quantity (stepper), Type dropdown (Gloss/Matt/MattyGloss), Location (Godown number), Image upload with preview
- Gold-highlighted Save button
- Smooth input focus animations

### 4. Search Screen
- Large elegant search bar with real-time filtering
- Result cards with: tile image thumbnail, name, type badge, stock quantity, location
- Shimmer loading placeholders
- Subtle card shadows

### 5. Tile Details Screen
- Large tile image with zoom gesture support
- Info sections: Name, Type, Available Stock, Location
- "Remove Stock" and "Update Stock" action buttons

### 6. Stock Removal Flow
- Tile selector → quantity input → confirmation modal
- Warning-styled confirmation with red accent

### 7. Audit Logs (Manager Panel)
- Clean list view of all stock actions
- Each entry: Staff Name, Action, Tile Name, Quantity, Timestamp
- Green = Added, Red = Removed color coding

## Design System
- Colors: White (#FFF), Ivory (#F8F6F2), Gold (#C9A646), Charcoal (#2B2B2B)
- Glassmorphism cards with backdrop blur
- Smooth rounded corners (12-16px)
- Thin/bold typography contrast
- Micro-interactions: button press scales, page transitions, shimmer loaders

## Data
- Local state with React useState/context (no backend initially)
- Sample demo tiles pre-loaded for showcase
- The uploaded marble image will be used as a hero tile image
