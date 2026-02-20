# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NumberConnect** is a casual logic puzzle mobile game where players clear numbers from a board by matching pairs. The project consists of:

- **Backend API**: ASP.NET Core 10.0 minimal API (C#)
- **Frontend**: Angular 21 standalone application
- **Platform**: Mobile-first (portrait orientation) using Ionic Capacitor

## Architecture

### Backend (NumberConnect/)
- Minimal ASP.NET Core API using .NET 10.0
- Entry point: `Program.cs`
- Configuration: `appsettings.json`, `appsettings.Development.json`

### Frontend (number-connect-app/)
- Angular 21 with standalone components
- Structure:
  - `src/app/components/` - UI components
  - `src/app/models/` - TypeScript data models
  - `src/app/services/` - Business logic and state management
- Vitest for unit testing
- Prettier configured (100 char width, single quotes)

## Development Commands

### Backend (.NET)
```bash
# Run the API (from NumberConnect/ or root)
dotnet run --project NumberConnect

# Build
dotnet build

# Restore dependencies
dotnet restore
```

### Frontend (Angular)
```bash
# Start dev server (from number-connect-app/)
cd number-connect-app
npm start
# Or: ng serve
# Runs on http://localhost:4200

# Build for production
npm run build

# Run tests
npm test

# Watch mode (rebuild on changes)
npm run watch

# Generate component
ng generate component component-name
```

## Game Mechanics

### Core Matching Rules
- Two numbers can be matched if they are **equal** OR **sum to 10** (1-9 only)
- Connection paths must pass only through empty cells
- Allowed path shapes:
  - Straight line (0 turns): horizontal, vertical, or diagonal
  - L-shape (1 turn): orthogonal segments only
  - Z/S-shape (2 turns): three orthogonal segments
  - Scan-order path: row-major adjacency

### Board Model
- **Grid**: Fixed 9 columns, dynamic rows (starts with 42 cells)
- Each cell tracks two states:
  - `isOccupied`: currently contains a number
  - `wasEverOccupied`: has ever contained a number
- **Cell types**:
  - Occupied: `isOccupied = true`
  - Cleared: `isOccupied = false`, `wasEverOccupied = true`
  - Pristine empty: `isOccupied = false`, `wasEverOccupied = false`

### "+" Button Behavior
When adding numbers:
1. Collect all occupied numbers in scan order (row-major)
2. Find the last pristine empty cell
3. Insert numbers starting at `lastPristineIndex + 1`
4. Only place in pristine empty cells
5. Append new rows if needed

### Row Removal
- After each match, check for completely empty rows
- Remove empty rows and shift remaining rows up
- No gravity (numbers don't fall within columns)

## UI/UX Design

### Visual Hierarchy
- Header bar (56px): back button, centered score with star icon, settings
- Large score display (80px): primary score in 48px bold blue
- Stats bar (72px): stage indicator, numbers cleared tracker (9 circles), all-time score with trophy
- Game board: flexible height, 9-column grid, dynamic cell sizing (~36px on standard phones)
- Bottom controls (80px + safe area): circular "+" button (blue), hint button (yellow)

### Color Palette
- Primary Blue: `#2196F3`
- Success Green: `#4CAF50`
- Error Red: `#FF5252`
- Warning/Hint Yellow: `#FFC107`
- Text: `#212121` (primary), `#757575` (secondary)
- Backgrounds: `#FFFFFF` (main), `#F5F5F5` (surface)

### Typography
- Primary font: Roboto
- Numbers: Roboto Mono
- Board numbers: 32px, medium weight
- Large score: 48px, bold

### Animations
- Cell selection: 200ms scale(1.05) with blue highlight
- Match success: 300ms path draw, 200ms fade out
- Match failure: 300ms shake animation
- All animations respect `prefers-reduced-motion`

## Design Constraints

- Matching logic is **deterministic** (no randomness)
- Maximum 2 turns for connection paths (except scan-order)
- Diagonal movement only for straight-line paths
- Must track `wasEverOccupied` state per cell
- Minimum touch targets: 48px × 48px
- WCAG AA color contrast compliance

## Project Files Reference

- Game specification: `App/Project.md` (complete rules and UI/UX design)
- Backend project: `NumberConnect/NumberConnect.csproj`
- Frontend config: `number-connect-app/angular.json`
- Frontend package: `number-connect-app/package.json`
