import { create } from 'zustand';
import * as api from '../services/api';

// Types
export interface User {
  id: string;
  openid: string;
  nickname: string;
  avatar_url: string;
  wallet_balance: number;
  membership_level: string;
  total_spend: number;
  created_at: string;
}

export interface LampType {
  id: number;
  name: string;
  name_en: string;
  icon: string;
  description: string;
  base_price: number;
  color: string;
  is_active: boolean;
  sort_order: number;
}

export interface TimePackage {
  id: number;
  name: string;
  minutes: number;
  original_price: number;
  discount_price: number;
  discount_rate: number;
  label: string;
  is_active: boolean;
  sort_order: number;
}

export interface PrayerWallItem {
  id: number;
  user_id: number;
  lamp_type_name: string;
  lamp_icon?: string;
  lamp_color?: string;
  prayer_text: string;
  prayer_target: string;
  is_anonymous: boolean;
  nickname: string;
  likes: number;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  lamp_type_id: number;
  package_id: number;
  amount: number;
  status: string;
  prayer_text: string;
  prayer_target: string;
  is_anonymous: boolean;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface ActiveLamp {
  id: number;
  order_id: number;
  lamp_type: LampType;
  package: TimePackage;
  prayer_text: string;
  prayer_target: string;
  is_anonymous: boolean;
  start_time: string;
  end_time: string;
  remaining_minutes: number;
}

export interface MembershipRule {
  level: string;
  name: string;
  price: number;
  discount_rate: number;
  max_lamps: number;
  perks: string;
}

export interface RechargePackage {
  id: number;
  amount: number;
  bonus: number;
  label: string;
}

// Store State Interface
interface AppState {
  // Data
  lampTypes: LampType[];
  timePackages: TimePackage[];
  membershipRules: MembershipRule[];
  rechargePackages: RechargePackage[];

  // User
  currentUser: User | null;
  isLoggedIn: boolean;

  // Lamp Selection
  selectedLamp: LampType | null;
  selectedPackage: TimePackage | null;
  prayerText: string;
  prayerTarget: string;
  isAnonymous: boolean;
  aiSuggestion: string;

  // Prayer Wall
  prayerWall: PrayerWallItem[];
  prayerStats: { today_count: number; total_likes: number; active_count: number };

  // Orders
  orders: Order[];
  activeLamps: ActiveLamp[];
  currentOrder: Order | null;

  // UI State
  currentPage: string;
  showPaymentModal: boolean;
  showSuccessModal: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadInitialData: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  login: (openid?: string) => Promise<void>;
  logout: () => void;
  selectLamp: (lamp: LampType) => void;
  selectPackage: (pkg: TimePackage) => void;
  setPrayerText: (text: string) => void;
  setPrayerTarget: (target: string) => void;
  setIsAnonymous: (anonymous: boolean) => void;
  generateAISuggestion: () => void;
  createOrder: () => Promise<Order | null>;
  payOrder: (paymentMethod?: string) => Promise<boolean>;
  createPayment: (orderId: string, paymentType?: string) => Promise<any>;
  checkPaymentStatus: (orderId: string) => Promise<boolean>;
  loadPrayerWall: () => Promise<void>;
  likePrayer: (id: number) => Promise<void>;
  recharge: (packageId: string) => Promise<void>;
  loadUserOrders: () => Promise<void>;
  loadActiveLamps: () => Promise<void>;
  setCurrentPage: (page: string) => void;
  setShowPaymentModal: (show: boolean) => void;
  setShowSuccessModal: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetSelection: () => void;
}

// AI祝福语生成
const generateBlessingText = (lampType: string, target: string): string => {
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

// Mock prayer wall for demo
const mockPrayerWall: PrayerWallItem[] = [
  {
    id: 1,
    user_id: 2,
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
    id: 2,
    user_id: 3,
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
    id: 3,
    user_id: 4,
    lamp_type_name: '财富灯',
    lamp_icon: '💰',
    lamp_color: '#27ae60',
    prayer_text: '愿生意兴隆，财源广进',
    prayer_target: '自己',
    is_anonymous: false,
    nickname: '福源',
    likes: 256,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

// Create Store
export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  lampTypes: [],
  timePackages: [],
  membershipRules: [],
  rechargePackages: [],
  currentUser: null,
  isLoggedIn: false,
  selectedLamp: null,
  selectedPackage: null,
  prayerText: '',
  prayerTarget: '自己',
  isAnonymous: false,
  aiSuggestion: '',
  prayerWall: mockPrayerWall,
  prayerStats: { today_count: 0, total_likes: 0, active_count: 0 },
  orders: [],
  activeLamps: [],
  currentOrder: null,
  currentPage: 'home',
  showPaymentModal: false,
  showSuccessModal: false,
  isLoading: false,
  error: null,

  // Actions
  loadInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      // 尝试从API获取数据
      const result = await api.getLampData();

      if (result.success && result.data) {
        set({
          lampTypes: result.data.lamps || [],
          timePackages: result.data.packages || [],
          membershipRules: result.data.membership || [],
          rechargePackages: result.data.recharge || []
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user, isLoggedIn: !!user }),

  login: async (openid?: string) => {
    set({ isLoading: true, error: null });
    try {
      // 使用openid或生成模拟ID
      const userOpenid = openid || `wx_${Date.now()}`;
      const result = await api.login(userOpenid);

      if (result.success && result.data) {
        set({
          currentUser: result.data,
          isLoggedIn: true
        });
        // 加载用户数据
        get().loadUserOrders();
        get().loadActiveLamps();
      } else {
        // 如果API失败，使用模拟登录
        const mockUser: User = {
          id: '1',
          openid: userOpenid,
          nickname: '善缘居士',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
          wallet_balance: 100.00,
          membership_level: 'normal',
          total_spend: 0,
          created_at: new Date().toISOString()
        };
        set({ currentUser: mockUser, isLoggedIn: true });
      }
    } catch (error) {
      // 模拟登录
      const mockUser: User = {
        id: '1',
        openid: `wx_${Date.now()}`,
        nickname: '善缘居士',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        wallet_balance: 100.00,
        membership_level: 'normal',
        total_spend: 0,
        created_at: new Date().toISOString()
      };
      set({ currentUser: mockUser, isLoggedIn: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => set({ currentUser: null, isLoggedIn: false }),

  selectLamp: (lamp) => set({ selectedLamp: lamp }),

  selectPackage: (pkg) => set({ selectedPackage: pkg }),

  setPrayerText: (text) => set({ prayerText: text }),

  setPrayerTarget: (target) => set({ prayerTarget: target }),

  setIsAnonymous: (anonymous) => set({ isAnonymous: anonymous }),

  generateAISuggestion: () => {
    const { selectedLamp, prayerTarget } = get();
    if (selectedLamp) {
      const suggestion = generateBlessingText(selectedLamp.name, prayerTarget);
      set({ aiSuggestion: suggestion });
    }
  },

  createOrder: async () => {
    const { currentUser, selectedLamp, selectedPackage, prayerText, prayerTarget, isAnonymous } = get();

    if (!currentUser || !selectedLamp || !selectedPackage) return null;

    try {
      const result = await api.createOrder(
        String(currentUser.id),
        String(selectedLamp.id),
        String(selectedPackage.id),
        prayerText,
        prayerTarget,
        isAnonymous
      );

      if (result.success && result.data) {
        set({ currentOrder: result.data });
        return result.data;
      }
    } catch (error) {
      console.error('创建订单失败:', error);
    }

    // 模拟订单
    const mockOrder: Order = {
      id: Date.now(),
      user_id: Number(currentUser.id),
      lamp_type_id: selectedLamp.id,
      package_id: selectedPackage.id,
      amount: selectedPackage.discount_price || selectedPackage.original_price,
      status: 'pending',
      prayer_text: prayerText,
      prayer_target: prayerTarget,
      is_anonymous: isAnonymous,
      start_time: '',
      end_time: '',
      created_at: new Date().toISOString()
    };

    set({ currentOrder: mockOrder });
    return mockOrder;
  },

  payOrder: async (paymentMethod: string = 'balance') => {
    const { currentUser, currentOrder, selectedLamp, selectedPackage, prayerText, prayerTarget, isAnonymous } = get();

    if (!currentUser || !currentOrder) return false;

    try {
      const result = await api.payOrder(
        String(currentOrder.id),
        String(currentUser.id),
        paymentMethod
      );

      if (result.success) {
        // 添加到祈福墙
        const newPrayer: PrayerWallItem = {
          id: Date.now(),
          user_id: Number(currentUser.id),
          lamp_type_name: selectedLamp?.name || '',
          lamp_icon: selectedLamp?.icon,
          lamp_color: selectedLamp?.color,
          prayer_text: prayerText,
          prayer_target: prayerTarget,
          is_anonymous: isAnonymous,
          nickname: isAnonymous ? '匿名' : currentUser.nickname,
          likes: 0,
          created_at: new Date().toISOString()
        };

        set((state) => ({
          prayerWall: [newPrayer, ...state.prayerWall],
          currentUser: state.currentUser ? {
            ...state.currentUser,
            wallet_balance: state.currentUser.wallet_balance - (currentOrder?.amount || 0)
          } : null,
          showPaymentModal: false,
          showSuccessModal: true
        }));

        return true;
      }
    } catch (error) {
      console.error('支付失败:', error);
    }

    // 模拟支付成功
    const newPrayer: PrayerWallItem = {
      id: Date.now(),
      user_id: Number(currentUser.id),
      lamp_type_name: selectedLamp?.name || '',
      lamp_icon: selectedLamp?.icon,
      lamp_color: selectedLamp?.color,
      prayer_text: prayerText,
      prayer_target: prayerTarget,
      is_anonymous: isAnonymous,
      nickname: isAnonymous ? '匿名' : currentUser.nickname,
      likes: 0,
      created_at: new Date().toISOString()
    };

    set((state) => ({
      prayerWall: [newPrayer, ...state.prayerWall],
      currentUser: state.currentUser ? {
        ...state.currentUser,
        wallet_balance: state.currentUser.wallet_balance - (currentOrder?.amount || 0)
      } : null,
      showPaymentModal: false,
      showSuccessModal: true
    }));

    return true;
  },

  // 创建二维码支付
  createPayment: async (orderId: string, paymentType: string = 'unified') => {
    const { currentUser } = get();
    if (!currentUser) return null;

    try {
      const result = await api.createPayment(orderId, String(currentUser.id), paymentType);
      return result;
    } catch (error) {
      console.error('创建支付失败:', error);
      return null;
    }
  },

  // 检查支付状态
  checkPaymentStatus: async (orderId: string) => {
    try {
      const result = await api.checkPaymentStatus(orderId);
      return result;
    } catch (error) {
      console.error('检查支付状态失败:', error);
      return false;
    }
  },

  loadPrayerWall: async () => {
    try {
      const result = await api.getPrayerWallData();
      if (result.success) {
        set({
          prayerWall: result.data || mockPrayerWall,
          prayerStats: result.stats || { today_count: 0, total_likes: 0, active_count: 0 }
        });
      }
    } catch (error) {
      // 使用mock数据
    }
  },

  likePrayer: async (id: number) => {
    try {
      await api.likePrayer(String(id));
    } catch (error) {}

    set((state) => ({
      prayerWall: state.prayerWall.map(item =>
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      )
    }));
  },

  recharge: async (packageId: string) => {
    const { currentUser, rechargePackages } = get();
    if (!currentUser) return;

    const pkg = rechargePackages.find(p => String(p.id) === packageId);
    if (!pkg) return;

    try {
      const result = await api.recharge(String(currentUser.id), packageId, pkg.amount);
      if (result.success && result.data) {
        set({ currentUser: result.data });
      }
    } catch (error) {
      // 模拟充值
      set({
        currentUser: {
          ...currentUser,
          wallet_balance: currentUser.wallet_balance + pkg.amount + pkg.bonus
        }
      });
    }
  },

  loadUserOrders: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const result = await api.getUserOrders(String(currentUser.id));
      if (result.success) {
        set({ orders: result.data || [] });
      }
    } catch (error) {}
  },

  loadActiveLamps: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const result = await api.getActiveLamps(String(currentUser.id));
      if (result.success) {
        set({ activeLamps: result.data || [] });
      }
    } catch (error) {}
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
    // 切换页面时加载数据
    if (page === 'prayer-wall') {
      get().loadPrayerWall();
    }
  },

  setShowPaymentModal: (show) => set({ showPaymentModal: show }),

  setShowSuccessModal: (show) => set({ showSuccessModal: show }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  resetSelection: () => set({
    selectedLamp: null,
    selectedPackage: null,
    prayerText: '',
    prayerTarget: '自己',
    isAnonymous: false,
    aiSuggestion: '',
    currentOrder: null
  })
}));

// Selectors
export const useCurrentUser = () => useAppStore((state) => state.currentUser);
export const useSelectedLamp = () => useAppStore((state) => state.selectedLamp);
export const useSelectedPackage = () => useAppStore((state) => state.selectedPackage);
export const usePrayerWall = () => useAppStore((state) => state.prayerWall);
export const useActiveLamps = () => useAppStore((state) => state.activeLamps);
export const useOrders = () => useAppStore((state) => state.orders);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useLampTypes = () => useAppStore((state) => state.lampTypes);
export const useTimePackages = () => useAppStore((state) => state.timePackages);
export const useMembershipRules = () => useAppStore((state) => state.membershipRules);
export const useRechargePackages = () => useAppStore((state) => state.rechargePackages);
