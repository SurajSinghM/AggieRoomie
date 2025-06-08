import { useState } from "react";
import './App.css'

export default function SegmentedSlider({ value, setValue }) { // Use props here
  const steps = [1, 2, 3, 4]; // Define segment values

  // Function to calculate the left position of the value dynamically
  const getThumbPosition = () => {
    const percentage = ((value - 1) / (steps.length - 1)) * 100;
    return `calc(${percentage}% - 10px)`; // Adjust to center the label
  };

  return (
    <div style={{ width: "90%", maxWidth: "300px", margin: "auto", position: "relative" }}>
      {/* Dynamic Value Display Above the Thumb */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          left: getThumbPosition(),
          background: "#323D49",
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "14px",
          transition: "left 0.2s ease-out",
        }}
      >
        {value}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={1}
        max={4}
        step="1"
        value={value} // Use prop value
        onChange={(e) => setValue(Number(e.target.value))} // Use prop setValue
        style={{
          width: "100%",
          
          
          borderRadius: "5px",
          cursor: "pointer",
          height: "10px",
        }}
      />
    </div>
  );
}
