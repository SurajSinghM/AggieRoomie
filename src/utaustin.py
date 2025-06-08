
def ut_prediction(user_occupants, user_bathroom, user_price, user_amenities):
    from bs4 import BeautifulSoup
    import requests
    import re
    from src.regex import extract_dorm_info
    import json
    

    ### === STEP 1: SCRAPE ALL RESIDENCE HALL LINKS === ###
    BASE_URL = "https://housing.utexas.edu/housing/residence-halls/residence-hall-locations"
    page_to_scrape = requests.get(BASE_URL)
    soup = BeautifulSoup(page_to_scrape.text, "html.parser")

    halls = soup.findAll("span", attrs={"class": "field field--name-title field--type-string field--label-hidden view-mode-utprop-list-1 field-node-utprop-property field-node-utprop-property--title"})
    halls_list = [hall.text.strip() for hall in halls]

    halls_links = {
        hall: f"{BASE_URL}/{hall.replace(' ', '-')}"
        for hall in halls_list
    }

    print(f"✅ Found {len(halls_list)} residence halls.")

    ### === STEP 2: USER INPUT FOR PREFERENCES === ###
    #print("\n🔍 Enter your room preferences below:")
    #user_occupants = input("Preferred number of occupants (One, Two, etc.): ").strip()
    #user_bathroom = input("Preferred bathroom type (Private, Shared, Community, etc.): ").strip()
    #user_price = float(input("Maximum price you are willing to pay: ").strip())
    #user_amenities = input("Preferred amenities/features (comma-separated): ").strip().lower().split(", ")
    user_occupants = int(str(user_occupants).strip())
    user_bathroom = user_bathroom.strip()
    user_price = float(str(user_price).strip())
    user_amenities = user_amenities.strip().lower().split(", ")
    if user_occupants == 1:
        user_occupants = "One Occupant"
    elif user_occupants == 2:
        user_occupants = "Two Occupant(s)"
    elif user_occupants == 3:
        user_occupants = "Three Occupant(s)"
    elif user_occupants == 4:
        user_occupants = "Four Occupant(s)"

    if user_bathroom == "One Private":
        user_bathroom = "One Bathroom (Private)"
    if user_bathroom == "One Connecting":
        user_bathroom = "One Bathroom (Connecting)"
    if user_bathroom == "Two Private":
        user_bathroom = "Two Bathrooms (Private)"

    ### === STEP 3: SCRAPE & EXTRACT ROOM DETAILS FOR ALL HALLS === ###
    

    class Room:
        def __init__(self, hall, title, occupants, bathroom, price, amenities, tour_available, tour_link):
            self.hall = hall
            self.title = title
            self.occupants = occupants
            self.bathroom = bathroom
            self.price = price
            self.amenities = amenities
            self.tour_available = tour_available
            self.tour_link = tour_link

        def to_dict(self):
            """Convert the Room object to a dictionary for JSON serialization."""
            return {
                "hall": self.hall,
                "title": self.title,
                "occupants": self.occupants,
                "bathroom": self.bathroom,
                "price": self.price,
                "amenities": self.amenities,
                "tour_available": self.tour_available,
                "tour_link":self.tour_link
            }
        def __repr__(self):
            return f"{self.hall} | {self.title} | {self.occupants} | {self.bathroom} | ${self.price} | Amenities: {', '.join(self.amenities)}"

    all_rooms = []

    for hall, link in halls_links.items():
        print(f"\n📍 Scraping: {hall} ...")
        hall_page = requests.get(link)
        hall_soup = BeautifulSoup(hall_page.text, "html.parser")

        # Extract all room details
        room_types = hall_soup.findAll("article", attrs={"class": "node node--type-utprop-property-space node--view-mode-utprop-alt-1"})
        
        for room in room_types:
            room_text = room.text.replace("\n", " ").replace("*", "").strip()
            
            # Check if the room text contains a price
            if "$" not in room_text:
                continue  # Skip rooms without pricing info

            room_text = re.sub(r'(?<=[a-z])([A-Z])', r' \1', room_text)  # Add spaces before capital letters
            extracted_info = extract_dorm_info(room_text).split(", ")

            # Extract amenities
            amenities_list = [
                amenity.get_text(strip=True).lower()
                for amenity in hall_soup.findAll("li", attrs={"class": "field__item field-node-utprop-property__item"})
                if amenity.get_text(strip=True)
            ]

            # Extract 3D Tour link (if available)
            tour_link_tag = room.find("span", class_="field__item field-node-utprop-property-space__item")
            
            tour_link = None

            

            # Check if extracted info is valid
            if len(extracted_info) == 5:  # Only expecting title, occupants, bathroom, price
                title, occupants, bathroom, price, tour_available = extracted_info
                if "Premium Single                            3D tour       One Occupant   Community Bath" in title:
                    title = "Premium Single"
                if tour_link_tag:
                    tour_a_tag = tour_link_tag.find("a")
                    if tour_available:
                        tour_link = tour_a_tag.get("href")
                price = float(price)  # Convert price to float for comparison
                all_rooms.append(Room(hall, title, occupants, bathroom, price, amenities_list, tour_available, tour_link))
                print(f"✅ Found: {title} | {occupants} | {bathroom} | ${price} | Tour: {'Available' if tour_available else 'Not Available'} | Link: {tour_link}")




    ### === STEP 4: FILTER ROOMS BASED ON USER PREFERENCES === ###
    # Initialize NLP model for similarity checking (Mistral-7B Instruct for better results)
    # Load the correct zero-shot classification model
    # Load the zero-shot classification model
    # Load the zero-shot classification model
    from fuzzywuzzy import fuzz  # Faster string similarity matching
    def convert_occupants_to_number(occupants_str):
        """Convert occupant descriptions into a standardized integer format."""
        occupants_mapping = {
            "One Occupant":1, "Two Occupant(s)": 2, "Three Occupant(s)": 3, "Four Occupant(s)": 4
        }
        
        words = occupants_str.lower().split()
        
        # Check for word-based numbers first
        for word in words:
            if word in occupants_mapping:
                return occupants_mapping[word]
        
        # Check if there's a numeric value in the string
        numbers = [int(s) for s in words if s.isdigit()]
        return numbers[0] if numbers else None  # Return first found number, else None

    def rate_room(room, strict_occupants, strict_bathroom, max_price, preferred_amenities):
        """Rate a room on a 100-point scale for precise scoring and convert to 5-star scale."""
        
        rating = 0  # Base rating (will increment)
        
        

        ### STRICT MATCHING (High Importance)
        if room.occupants == strict_occupants:
            rating += 40  # ✅ +40 points if occupants match exactly
        else:
            return 0  # 🚫 Completely reject the room if occupants don't match

        if strict_bathroom.lower() in room.bathroom.lower():
            rating += 30  # ✅ +30 points if bathroom matches exactly
        elif fuzz.ratio(strict_bathroom.lower(), room.bathroom.lower()) > 75:
            rating += 15  # ✅ +15 points if it's a close match (e.g., "Shared" vs. "Community")
        else:
            return 0  # 🚫 Completely reject the room if bathroom doesn't match

        if room.price <= max_price:
            rating += 20  # ✅ +20 points if price is within budget
        elif room.price <= max_price * 1.1:  # ✅ Allow up to 10% over budget with penalty
            rating += 10  # ✅ +10 points if price is within 10% over budget
        else:
            return 0  # 🚫 Completely reject the room if price is too high

        ### FLEXIBLE MATCHING WITH FAST FUZZY STRING COMPARISON (Lower Importance)
        if preferred_amenities and room.amenities:  # If user selected amenities
            amenity_score = sum(
                1 for amenity in preferred_amenities 
                if max(fuzz.partial_ratio(amenity.lower(), room_amenity.lower()) for room_amenity in room.amenities) > 75
            )
            rating += min(amenity_score * 5, 10)  # ✅ Up to +10 points for amenity matches

        ### NO AMENITIES SELECTED (Neutral Handling)
        else:
            rating += 5  # ✅ Default boost if no amenities are selected (so user still gets results)

        ### CONVERT TO 5-STAR SCALE
        star_rating = round(rating / 20, 1)  # Convert to decimal-based 5-star rating
        return min(star_rating, 5.0)  # Cap at 5.0 stars


    ### === STEP 5: FIND & DISPLAY BEST MATCHES WITH DECIMAL RATINGS === ###
    rated_rooms = [
        (room, rate_room(room, user_occupants, user_bathroom, user_price, user_amenities))
        for room in all_rooms
    ]

    # Capitalize the first letter of each amenity AFTER rating
    for room, rating in rated_rooms:
        if hasattr(room, "amenities"):  # Ensure `room` has `amenities` attribute
            room.amenities = [amenity.capitalize() for amenity in room.amenities]



    # Remove rooms that got a 0-star rating (didn't pass strict filtering)
    # Sort while still in tuple format
    rated_rooms.sort(key=lambda x: x[1], reverse=True)

    # Convert after sorting
    rated_rooms_json = [{"room": room.to_dict(), "rating": rating} for room, rating in rated_rooms if rating > 0]

    # Convert full list to JSON string
    top_3_rooms = rated_rooms_json[:3]

    # Convert to JSON
    json_top_3 = json.dumps(top_3_rooms, indent=4)
    top_10_rooms = rated_rooms_json[:10]

# Convert to JSON
    json_top_10 = json.dumps(top_10_rooms, indent=4)
    # Display Top Rated Dorms
    if top_3_rooms:
        print("\n🏠 **Top Rated Dorm Rooms for You:**")
        print(top_3_rooms)
        
        for room, stars in top_3_rooms:
            print(f"⭐️ {stars}/5 | {room}")
        return json_top_3, json_top_10
        
    else:
        print("\n⚠️ No matching dorms found. Try adjusting your filters!")
        print(user_occupants, user_bathroom, user_price, user_amenities, tour_available, tour_link)
        return "None", "None"

    print("\nℹ️ *Information may not be 100% accurate, please check your college website for more accurate details.*")


