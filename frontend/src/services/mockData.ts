// 模拟数据服务 - 模拟后端API
// Lamp Types - 灯型数据
export const lampTypes = [
  {
    id: '1',
    name: '酥油灯',
    name_en: 'Ghee Lamp',
    icon: '🪔',
    description: '传统供养，象征虔诚之心，点亮智慧光明',
    base_price: 0.0001,
    color: '#d4a550',
    is_active: true,
    sort_order: 1
  },
  {
    id: '2',
    name: '平安灯',
    name_en: 'Peace Lamp',
    icon: '🏮',
    description: '消灾免难，健康平安，护佑家宅安宁',
    base_price: 0.0001,
    color: '#e74c3c',
    is_active: true,
    sort_order: 2
  },
  {
    id: '3',
    name: '智慧灯',
    name_en: 'Wisdom Lamp',
    icon: '💡',
    description: '启迪智慧，学业事业，金榜题名',
    base_price: 0.0001,
    color: '#3498db',
    is_active: true,
    sort_order: 3
  },
  {
    id: '4',
    name: '功德灯',
    name_en: 'Merit Lamp',
    icon: '✨',
    description: '累积功德，福泽深厚，回向众生',
    base_price: 0.0002,
    color: '#f39c12',
    is_active: true,
    sort_order: 4
  },
  {
    id: '5',
    name: '长寿灯',
    name_en: 'Longevity Lamp',
    icon: '🌸',
    description: '健康长寿，福寿安康，延年益寿',
    base_price: 0.0002,
    color: '#e91e63',
    is_active: true,
    sort_order: 5
  },
  {
    id: '6',
    name: '财富灯',
    name_en: 'Wealth Lamp',
    icon: '💰',
    description: '财源广进，富贵吉祥，生意兴隆',
    base_price: 0.0002,
    color: '#27ae60',
    is_active: true,
    sort_order: 6
  }
];

// Time Packages - 时长套餐数据
export const timePackages = [
  {
    id: '1',
    name: '体验祈福',
    minutes: 60,
    original_price: 0.36,
    discount_price: 0.36,
    discount_rate: 1.00,
    label: '体验',
    is_active: true,
    sort_order: 1
  },
  {
    id: '2',
    name: '一日虔心',
    minutes: 1440,
    original_price: 8.64,
    discount_price: 5.18,
    discount_rate: 0.60,
    label: '6折',
    is_active: true,
    sort_order: 2
  },
  {
    id: '3',
    name: '七日修行',
    minutes: 10080,
    original_price: 60.48,
    discount_price: 36.29,
    discount_rate: 0.60,
    label: '6折',
    is_active: true,
    sort_order: 3
  },
  {
    id: '4',
    name: '月度供奉',
    minutes: 43200,
    original_price: 259.20,
    discount_price: 155.52,
    discount_rate: 0.60,
    label: '6折',
    is_active: true,
    sort_order: 4
  },
  {
    id: '5',
    name: '年度功德',
    minutes: 525600,
    original_price: 3153.60,
    discount_price: 1892.16,
    discount_rate: 0.60,
    label: '6折',
    is_active: true,
    sort_order: 5
  },
  {
    id: '6',
    name: '终生光明',
    minutes: 5256000,
    original_price: 31536.00,
    discount_price: 15768.00,
    discount_rate: 0.50,
    label: '5折',
    is_active: true,
    sort_order: 6
  }
];

// Membership Rules - 会员规则
export const membershipRules = [
  {
    level: 'normal',
    name: '普通用户',
    price: 0,
    discount_rate: 1.00,
    max_lamps: 1,
    perks: '基础祈福'
  },
  {
    level: 'monthly',
    name: '月度会员',
    price: 30,
    discount_rate: 0.80,
    max_lamps: 1,
    perks: '无限点1盏基础灯|所有灯型8折|专属祈福位置'
  },
  {
    level: 'yearly',
    name: '年度功德主',
    price: 300,
    discount_rate: 0.60,
    max_lamps: 2,
    perks: '无限点2盏任意灯|所有灯型6折|每日诵经回向|专属客服'
  }
];

// Recharge Packages - 充值套餐
export const rechargePackages = [
  { id: '1', amount: 30, bonus: 3, label: '充30送3' },
  { id: '2', amount: 100, bonus: 15, label: '充100送15' },
  { id: '3', amount: 500, bonus: 100, label: '充500送100' },
  { id: '4', amount: 1000, bonus: 250, label: '充1000送250' }
];

// Mock Users - 模拟用户数据
export const mockUsers = [
  {
    id: 'user1',
    openid: 'wx_openid_001',
    nickname: '善缘居士',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    wallet_balance: 100.00,
    membership_level: 'normal',
    total_spend: 50.00,
    created_at: '2024-01-15T10:00:00Z'
  }
];

// Mock Prayer Wall - 模拟祈福墙数据
export const mockPrayerWall = [
  {
    id: 'pw1',
    user_id: 'user2',
    lamp_type_name: '酥油灯',
    lamp_icon: '🪔',
    lamp_color: '#d4a550',
    prayer_text: '愿家人平安健康，诸事顺遂',
    prayer_target: '家人',
    is_anonymous: false,
    nickname: '明心',
    likes: 128,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: 'pw2',
    user_id: 'user3',
    lamp_type_name: '智慧灯',
    lamp_icon: '💡',
    lamp_color: '#3498db',
    prayer_text: '愿孩子学业进步，金榜题名',
    prayer_target: '孩子',
    is_anonymous: true,
    nickname: '匿名',
    likes: 89,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 'pw3',
    user_id: 'user4',
    lamp_type_name: '财富灯',
    lamp_icon: '💰',
    lamp_color: '#27ae60',
    prayer_text: '愿生意兴隆，财源广进',
    prayer_target: '自己',
    is_anonymous: false,
    nickname: '福源',
    likes: 256,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'pw4',
    user_id: 'user5',
    lamp_type_name: '平安灯',
    lamp_icon: '🏮',
    lamp_color: '#e74c3c',
    prayer_text: '愿父母健康长寿，福寿安康',
    prayer_target: '父母',
    is_anonymous: false,
    nickname: '孝子',
    likes: 312,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'pw5',
    user_id: 'user6',
    lamp_type_name: '功德灯',
    lamp_icon: '✨',
    lamp_color: '#f39c12',
    prayer_text: '回向法界众生，愿成正觉',
    prayer_target: '众生',
    is_anonymous: true,
    nickname: '匿名',
    likes: 178,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  }
];

// AI祝福语生成
export const generateBlessingText = (lampType: string, target: string): string => {
  const blessings: Record<string, string[]> = {
    '酥油灯': [
      `诚心点燃酥油灯，愿${target}智慧光明，业障消除，福德圆满`,
      `以此酥油灯供养功德，愿${target}心灯常明，前路一片光明`,
      `点燃酥油灯，照亮${target}的修行之路，愿成正果`
    ],
    '平安灯': [
      `点燃平安灯，愿${target}消灾解难，岁岁平安，健康长寿`,
      `以此平安灯祈福，愿${target}家宅安宁，诸事顺遂，灾祸远离`,
      `平安灯高照，愿${target}出入平安，一切吉祥如意`
    ],
    '智慧灯': [
      `点燃智慧灯，愿${target}开启智慧，金榜题名，学业有成`,
      `以此智慧灯供养，愿${target}慧根深厚，辩才无碍`,
      `智慧灯照破无明，愿${target}学业进步，事业腾飞`
    ],
    '功德灯': [
      `点燃功德灯，愿${target}累积功德，福泽深厚，利益众生`,
      `以此功德灯回向，愿${target}福报圆满，功德无量`,
      `功德灯照亮菩提路，愿${target}早证菩提`
    ],
    '长寿灯': [
      `点燃长寿灯，愿${target}健康长寿，福寿安康，延年益寿`,
      `以此长寿灯祈福，愿${target}色身康健，长命百岁`,
      `长寿灯照破病魔，愿${target}身心安乐，长寿吉祥`
    ],
    '财富灯': [
      `点燃财富灯，愿${target}财源广进，生意兴隆，富甲天下`,
      `以此财富灯祈福，愿${target}金银满库，富贵吉祥`,
      `财富灯照亮财路，愿${target}事业发达，财运亨通`
    ]
  };

  const lampBlessings = blessings[lampType] || blessings['酥油灯'];
  return lampBlessings[Math.floor(Math.random() * lampBlessings.length)];
};

// 计算价格
export const calculatePrice = (
  lampTypeId: string,
  packageId: string,
  membershipLevel: string = 'normal'
): number => {
  const lamp = lampTypes.find(l => l.id === lampTypeId);
  const pkg = timePackages.find(p => p.id === packageId);
  const membership = membershipRules.find(m => m.level === membershipLevel);

  if (!lamp || !pkg) return 0;

  const basePrice = lamp.base_price * pkg.minutes;
  const withPackageDiscount = basePrice * pkg.discount_rate;
  const finalPrice = withPackageDiscount * (membership?.discount_rate || 1);

  return Math.round(finalPrice * 100) / 100;
};

// 格式化时间
export const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时`;
  if (minutes < 525600) return `${Math.floor(minutes / 1440)}天`;
  return `${Math.floor(minutes / 525600)}年`;
};

// 相对时间格式化
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
};
