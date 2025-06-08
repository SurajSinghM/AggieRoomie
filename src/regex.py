import re

def extract_dorm_info(text):
    # Updated regex patterns
    title_pattern = r"^(.*?)\s*(?:Room|Suite|Dorm|Apartment)"
    occupants_pattern = r"(\bOne\b|\bTwo\b|\bThree\b|\bFour\b|\d+)\s*(?:Occupant|Occupants)"
    bathroom_pattern = r"(Community Bathroom|Private Bathroom|Shared Bathroom|One Bathroom \(Private\)|One Bathroom \(Connecting\)|Two Bathrooms \(Private\))"
    price_pattern = r"\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$"
    

    # Extracting details
    title_match = re.search(title_pattern, text, re.IGNORECASE)
    occupants_match = re.search(occupants_pattern, text, re.IGNORECASE)
    bathroom_match = re.search(bathroom_pattern, text, re.IGNORECASE)
    price_match = re.search(price_pattern, text)
    tour_available = False
    if "3d tour" or "tour" in text.lower():
        tour_available = True

    # Clean extracted results
    title = title_match.group(1).strip() if title_match else "N/A"
    if occupants_match:
        if occupants_match.group(1) == "One":
            occupants = occupants_match.group(1).capitalize() + " Occupant"
        else:
            occupants = occupants_match.group(1).capitalize() + " Occupant(s)"
    else:
        occupants = "N/A"
    bathroom = bathroom_match.group(1) if bathroom_match else "N/A"
    price = price_match.group(1).replace(",", "") if price_match else "N/A"

    return f"{title}, {occupants}, {bathroom}, {price}, {tour_available}"

# Example usage
text = "Single Room 3D Tour One Occupant One Bathroom (Private) Per person: $15,963"
print(extract_dorm_info(text))
