# app.py

from flask import Flask, request, Response, send_file, jsonify
import os
import json

app = Flask(__name__)

LOG_FILE = "telemetry_log.jsonl"
HTML_FILE = "index.html"


# Serve dashboard
@app.route("/", methods=["GET"])
def serve_dashboard():
    if not os.path.exists(HTML_FILE):
        return "index.html not found", 404

    return send_file(HTML_FILE, mimetype="text/html")


# Receive telemetry
@app.route("/telemetry", methods=["POST"])
def receive_telemetry():
    try:
        data = request.get_json(force=True)

        with open(LOG_FILE, "a", encoding="utf-8") as log:
            json.dump(data, log)
            log.write("\n")

        print("[+] Telemetry received:", data)

        return jsonify({
            "status": "success",
            "message": "Telemetry received"
        }), 200

    except Exception as e:
        print("[-] Error receiving telemetry:", e)

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


# Send telemetry data to dashboard
@app.route("/data", methods=["GET"])
def get_telemetry_data():
    data = []

    if not os.path.exists(LOG_FILE):
        return jsonify(data), 200

    with open(LOG_FILE, "r", encoding="utf-8") as log:
        for line in log:
            line = line.strip()

            if not line:
                continue

            try:
                data.append(json.loads(line))
            except json.JSONDecodeError:
                print("[-] Skipping invalid JSON line")

    return jsonify(data), 200


if __name__ == "__main__":
    print("Server listening on http://localhost:8080")
    app.run(host="0.0.0.0", port=8080, debug=True)