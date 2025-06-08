import {useState} from "react";

export default function TrueSlider(){
    const [value, setValue] = useState(10000)

    // Function to calculate the left position of the value dynamically
    const getThumbPosition = () => {
        const percentage = ((value - 1) / (30000 - 1)) * 100;
        return `calc(${percentage}% - 10px)`; // Adjust to center the label
    };
    const handleNumberChange = (e) =>{
        let newValue = Number(e.target.value);
        if (newValue >= 0 && newValue <= 30000){
            setValue(newValue);
        }
    }
    return (
        <div style={{ width: "300px", margin: "35px auto", textAlign: "center", position: "relative" }}>
          {/* Dynamic Value Display Above the Thumb */}
          <input
            type="number"
            value={value}
            onChange={handleNumberChange}
            style={{
                position: "absolute",
                top: "-40px",
                left: getThumbPosition(),
                width: "40px",
                textAlign: "center",
                background: "white",
                border: "1px solid gray",
                borderRadius: "4px",
                fontSize: "14px",
                padding: "2px",
                transition: "left 0.2s ease-out",
            }}
            />
            {value}
          
    
          {/* Slider */}
          <input
            type="range"
            min={0}
            max={30000}
            step="500"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            style={{ width: "100%", position: "relative", zIndex: "1" }}
          />
    
          
          
        </div>
      );
    
}