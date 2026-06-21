import os
import re
import json
import urllib.request

# Configuration
GUTENBERG_URL = "https://www.gutenberg.org/cache/epub/2680/pg2680.txt"
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
TEXT_FILE_PATH = os.path.join(SCRIPTS_DIR, "meditations_gutenberg.txt")
RAW_JSON_PATH = os.path.join(SCRIPTS_DIR, "..", "src", "data", "raw_meditations.json")
CANDIDATE_JSON_PATH = os.path.join(SCRIPTS_DIR, "candidate_pairs.json")

def download_text():
    if os.path.exists(TEXT_FILE_PATH):
        print(f"Text file already exists at {TEXT_FILE_PATH}")
        with open(TEXT_FILE_PATH, 'r', encoding='utf-8') as f:
            return f.read()
    
    print(f"Downloading Meditations from {GUTENBERG_URL}...")
    try:
        response = urllib.request.urlopen(GUTENBERG_URL)
        text = response.read().decode('utf-8')
        os.makedirs(SCRIPTS_DIR, exist_ok=True)
        with open(TEXT_FILE_PATH, 'w', encoding='utf-8') as f:
            f.write(text)
        print("Download complete.")
        return text
    except Exception as e:
        print(f"Error downloading text: {e}")
        raise e

def parse_meditations(text):
    text = text.replace('\r\n', '\n')
    
    book_titles = [
        "THE FIRST BOOK",
        "THE SECOND BOOK",
        "THE THIRD BOOK",
        "THE FOURTH BOOK",
        "THE FIFTH BOOK",
        "THE SIXTH BOOK",
        "THE SEVENTH BOOK",
        "THE EIGHTH BOOK",
        "THE NINTH BOOK",
        "THE TENTH BOOK",
        "THE ELEVENTH BOOK",
        "THE TWELFTH BOOK"
    ]
    
    book_indices = []
    for title in book_titles:
        pattern = re.compile(rf"^\s*{re.escape(title)}\s*$", re.MULTILINE | re.IGNORECASE)
        match = pattern.search(text)
        if match:
            book_indices.append((title, match.start()))
        else:
            pattern_dot = re.compile(rf"{re.escape(title)}\.?", re.IGNORECASE)
            match_dot = pattern_dot.search(text)
            if match_dot:
                book_indices.append((title, match_dot.start()))
            else:
                print(f"Warning: Could not find book header: {title}")
    
    book_indices.sort(key=lambda x: x[1])
    
    print(f"Found {len(book_indices)} book headers:")
    for title, idx in book_indices:
        print(f"  {title} at index {idx}")
        
    passages = []
    
    for i in range(len(book_indices)):
        current_book_title, start_idx = book_indices[i]
        end_idx = book_indices[i+1][1] if i + 1 < len(book_indices) else len(text)
        
        if i == len(book_indices) - 1:
            end_match = re.search(r"THE END OF THE EBOOK|End of the Project Gutenberg", text[start_idx:], re.IGNORECASE)
            if end_match:
                end_idx = start_idx + end_match.start()
        
        book_content = text[start_idx:end_idx]
        book_num = i + 1
        
        roman_nums = ["I","II","III","IV","V","VI","VII","VIII","IX","X",
                      "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX",
                      "XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII","XXVIII","XXIX","XXX",
                      "XXXI","XXXII","XXXIII","XXXIV","XXXV","XXXVI","XXXVII","XXXVIII","XXXIX","XL",
                      "XLI","XLII","XLIII","XLIV","XLV","XLVI","XLVII","XLVIII","XLIX","L",
                      "LI","LII","LIII","LIV","LV","LVI","LVII","LVIII","LIX","LX"]
        
        roman_pattern = "|".join(roman_nums)
        pattern = re.compile(rf"^\s*({roman_pattern}|\d+)\.\s+", re.MULTILINE)
        
        matches = list(pattern.finditer(book_content))
        
        if not matches:
            print(f"Warning: No numbered passages found in Book {book_num} with standard regex. Attempting fallback pattern.")
            pattern = re.compile(r"^\s*([IVXLCDM\d]+)\.\s+", re.MULTILINE | re.IGNORECASE)
            matches = list(pattern.finditer(book_content))
            
        print(f"Book {book_num}: Found {len(matches)} passages.")
        
        for idx_m, match in enumerate(matches):
            chapter_str = match.group(1)
            try:
                if chapter_str.isdigit():
                    chapter_num = int(chapter_str)
                else:
                    chapter_num = roman_to_int(chapter_str.upper())
            except Exception:
                chapter_num = idx_m + 1
            
            start_p = match.end()
            end_p = matches[idx_m + 1].start() if idx_m + 1 < len(matches) else len(book_content)
            
            passage_text = book_content[start_p:end_p].strip()
            paragraphs = passage_text.split('\n\n')
            cleaned_paragraphs = []
            for p in paragraphs:
                cleaned_p = re.sub(r'\s+', ' ', p).strip()
                if cleaned_p:
                    cleaned_paragraphs.append(cleaned_p)
            passage_text = "\n\n".join(cleaned_paragraphs)
            
            if passage_text:
                passages.append({
                    "id": f"B{book_num}_P{chapter_num}",
                    "book": book_num,
                    "chapter": chapter_num,
                    "text": passage_text
                })
                
    return passages

def roman_to_int(roman):
    roman_map = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    val = 0
    for i in range(len(roman)):
        if i > 0 and roman_map[roman[i]] > roman_map[roman[i - 1]]:
            val += roman_map[roman[i]] - 2 * roman_map[roman[i - 1]]
        else:
            val += roman_map[roman[i]]
    return val

STOP_WORDS = set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot", "could",
    "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each", "few", "for", "from",
    "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here",
    "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in", "into",
    "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor", "not", "of",
    "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant",
    "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the", "their",
    "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve",
    "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were",
    "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why",
    "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself", "yourselves"
])

STOIC_CONCEPTS = {
    "inner_citadel": [
        "citadel", "fortress", "ruling center", "governing part", "mind", "soul", 
        "daemon", "inner self", "ruling power", "rational soul", "judgment", "opinion",
        "assent", "retreat within", "sanctuary", "freedom", "free"
    ],
    "transience_of_life": [
        "transience", "fleeting", "smoke", "bubble", "river", "eternity", "time", "death", 
        "die", "mortal", "decay", "ashes", "oblivion", "brief", "moment", "temporary",
        "span", "vapor", "swift", "flow", "transitory", "vanished"
    ],
    "cosmic_order": [
        "logos", "nature", "cosmos", "providence", "universe", "whole", "destiny", 
        "fate", "ordained", "all-governing", "rational design", "world-soul", "coherence",
        "harmony", "general law"
    ],
    "social_duty": [
        "fellowship", "brotherhood", "social", "citizen", "cooperation", "help", "common good",
        "kindness", "benevolence", "community", "jointly", "neighbor", "forbear", "patiently",
        "instruction", "fellow-workers", "society", "mankind"
    ],
    "virtue_and_vice": [
        "virtue", "vice", "good", "evil", "justice", "temperance", "fortitude", "wisdom",
        "integrity", "moral", "shamefastness", "truth", "righteousness", "duty", "honest"
    ]
}

STOIC_PRESERVED_WORDS = {
    "all", "one", "god", "law", "bad", "art", "fit", "end", "whole"
}

def tokenize(text):
    text_lower = text.lower()
    
    # 1. Preserve critical words and remove refined stop words
    words = re.findall(r'\b[a-z]{2,}\b', text_lower)
    tokens = []
    
    refined_stop_words = STOP_WORDS.copy()
    for w in STOIC_PRESERVED_WORDS:
        refined_stop_words.discard(w)
        
    for w in words:
        if w in STOIC_PRESERVED_WORDS:
            tokens.append(w)
        elif len(w) >= 3 and w not in refined_stop_words:
            tokens.append(w)
            
    # 2. Stoic Concept Mapping
    for concept_name, keywords in STOIC_CONCEPTS.items():
        for kw in keywords:
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, text_lower):
                tokens.extend([f"__concept_{concept_name}__"] * 2)
                break
                
    return tokens

def compute_similarity_matrix(passages, k=5):
    try:
        from sentence_transformers import SentenceTransformer
        import numpy as np
        
        print("Using Local Neural Embeddings (Tier 2)...")
        print("Loading sentence-transformers model 'all-MiniLM-L6-v2'...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        texts = [p["text"] for p in passages]
        print(f"Computing dense embeddings for {len(texts)} passages...")
        embeddings = model.encode(texts, show_progress_bar=True)
        
        # Normalize embeddings
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norm_embeddings = embeddings / np.where(norms == 0, 1e-12, norms)
        
        # Pairwise cosine similarity matrix
        similarity_matrix = np.dot(norm_embeddings, norm_embeddings.T)
        
        num_docs = len(passages)
        candidate_pairs = []
        
        for i in range(num_docs):
            doc_i = passages[i]
            sims = []
            for j in range(num_docs):
                if i == j:
                    continue
                sims.append((j, float(similarity_matrix[i, j])))
                
            sims.sort(key=lambda x: x[1], reverse=True)
            top_k = sims[:k]
            
            for neighbor_idx, sim_score in top_k:
                doc_j = passages[neighbor_idx]
                candidate_pairs.append({
                    "source": doc_i["id"],
                    "target": doc_j["id"],
                    "similarity": round(sim_score, 4)
                })
                
        return candidate_pairs
        
    except Exception as e:
        print(f"Failed to run Local Neural Embeddings: {e}")
        print("Falling back to Concept-Aware TF-IDF (Tier 1)...")
        
        tokenized_passages = [tokenize(p["text"]) for p in passages]
        num_docs = len(passages)
        
        df = {}
        for doc in tokenized_passages:
            unique_terms = set(doc)
            for term in unique_terms:
                df[term] = df.get(term, 0) + 1
                
        import math
        idf = {}
        for term, count in df.items():
            idf[term] = math.log(1 + num_docs / (1 + count)) + 1
            
        tfidf_vectors = []
        for doc in tokenized_passages:
            tf = {}
            for term in doc:
                tf[term] = tf.get(term, 0) + 1
                
            vector = {}
            for term, count in tf.items():
                vector[term] = count * idf[term]
                
            l2_norm = math.sqrt(sum(val ** 2 for val in vector.values()))
            
            if l2_norm > 0:
                normalized_vector = {term: val / l2_norm for term, val in vector.items()}
            else:
                normalized_vector = {}
                
            tfidf_vectors.append(normalized_vector)
            
        candidate_pairs = []
        
        print("Computing similarity matrix...")
        for i in range(num_docs):
            doc_i = passages[i]
            vec_i = tfidf_vectors[i]
            
            similarities = []
            for j in range(num_docs):
                if i == j:
                    continue
                
                vec_j = tfidf_vectors[j]
                dot_product = 0.0
                if len(vec_i) < len(vec_j):
                    for term, val in vec_i.items():
                        if term in vec_j:
                            dot_product += val * vec_j[term]
                else:
                    for term, val in vec_j.items():
                        if term in vec_i:
                            dot_product += val * vec_i[term]
                            
                if dot_product > 0.0:
                    similarities.append((j, dot_product))
                    
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            top_k = similarities[:k]
            for neighbor_idx, sim_score in top_k:
                doc_j = passages[neighbor_idx]
                candidate_pairs.append({
                    "source": doc_i["id"],
                    "target": doc_j["id"],
                    "similarity": round(sim_score, 4)
                })
                
        return candidate_pairs

def main():
    try:
        text = download_text()
        passages = parse_meditations(text)
        
        if not passages:
            print("Failed to parse any passages.")
            return
            
        print(f"Successfully parsed {len(passages)} passages total.")
        
        os.makedirs(os.path.dirname(RAW_JSON_PATH), exist_ok=True)
        with open(RAW_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(passages, f, indent=2, ensure_ascii=False)
        print(f"Wrote raw passages to {RAW_JSON_PATH}")
        
        candidate_pairs = compute_similarity_matrix(passages, k=5)
        print(f"Computed {len(candidate_pairs)} similarity candidate pairs.")
        
        with open(CANDIDATE_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(candidate_pairs, f, indent=2, ensure_ascii=False)
        print(f"Wrote candidate pairs to {CANDIDATE_JSON_PATH}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
