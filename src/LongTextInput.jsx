import {useState} from "react"

export default function LongTextInput({text, setText}){
    

    const handleTextChange = (e) => {
        if (e.target.value.length <= 100){
            setText(e.target.value)
        }
        
        
    }
    
    return(
        <div style={{ width: "400px", margin: "20px auto", textAlign: "center", marginLeft:"20px"}}>
            <textarea
            id = "longtext"
            value = {text}
            onChange = {(e) => handleTextChange(e)}
            placeholder = {"Enter any acommodations or amenities you prefer in a comma separated format..."}
            rows = "5"
            style={{
                width: "100%",
                minHeight: "125px",
                padding: "8px",
                fontSize: "16px",
                borderRadius: "5px",
                border: "1px solid gray",
                resize: "vertical", // Allows user to resize the box
                
              }}
            />

        </div>
    )
}