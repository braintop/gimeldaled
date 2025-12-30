import React from "react";

export const ColorModeContext = React.createContext<{
  toggleColorMode: () => void;
}>({
  // default implementation – will be overridden in main.tsx
  toggleColorMode: () => {}
});


