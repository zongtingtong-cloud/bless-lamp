<?php
/**
 * 数据库配置
 */

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'blessing_lamp');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // 如果数据库不存在，创建它
            if ($e->getCode() == 1049) {
                $this->createDatabase();
                $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            } else {
                throw new Exception("数据库连接失败: " . $e->getMessage());
            }
        }
    }

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }

    private function createDatabase() {
        $dsn = "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo = null;
    }

    // 初始化数据库表
    public function initTables() {
        $sql = "
        -- 用户表
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            openid VARCHAR(128) UNIQUE,
            nickname VARCHAR(100),
            avatar_url TEXT,
            wallet_balance DECIMAL(10,2) DEFAULT 0,
            membership_level VARCHAR(20) DEFAULT 'normal',
            total_spend DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- 灯型表
        CREATE TABLE IF NOT EXISTS lamp_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            name_en VARCHAR(50),
            icon VARCHAR(10),
            description TEXT,
            base_price DECIMAL(10,6) DEFAULT 0.0001,
            color VARCHAR(20) DEFAULT '#d4a550',
            is_active BOOLEAN DEFAULT TRUE,
            sort_order INT DEFAULT 0
        );

        -- 时长套餐表
        CREATE TABLE IF NOT EXISTS time_packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            minutes INT NOT NULL,
            original_price DECIMAL(10,2),
            discount_price DECIMAL(10,2),
            discount_rate DECIMAL(5,2) DEFAULT 1.00,
            label VARCHAR(20),
            is_active BOOLEAN DEFAULT TRUE,
            sort_order INT DEFAULT 0
        );

        -- 订单表
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            lamp_type_id INT,
            package_id INT,
            amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            payment_method VARCHAR(20),
            prayer_text TEXT,
            prayer_target VARCHAR(50),
            is_anonymous BOOLEAN DEFAULT FALSE,
            start_time TIMESTAMP NULL,
            end_time TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            paid_at TIMESTAMP NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (lamp_type_id) REFERENCES lamp_types(id),
            FOREIGN KEY (package_id) REFERENCES time_packages(id)
        );

        -- 祈福墙表
        CREATE TABLE IF NOT EXISTS prayer_wall (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            order_id INT,
            lamp_type_name VARCHAR(50),
            prayer_text TEXT,
            prayer_target VARCHAR(50),
            is_anonymous BOOLEAN DEFAULT FALSE,
            likes INT DEFAULT 0,
            is_visible BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
        );

        -- 支付记录表
        CREATE TABLE IF NOT EXISTS payment_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            order_id INT,
            amount DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR(20),
            transaction_id VARCHAR(100),
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
        );

        -- 会员规则表
        CREATE TABLE IF NOT EXISTS membership_rules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            level VARCHAR(20) PRIMARY KEY,
            name VARCHAR(50),
            price DECIMAL(10,2),
            discount_rate DECIMAL(5,2) DEFAULT 1.00,
            max_lamps INT DEFAULT 1,
            perks TEXT,
            is_active BOOLEAN DEFAULT TRUE
        );

        -- 充值套餐表
        CREATE TABLE IF NOT EXISTS recharge_packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            amount DECIMAL(10,2) NOT NULL,
            bonus DECIMAL(10,2) DEFAULT 0,
            label VARCHAR(50),
            is_active BOOLEAN DEFAULT TRUE
        );
        ";

        // 分隔SQL语句并执行
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        foreach ($statements as $statement) {
            if (!empty($statement)) {
                $this->pdo->exec($statement);
            }
        }

        // 插入默认数据
        $this->insertDefaultData();
    }

    private function insertDefaultData() {
        // 检查是否已有数据
        $stmt = $this->pdo->query("SELECT COUNT(*) as cnt FROM lamp_types");
        $result = $stmt->fetch();
        if ($result['cnt'] > 0) return;

        // 插入灯型数据
        $lampTypes = [
            ['酥油灯', 'Ghee Lamp', '🪔', '传统供养，象征虔诚之心，点亮智慧光明', 0.0001, '#d4a550', 1],
            ['平安灯', 'Peace Lamp', '🏮', '消灾免难，健康平安，护佑家宅安宁', 0.0001, '#e74c3c', 2],
            ['智慧灯', 'Wisdom Lamp', '💡', '启迪智慧，学业事业，金榜题名', 0.0001, '#3498db', 3],
            ['功德灯', 'Merit Lamp', '✨', '累积功德，福泽深厚，回向众生', 0.0002, '#f39c12', 4],
            ['长寿灯', 'Longevity Lamp', '🌸', '健康长寿，福寿安康，延年益寿', 0.0002, '#e91e63', 5],
            ['财富灯', 'Wealth Lamp', '💰', '财源广进，富贵吉祥，生意兴隆', 0.0002, '#27ae60', 6]
        ];

        $stmt = $this->pdo->prepare("INSERT INTO lamp_types (name, name_en, icon, description, base_price, color, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($lampTypes as $lamp) {
            $stmt->execute($lamp);
        }

        // 插入套餐数据
        $packages = [
            ['体验祈福', 60, 0.36, 0.36, 1.00, '体验', 1],
            ['一日虔心', 1440, 8.64, 5.18, 0.60, '6折', 2],
            ['七日修行', 10080, 60.48, 36.29, 0.60, '6折', 3],
            ['月度供奉', 43200, 259.20, 155.52, 0.60, '6折', 4],
            ['年度功德', 525600, 3153.60, 1892.16, 0.60, '6折', 5],
            ['终生光明', 5256000, 31536.00, 15768.00, 0.50, '5折', 6]
        ];

        $stmt = $this->pdo->prepare("INSERT INTO time_packages (name, minutes, original_price, discount_price, discount_rate, label, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($packages as $pkg) {
            $stmt->execute($pkg);
        }

        // 插入会员规则
        $memberships = [
            ['normal', '普通用户', 0, 1.00, 1, '基础祈福'],
            ['monthly', '月度会员', 30, 0.80, 1, '无限点1盏基础灯|所有灯型8折|专属祈福位置'],
            ['yearly', '年度功德主', 300, 0.60, 2, '无限点2盏任意灯|所有灯型6折|每日诵经回向|专属客服']
        ];

        $stmt = $this->pdo->prepare("INSERT INTO membership_rules (level, name, price, discount_rate, max_lamps, perks) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($memberships as $m) {
            $stmt->execute($m);
        }

        // 插入充值套餐
        $recharges = [
            [30, 3, '充30送3'],
            [100, 15, '充100送15'],
            [500, 100, '充500送100'],
            [1000, 250, '充1000送250']
        ];

        $stmt = $this->pdo->prepare("INSERT INTO recharge_packages (amount, bonus, label) VALUES (?, ?, ?)");
        foreach ($recharges as $r) {
            $stmt->execute($r);
        }
    }
}
