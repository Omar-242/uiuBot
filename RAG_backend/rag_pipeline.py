import os
import pickle

import faiss
from openai import OpenAI
from sentence_transformers import SentenceTransformer


api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY environment variable not set.")
client = OpenAI(api_key=api_key)


class ContextRetriever:
    def __init__(self):
        print("Loading embedding model...")
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.index = None
        self.data = []
        self.metadata = []
        self.load_index()

    def load_index(self, index_path="uiu_index.faiss", metadata_path="uiu_metadata.pkl"):
        """Load FAISS index and metadata."""
        try:
            print("Loading FAISS index...")
            self.index = faiss.read_index(index_path)
            with open(metadata_path, "rb") as f:
                saved_data = pickle.load(f)
                self.data = saved_data["data"]
                self.metadata = saved_data["metadata"]
            print(f"Index loaded successfully! Total chunks: {len(self.data)}")
            return True
        except Exception as exc:
            print(f"Error loading index: {exc}")
            return False

    def retrieve_context(self, query, k=5):
        """Retrieve most relevant context for query."""
        query_embedding = self.embedding_model.encode([query])
        faiss.normalize_L2(query_embedding)
        scores, indices = self.index.search(query_embedding, k)

        results = []
        for i, idx in enumerate(indices[0]):
            if 0 <= idx < len(self.data):
                results.append(
                    {
                        "content": self.data[idx],
                        "url": self.metadata[idx]["url"],
                        "title": self.metadata[idx]["title"],
                        "score": float(scores[0][i]),
                        "chunk_id": idx,
                    }
                )
        return results


retriever = ContextRetriever()


def generate_answer(query, k=5):
    """Full RAG pipeline."""
    results = retriever.retrieve_context(query, k=k)
    if not results:
        return "Sorry, I couldn't find any relevant information for that question."

    context_text = "\n\n".join([r["content"] for r in results])

    prompt = f"""
You are a helpful assistant for students of United International University (UIU).
Use the following context from UIU's official websites to answer the user's question accurately.
If the answer is not found in the context, politely say so.

Context:
{context_text}

Question: {query}

Answer:
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content.strip()
