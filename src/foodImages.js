// Food Images for Friends Fast Food Menu
export const foodImages = {
  'Bariis': 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=300&h=300&fit=crop',
  'Baris saldato': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=300&fit=crop',
  'Baasto': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=300&h=300&fit=crop',
  'Baasto saldato': 'https://images.unsplash.com/photo-1645112411342-4665a10c6a3a?w=300&h=300&fit=crop',
  'Haaf suqaar': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=300&fit=crop',
  'Saxan suqaar': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=300&fit=crop',
  'Chicken Broosto': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=300&fit=crop',
  'Friends chicken afarxabo': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop',
  'Shuwarmo': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=300&fit=crop',
  'Chicken burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop',
  'Smoothei': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&h=300&fit=crop',
  'Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop',
  'Shaah': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=300&h=300&fit=crop',
  'Faxam': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop',
  'Shuweeyo': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=300&fit=crop',
  'Sanbuus': 'https://images.unsplash.com/photo-1625938144748-8c6fb3d3b013?w=300&h=300&fit=crop',
  'Ice cofee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=300&fit=crop',
};

export const getFoodImage = (itemName) => {
  return foodImages[itemName] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop';
};
