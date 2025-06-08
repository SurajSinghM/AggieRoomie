from flask import Flask, request, jsonify
from flask_cors import CORS
from src.utaustin import ut_prediction  # If inside src/


app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Ensure this route handles both GET and POST
@app.route('/api/data', methods=['GET', 'POST'])
def handle_data():
    if request.method == 'POST':
        data = request.get_json()  # Extract JSON data from request
        #occupants = data.get(occupants)
        #bathroom = data.get(bathroom)
        #budget = data.get(budget)
        #accommodations = data.get(accommodations)
        #print("Received data:", occupants, bathroom, budget, accommodations)  # Debugging
        occupants = data['first']
        bathroom = data['second']
        budget = data['third']
        accommodations = data['fourth']
        #top3 = "a"
        #top10 = "b"
        top3, top10 = ut_prediction(occupants, bathroom, budget, accommodations)
        print(type(top3))
        return jsonify({"message": "Data received", "received": {"top3": top3, "top10": top10}}), 200


    # Handle GET request if needed
    return jsonify({"message": "Send a POST request with data"}), 200

if __name__ == '__main__':
    app.run(debug=True)
