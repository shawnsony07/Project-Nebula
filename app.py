from flask import Flask, jsonify, render_template, request
from astroquery.gaia import Gaia
from astroquery.ipac.nexsci.nasa_exoplanet_archive import NasaExoplanetArchive
from flask_cors import CORS
import numpy as np
import json
import os
import openai

app = Flask(__name__)
CORS(app)

# Set your OpenAI API key
openai.api_key = 'YOUR-API-KEY'

# Specify the directory where you want to save the JSON file
SAVE_DIRECTORY = r"C:\Users\LENOVO\Documents\exosky"

def clean_data_for_json(data):
    if isinstance(data, np.ma.MaskedArray):
        return data.filled(None).tolist()
    elif isinstance(data, np.ndarray):
        return data.tolist()
    elif isinstance(data, (np.float32, np.float64, np.int32, np.int64)):
        return data.item()
    elif isinstance(data, dict):
        return {key: clean_data_for_json(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [clean_data_for_json(item) for item in data]
    else:
        return data

def fetch_exoplanet_data(planet_name):
    try:
        exoplanets = NasaExoplanetArchive.query_object(object_name=planet_name, table="ps")
        exoplanet_data = []
        
        for exoplanet in exoplanets:
            exoplanet_data.append({
                "pl_name": exoplanet["pl_name"],
                "hostname": exoplanet["hostname"],
                "sy_hmag": exoplanet["sy_hmag"],
                "sy_kmag": exoplanet["sy_kmag"],
                "sky_coord": exoplanet["sky_coord"]
            })
        
        return exoplanet_data
    
    except Exception as e:
        print(f"Error fetching exoplanet data for {planet_name}: {e}")
        return []

def fetch_gaia_data(ra_min, ra_max, dec_min, dec_max):
    try:
        query = f"""
            SELECT TOP 100 ra, dec, phot_g_mean_mag, parallax
            FROM gaiadr3.gaia_source
            WHERE ra BETWEEN {ra_min} AND {ra_max}
            AND dec BETWEEN {dec_min} AND {dec_max}
        """
        job = Gaia.launch_job(query)
        gaia_results = job.get_results()

        stars = []
        for row in gaia_results:
            distance = None
            if row["parallax"] and row["parallax"] > 0:
                distance = 1.0 / row["parallax"]  # Distance in parsecs

            stars.append({
                "ra": row["ra"],
                "dec": row["dec"],
                "magnitude": row["phot_g_mean_mag"],
                "distance": distance  # Add distance
            })

        return stars
    
    except Exception as e:
        print(f"Error fetching Gaia data: {e}")
        return []

def convert_to_cartesian(ra, dec, magnitude):
    ra_rad = np.radians(ra)
    dec_rad = np.radians(dec)
    distance = 10 ** ((magnitude + 5) / 5)  # Convert magnitude to a distance scale
    x = distance * np.cos(dec_rad) * np.cos(ra_rad)
    y = distance * np.cos(dec_rad) * np.sin(ra_rad)
    z = distance * np.sin(dec_rad)
    return x, y, z

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/fetch-stars/<planet_name>', methods=['GET'])
def fetch_star_data(planet_name):
    print(f"Fetching star data for planet: {planet_name}")
    exoplanet_data = fetch_exoplanet_data(planet_name)

    if not exoplanet_data:
        print(f"No exoplanet data returned for {planet_name}")
        return jsonify({"error": "No exoplanet data found"}), 404

    stars = [] 

    for exoplanet in exoplanet_data:
        try:
            sky_coord = exoplanet['sky_coord']
            ra = sky_coord.ra.deg
            dec = sky_coord.dec.deg

            print(f"RA: {ra}, Dec: {dec}") 

            ra_min = ra - 0.5
            ra_max = ra + 0.5
            dec_min = dec - 0.5
            dec_max = dec + 0.5

            gaia_stars = fetch_gaia_data(ra_min, ra_max, dec_min, dec_max)
            stars.extend(gaia_stars)

        except Exception as e:
            print(f"Error processing exoplanet data for {exoplanet['pl_name']}: {e}")

    response_data = {
        "exoplanet_data": [
            {
                "pl_name": exoplanet['pl_name'],
                "hostname": exoplanet['hostname'],
                "ra": exoplanet['sky_coord'].ra.deg,
                "dec": exoplanet['sky_coord'].dec.deg
            } for exoplanet in exoplanet_data
        ],
        "stars": []
    }

    # Convert stars to Cartesian coordinates
    for star in stars:
        x, y, z = convert_to_cartesian(star['ra'], star['dec'], star['magnitude'])
        response_data["stars"].append({
            "ra": star['ra'],
            "dec": star['dec'],
            "magnitude": star['magnitude'],
            "x": x,
            "y": y,
            "z": z
        })

    # Save response data to a JSON file
    json_file_path = os.path.join(SAVE_DIRECTORY, f"{planet_name}_star_data.json")
    try:
        with open(json_file_path, 'w') as json_file:
            json.dump(clean_data_for_json(response_data), json_file, indent=4)
        print(f"Data saved to {json_file_path}")
    except Exception as e:
        print(f"Error saving data to file: {e}")

    return jsonify(clean_data_for_json(response_data))

@app.route('/chatgpt', methods=['POST'])
def chatgpt():
    user_message = request.json.get('message')
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # You can change the model as needed
            messages=[{"role": "user", "content": user_message}],
            max_tokens=150  # Limit response length
        )
        
        bot_message = response.choices[0].message['content']
        return jsonify({"response": bot_message})
    
    except Exception as e:
        print(f"Error communicating with ChatGPT: {e}")
        return jsonify({"error": "ChatGPT API request failed"}), 500

if __name__ == '__main__':
    app.run(debug=True)
