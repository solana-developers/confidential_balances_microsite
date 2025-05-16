import React from "react";

// Define types for button props
type ButtonSize = "small" | "medium" | "large";
type ButtonStyle = "primary" | "secondary" | "outline";

interface TestButtonProps {
  size?: ButtonSize;
  style?: ButtonStyle;
  children: string | JSX.Element;
  onClick?: () => void;
}

// Button component with arrow function syntax
export const TestButton = ({
  size = "medium",
  style = "primary",
  children,
  onClick,
}: TestButtonProps) => {
  // Size classes
  const sizeClasses = {
    small: "px-3 py-1.5 text-sm font-medium",
    medium: "px-4 py-2 text-base font-semibold",
    large: "px-6 py-3 text-lg font-bold",
  };

  // Style classes
  const styleClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
    outline:
      "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-blue-300 disabled:text-blue-300",
  };

  return (
    <button
      className={`rounded-lg ${sizeClasses[size]} ${styleClasses[style]} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
