<?php
/**
 * 管理后台 API - 验证码登录
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

// 验证码存储（实际应该用Redis或数据库）
$codesFile = '/tmp/admin_codes.json';

function getCodes() {
    global $codesFile;
    if (file_exists($codesFile)) {
        return json_decode(file_get_contents($codesFile), true) ?: [];
    }
    return [];
}

function saveCodes($codes) {
    global $codesFile;
    file_put_contents($codesFile, json_encode($codes));
}

function cleanExpiredCodes() {
    $codes = getCodes();
    $now = time();
    foreach ($codes as $contact => $code) {
        if ($now - $code['time'] > 300) { // 5分钟过期
            unset($codes[$contact]);
        }
    }
    saveCodes($codes);
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // 发送验证码
    if ($action === 'send-code') {
        $contact = $data['contact'] ?? '';
        $type = $data['type'] ?? 'phone';
        $code = $data['code'] ?? '';
        
        if (empty($contact) || empty($code)) {
            echo json_encode(['success' => false, 'message' => '参数不完整']);
            exit;
        }
        
        // 保存验证码
        $codes = getCodes();
        $codes[$contact] = [
            'code' => $code,
            'time' => time(),
            'type' => $type
        ];
        saveCodes($codes);
        
        // 这里实际应该调用短信/邮件API发送验证码
        // 模拟发送成功
        echo json_encode(['success' => true, 'message' => '验证码已发送']);
        exit;
    }
    
    // 验证验证码
    if ($action === 'verify-code') {
        $contact = $data['contact'] ?? '';
        $code = $data['code'] ?? '';
        
        if (empty($contact) || empty($code)) {
            echo json_encode(['success' => false, 'message' => '参数不完整']);
            exit;
        }
        
        // 清理过期验证码
        cleanExpiredCodes();
        
        // 验证
        $codes = getCodes();
        if (isset($codes[$contact]) && $codes[$contact]['code'] === $code) {
            // 验证成功，删除验证码
            unset($codes[$contact]);
            saveCodes($codes);
            
            echo json_encode(['success' => true, 'message' => '登录成功']);
        } else {
            echo json_encode(['success' => false, 'message' => '验证码错误']);
        }
        exit;
    }
}

echo json_encode(['success' => false, 'message' => '未知操作']);