module.exports = {
    extends: ["next/core-web-vitals"],
    rules: {
      // Allow the use of 'any' type in TypeScript
      "@typescript-eslint/no-explicit-any": "off",
      
      // Make React hooks exhaustive-deps a warning instead of error
      "react-hooks/exhaustive-deps": "warn",
    }
  }