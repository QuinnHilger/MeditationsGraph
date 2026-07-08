// Color scheme for Books 1 to 12
export const BOOK_COLORS: Record<number, string> = {
  1: '#d4af37', // Imperial Gold
  2: '#10b981', // Stoic Emerald
  3: '#3b82f6', // Cobalt Blue
  4: '#f59e0b', // Autumn Amber
  5: '#ef4444', // Gladiator Ruby
  6: '#8b5cf6', // Tyrian Purple
  7: '#06b6d4', // Aegean Teal
  8: '#f97316', // Campfire Orange
  9: '#ec4899', // Blossom Pink
  10: '#14b8a6', // Mediterranean Cyan
  11: '#f43f5e', // Rose
  12: '#a855f7'  // Violet
};

// Colors for the 5 central Stoic themes (for Anchor Nodes)
export const THEME_COLORS: Record<string, string> = {
  INNER_CITADEL: '#3b82f6', // Cobalt Blue (matches The Inner Citadel)
  TRANSIENCE: '#f59e0b',    // Amber (matches Transience & Mortality)
  COSMOS: '#8b5cf6',        // Tyrian Purple (matches Cosmic Order & Logos)
  SOCIAL_DUTY: '#10b981',   // Stoic Emerald (matches Fellowship & Duty)
  VIRTUE: '#ef4444'        // Gladiator Ruby (matches Virtue & Wisdom)
};

export const BOOK_NAMES: Record<number, string> = {
  1: "Book I (Ancestors)",
  2: "Book II (On the Quadi)",
  3: "Book III (Carnuntum)",
  4: "Book IV (Self-Retreat)",
  5: "Book V (Duty)",
  6: "Book VI (The Whole)",
  7: "Book VII (Providence)",
  8: "Book VIII (Virtue)",
  9: "Book IX ( Logos)",
  10: "Book X (Nature)",
  11: "Book XI (Fellowship)",
  12: "Book XII (Eternity)"
};

export const STOIC_CONCEPTS: Record<string, { label: string; keywords: string[]; color: string }> = {
  inner_citadel: {
    label: "The Inner Citadel",
    color: "#3b82f6", // Blue
    keywords: [
      "citadel", "fortress", "ruling center", "governing part", "mind", "soul", 
      "daemon", "inner self", "ruling power", "rational soul", "judgment", "opinion",
      "assent", "retreat within", "sanctuary", "freedom", "free"
    ]
  },
  transience_of_life: {
    label: "Transience & Mortality",
    color: "#f59e0b", // Amber
    keywords: [
      "transience", "fleeting", "smoke", "bubble", "river", "transitoriness", "eternity", "time", "death", 
      "die", "mortal", "decay", "ashes", "oblivion", "brief", "moment", "temporary",
      "span", "vapor", "swift", "flow", "transitory", "vanished"
    ]
  },
  cosmic_order: {
    label: "Cosmic Order & Logos",
    color: "#8b5cf6", // Purple
    keywords: [
      "logos", "nature", "cosmos", "providence", "universe", "whole", "destiny", 
      "fate", "ordained", "all-governing", "rational design", "world-soul", "coherence",
      "harmony", "general law"
    ]
  },
  social_duty: {
    label: "Fellowship & Duty",
    color: "#10b981", // Emerald Green
    keywords: [
      "fellowship", "brotherhood", "social", "citizen", "cooperation", "help", "common good",
      "kindness", "benevolence", "community", "jointly", "neighbor", "forbear", "patiently",
      "instruction", "fellow-workers", "society", "mankind"
    ]
  },
  virtue_and_vice: {
    label: "Virtue & Wisdom",
    color: "#ef4444", // Crimson Red
    keywords: [
      "virtue", "vice", "good", "evil", "justice", "temperance", "fortitude", "wisdom",
      "integrity", "moral", "shamefastness", "truth", "righteousness", "duty", "honest"
    ]
  }
};
