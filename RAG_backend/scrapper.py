# scraper.py
import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
from urllib.parse import urljoin, urlparse
import time
import hashlib

class UIUScraper:
    def __init__(self):
        self.domains = [
            "https://uiu.ac.bd",
            "https://www.uiu.ac.bd",
            "https://cse.uiu.ac.bd",
            "https://eee.uiu.ac.bd", 
            "https://datascience.uiu.ac.bd",
            "https://pharmacy.uiu.ac.bd",
            "https://bge.uiu.ac.bd",
            "https://sobe.uiu.ac.bd",
            "https://msj.uiu.ac.bd",
            "https://english.uiu.ac.bd",
            "https://ce.uiu.ac.bd",
            "https://ucam.uiu.ac.bd",
            "https://library.uiu.ac.bd",
        ]
        
        self.important_pages = [
            "https://uiu.ac.bd/faculty/",
            "https://uiu.ac.bd/admission/",
            "https://uiu.ac.bd/scholarships/", 
            "https://uiu.ac.bd/academic-calendar/",
            "https://uiu.ac.bd/programs/",
            "https://uiu.ac.bd/tuition-fees/",
            "https://uiu.ac.bd/contact/",
            "https://cse.uiu.ac.bd/faculty/",
            "https://cse.uiu.ac.bd/programs/",
            "https://eee.uiu.ac.bd/faculty/",
            "https://ucam.uiu.ac.bd/student-login/",
        ]
        
        self.visited_urls = set()
        self.data = []
        
    def clean_text(self, text):
        """Clean and preprocess text"""
        if not text:
            return ""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep Bengali and basic punctuation
        text = re.sub(r'[^\w\s\u0980-\u09FF.,!?;:()\-]', '', text)
        return text.strip()
    
    def extract_content(self, url):
        """Extract main content from a webpage"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "header", "footer"]):
                script.decompose()
            
            # Try to find main content areas
            main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile('content|main|post'))
            
            if main_content:
                content = main_content.get_text()
            else:
                content = soup.get_text()
            
            # Get title
            title = soup.find('title')
            title_text = title.get_text() if title else url
            
            return self.clean_text(content), title_text
            
        except Exception as e:
            print(f"Error extracting {url}: {e}")
            return None, None
    
    def get_page_links(self, url):
        """Extract all internal links from a page"""
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                full_url = urljoin(url, href)
                
                # Check if it's a relevant UIU URL and not a PDF
                if (any(domain in full_url for domain in self.domains) and 
                    not full_url.lower().endswith(('.pdf', '.doc', '.docx', '.zip')) and
                    '#' not in full_url):
                    links.append(full_url)
            
            return links
            
        except Exception as e:
            print(f"Error getting links from {url}: {e}")
            return []
    
    def scrape_website(self, max_pages=1000):
        """Scrape UIU websites systematically"""
        all_urls = set(self.important_pages)
        
        # Start with important pages
        queue = list(self.important_pages)
        
        while queue and len(self.visited_urls) < max_pages:
            url = queue.pop(0)
            
            if url in self.visited_urls:
                continue
                
            print(f"Scraping: {url}")
            content, title = self.extract_content(url)
            
            if content and len(content) > 100:  # Only store substantial content
                # Create data entry
                data_entry = {
                    'id': hashlib.md5(url.encode()).hexdigest(),
                    'url': url,
                    'title': title,
                    'content': content,
                    'domain': urlparse(url).netloc,
                    'length': len(content)
                }
                self.data.append(data_entry)
                
                # Save progress periodically
                if len(self.data) % 50 == 0:
                    self.save_progress()
            
            self.visited_urls.add(url)
            
            # Get new links from this page
            if len(self.visited_urls) < max_pages:
                new_links = self.get_page_links(url)
                for link in new_links:
                    if (link not in self.visited_urls and 
                        link not in queue and 
                        any(domain in link for domain in self.domains)):
                        queue.append(link)
            
            time.sleep(1)  # Be respectful to the server
        
        self.save_progress()
        return self.data
    
    def save_progress(self):
        """Save scraped data to CSV"""
        df = pd.DataFrame(self.data)
        df.to_csv('uiu_dataset.csv', index=False)
        print(f"Progress saved. Total pages: {len(self.data)}")
    
    def load_dataset(self):
        """Load existing dataset"""
        try:
            df = pd.read_csv('uiu_dataset.csv')
            self.data = df.to_dict('records')
            return self.data
        except FileNotFoundError:
            print("No existing dataset found. Starting fresh scrape.")
            return []

# Run the scraper
if __name__ == "__main__":
    scraper = UIUScraper()
    
    # Try to load existing dataset first
    existing_data = scraper.load_dataset()
    
    if len(existing_data) < 500:  # If not enough data, scrape more
        print("Starting website scraping...")
        scraper.scrape_website(max_pages=1000)
    else:
        print(f"Loaded existing dataset with {len(existing_data)} pages")