// The Marlowe Heist — tuning and look. One place for every number that
// shapes how the game feels, so balance tweaks never touch game logic.
export const TILE = 40;
export const VIEW_W = 960;
export const VIEW_H = 600;
export const HUD_H = 64;

export const PLAYER = {
  radius: 13,
  walkSpeed: 175,
  sneakSpeed: 98,
  // Detection fills faster when the thief is close, upright and moving.
  // Sneaking halves the rate; standing still in a cone halves it again.
  baseSeeRate: 1.15,
  sneakSeeFactor: 0.45,
  stillSeeFactor: 0.55,
};

export const ALARM = {
  max: 100,
  // Alarm climbs while anyone has eyes on the thief, and drains while hidden.
  risePerSecond: 26,
  decayPerSecond: 9,
  // Guards start hunting once the alarm passes this line.
  huntAt: 55,
  // Guards grow suspicious (and drift toward the thief) past this line.
  suspiciousAt: 28,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 62,
  chaseSpeed: 128,
  investigateSpeed: 92,
  // Vision cone: how far a guard sees, and how wide the cone is.
  viewRange: 215,
  halfAngle: 0.62, // radians, about 35 degrees each side
  // A guard's suspicion (0..1) rises while the thief is in the cone.
  seeRise: 1.6,
  seeFall: 0.8,
  pauseAtWaypoint: 1.4,
};

export const CAMERA = {
  viewRange: 235,
  halfAngle: 0.5,
  sweepSpeed: 0.55, // radians per second of the sweeping mount
  seeRise: 1.35,
  seeFall: 0.7,
};

export const TOOLS = {
  smoke: { start: 3, radius: 95, seconds: 5 },
  emp: { start: 2, radius: 270, seconds: 6 },
  coin: { start: 3, throwDistance: 190, lureRadius: 320, seconds: 6 },
};

export const SCORE = {
  diamond: 5000,
  painting: 800,
  gold: 1200,
  vase: 600,
  timeBonusPerSecond: 15,
  alarmPenalty: 250,
};

export const COLORS = {
  floorA: '#2b2620',
  floorB: '#26211c',
  carpet: '#5a2e35',
  carpetEdge: '#7a3f47',
  wall: '#17130f',
  wallTop: '#4a3b2c',
  crate: '#6b4a26',
  crateEdge: '#8a6238',
  caseGlass: '#3d6f8e',
  caseFrame: '#9a7b2d',
  plant: '#2f6b34',
  plantPot: '#7a4a28',
  rope: '#8e2f3c',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 150, 50, 0.30)',
  coneAlert: 'rgba(255, 60, 50, 0.34)',
  coneEdgeCalm: 'rgba(255, 214, 90, 0.45)',
  coneEdgeAlert: 'rgba(255, 70, 60, 0.6)',
  guardBody: '#3f5a78',
  guardAlert: '#a33327',
  cameraBody: '#20262c',
  cameraLens: '#ff5a4a',
  player: '#e8c15a',
  playerCoat: '#274b63',
  diamond: '#7fe7ff',
  gold: '#f2c14e',
  exit: '#3fae6a',
  exitLocked: '#8e2f3c',
  smoke: 'rgba(200, 205, 215, 0.55)',
  hudBg: '#14100c',
  hudText: '#e8ddc4',
  hudDim: '#9a8d74',
};

export const STORY = {
  title: 'THE MARLOWE HEIST',
  thief: 'Wren',
  target: 'the Sunspire Diamond',
  gallery: 'the Marlowe Gallery',
};
