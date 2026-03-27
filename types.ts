export type DesignType = 'Star' | 'Flap' | 'Ripple';

export interface WallConfig {
  design: DesignType;
  gridX: number;
  gridY: number;
  size: number;
  gap: number;
  speed: number;
  phaseOffset: number;
  maxHeight: number;
  manualProgress: number;
  isPaused: boolean;
  metalness: number;
  roughness: number;
  baseColor: string;
}

export interface ModuleProps {
  x: number;
  y: number;
  totalX: number;
  totalY: number;
  config: WallConfig;
}
