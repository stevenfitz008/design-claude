// We'll pass PRESET_SIZES as parameter to avoid circular imports

export interface PresetSize {
  name: string;
  width: number;
  height: number;
  category: string;
  platform?: string;
  format?: string;
  type?: string;
  device?: string;
}

export interface RecentSize {
  width: number;
  height: number;
  name: string;
  timestamp: number;
}

export interface CustomPreset extends PresetSize {
  id: string;
  createdAt: number;
  userId?: string;
}

// Local storage keys
const STORAGE_KEYS = {
  FAVORITES: 'resize-panel-favorites',
  RECENT_SIZES: 'resize-panel-recent-sizes',
  CUSTOM_PRESETS: 'resize-panel-custom-presets',
  USAGE_STATS: 'resize-panel-usage-stats'
} as const;

// Preset search and filtering
export const searchPresets = (presets: PresetSize[], query: string): PresetSize[] => {
  if (!query.trim()) return presets;
  
  const searchTerm = query.toLowerCase().trim();
  
  return presets.filter(preset => 
    preset.name.toLowerCase().includes(searchTerm) ||
    preset.category.toLowerCase().includes(searchTerm) ||
    preset.platform?.toLowerCase().includes(searchTerm) ||
    preset.format?.toLowerCase().includes(searchTerm) ||
    preset.type?.toLowerCase().includes(searchTerm) ||
    preset.device?.toLowerCase().includes(searchTerm) ||
    `${preset.width}x${preset.height}`.includes(searchTerm) ||
    `${preset.width} × ${preset.height}`.includes(searchTerm)
  );
};

// Favorites management
export const getFavoritePresets = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

export const saveFavoritePresets = (favorites: Set<string>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([...favorites]));
  } catch (error) {
    console.warn('Failed to save favorite presets:', error);
  }
};

export const togglePresetFavorite = (presetKey: string): Set<string> => {
  const favorites = getFavoritePresets();
  
  if (favorites.has(presetKey)) {
    favorites.delete(presetKey);
  } else {
    favorites.add(presetKey);
  }
  
  saveFavoritePresets(favorites);
  return favorites;
};

// Recent sizes management
export const getRecentSizes = (): RecentSize[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENT_SIZES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addRecentSize = (size: Omit<RecentSize, 'timestamp'>): RecentSize[] => {
  const recent = getRecentSizes();
  const newSize: RecentSize = { ...size, timestamp: Date.now() };
  
  // Remove existing entry with same dimensions
  const filtered = recent.filter(r => !(r.width === size.width && r.height === size.height));
  
  // Add to beginning and limit to 10 items
  const updated = [newSize, ...filtered].slice(0, 10);
  
  try {
    localStorage.setItem(STORAGE_KEYS.RECENT_SIZES, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save recent size:', error);
  }
  
  return updated;
};

// Custom presets management
export const getCustomPresets = (): CustomPreset[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRESETS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCustomPreset = (preset: Omit<CustomPreset, 'id' | 'createdAt'>): CustomPreset => {
  const customPresets = getCustomPresets();
  const newPreset: CustomPreset = {
    ...preset,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now()
  };
  
  const updated = [...customPresets, newPreset];
  
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PRESETS, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save custom preset:', error);
  }
  
  return newPreset;
};

export const deleteCustomPreset = (presetId: string): CustomPreset[] => {
  const customPresets = getCustomPresets();
  const updated = customPresets.filter(p => p.id !== presetId);
  
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PRESETS, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to delete custom preset:', error);
  }
  
  return updated;
};

// Usage statistics
export const getUsageStats = (): Map<string, number> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USAGE_STATS);
    return stored ? new Map(JSON.parse(stored)) : new Map();
  } catch {
    return new Map();
  }
};

export const incrementPresetUsage = (presetKey: string): Map<string, number> => {
  const stats = getUsageStats();
  const currentCount = stats.get(presetKey) || 0;
  stats.set(presetKey, currentCount + 1);
  
  try {
    localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify([...stats]));
  } catch (error) {
    console.warn('Failed to save usage stats:', error);
  }
  
  return stats;
};

export const getMostUsedPresets = (limit: number = 5): Array<{key: string, count: number}> => {
  const stats = getUsageStats();
  return [...stats.entries()]
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
};

// Utility functions
export const createPresetKey = (preset: PresetSize): string => {
  return `${preset.category}-${preset.name}-${preset.width}x${preset.height}`;
};

export const findPresetByKey = (key: string, presetSizes: PresetSize[]): PresetSize | undefined => {
  return presetSizes.find(preset => createPresetKey(preset) === key);
};

export const estimateFileSize = (width: number, height: number, format: string = 'PNG'): string => {
  const pixels = width * height;
  let bytesPerPixel = 4; // Default RGBA
  
  // Adjust for different formats
  switch (format.toUpperCase()) {
    case 'JPEG':
    case 'JPG':
      bytesPerPixel = 3; // RGB, compressed
      break;
    case 'PNG':
      bytesPerPixel = 4; // RGBA
      break;
    case 'SVG':
      // SVG is vector, much smaller
      return '< 100KB';
    case 'WEBP':
      bytesPerPixel = 2.5; // Better compression
      break;
  }
  
  const bytes = pixels * bytesPerPixel;
  
  if (bytes < 1024) {
    return `~${Math.round(bytes)}B`;
  } else if (bytes < 1024 * 1024) {
    return `~${Math.round(bytes / 1024)}KB`;
  } else {
    return `~${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
};

export const getOptimalFormat = (width: number, height: number): string => {
  const pixels = width * height;
  
  if (pixels > 4000000) { // > 4MP
    return 'JPEG'; // Better compression for large images
  } else if (pixels < 100000) { // < 0.1MP
    return 'PNG'; // Better quality for small images/icons
  } else {
    return 'WEBP'; // Best balance for medium images
  }
};

export const getAspectRatioName = (width: number, height: number): string => {
  const ratio = width / height;
  const roundedRatio = Math.round(ratio * 100) / 100;
  
  // Common aspect ratios
  const ratios = {
    '1.00': '1:1 (Square)',
    '1.33': '4:3 (Standard)',
    '1.78': '16:9 (Widescreen)',
    '2.39': '21:9 (Ultrawide)',
    '0.56': '9:16 (Vertical)',
    '0.75': '3:4 (Portrait)',
    '1.50': '3:2 (Photography)',
    '1.91': '1.91:1 (Facebook)',
    '2.00': '2:1 (Panoramic)'
  };
  
  // Find closest match
  let closest = '1.00';
  let minDiff = Math.abs(roundedRatio - 1.00);
  
  for (const [key, name] of Object.entries(ratios)) {
    const diff = Math.abs(roundedRatio - parseFloat(key));
    if (diff < minDiff) {
      minDiff = diff;
      closest = key;
    }
  }
  
  return ratios[closest] || `${roundedRatio.toFixed(2)}:1`;
};

export const suggestSimilarPresets = (currentPreset: PresetSize, presetSizes: PresetSize[], limit: number = 3): PresetSize[] => {
  const currentRatio = currentPreset.width / currentPreset.height;
  const currentArea = currentPreset.width * currentPreset.height;
  
  return presetSizes
    .filter(preset => preset.name !== currentPreset.name)
    .map(preset => ({
      preset,
      ratioScore: Math.abs((preset.width / preset.height) - currentRatio),
      areaScore: Math.abs((preset.width * preset.height) - currentArea) / currentArea,
      categoryScore: preset.category === currentPreset.category ? 0 : 1
    }))
    .sort((a, b) => {
      const scoreA = a.ratioScore + a.areaScore * 0.3 + a.categoryScore * 0.5;
      const scoreB = b.ratioScore + b.areaScore * 0.3 + b.categoryScore * 0.5;
      return scoreA - scoreB;
    })
    .slice(0, limit)
    .map(item => item.preset);
};