import { useState } from 'react'
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
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleBathroomChange = (event) => {
    updateBathroom(event.target.value);
  };

  const handleBudgetChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      updateBudget("");
    } else if (!isNaN(val)) {
      const num = Number(val);
      if (num >= 0 && num <= 1000000) {
        updateBudget(num);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTop3(null);
    setTop10(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/data`, {
        first: selectedOccupants,
        second: selectedBathroom,
        third: selectedBudget,
        fourth: accommodation
      });

      const data = res.data.received;

      const parsedTop3 = data.top3 && data.top3 !== "None" ? JSON.parse(data.top3) : [];
      const parsedTop10 = data.top10 && data.top10 !== "None" ? JSON.parse(data.top10) : [];

      setTop3(parsedTop3);
      setTop10(parsedTop10);
    } catch (error) {
      console.error("Error fetching dorms:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="total-container">
      <Analytics />

      <a href="https://github.com/ChetanGorantla/dorm-match-ut" target="_blank" rel="noopener noreferrer" className="github-link">
        <img src="https://cdn-icons-png.flaticon.com/256/25/25231.png" alt="GitHub" className="github-icon" />
      </a>

      <div className="header-container">
        <div className="header-content">
          <h1 className="main-title">Aggie Dormie</h1>
          <p className="subtitle">
            Find your perfect dorm at <span className="highlight-text">Texas A&M University</span>
          </p>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {/* Left Section */}
          <div className="left-section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                Number of Occupants
              </div>
              <SegmentedSlider value={selectedOccupants} setValue={updateOccupants} />
            </div>

            <div>
              <label htmlFor="dropdown">Type of Bathroom</label>
              <select id="dropdown" value={selectedBathroom} onChange={handleBathroomChange} style={{ marginLeft: "10px" }}>
                <option value="Community Bathroom">Community Bathroom</option>
                <option value="One Private">One Private</option>
                <option value="One Connecting">One Connecting</option>
                <option value="Two Private">Two Private</option>
              </select>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "10px" }}>
                Budget
                <input
                  className="budget-input"
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
                    color: "black"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="right-section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <LongTextInput text={accommodation} setText={setAccommodation} />
          </div>
        </div>

        {/* Match Me Button */}
        <button onClick={handleSubmit} className="example-button" style={{ minWidth: "10px" }}>
          Match me!
        </button>

        {/* Results Section */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px" }}>
          <div style={{ color: "#323D49" }}>
            {loading && (
              <p style={{ fontWeight: "bold", fontSize: "18px" }}>
                Finding a dorm for you...
              </p>
            )}

            {!loading && top3 !== null && top3.length === 0 && (
              <p style={{ fontWeight: "bold", fontSize: "18px" }}>
                We couldn't find a dorm that fits your needs. Try different inputs.
              </p>
            )}
          </div>

          {!loading && top3 && top3.length > 0 && <DormResults top3={top3} top10={top10} />}
        </div>
      </div>

      <footer className="footer">
        <p>Results are generated by a ranking system tailored to your TAMU housing preferences.</p>
        <p>Data is not official. Refer to TAMU's housing site for final details.</p>
      </footer>
    </div>
  );
}

export default App;
