<?php
/**
 * 祈福墙相关API
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

// 获取祈福墙列表
function getPrayerWall($pdo, $limit = 50, $offset = 0, $userId = null) {
    $sql = "
        SELECT pw.*, u.nickname, u.avatar_url
        FROM prayer_wall pw
        LEFT JOIN users u ON pw.user_id = u.id
        WHERE pw.is_visible = 1
    ";

    if ($userId) {
        $sql .= " AND pw.user_id = " . intval($userId);
    }

    $sql .= " ORDER BY pw.created_at DESC LIMIT ? OFFSET ?";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();

    $results = $stmt->fetchAll();

    // 处理匿名用户
    foreach ($results as &$item) {
        if ($item['is_anonymous']) {
            $item['nickname'] = '匿名';
            $item['avatar_url'] = '';
        }
    }

    return $results;
}

// 点赞
function likePrayer($pdo, $prayerId) {
    $stmt = $pdo->prepare("UPDATE prayer_wall SET likes = likes + 1 WHERE id = ?");
    $stmt->execute([$prayerId]);

    $stmt = $pdo->prepare("SELECT likes FROM prayer_wall WHERE id = ?");
    $stmt->execute([$prayerId]);
    $result = $stmt->fetch();

    return $result['likes'];
}

// 获取统计数据
function getStats($pdo) {
    // 今日祈福数
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM prayer_wall WHERE DATE(created_at) = CURDATE()");
    $today = $stmt->fetch();

    // 累计功德（总点赞数）
    $stmt = $pdo->query("SELECT SUM(likes) as total FROM prayer_wall");
    $totalLikes = $stmt->fetch();

    // 实时祈福数
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM orders WHERE status = 'paid' AND end_time > NOW()");
    $active = $stmt->fetch();

    return [
        'today_count' => intval($today['cnt']),
        'total_likes' => intval($totalLikes['total'] ?: 0),
        'active_count' => intval($active['cnt'])
    ];
}

// 路由处理
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'list':
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        $userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;

        $list = getPrayerWall($pdo, $limit, $offset, $userId);
        echo json_encode(['success' => true, 'data' => $list]);
        break;

    case 'like':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $prayerId = $data['prayer_id'] ?? '';

            if (!$prayerId) {
                echo json_encode(['success' => false, 'message' => '参数不完整']);
                exit;
            }

            $likes = likePrayer($pdo, $prayerId);
            echo json_encode(['success' => true, 'likes' => $likes]);
        }
        break;

    case 'stats':
        $stats = getStats($pdo);
        echo json_encode(['success' => true, 'data' => $stats]);
        break;

    default:
        // 返回列表和统计
        $list = getPrayerWall($pdo);
        $stats = getStats($pdo);
        echo json_encode([
            'success' => true,
            'data' => $list,
            'stats' => $stats
        ]);
}
