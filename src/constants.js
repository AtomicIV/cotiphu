export const BOARD_SIZE = 7; // A 7x7 grid (24 tiles total along the perimeter)

export const TILES = [
    { id: 0, name: 'Bắt Đầu', type: 'start', color: '#ffeb3b', basePrice: 0, rent: 0, icon: '🏁' },
    { id: 1, name: 'Hà Nội', type: 'property', color: '#8bc34a', basePrice: 100, rent: 10, icon: '🏙️' },
    { id: 2, name: 'Cơ Hội', type: 'chance', color: '#03a9f4', basePrice: 0, rent: 0, icon: '🎁' },
    { id: 3, name: 'Hải Phòng', type: 'property', color: '#8bc34a', basePrice: 120, rent: 12, icon: '⚓' },
    { id: 4, name: 'Thuế', type: 'tax', color: '#f44336', basePrice: 200, rent: 0, icon: '💸' },
    { id: 5, name: 'Quảng Ninh', type: 'property', color: '#8bc34a', basePrice: 150, rent: 15, icon: '⛰️' },
    { id: 6, name: 'Nhà Tù', type: 'jail', color: '#9e9e9e', basePrice: 0, rent: 0, icon: '🏢' },
    { id: 7, name: 'Đà Nẵng', type: 'property', color: '#e91e63', basePrice: 200, rent: 20, icon: '🌉' },
    { id: 8, name: 'Khí Vận', type: 'chest', color: '#ff9800', basePrice: 0, rent: 0, icon: '🍀' },
    { id: 9, name: 'Hội An', type: 'property', color: '#e91e63', basePrice: 220, rent: 22, icon: '🏮' },
    { id: 10, name: 'Nha Trang', type: 'property', color: '#e91e63', basePrice: 240, rent: 24, icon: '🏖️' },
    { id: 11, name: 'Đà Lạt', type: 'property', color: '#e91e63', basePrice: 260, rent: 26, icon: '🌲' },
    { id: 12, name: 'Bến Xe', type: 'parking', color: '#795548', basePrice: 0, rent: 0, icon: '🅿️' },
    { id: 13, name: 'Vũng Tàu', type: 'property', color: '#9c27b0', basePrice: 300, rent: 30, icon: '🚢' },
    { id: 14, name: 'Cơ Hội', type: 'chance', color: '#03a9f4', basePrice: 0, rent: 0, icon: '🎁' },
    { id: 15, name: 'Đồng Nai', type: 'property', color: '#9c27b0', basePrice: 320, rent: 32, icon: '🏭' },
    { id: 16, name: 'Bình Dương', type: 'property', color: '#9c27b0', basePrice: 350, rent: 35, icon: '🏗️' },
    { id: 17, name: 'Sân Bay', type: 'station', color: '#607d8b', basePrice: 200, rent: 25, icon: '✈️' },
    { id: 18, name: 'Đi Tù', type: 'gojail', color: '#3f51b5', basePrice: 0, rent: 0, icon: '🚓' },
    { id: 19, name: 'TpHCM', type: 'property', color: '#009688', basePrice: 400, rent: 40, icon: '🌃' },
    { id: 20, name: 'Thuế VIP', type: 'tax', color: '#f44336', basePrice: 300, rent: 0, icon: '💰' },
    { id: 21, name: 'Cần Thơ', type: 'property', color: '#009688', basePrice: 450, rent: 45, icon: '🚤' },
    { id: 22, name: 'Khí Vận', type: 'chest', color: '#ff9800', basePrice: 0, rent: 0, icon: '🍀' },
    { id: 23, name: 'Phú Quốc', type: 'property', color: '#009688', basePrice: 500, rent: 50, icon: '🏝️' }
];

export const GAME_CONFIG = {
    startingMoney: 1500,
    goBonus: 200,
    botBuyChance: 0.8
};

// Colors for default players (up to 12)
export const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e', '#e84393', '#fdcb6e', '#00b894', '#d63031'];
export const PLAYER_ICONS = ['😀', '🤖', '🐶', '🐱', '🦊', '🐼', '🐯', '🐸', '🦁', '🐻', '🐰', '🦄'];

// Helper to get 3D coordinates based on board index (24 tiles around 7x7 grid)
export function getTileCoordinates(index) {
  const size = BOARD_SIZE;
  const tileSpacing = 2.5;
  const offset = ((size - 1) * tileSpacing) / 2;
  
  let x = 0;
  let z = 0;
  
  // Maps 0-23 to a square perimeter wrapping clockwise from bottom right
  if (index >= 0 && index < 6) {
    // Bottom edge (right to left)
    x = offset - index * tileSpacing;
    z = offset;
  } else if (index >= 6 && index < 12) {
    // Left edge (bottom to top)
    x = -offset;
    z = offset - (index - 6) * tileSpacing;
  } else if (index >= 12 && index < 18) {
    // Top edge (left to right)
    x = -offset + (index - 12) * tileSpacing;
    z = -offset;
  } else if (index >= 18 && index < 24) {
    // Right edge (top to bottom)
    x = offset;
    z = -offset + (index - 18) * tileSpacing;
  }
  
  return [x, 0, z];
}
