import React, { useState } from "react";

const DormResults = ({ top3, top10 }) => {
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showMore, setShowMore] = useState(false);

    // Function to handle room click (opens/closes modal)
    const handleRoomClick = (room) => {
        setSelectedRoom(prev => (prev === room ? null : room));
    };

    // Function to close modal when clicking outside
    const handleOutsideClick = (event) => {
        if (event.target.classList.contains("modal-overlay")) {
            setSelectedRoom(null);
        }
    };

    // Filter Top 10 to remove Top 3 (avoids duplicates)
    const additionalResults = top10.slice(3);

    return (
        <div style={{
            width: "100%",
            maxWidth: "500px",
            margin: "auto",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "15px",
            marginBottom: 60
        }}>
            <h2>Top 3 Dorms</h2>
            {top3?.map((item, index) => (
                <div key={index} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    gap: "5px", 
                    width: "100%", 
                    flexWrap: "wrap"
                }}>
                    {/* Dorm name */}
                    <span
                        onClick={() => handleRoomClick(item)}
                        style={{
                            cursor: "pointer",
                            fontWeight: "bold",
                            color: "#323D49",
                            textDecoration: item.room.tour_link ? "underline" : "none"
                        }}
                    >
                        {item.rating}⭐ {item.room.hall} - {item.room.title}
                    </span>

                    {/* Tour Button (only if link exists) */}
                    {item.room.tour_link && (
                        <a href={item.room.tour_link} target="_blank" rel="noopener noreferrer">
                            <button style={{ padding: "5px 10px", backgroundColor: "#323D49", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                                Tour
                            </button>
                        </a>
                    )}

                    {/* Popup Modal */}
                    {selectedRoom === item && (
                        <div
                            className="modal-overlay"
                            onClick={handleOutsideClick}
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                zIndex: 1000
                            }}
                        >
                            <div
                                className="modal-content"
                                style={{
                                    backgroundColor: "white",
                                    color: "black",  // ✅ Ensures text is visible
                                    padding: "20px",
                                    borderRadius: "8px",
                                    boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
                                    maxWidth: "400px",
                                    position: "relative"
                                }}
                            >

                                <h3>{selectedRoom.room.hall} - {selectedRoom.room.title}</h3>
                                <p><strong>Occupants:</strong> {selectedRoom.room.occupants}</p>
                                <p><strong>Bathroom:</strong> {selectedRoom.room.bathroom}</p>
                                <p><strong>Price:</strong> ${selectedRoom.room.price.toLocaleString()}</p>
                                <p><strong>Amenities:</strong></p>
                                <ul>
                                    {selectedRoom.room.amenities.map((amenity, idx) => (
                                        <li key={idx}>{amenity}</li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => setSelectedRoom(null)}
                                    style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        backgroundColor: "#BF5700",
                                        color: "white",
                                        border: "none",
                                        padding: "5px 10px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Show More Results Button */}
            {additionalResults.length > 0 && (
                <button
                    onClick={() => setShowMore(prev => !prev)}
                    style={{
                        backgroundColor: showMore ? "#A14C00" : "#BF5700",  /* Burnt Orange */
                        color: "white",
                        border: "2px solid #BF5700",  /* Burnt Orange Border */
                        padding: "8px 12px",
                        cursor: "pointer",
                        marginTop: "10px",
                        borderRadius: "5px",
                        fontWeight: "bold",
                        transition: "background-color 0.3s ease, border 0.3s ease"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#A14C00"}  /* Darker shade on hover */
                    onMouseLeave={(e) => e.target.style.backgroundColor = showMore ? "#A14C00" : "#BF5700"}
                >
                    {showMore ? "Hide additional results..." : "Show more results..."}
                </button>
            
            )}

            {/* Show Additional Results */}
            {showMore && (
                <div style={{
                    width: "100%",
                    maxWidth: "800px",
                    margin: "auto",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "15px"}}>
                    <h3>Additional Dorms</h3>
                    {additionalResults.map((item, index) => (
                        <div key={index} style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "space-between", 
                            gap: "5px", 
                            width: "100%", 
                            flexWrap: "wrap"
                        }}>
                            <span
                                onClick={() => handleRoomClick(item)}
                                style={{
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    color: "#323D49",
                                    textDecoration: item.room.tour_link ? "underline" : "none"
                                }}
                            >
                                {item.rating}⭐ {item.room.hall} - {item.room.title}
                            </span>

                            {/* Popup Modal */}
                    {selectedRoom === item && (
                            <div
                                className="modal-overlay"
                                onClick={handleOutsideClick}
                                style={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    zIndex: 1000
                                }}
                            >
                                <div
                                    className="modal-content"
                                    style={{
                                        backgroundColor: "white",
                                        color: "black",  // ✅ Ensures text is visible
                                        padding: "20px",
                                        borderRadius: "8px",
                                        boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
                                        maxWidth: "400px",
                                        position: "relative"
                                    }}
                                >

                                    <h3>{selectedRoom.room.hall} - {selectedRoom.room.title}</h3>
                                    <p><strong>Occupants:</strong> {selectedRoom.room.occupants}</p>
                                    <p><strong>Bathroom:</strong> {selectedRoom.room.bathroom}</p>
                                    <p><strong>Price:</strong> ${selectedRoom.room.price.toLocaleString()}</p>
                                    <p><strong>Amenities:</strong></p>
                                    <ul>
                                        {selectedRoom.room.amenities.map((amenity, idx) => (
                                            <li key={idx}>{amenity}</li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => setSelectedRoom(null)}
                                        style={{
                                            position: "absolute",
                                            top: "10px",
                                            right: "10px",
                                            backgroundColor: "#BF5700",
                                            color: "white",
                                            border: "none",
                                            padding: "5px 10px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                            {item.room.tour_link && (
                                <a href={item.room.tour_link} target="_blank" rel="noopener noreferrer">
                                    <button style={{ padding: "5px 10px", backgroundColor: "#323D49", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: 3 }}>
                                        Tour
                                    </button>
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DormResults;
