import json
import os

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
CANDIDATE_JSON_PATH = os.path.join(SCRIPTS_DIR, "candidate_pairs.json")
FILTERED_JSON_PATH = os.path.join(SCRIPTS_DIR, "filtered_candidates.json")

def main():
    if not os.path.exists(CANDIDATE_JSON_PATH):
        print(f"Error: {CANDIDATE_JSON_PATH} does not exist. Run prepare_data.py first.")
        return

    with open(CANDIDATE_JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Determine the similarity threshold dynamically based on distribution
    all_sims = [pair['similarity'] for pair in data]
    avg_sim = sum(all_sims) / len(all_sims) if all_sims else 0
    max_sim = max(all_sims) if all_sims else 0
    
    if avg_sim > 0.35:
        threshold = 0.55
        method_name = "Neural Embeddings"
    else:
        threshold = 0.28
        method_name = "TF-IDF"
        
    print(f"Detected similarity method: {method_name} (avg: {avg_sim:.4f}, max: {max_sim:.4f})")
    print(f"Using filtering threshold: {threshold}")

    # Group candidate pairs by source node to find each node's best match
    node_candidates = {}
    for pair in data:
        s = pair['source']
        node_candidates.setdefault(s, []).append(pair)

    keep_pairs = {}
    
    # 1. Guarantee top-1 nearest neighbor for every node is kept
    for node_id, pairs in node_candidates.items():
        if not pairs:
            continue
        top_pair = max(pairs, key=lambda x: x['similarity'])
        key = tuple(sorted([top_pair['source'], top_pair['target']]))
        keep_pairs[key] = top_pair

    # 2. Add all candidate pairs with similarity >= threshold
    for pair in data:
        if pair['similarity'] >= threshold:
            key = tuple(sorted([pair['source'], pair['target']]))
            if key not in keep_pairs:
                keep_pairs[key] = pair

    # Convert back to list
    filtered_list = list(keep_pairs.values())
    
    # Sort by similarity descending
    filtered_list.sort(key=lambda x: x['similarity'], reverse=True)

    with open(FILTERED_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(filtered_list, f, indent=2, ensure_ascii=False)

    print(f"Filtered candidate pairs generated at {FILTERED_JSON_PATH}")
    print(f"Total nodes with top-1 connections guaranteed: {len(node_candidates)}")
    print(f"Total output connections (top-1 + threshold >= {threshold}): {len(filtered_list)}")

if __name__ == "__main__":
    main()
