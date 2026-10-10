import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"

// The UI is designed dark-only; `class="dark"` is pinned on <html> in
// index.html so shadcn tokens (tooltips, chart axes) match the hard-coded
// dark palette regardless of the OS theme.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
