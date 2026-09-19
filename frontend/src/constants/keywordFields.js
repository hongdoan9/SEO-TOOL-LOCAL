export const KEYWORD_FIELDS = [
  { key: 'key_chinh_local', label: 'Key chính + Local', group: 1 },
  { key: 'lsi_local', label: 'LSI + local', group: 1 },
  // Nhóm 2 (1-4)
  ...Array.from({ length: 4 }, (_, i) => ({ key: `lsi_${i + 1}`, label: `LSI keywords ${i + 1}`, group: 2 })),
  // Nhóm 3 (1-6)
  ...Array.from({ length: 6 }, (_, i) => ({ key: `cluster_${i + 1}`, label: `Cluster key ${i + 1}`, group: 3 })),
  // Nhóm 4 (5-41)
  ...Array.from({ length: 37 }, (_, i) => ({ key: `lsi_${i + 5}`, label: `LSI keywords ${i + 5}`, group: 4 }))
];

export const getLanguageFullName = (code) => {
  const map = {
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ru': 'Russian',
    'zh': 'Chinese',
    'en': 'English',
    'ja': 'Japanese',
    'de': 'German',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'fr': 'French',
    'bn': 'Bengali',
    'pl': 'Polish',
    'fi': 'Finnish',
    'ko': 'Korean',
    'it': 'Italian'
  };
  return map[code] || code;
};
