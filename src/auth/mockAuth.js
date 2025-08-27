import React, { createContext, useContext } from "react";

// Create the mock auth context
const MockAuthContext = createContext(null);

// Default mock auth values
const mockAuthValue = {
  keycloak: null,
  initialized: true,
  token: "mock-token",
  isAuthenticated: true,
  logout: () => console.log("Mock logout called"),
  hasRole: () => true,
};

// Provider component for mock auth
export const MockAuthProvider = ({ children }) => {
  return (
    <MockAuthContext.Provider value={mockAuthValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

// Hook to use mock auth context
export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
};
