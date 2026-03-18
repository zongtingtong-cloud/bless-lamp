<?php
/**
 * 订单相关API
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

// 创建订单
function createOrder($pdo, $userId, $lampTypeId, $packageId, $prayerText, $prayerTarget, $isAnonymous) {
    // 获取灯型和套餐信息
    $stmt = $pdo->prepare("SELECT * FROM lamp_types WHERE id = ?");
    $stmt->execute([$lampTypeId]);
    $lamp = $stmt->fetch();

    $stmt = $pdo->prepare("SELECT * FROM time_packages WHERE id = ?");
    $stmt->execute([$packageId]);
    $package = $stmt->fetch();

    $stmt = $pdo->prepare("SELECT membership_level FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$lamp || !$package || !$user) {
        return false;
    }

    // 计算价格
    $stmt = $pdo->prepare("SELECT discount_rate FROM membership_rules WHERE level = ?");
    $stmt->execute([$user['membership_level']]);
    $membership = $stmt->fetch();

    $basePrice = $lamp['base_price'] * $package['minutes'];
    $withPackageDiscount = $basePrice * $package['discount_rate'];
    $amount = round($withPackageDiscount * $membership['discount_rate'], 2);

    // 创建订单
    $stmt = $pdo->prepare("INSERT INTO orders (user_id, lamp_type_id, package_id, amount, prayer_text, prayer_target, is_anonymous) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $lampTypeId, $packageId, $amount, $prayerText, $prayerTarget, $isAnonymous ? 1 : 0]);

    return [
        'id' => $pdo->lastInsertId(),
        'amount' => $amount,
        'lamp' => $lamp,
        'package' => $package
    ];
}

// 支付订单
function payOrder($pdo, $orderId, $userId, $paymentMethod = 'balance') {
    // 获取订单信息
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch();

    if (!$order) {
        return ['success' => false, 'message' => '订单不存在'];
    }

    if ($order['status'] === 'paid') {
        return ['success' => false, 'message' => '订单已支付'];
    }

    // 检查余额
    $stmt = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if ($user['wallet_balance'] < $order['amount']) {
        return ['success' => false, 'message' => '余额不足'];
    }

    // 扣除余额
    $stmt = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?");
    $stmt->execute([$order['amount'], $userId]);

    // 更新用户累计消费
    $stmt = $pdo->prepare("UPDATE users SET total_spend = total_spend + ? WHERE id = ?");
    $stmt->execute([$order['amount'], $userId]);

    // 更新订单状态
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("SELECT minutes FROM time_packages WHERE id = ?");
    $stmt->execute([$order['package_id']]);
    $package = $stmt->fetch();

    $startTime = $now;
    $endTime = date('Y-m-d H:i:s', strtotime($now) + $package['minutes'] * 60);

    $stmt = $pdo->prepare("UPDATE orders SET status = 'paid', payment_method = ?, start_time = ?, end_time = ?, paid_at = ? WHERE id = ?");
    $stmt->execute([$paymentMethod, $startTime, $endTime, $now, $orderId]);

    // 添加到祈福墙
    $stmt = $pdo->prepare("SELECT name FROM lamp_types WHERE id = ?");
    $stmt->execute([$order['lamp_type_id']]);
    $lamp = $stmt->fetch();

    $stmt = $pdo->prepare("INSERT INTO prayer_wall (user_id, order_id, lamp_type_name, prayer_text, prayer_target, is_anonymous) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $orderId, $lamp['name'], $order['prayer_text'], $order['prayer_target'], $order['is_anonymous']]);

    // 记录支付日志
    $stmt = $pdo->prepare("INSERT INTO payment_logs (user_id, order_id, amount, payment_method, status) VALUES (?, ?, ?, ?, 'completed')");
    $stmt->execute([$userId, $orderId, $order['amount'], $paymentMethod]);

    return ['success' => true, 'message' => '支付成功'];
}

// 获取用户订单
function getUserOrders($pdo, $userId) {
    $stmt = $pdo->prepare("
        SELECT o.*, lt.name as lamp_name, lt.icon as lamp_icon, lt.color as lamp_color, tp.name as package_name
        FROM orders o
        LEFT JOIN lamp_types lt ON o.lamp_type_id = lt.id
        LEFT JOIN time_packages tp ON o.package_id = tp.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    ");
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

// 获取用户有效祈福
function getActiveLamps($pdo, $userId) {
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("
        SELECT o.*, lt.name as lamp_name, lt.icon as lamp_icon, lt.color as lamp_color, lt.name_en as lamp_name_en,
               tp.name as package_name, tp.minutes,
               TIMESTAMPDIFF(MINUTE, NOW(), o.end_time) as remaining_minutes
        FROM orders o
        LEFT JOIN lamp_types lt ON o.lamp_type_id = lt.id
        LEFT JOIN time_packages tp ON o.package_id = tp.id
        WHERE o.user_id = ? AND o.status = 'paid' AND o.end_time > ?
        ORDER BY o.end_time ASC
    ");
    $stmt->execute([$userId, $now]);
    return $stmt->fetchAll();
}

// 路由处理
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'create':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $data['user_id'] ?? '';
            $lampTypeId = $data['lamp_type_id'] ?? '';
            $packageId = $data['package_id'] ?? '';
            $prayerText = $data['prayer_text'] ?? '';
            $prayerTarget = $data['prayer_target'] ?? '自己';
            $isAnonymous = $data['is_anonymous'] ?? false;

            if (!$userId || !$lampTypeId || !$packageId) {
                echo json_encode(['success' => false, 'message' => '参数不完整']);
                exit;
            }

            $result = createOrder($pdo, $userId, $lampTypeId, $packageId, $prayerText, $prayerTarget, $isAnonymous);

            if ($result) {
                echo json_encode(['success' => true, 'data' => $result]);
            } else {
                echo json_encode(['success' => false, 'message' => '创建订单失败']);
            }
        }
        break;

    case 'pay':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $orderId = $data['order_id'] ?? '';
            $userId = $data['user_id'] ?? '';
            $paymentMethod = $data['payment_method'] ?? 'balance';

            if (!$orderId || !$userId) {
                echo json_encode(['success' => false, 'message' => '参数不完整']);
                exit;
            }

            $result = payOrder($pdo, $orderId, $userId, $paymentMethod);
            echo json_encode($result);
        }
        break;

    case 'create-payment':
        // 创建支付订单（支持微信和支付宝二维码）
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $orderId = intval($data['order_id'] ?? 0);
            $userId = intval($data['user_id'] ?? 0);
            $paymentType = $data['payment_type'] ?? 'unified'; // wechat, alipay, unified
            $openid = $data['openid'] ?? '';

            if (!$orderId || !$userId) {
                echo json_encode(['success' => false, 'message' => '参数不完整']);
                exit;
            }

            // 获取订单信息
            $stmt = $pdo->prepare("SELECT o.*, lt.name as lamp_name FROM orders o LEFT JOIN lamp_types lt ON o.lamp_type_id = lt.id WHERE o.id = ? AND o.user_id = ?");
            $stmt->execute([$orderId, $userId]);
            $order = $stmt->fetch();

            if (!$order) {
                echo json_encode(['success' => false, 'message' => '订单不存在']);
                exit;
            }

            if ($order['status'] === 'paid') {
                echo json_encode(['success' => false, 'message' => '订单已支付']);
                exit;
            }

            // 调用汇付支付
            $paymentParams = [
                'order_id' => $orderId,
                'amount' => $order['amount'],
                'payment_type' => $paymentType,
                'goods_desc' => '云端祈福坛 - ' . $order['lamp_name'],
                'sub_openid' => $openid,
            ];

            $paymentResult = createHuifuPayment($paymentParams);

            if ($paymentResult['success']) {
                // 记录支付流水
                $paymentMethod = $paymentType === 'alipay' ? 'alipay' : 'wechat';
                $stmt = $pdo->prepare("INSERT INTO payment_logs (user_id, order_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, 'pending')");
                $stmt->execute([$userId, $orderId, $order['amount'], $paymentMethod, $paymentResult['data']['wechat']['hf_seq_id'] ?? '']);

                // 测试模式下自动确认支付
                if (!empty($paymentResult['test_mode'])) {
                    $now = date('Y-m-d H:i:s');
                    $endTime = date('Y-m-d H:i:s', strtotime($now) + 86400); // 测试模式：默认1天
                    $stmt = $pdo->prepare("UPDATE orders SET status = 'paid', payment_method = ?, start_time = ?, end_time = ?, paid_at = ? WHERE id = ?");
                    $stmt->execute([$paymentMethod, $now, $endTime, $now, $orderId]);
                    
                    // 添加祈福墙记录
                    $stmt = $pdo->prepare("INSERT INTO prayer_wall (user_id, order_id, lamp_type_name, prayer_text, prayer_target, is_anonymous) SELECT user_id, id, (SELECT name FROM lamp_types WHERE id = lamp_type_id), prayer_text, prayer_target, is_anonymous FROM orders WHERE id = ?");
                    $stmt->execute([$orderId]);
                }

                echo json_encode([
                    'success' => true,
                    'data' => [
                        'order_id' => $orderId,
                        'amount' => $order['amount'],
                        'wechat_qr' => $paymentResult['data']['wechat']['qr_code'] ?? '',
                        'alipay_qr' => $paymentResult['data']['alipay']['qr_code'] ?? '',
                        'test_mode' => $paymentResult['test_mode'] ?? false,
                        'paid' => !empty($paymentResult['test_mode']), // 测试模式下直接标记已支付
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

    case 'payment-notify':
        // 支付异步回调
        if ($method === 'POST') {
            $postData = $_POST;

            // 如果是JSON POST
            if (empty($postData)) {
                $postData = json_decode(file_get_contents('php://input'), true);
            }

            $result = processHuifuNotify($postData);

            if (isset($result['success']) && $result['success']) {
                // 更新订单状态
                $orderId = $result['order_id'];

                // 从order_id中提取原始订单ID
                $originalOrderId = explode('_', $orderId)[1] ?? $orderId;
                $originalOrderId = intval($originalOrderId);

                // 获取订单
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
                $stmt->execute([$originalOrderId]);
                $order = $stmt->fetch();

                if ($order && $order['status'] !== 'paid') {
                    // 更新订单状态
                    $now = date('Y-m-d H:i:s');
                    $stmt = $pdo->prepare("SELECT minutes FROM time_packages WHERE id = ?");
                    $stmt->execute([$order['package_id']]);
                    $package = $stmt->fetch();

                    $startTime = $now;
                    $endTime = date('Y-m-d H:i:s', strtotime($now) + ($package['minutes'] ?? 60) * 60);

                    $stmt = $pdo->prepare("UPDATE orders SET status = 'paid', payment_method = 'wechat', start_time = ?, end_time = ?, paid_at = ? WHERE id = ?");
                    $stmt->execute([$startTime, $endTime, $now, $originalOrderId]);

                    // 更新用户累计消费
                    $stmt = $pdo->prepare("UPDATE users SET total_spend = total_spend + ? WHERE id = ?");
                    $stmt->execute([$order['amount'], $order['user_id']]);

                    // 添加到祈福墙
                    $stmt = $pdo->prepare("SELECT name FROM lamp_types WHERE id = ?");
                    $stmt->execute([$order['lamp_type_id']]);
                    $lamp = $stmt->fetch();

                    $stmt = $pdo->prepare("INSERT INTO prayer_wall (user_id, order_id, lamp_type_name, prayer_text, prayer_target, is_anonymous) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$order['user_id'], $originalOrderId, $lamp['name'], $order['prayer_text'], $order['prayer_target'], $order['is_anonymous']]);

                    // 更新支付日志
                    $stmt = $pdo->prepare("UPDATE payment_logs SET status = 'completed' WHERE order_id = ? AND payment_method = 'wechat'");
                    $stmt->execute([$originalOrderId]);
                }

                echo json_encode(['resp_code' => '00000000', 'resp_desc' => '成功']);
            } else {
                echo json_encode(['resp_code' => '失败', 'resp_desc' => $result['resp_desc'] ?? '处理失败']);
            }
        }
        break;

    case 'list':
        $userId = $_GET['user_id'] ?? '';
        if ($userId) {
            $orders = getUserOrders($pdo, $userId);
            echo json_encode(['success' => true, 'data' => $orders]);
        } else {
            echo json_encode(['success' => false, 'message' => '用户ID不能为空']);
        }
        break;

    case 'active':
        $userId = $_GET['user_id'] ?? '';
        if ($userId) {
            $lamps = getActiveLamps($pdo, $userId);
            echo json_encode(['success' => true, 'data' => $lamps]);
        } else {
            echo json_encode(['success' => false, 'message' => '用户ID不能为空']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => '未知操作']);
}
