import json
import os
import re

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.join(SCRIPTS_DIR, "..")
raw_file = os.path.join(workspace_dir, "src", "data", "raw_meditations.json")
candidates_file = os.path.join(workspace_dir, "scripts", "filtered_candidates.json")
output_file = os.path.join(workspace_dir, "public", "data", "graph_data.json")

os.makedirs(os.path.dirname(output_file), exist_ok=True)

with open(raw_file, "r", encoding="utf-8") as f:
    raw_nodes = json.load(f)

with open(candidates_file, "r", encoding="utf-8") as f:
    candidates = json.load(f)

nodes_map = {node["id"]: node for node in raw_nodes}

# Define theme keywords
themes = {
    "TRANSIENCE": {
        "keywords": ["time", "death", "mortal", "forgotten", "years", "smoke", "bubble", "moment", "eternity", "past", "future", "vanish", "point", "age", "die", "depart", "departing", "long ago", "history", "ashes", "decay", "transient", "transitoriness", "brevity", "oblivion", "shortness"],
        "labels": [
            "Reflects on life's transience",
            "Compares time to eternity",
            "Urges awareness of death",
            "Notes the brevity of life",
            "Contrasts time with eternity"
        ],
        "desc_template": "In Book {src_book}, Marcus reflects on the transience of human life, which aligns with his discussion in Book {tgt_book} about how quickly all things fade into the oblivion of eternity."
    },
    "INNER_CITADEL": {
        "keywords": ["soul", "mind", "opinion", "judgment", "grieve", "hurt", "imagination", "citadel", "retire", "tranquility", "rest", "calm", "withdraw", "retreat", "fortress", "ruling", "governing", "will", "choice", "intellect", "reason", "ruling centre", "independent"],
        "labels": [
            "Recommends inner retreat",
            "Shields soul from externals",
            "Emphasizes control of opinion",
            "Urges self-governance",
            "Protects mind from passion"
        ],
        "desc_template": "Marcus advises turning inward to the soul for peace in Book {src_book}, reinforcing the idea in Book {tgt_book} that external events have no power over the mind unless through opinion."
    },
    "COSMOS": {
        "keywords": ["nature", "universe", "cosmos", "whole", "part", "member", "providence", "gods", "atoms", "cause", "divine", "necessity", "fate", "logos", "order", "world", "governed", "governor", "common nature"],
        "labels": [
            "Accepts universal nature",
            "Aligns with cosmic order",
            "Submits to divine providence",
            "Reflects on part-whole relation",
            "Accepts destiny contentedly"
        ],
        "desc_template": "In Book {src_book}, Marcus discusses our role as parts of the universe, which he connects to Book {tgt_book} where he urges acceptance of whatever universal nature provides."
    },
    "SOCIAL_DUTY": {
        "keywords": ["men", "social", "good", "citizens", "help", "benefit", "another", "offend", "wicked", "anger", "meek", "forbear", "kindred", "society", "brother", "neighbor", "ignorant", "fault", "error", "fellow", "cooperation", "assistance", "love"],
        "labels": [
            "Advocates for common good",
            "Urges patience with others",
            "Emphasizes human fellowship",
            "Reminds of social duty",
            "Recommends gentle correction"
        ],
        "desc_template": "Marcus emphasizes that humans are made for cooperation in Book {src_book}, which connects to his advice in Book {tgt_book} to bear with others patiently and work for the community."
    },
    "VIRTUE": {
        "keywords": ["virtue", "righteousness", "truth", "temperance", "fortitude", "justice", "goodness", "just", "temperate", "courageous", "honest", "integrity", "probity", "moral"],
        "labels": [
            "Prioritizes moral virtue",
            "Urges justice and truth",
            "Defines the only good",
            "Exhorts practice of virtue",
            "Values integrity above all"
        ],
        "desc_template": "Marcus stresses that moral goodness is the only true benefit in Book {src_book}, which reinforces his exhortation in Book {tgt_book} to pursue virtue and justice above all else."
    }
}

def clean_text(text):
    return re.sub(r'[^\w\s]', '', text.lower())

def classify_node(text):
    clean = clean_text(text)
    scores = {}
    for theme_name, data in themes.items():
        score = sum(clean.count(kw) for kw in data["keywords"])
        scores[theme_name] = score
    best_theme = max(scores, key=scores.get)
    if scores[best_theme] == 0:
        return "VIRTUE"
    return best_theme

def classify_pair(src_text, tgt_text):
    src_clean = clean_text(src_text)
    tgt_clean = clean_text(tgt_text)
    
    scores = {}
    for theme_name, data in themes.items():
        src_score = sum(src_clean.count(kw) for kw in data["keywords"])
        tgt_score = sum(tgt_clean.count(kw) for kw in data["keywords"])
        scores[theme_name] = src_score * tgt_score
        
    best_theme = max(scores, key=scores.get)
    if scores[best_theme] == 0:
        for theme_name, data in themes.items():
            src_score = sum(src_clean.count(kw) for kw in data["keywords"])
            tgt_score = sum(tgt_clean.count(kw) for kw in data["keywords"])
            scores[theme_name] = src_score + tgt_score
        best_theme = max(scores, key=scores.get)
        if scores[best_theme] == 0:
            return "VIRTUE"
            
    return best_theme

# Classify and label each passage node
for node in raw_nodes:
    node["theme"] = classify_node(node["text"])
    node["isAnchor"] = False

# Define Anchor themes metadata
ANCHOR_THEMES = {
    "INNER_CITADEL": {
        "title": "The Inner Citadel",
        "desc": "The rational mind as an invulnerable fortress. Marcus reminds himself that while external circumstances are beyond control, we maintain absolute sovereignty over our opinions, judgments, and character."
    },
    "TRANSIENCE": {
        "title": "The Flow of Time",
        "desc": "Life as a brief moment in the river of eternity. Marcus reflects on the constant flow of change, transience of fame, and the certainty of death to cultivate humility and presence."
    },
    "COSMOS": {
        "title": "Cosmic Order & Logos",
        "desc": "The universe as a single living organism governed by rational design (Logos). Marcus urges alignment and contentment with fate, recognizing each individual as a cooperative part of the whole."
    },
    "SOCIAL_DUTY": {
        "title": "Social Duty & Fellowship",
        "desc": "Humanity as cooperative limbs of a social body. Marcus emphasizes acting for the common good, bearing patiently with the faults of others, and offering gentle guidance."
    },
    "VIRTUE": {
        "title": "Moral Virtue",
        "desc": "Virtue as the sole true good. Marcus focuses on the practice of justice, temperance, wisdom, and courage as the only source of genuine benefit and peace of mind."
    }
}

anchor_nodes = []
for theme_id, theme_info in ANCHOR_THEMES.items():
    anchor_nodes.append({
        "id": f"theme_{theme_id.lower()}",
        "isAnchor": True,
        "theme": theme_id,
        "title": theme_info["title"],
        "text": theme_info["desc"],
        "book": 0,
        "chapter": 0
    })

all_nodes = raw_nodes + anchor_nodes

links = []
discarded_count = 0

all_sims = [c["similarity"] for c in candidates]
min_sim = min(all_sims) if all_sims else 0.55
max_sim = max(all_sims) if all_sims else 0.8

print(f"Calibrating weights based on similarity range: [{min_sim:.4f}, {max_sim:.4f}]")

for cand in candidates:
    src_id = cand["source"]
    tgt_id = cand["target"]
    sim = cand["similarity"]
    
    src_node = nodes_map.get(src_id)
    tgt_node = nodes_map.get(tgt_id)
    
    if not src_node or not tgt_node:
        discarded_count += 1
        continue
        
    src_text = src_node["text"]
    tgt_text = tgt_node["text"]
    
    theme_name = classify_pair(src_text, tgt_text)
    theme_data = themes[theme_name]
    
    label_idx = (hash(src_id + tgt_id) % len(theme_data["labels"]))
    label = theme_data["labels"][label_idx]
    
    # Scale similarity dynamically from [min_sim, max_sim] to [30, 95]
    if max_sim - min_sim > 0:
        weight = int(30 + (sim - min_sim) / (max_sim - min_sim) * 65)
    else:
        weight = 60
    weight = max(10, min(100, weight))
    
    src_book = src_node.get("book", "?")
    tgt_book = tgt_node.get("book", "?")
    desc = theme_data["desc_template"].format(src_book=src_book, tgt_book=tgt_book)
    
    links.append({
        "source": src_id,
        "target": tgt_id,
        "label": label,
        "weight": weight,
        "description": desc
    })

# Generate and append Gravity links to the Anchor Nodes
anchor_links = []
for node in raw_nodes:
    theme_id = node["theme"]
    anchor_links.append({
        "source": node["id"],
        "target": f"theme_{theme_id.lower()}",
        "label": "Thematic Gravity",
        "weight": 85,  # Strong weight to pull them together
        "description": f"This passage belongs to the thematic domain of {ANCHOR_THEMES[theme_id]['title']}.",
        "isAnchorLink": True
    })

all_links = links + anchor_links

print(f"Generated {len(links)} links, injected {len(anchor_links)} gravity anchor links, discarded {discarded_count}")

# Define takeaways
takeaways = [
    {
        "id": "takeaway_1",
        "title": "The Inner Citadel",
        "story": "Marcus Aurelius repeatedly returns to the concept of the 'Inner Citadel'—the rational mind as a fortress that cannot be breached by external events unless we allow it. Across various books, he reminds himself that while we cannot control external circumstances, we maintain absolute power over our opinions and judgments. By retreating into this inner sanctuary, we find absolute peace, free from the distractions of fame, pleasure, or pain.",
        "relatedNodeIds": ["B4_P3", "B12_P1", "B8_P1", "B10_P8", "B5_P19"]
    },
    {
        "id": "takeaway_2",
        "title": "The Flow of Time",
        "story": "Life is a brief moment in the vast river of eternity. Marcus uses vivid metaphors—comparing human lives to smoke, bubbles, and fleeting points in time—to cultivate humility and detach himself from worldly ambitions. By seeing the constant flow of change, he recognizes that both the longest and shortest lives lose only the present moment when they die.",
        "relatedNodeIds": ["B2_P12", "B12_P19", "B10_P31", "B9_P29", "B4_P3"]
    },
    {
        "id": "takeaway_3",
        "title": "Harmonizing with the Cosmos",
        "story": "Every individual is a part of a larger whole, governed by universal nature (Logos). Marcus argues that resisting what happens is like tearing oneself away from the cosmic body. By understanding that everything that occurs is necessary for the whole, he finds contentment and alignment with the divine providence, rejecting the notion that the universe is merely a chaotic clash of atoms.",
        "relatedNodeIds": ["B2_P6", "B10_P6", "B9_P20", "B12_P24", "B6_P36"]
    },
    {
        "id": "takeaway_4",
        "title": "Social Duty and Fellowship",
        "story": "Human beings are rational and social creatures, made to work together like feet, hands, and rows of teeth. Marcus stresses that our sole purpose in action should be the benefit of human society. When others offend us, we must remember they act out of ignorance of good and evil, and it is our duty to teach them or bear with them patiently.",
        "relatedNodeIds": ["B2_P1", "B9_P43", "B5_P1", "B11_P13", "B8_P34"]
    },
    {
        "id": "takeaway_5",
        "title": "The Vanity of Fame",
        "story": "Seeking praise from contemporary men or hoping for posthumous fame is a futile distraction. Marcus warns that those who praise us will soon die, and memory itself is quickly swallowed by the abyss of time. Real value lies in virtue and acting in accordance with reason, not in the fickle opinion of others.",
        "relatedNodeIds": ["B4_P18", "B9_P29", "B8_P1", "B12_P25", "B10_P31"]
    }
]

graph_data = {
    "nodes": all_nodes,
    "links": all_links,
    "takeaways": takeaways
}

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(graph_data, f, indent=2, ensure_ascii=False)

print(f"Saved base graph data to {output_file}")
