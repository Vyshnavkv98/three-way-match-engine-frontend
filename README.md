# Three-Way Match Engine - Frontend

This is the frontend application for the **Three-Way Match Engine**, built with Next.js 15, Tailwind CSS, TanStack Query, and React Hook Form.

## Features

- **Document Upload & Parsing:** Upload POs, GRNs, and Invoices.
- **Three-Way Matching Dashboard:** View real-time matching status, quantity mismatches, and price discrepancies.
- **SKU Resolution & Mapping:** Unresolved items are flagged and can be matched against the SKU Master catalogue.
- **Premium UI/UX:** Built with a modern glassmorphism design, micro-animations, and responsive layouts.

## Prerequisites

- Node.js 20+

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## State Management

TanStack Query manages all server state. The backend is the single source of truth — no global client store is needed. React context handles UI-only state (open/closed modals, active tabs).

## Styling & Design

The UI is built with **Tailwind CSS** using a highly customized design system.
Key design choices include:
- Frosted glass effects (backdrop-blur).
- Subtle gradients and inset shadows for a premium feel.
- Smooth transitions and micro-animations for an interactive user experience.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
