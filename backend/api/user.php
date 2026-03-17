<?php
/**
 * 用户相关API
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/huifu_payment.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$db = Database::getInstance();
$pdo = $db->getConnection();

// 用户登录/注册
function login($pdo, $openid, $nickname = '', $avatar_url = '') {
    // 检查用户是否存在
    $stmt = $pdo->prepare("SELECT * FROM users WHERE openid = ?");
    $stmt->execute([$openid]);
    $user = $stmt->fetch();

    if ($user) {
        // 更新用户信息
        if ($nickname || $avatar_url) {
            $updates = [];
            $params = [];
            if ($nickname) {
                $updates[] = "nickname = ?";
                $params[] = $nickname;
            }
            if ($avatar_url) {
                $updates[] = "avatar_url = ?";
                $params[] = $avatar_url;
            }
            $params[] = $openid;

            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE openid = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }
        return $user;
    } else {
        // 创建新用户
        $stmt = $pdo->prepare("INSERT INTO users (openid, nickname, avatar_url, wallet_balance, membership_level) VALUES (?, ?, ?, 100, 'normal')");
        $stmt->execute([$openid, $nickname ?: '善缘居士', $avatar_url ?: '']);
        $userId = $pdo->lastInsertId();

        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }
}

// 获取用户信息
function getUser($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id, openid, nickname, avatar_url, wallet_balance, membership_level, total_spend, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    return $stmt->fetch();
}

// 更新余额
function updateBalance($pdo, $userId, $amount) {
    $stmt = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?");
    return $stmt->execute([$amount, $userId]);
}

// 获取会员规则
function getMembershipRule($pdo, $level) {
    $stmt = $pdo->prepare("SELECT * FROM membership_rules WHERE level = ?");
    $stmt->execute([$level]);
    return $stmt->fetch();
}

// 充值
function recharge($pdo, $userId, $amount, $bonus) {
    // 更新余额
    $stmt = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?");
    $stmt->execute([$amount + $bonus, $userId]);

    // 记录充值日志
    $stmt = $pdo->prepare("INSERT INTO payment_logs (user_id, amount, payment_method, status) VALUES (?, ?, 'balance', 'completed')");
    $stmt->execute([$userId, $amount + $bonus]);

    return getUser($pdo, $userId);
}

// 路由处理
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'login':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $openid = $data['openid'] ?? '';
            $nickname = $data['nickname'] ?? '';
            $avatar_url = $data['avatar_url'] ?? '';

            if (empty($openid)) {
                echo json_encode(['success' => false, 'message' => 'openid不能为空']);
                exit;
            }

            $user = login($pdo, $openid, $nickname, $avatar_url);
            echo json_encode(['success' => true, 'data' => $user]);
        }
        break;

    case 'get-user':
        $userId = $_GET['user_id'] ?? '';
        if ($userId) {
            $user = getUser($pdo, $userId);
            if ($user) {
                echo json_encode(['success' => true, 'data' => $user]);
            } else {
                echo json_encode(['success' => false, 'message' => '用户不存在']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => '用户ID不能为空']);
        }
        break;

    case 'recharge':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $data['user_id'] ?? '';
            $amount = floatval($data['amount'] ?? 0);
            $packageId = $data['package_id'] ?? '';

            if (!$userId || $amount <= 0) {
                echo json_encode(['success' => false, 'message' => '参数错误']);
                exit;
            }

            // 获取充值套餐
            $stmt = $pdo->prepare("SELECT * FROM recharge_packages WHERE id = ?");
            $stmt->execute([$packageId]);
            $package = $stmt->fetch();

            if (!$package) {
                echo json_encode(['success' => false, 'message' => '充值套餐不存在']);
                exit;
            }

            $bonus = floatval($package['bonus']);
            $user = recharge($pdo, $userId, $amount, $bonus);
            echo json_encode(['success' => true, 'data' => $user, 'bonus' => $bonus]);
        }
        break;

    case 'get-membership':
        $level = $_GET['level'] ?? 'normal';
        $rule = getMembershipRule($pdo, $level);
        echo json_encode(['success' => true, 'data' => $rule]);
        break;

    case 'create-recharge':
        // 创建充值订单（微信支付）
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = intval($data['user_id'] ?? 0);
            $amount = floatval($data['amount'] ?? 0);
            $tradeType = $data['trade_type'] ?? 'T_H5';
            $openid = $data['openid'] ?? '';

            if (!$userId || $amount <= 0) {
                echo json_encode(['success' => false, 'message' => '参数不完整']);
                exit;
            }

            // 获取充值套餐
            $stmt = $pdo->prepare("SELECT * FROM recharge_packages WHERE amount = ? AND is_active = 1");
            $stmt->execute([$amount]);
            $package = $stmt->fetch();

            $bonus = $package ? floatval($package['bonus']) : 0;
            $totalAmount = $amount + $bonus;

            // 创建充值记录
            $rechargeId = 'R' . time() . rand(1000, 9999);
            $stmt = $pdo->prepare("INSERT INTO payment_logs (user_id, amount, payment_method, transaction_id, status) VALUES (?, ?, 'wechat', ?, 'pending')");
            $stmt->execute([$userId, $totalAmount, $rechargeId]);

            // 调用汇付支付
            $paymentParams = [
                'order_id' => $rechargeId,
                'amount' => $totalAmount,
                'trade_type' => $tradeType,
                'goods_desc' => '云端祈福坛 - 余额充值',
                'sub_openid' => $openid,
            ];

            $paymentResult = createHuifuPayment($paymentParams);

            if ($paymentResult['success']) {
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'recharge_id' => $rechargeId,
                        'amount' => $amount,
                        'bonus' => $bonus,
                        'total_amount' => $totalAmount,
                        'payment_params' => $paymentResult['data']['pay_info'] ?? '',
                        'qr_code' => $paymentResult['data']['qr_code'] ?? '',
                        'hf_seq_id' => $paymentResult['data']['hf_seq_id'] ?? '',
                        'test_mode' => $paymentResult['test_mode'] ?? false,
                    ]
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => $paymentResult['resp_desc'] ?? '支付创建失败'
                ]);
            }
        }
        break;

    case 'create-membership':
        // 开通/续费会员（微信支付）
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = intval($data['user_id'] ?? 0);
            $level = $data['level'] ?? 'monthly';
            $tradeType = $data['trade_type'] ?? 'T_H5';
            $openid = $data['openid'] ?? '';

            if (!$userId || !$level) {
                echo json_encode(['success' => false, 'message' => '参数不完整']);
                exit;
            }

            // 获取会员价格
            $rule = getMembershipRule($pdo, $level);
            if (!$rule || floatval($rule['price']) <= 0) {
                echo json_encode(['success' => false, 'message' => '会员类型不存在']);
                exit;
            }

            $amount = floatval($rule['price']);

            // 创建会员订单记录
            $memberOrderId = 'M' . time() . rand(1000, 9999);
            $stmt = $pdo->prepare("INSERT INTO payment_logs (user_id, amount, payment_method, transaction_id, status) VALUES (?, ?, 'wechat', ?, 'pending')");
            $stmt->execute([$userId, $amount, $memberOrderId]);

            // 调用汇付支付
            $paymentParams = [
                'order_id' => $memberOrderId,
                'amount' => $amount,
                'trade_type' => $tradeType,
                'goods_desc' => '云端祈福坛 - ' . $rule['name'],
                'sub_openid' => $openid,
            ];

            $paymentResult = createHuifuPayment($paymentParams);

            if ($paymentResult['success']) {
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'member_order_id' => $memberOrderId,
                        'level' => $level,
                        'amount' => $amount,
                        'payment_params' => $paymentResult['data']['pay_info'] ?? '',
                        'qr_code' => $paymentResult['data']['qr_code'] ?? '',
                        'hf_seq_id' => $paymentResult['data']['hf_seq_id'] ?? '',
                        'test_mode' => $paymentResult['test_mode'] ?? false,
                    ]
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => $paymentResult['resp_desc'] ?? '支付创建失败'
                ]);
            }
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => '未知操作']);
}
