# embeddings.py
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import pickle
import os

class UIUEmbeddings:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.data = []
        self.metadata = []
        
    def load_data(self, csv_path='uiu_dataset.csv'):
        """Load and prepare data for embedding"""
        df = pd.read_csv(csv_path)
        
        # Filter out very short content
        df = df[df['content'].str.len() > 100]
        
        # Split long documents into chunks
        chunks = []
        metadata = []
        
        for _, row in df.iterrows():
            content = row['content']
            # Split by sentences or fixed length
            sentences = content.split('. ')
            
            current_chunk = ""
            for sentence in sentences:
                if len(current_chunk + sentence) < 500:  # Rough chunk size
                    current_chunk += sentence + ". "
                else:
                    if len(current_chunk) > 50:  # Minimum chunk size
                        chunks.append(current_chunk.strip())
                        metadata.append({
                            'url': row['url'],
                            'title': row['title'],
                            'domain': row['domain'],
                            'chunk_id': len(chunks)
                        })
                    current_chunk = sentence + ". "
            
            # Add the last chunk
            if len(current_chunk) > 50:
                chunks.append(current_chunk.strip())
                metadata.append({
                    'url': row['url'],
                    'title': row['title'],
                    'domain': row['domain'],
                    'chunk_id': len(chunks)
                })
        
        self.data = chunks
        self.metadata = metadata
        return chunks, metadata
    
    def generate_embeddings(self):
        """Generate embeddings for all chunks"""
        if not self.data:
            raise ValueError("No data loaded. Call load_data() first.")
        
        print(f"Generating embeddings for {len(self.data)} chunks...")
        embeddings = self.model.encode(self.data, show_progress_bar=True)
        return embeddings
    
    def build_index(self, embeddings):
        """Build FAISS index"""
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Using inner product for cosine similarity
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)
        
        return self.index
    
    def save_index(self, index_path='uiu_index.faiss', metadata_path='uiu_metadata.pkl'):
        """Save FAISS index and metadata"""
        if self.index is None:
            raise ValueError("No index built. Call build_index() first.")
        
        faiss.write_index(self.index, index_path)
        
        with open(metadata_path, 'wb') as f:
            pickle.dump({
                'data': self.data,
                'metadata': self.metadata
            }, f)
        
        print(f"Index saved to {index_path}")
        print(f"Metadata saved to {metadata_path}")
    
    def load_index(self, index_path='uiu_index.faiss', metadata_path='uiu_metadata.pkl'):
        """Load existing FAISS index and metadata"""
        if not os.path.exists(index_path) or not os.path.exists(metadata_path):
            return False
        
        self.index = faiss.read_index(index_path)
        
        with open(metadata_path, 'rb') as f:
            saved_data = pickle.load(f)
            self.data = saved_data['data']
            self.metadata = saved_data['metadata']
        
        print(f"Loaded index with {len(self.data)} chunks")
        return True

# Create embeddings
if __name__ == "__main__":
    embedder = UIUEmbeddings()
    
    # Try to load existing index
    if not embedder.load_index():
        print("No existing index found. Creating new one...")
        chunks, metadata = embedder.load_data()
        embeddings = embedder.generate_embeddings()
        embedder.build_index(embeddings)
        embedder.save_index()