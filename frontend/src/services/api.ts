// API服务层 - 连接PHP后端

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  [key: string]: any;
}

// 通用请求方法
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络请求失败'
    };
  }
}

// ============ 灯型API ============

// 获取灯型列表
export async function getLamps() {
  return request('lamp.php?action=get-lamps');
}

// 获取套餐列表
export async function getPackages() {
  return request('lamp.php?action=get-packages');
}

// 获取会员规则
export async function getMembership() {
  return request('lamp.php?action=get-membership');
}

// 获取充值套餐
export async function getRechargePackages() {
  return request('lamp.php?action=get-recharge');
}

// 计算价格
export async function calculatePrice(lampTypeId: string, packageId: string, membershipLevel: string = 'normal') {
  return request('lamp.php?action=calculate-price', {
    method: 'POST',
    body: JSON.stringify({
      lamp_type_id: lampTypeId,
      package_id: packageId,
      membership_level: membershipLevel
    })
  });
}

// 获取所有基础数据
export async function getLampData() {
  return request('lamp.php');
}

// ============ 用户API ============

// 登录
export async function login(openid: string, nickname?: string, avatarUrl?: string) {
  return request('user.php?action=login', {
    method: 'POST',
    body: JSON.stringify({
      openid,
      nickname,
      avatar_url: avatarUrl
    })
  });
}

// 获取用户信息
export async function getUser(userId: string) {
  return request(`user.php?action=get-user&user_id=${userId}`);
}

// 充值
export async function recharge(userId: string, packageId: string, amount: number) {
  return request('user.php?action=recharge', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      package_id: packageId,
      amount
    })
  });
}

// 获取会员规则详情
export async function getMembershipRule(level: string) {
  return request(`user.php?action=get-membership&level=${level}`);
}

// ============ 订单API ============

// 创建订单
export async function createOrder(
  userId: string,
  lampTypeId: string,
  packageId: string,
  prayerText: string,
  prayerTarget: string,
  isAnonymous: boolean
) {
  return request('order.php?action=create', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      lamp_type_id: lampTypeId,
      package_id: packageId,
      prayer_text: prayerText,
      prayer_target: prayerTarget,
      is_anonymous: isAnonymous
    })
  });
}

// 支付订单
export async function payOrder(orderId: string, userId: string, paymentMethod: string = 'balance') {
  return request('order.php?action=pay', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      user_id: userId,
      payment_method: paymentMethod
    })
  });
}

// 获取用户订单列表
export async function getUserOrders(userId: string) {
  return request(`order.php?action=list&user_id=${userId}`);
}

// 获取用户有效祈福
export async function getActiveLamps(userId: string) {
  return request(`order.php?action=active&user_id=${userId}`);
}

// 创建支付（返回二维码）
export async function createPayment(orderId: string, userId: string, paymentType: string = 'unified') {
  return request('order.php?action=create-payment', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      user_id: userId,
      payment_type: paymentType
    })
  });
}

// 检查支付状态
export async function checkPaymentStatus(orderId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/order.php?action=get&id=${orderId}`);
    const data = await response.json();
    return data.success && data.data?.status === 'paid';
  } catch {
    return false;
  }
}

// ============ 祈福墙API ============

// 获取祈福墙列表
export async function getPrayerWall(limit: number = 50, offset: number = 0, userId?: string) {
  let url = `prayer_wall.php?action=list&limit=${limit}&offset=${offset}`;
  if (userId) {
    url += `&user_id=${userId}`;
  }
  return request(url);
}

// 点赞
export async function likePrayer(prayerId: string) {
  return request('prayer_wall.php?action=like', {
    method: 'POST',
    body: JSON.stringify({
      prayer_id: prayerId
    })
  });
}

// 获取祈福墙统计
export async function getPrayerStats() {
  return request('prayer_wall.php?action=stats');
}

// 获取祈福墙数据（列表+统计）
export async function getPrayerWallData(limit: number = 50, offset: number = 0, userId?: string) {
  return request('prayer_wall.php');
}

// ============ 工具函数 ============

// 格式化金额
export function formatMoney(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

// 生成唯一ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
