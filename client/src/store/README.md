// This file re-exports immer middleware to ensure compatibility.
// Zustand 4.x includes immer as a separate middleware import.
// If you see errors, run: npm install immer
// in the /client directory.
//
// Usage in store files:
//   import { create } from 'zustand'
//   import { immer } from 'zustand/middleware/immer'
