"use client";

import React from 'react';

// Simple provider component - Stack Auth has been removed
export function StackProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default StackProvider;