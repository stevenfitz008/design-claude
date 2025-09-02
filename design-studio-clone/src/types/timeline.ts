// Timeline and animation system types

export interface Timeline {
  id: string;
  name: string;
  duration: number; // in milliseconds
  fps: number; // frames per second
  tracks: TimelineTrack[];
  isPlaying: boolean;
  currentTime: number;
  loop: boolean;
  autoplay: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  elementId: string;
  visible: boolean;
  locked: boolean;
  color?: string;
  keyframes: Keyframe[];
  order: number;
}

export interface Keyframe {
  id: string;
  time: number; // in milliseconds
  properties: AnimatableProperties;
  easing: EasingType;
  interpolation: InterpolationType;
}

export interface AnimatableProperties {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  // Text-specific properties
  fontSize?: number;
  color?: string;
  letterSpacing?: number;
  // Image-specific properties
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  // Shape-specific properties
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export type EasingType = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-sine'
  | 'ease-out-sine'
  | 'ease-in-out-sine'
  | 'ease-in-quad'
  | 'ease-out-quad'
  | 'ease-in-out-quad'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'ease-in-quart'
  | 'ease-out-quart'
  | 'ease-in-out-quart'
  | 'ease-in-quint'
  | 'ease-out-quint'
  | 'ease-in-out-quint'
  | 'ease-in-expo'
  | 'ease-out-expo'
  | 'ease-in-out-expo'
  | 'ease-in-circ'
  | 'ease-out-circ'
  | 'ease-in-out-circ'
  | 'ease-in-back'
  | 'ease-out-back'
  | 'ease-in-out-back'
  | 'ease-in-elastic'
  | 'ease-out-elastic'
  | 'ease-in-out-elastic'
  | 'ease-in-bounce'
  | 'ease-out-bounce'
  | 'ease-in-out-bounce';

export type InterpolationType = 'linear' | 'discrete' | 'bezier';

export interface TimelineState {
  activeTimeline?: string;
  timelines: Timeline[];
  playbackState: PlaybackState;
  selectedTracks: string[];
  selectedKeyframes: string[];
  clipboard: Keyframe[];
  snapSettings: SnapSettings;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number; // 0.5, 1, 1.5, 2x speed
  lastUpdateTime: number;
  frameRate: number;
}

export interface SnapSettings {
  snapToKeyframes: boolean;
  snapToGrid: boolean;
  gridInterval: number; // in milliseconds
  snapTolerance: number;
}

// Animation presets and effects
export interface AnimationPreset {
  id: string;
  name: string;
  category: AnimationCategory;
  duration: number;
  keyframes: Keyframe[];
  preview?: string;
  icon: string;
}

export type AnimationCategory = 
  | 'entrance'
  | 'exit' 
  | 'emphasis'
  | 'motion'
  | 'zoom'
  | 'rotate'
  | 'fade'
  | 'slide'
  | 'bounce'
  | 'elastic'
  | 'custom';

export interface AnimationEffect {
  id: string;
  name: string;
  type: 'entrance' | 'exit' | 'emphasis' | 'path';
  duration: number;
  delay: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';
  easing: EasingType;
  properties: AnimatableProperties;
}

// Timeline UI and controls
export interface TimelineControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleLoop: () => void;
  addKeyframe: (trackId: string, time: number, properties: AnimatableProperties) => void;
  removeKeyframe: (keyframeId: string) => void;
  moveKeyframe: (keyframeId: string, newTime: number) => void;
  updateKeyframe: (keyframeId: string, properties: Partial<Keyframe>) => void;
}

export interface TimelineViewport {
  startTime: number;
  endTime: number;
  zoom: number;
  trackHeight: number;
  timelineWidth: number;
  pixelsPerSecond: number;
}

// Export formats for animations
export interface AnimationExport {
  format: 'gif' | 'mp4' | 'webm' | 'apng' | 'lottie';
  quality: number;
  fps: number;
  width: number;
  height: number;
  duration?: number;
  loop?: boolean;
}

export interface GifExportOptions extends AnimationExport {
  format: 'gif';
  dithering: boolean;
  colors: number; // 2-256
}

export interface VideoExportOptions extends AnimationExport {
  format: 'mp4' | 'webm';
  bitrate: number;
  codec: 'h264' | 'vp9' | 'av1';
}

export interface LottieExportOptions extends AnimationExport {
  format: 'lottie';
  compression: boolean;
  assets: 'embed' | 'external';
}

// Timeline events and callbacks
export interface TimelineEvents {
  onTimelinePlay: (timeline: Timeline) => void;
  onTimelinePause: (timeline: Timeline) => void;
  onTimelineStop: (timeline: Timeline) => void;
  onTimeUpdate: (currentTime: number) => void;
  onKeyframeAdd: (keyframe: Keyframe) => void;
  onKeyframeRemove: (keyframeId: string) => void;
  onKeyframeUpdate: (keyframe: Keyframe) => void;
  onTrackAdd: (track: TimelineTrack) => void;
  onTrackRemove: (trackId: string) => void;
  onTrackReorder: (trackId: string, newOrder: number) => void;
}

// Utility types
export interface TimelineUtils {
  millisecondsToFrames: (ms: number, fps: number) => number;
  framesToMilliseconds: (frames: number, fps: number) => number;
  timeToPixels: (time: number, pixelsPerSecond: number) => number;
  pixelsToTime: (pixels: number, pixelsPerSecond: number) => number;
  interpolateValues: (startValue: number, endValue: number, progress: number, easing: EasingType) => number;
  getKeyframeAtTime: (track: TimelineTrack, time: number) => Keyframe | null;
  getInterpolatedProperties: (track: TimelineTrack, time: number) => AnimatableProperties;
}