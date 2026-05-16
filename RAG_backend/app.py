# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from rag_pipeline import generate_answer

app = Flask(__name__)
CORS(app)  # allows frontend (React/HTML) to connect

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "No question provided."}), 400

    try:
        answer = generate_answer(question)
        return jsonify({"answer": answer})
    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
