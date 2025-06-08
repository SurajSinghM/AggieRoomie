import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SegmentedSlider from './SegmentedSlider'
import TrueSlider from './TrueSlider'
import LongTextInput from './LongTextInput'
import axios from 'axios';
import DormResults from './results'
import { Analytics } from "@vercel/analytics/react"

function App() {
  const [selectedOccupants, updateOccupants] = useState(1);
  const [selectedBathroom, updateBathroom] = useState("Community Bathroom");
  const [selectedBudget, updateBudget] = useState(20000);
  const [accommodation, setAccommodation] = useState("");
  
  const [top3, setTop3] = useState(null);
  const [top10, setTop10] = useState(null);
  const [loading, setLoading] = useState(false);  // ✅ Loading state

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


  // Handles the change in Number of Occupants slider
const handleOccupantChange = (event) => {
  updateOccupants(Number(event.target.value)); // Convert to number
};

// Handles the change in Type of Bathroom dropdown
const handleBathroomChange = (event) => {
  updateBathroom(event.target.value);
};

// Handles the change in Budget input
const handleBudgetChange = (e) => {
  let currVal = e.target.value;

  // If input is empty, set state to an empty string
  if (currVal === "0") {
      updateBudget("");
      e.target.value = "";
  } 
  // Otherwise, parse the number and ensure it's within limits
  else if (!isNaN(currVal)) {
      let newValue = Number(e.target.value);
      if (newValue >= 0 && newValue <= 1000000) {
          updateBudget(newValue);
      }
  }
};

// Handles the change in Long Text Input (Accommodations)
const handleAccommodationChange = (event) => {
  setAccommodation(event.target.value);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // ✅ Show "Finding a dorm for you..."
    setTop3(null);
    setTop10(null);

    const requestData = {
        first: selectedOccupants,
        second: selectedBathroom,
        third: selectedBudget,
        fourth: accommodation
    };

    fetch(`${API_BASE_URL}/api/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();  // Convert to JSON
    })
    .then(data => {
        //console.log("Response from server:", data);

        let t3 = data.received.top3;
        let t10 = data.received.top10;

        // Handle cases where the response is None or empty
        const parsedTop3 = t3 && t3 !== "None" ? JSON.parse(t3) : [];
        const parsedTop10 = t10 && t10 !== "None" ? JSON.parse(t10) : [];

        setTop3(parsedTop3);
        setTop10(parsedTop10);
    })
    .catch(error => console.error("Error:", error.message))
    .finally(() => setLoading(false)); // ✅ Stop loading after data is received
  };

  return (
    <div className = "total-container" style = {{}}>
      <Analytics/>

      <a href="https://github.com/ChetanGorantla/dorm-match-ut" target="_blank" rel="noopener noreferrer" className="github-link">
          <img src="https://cdn-icons-png.flaticon.com/256/25/25231.png" alt="GitHub" className="github-icon" />
      </a>

      <div className="header-container">
          <div className="header-content">
              <h1 className="main-title">Dorm Match.</h1>
              <p className="subtitle">
                  Find your perfect dorm at UT Austin in <span className="highlight-text">seconds</span>
              </p>
          </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            {/* Left Side */}
            <div className = "left-section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "center", alignItems:"center", marginTop: "0px" }}>
                  Number of Occupants
                </div>
                <SegmentedSlider value={selectedOccupants} setValue={updateOccupants}/>
              </div>
              
              <div>
                <label htmlFor="dropdown">Type of Bathroom</label>
                <select id="dropdown" value={selectedBathroom} onChange={handleBathroomChange} style={{ marginLeft:"10px" }}>
                  <option value="Community Bathroom">Community Bathroom</option>
                  <option value="One Private">One Private</option>
                  <option value="One Connecting">One Connecting</option>
                  <option value="Two Private">Two Private</option>
                </select>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "center", alignItems:"center", marginTop: "10px"}}>
                  Budget
                  <input
                    className = "budget-input"
                    type="text"
                    value={selectedBudget}
                    onChange={handleBudgetChange}
                    style={{
                      marginLeft: "10px",
                      textAlign: "center",
                      background: "white",
                      border: "1px solid gray",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color:"black",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className = "right-section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <LongTextInput text={accommodation} setText={setAccommodation}/>
            </div>
        </div>

        {/* Match Me Button */}
        <button 
        onClick={handleSubmit}
        className="example-button"
        style={{ minWidth:"10px" }}>
           Match me!
        </button>

        {/* Display Messages & Results */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px" }}>
          <div style={{ color: "#323D49" }}> {/* Apply dark blue-black color */}

            {/* Loading Message */}
            {loading && (
                <p style={{ color: "#323D49", fontWeight: "bold", fontSize: "18px" }}>
                    Finding a dorm for you...
                </p>
            )}

            {/* No Results Found Message */}
            {!loading && top3 !== null && top3.length === 0 && (
                <p style={{ color: "#323D49", fontWeight: "bold", fontSize: "18px" }}>
                    We couldn't find a dorm that fits your needs. Please try entering different inputs.
                </p>
            )}

            </div>

          
          {/* Display Dorm Results When Available */}
          {!loading && top3 && top3.length > 0 && <DormResults top3={top3} top10={top10} />}
        
        </div>
      </div>
      <footer className="footer">
          <p>Results are generated by a ranking system that rates each dorm relative to your needs.</p>
          <p>Ratings may vary per person. Please refer to the official UT housing website for more details.</p>
      </footer>

    </div>
  );
}

export default App;
