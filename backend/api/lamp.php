<?php
/**
 * 灯型相关API
 */

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$db = Database::getInstance();
$pdo = $db->getConnection();

// 获取灯型列表
function getLamps($pdo) {
    $stmt = $pdo->query("SELECT * FROM lamp_types WHERE is_active = 1 ORDER BY sort_order");
    return $stmt->fetchAll();
}

// 获取套餐列表
function getPackages($pdo) {
    $stmt = $pdo->query("SELECT * FROM time_packages WHERE is_active = 1 ORDER BY sort_order");
    return $stmt->fetchAll();
}

// 获取会员规则
function getMembershipRules($pdo) {
    $stmt = $pdo->query("SELECT * FROM membership_rules WHERE is_active = 1");
    return $stmt->fetchAll();
}

// 获取充值套餐
function getRechargePackages($pdo) {
    $stmt = $pdo->query("SELECT * FROM recharge_packages WHERE is_active = 1");
    return $stmt->fetchAll();
}

// 计算价格
function calculatePrice($lampTypeId, $packageId, $membershipLevel = 'normal') {
    global $pdo;

    $stmt = $pdo->prepare("SELECT base_price FROM lamp_types WHERE id = ?");
    $stmt->execute([$lampTypeId]);
    $lamp = $stmt->fetch();

    $stmt = $pdo->prepare("SELECT minutes, discount_rate FROM time_packages WHERE id = ?");
    $stmt->execute([$packageId]);
    $package = $stmt->fetch();

    $stmt = $pdo->prepare("SELECT discount_rate FROM membership_rules WHERE level = ?");
    $stmt->execute([$membershipLevel]);
    $membership = $stmt->fetch();

    if (!$lamp || !$package || !$membership) {
        return 0;
    }

    $basePrice = $lamp['base_price'] * $package['minutes'];
    $withPackageDiscount = $basePrice * $package['discount_rate'];
    $finalPrice = $withPackageDiscount * $membership['discount_rate'];

    return round($finalPrice, 2);
}

// 路由处理
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get-lamps':
        $result = getLamps($pdo);
        echo json_encode(['success' => true, 'data' => $result]);
        break;

    case 'get-packages':
        $result = getPackages($pdo);
        echo json_encode(['success' => true, 'data' => $result]);
        break;

    case 'get-membership':
        $result = getMembershipRules($pdo);
        echo json_encode(['success' => true, 'data' => $result]);
        break;

    case 'get-recharge':
        $result = getRechargePackages($pdo);
        echo json_encode(['success' => true, 'data' => $result]);
        break;

    case 'calculate-price':
        $lampTypeId = $_POST['lamp_type_id'] ?? '';
        $packageId = $_POST['package_id'] ?? '';
        $membershipLevel = $_POST['membership_level'] ?? 'normal';

        $price = calculatePrice($lampTypeId, $packageId, $membershipLevel);
        echo json_encode(['success' => true, 'price' => $price]);
        break;

    case 'init':
        // 初始化数据库（仅管理员可用）
        $db->initTables();
        echo json_encode(['success' => true, 'message' => '数据库初始化完成']);
        break;

    default:
        // 返回所有数据
        echo json_encode([
            'success' => true,
            'data' => [
                'lamps' => getLamps($pdo),
                'packages' => getPackages($pdo),
                'membership' => getMembershipRules($pdo),
                'recharge' => getRechargePackages($pdo)
            ]
        ]);
}
