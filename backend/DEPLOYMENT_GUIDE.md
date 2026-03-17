---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3045022077a2ad05d99174b137da185563c7293c83e8610499237761438a9ccbf37ee46d0221009d0b323aeec2cfb6090d53dba22e389e976c2d52f41ab399d49bc372dba95985
    ReservedCode2: 3044021f7f459b75ee9bb73a06735c2a3eada0601048870b704068a521b156e3e4c314022100872cdd0001676494cedf69d3256cb07cbd656cf7a9e5e08275239aa5a198d84c
---

# 云端祈福坛 - 部署指南

## 一、服务器要求

### 基础环境
|配置 项目 | 最低 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Ubuntu 18.04+ / CentOS 7+ | Ubuntu 20.04+ |
| PHP 版本 | PHP 7.4+ | PHP 8.1+ |
| MySQL 版本 | MySQL 5.7+ | MySQL 8.0+ |
| Web 服务器 | Nginx 1.18+ | Nginx 1.20+ |
| 内存 | 1GB | 2GB+ |
| 磁盘空间 | 5GB | 10GB+ |

### PHP 扩展要求
- pdo_mysql
- json
- mbstring
- curl
- fileinfo

---

## 二、部署流程

### 步骤1：上传代码

```bash
# 方式一：Git 克隆（推荐）
git clone https://github.com/your-repo/blessing-lamp-backend.git /var/www/blessing-lamp

# 方式二：SFTP 上传
# 将 blessing-lamp-backend 文件夹上传到服务器 /var/www/ 目录
```

### 步骤2：配置目录权限

```bash
cd /var/www/blessing-lamp
chmod -R 755 .
chmod -R 777 storage/
```

### 步骤3：安装依赖（如有需要）

```bash
# 如需使用 Composer
composer install
```

### 步骤4：配置 Nginx

创建 Nginx 配置文件：

```nginx
# /etc/nginx/sites-available/blessing-lamp

server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    root /var/www/blessing-lamp;
    index index.php index.html;

    # 日志配置
    access_log /var/log/nginx/blessing-lamp-access.log;
    error_log /var/log/nginx/blessing-lamp-error.log;

    # PHP-FPM 配置
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;  # 根据您的PHP版本调整
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # URL 重写
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # 禁止访问敏感文件
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # CORS 头（允许前端跨域访问）
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
}
```

启用站点：

```bash
ln -s /etc/nginx/sites-available/blessing-lamp /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 三、数据库配置

### 方式一：手动创建（推荐）

登录 MySQL：

```bash
mysql -u root -p
```

执行以下 SQL：

```sql
-- 创建数据库
CREATE DATABASE blessing_lamp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（替换为您密码）
CREATE USER 'blessing_user'@'localhost' IDENTIFIED BY 'your_password';

-- 授权
GRANT ALL PRIVILEGES ON blessing_lamp.* TO 'blessing_user'@'localhost';
FLUSH PRIVILEGES;

-- 使用数据库
USE blessing_lamp;
```

### 方式二：自动初始化

访问 `http://your-domain.com/api/lamp.php?action=init` （如果已实现）

---

## 四、应用配置

### 修改数据库连接

编辑 `config/database.php`：

```php
<?php
// 数据库配置
define('DB_HOST', 'localhost');        // 数据库主机
define('DB_NAME', 'blessing_lamp');    // 数据库名
define('DB_USER', 'blessing_user');    // 数据库用户名
define('DB_PASS', 'your_password');    // 数据库密码
define('DB_CHARSET', 'utf8mb4');       // 字符集
```

### 配置汇付天下支付（重要）

编辑 `config/payment.php`：

```php
<?php
// 汇付天下商户配置

// 系统号（从汇付后台获取）
define('HUIFU_SYS_ID', '6666000123120000');

// 商户号（从汇付后台获取）
define('HUIFU_HUIFU_ID', '6666000123123123');

// 产品号（通常为 MCS）
define('HUIFU_PRODUCT_ID', 'MCS');

// 商户私钥（RSA签名用，从汇付后台下载）
define('HUIFU_MCH_PRIV_KEY', '-----BEGIN PRIVATE KEY-----
您的商户私钥内容
-----END PRIVATE KEY-----');

// 汇付公钥（验签用，从汇付后台下载）
define('HUIFU_HUIFU_PUBLIC_KEY', '-----BEGIN PUBLIC KEY-----
汇付公钥内容
-----END PUBLIC KEY-----');

// 异步通知地址（支付完成后汇付服务器回调）
define('HUIFU_NOTIFY_URL', 'https://your-domain.com/api/order.php?action=payment-notify');

// 签名类型（RSA 或 MD5）
define('HUIFU_SIGN_TYPE', 'RSA');

// 测试模式（生产环境设为 false）
define('HUIFU_TEST_MODE', false);
```

**获取汇付配置步骤：**
1. 登录汇付天下商户后台：https://merchant.huifu.com
2. 获取系统号（sys_id）- 商户/渠道商ID
3. 获取商户号（huifu_id）- 您的商户ID
4. 下载商户密钥（RSA公私钥对）
5. 开通微信支付产品权限

### 前端 API 配置

修改前端 API 指向：

编辑 `/workspace/blessing-lamp/src/services/api.ts`：

```typescript
// 将 baseURL 改为您的服务器地址
const baseURL = 'https://your-domain.com/api';
```

重新构建并部署前端：

```bash
cd /workspace/blessing-lamp
npm run build
# 将 dist 目录上传到您的Web服务器
```

---

## 五、安全配置

### 1. 环境变量（推荐）

创建 `.env` 文件：

```bash
# /var/www/blessing-lamp/.env
DB_HOST=localhost
DB_NAME=blessing_lamp
DB_USER=blessing_user
DB_PASS=your_strong_password
JWT_SECRET=your_jwt_secret_key_here
```

修改 `config/database.php` 使用环境变量：

```php
<?php
// 从环境变量读取配置
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'blessing_lamp');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');
```

### 2. HTTPS 配置（重要）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

修改 Nginx 配置支持 HTTPS：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # ... 其他配置
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. 防火墙配置

```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

---

## 六、常见问题

### Q1: 页面显示 500 错误
- 检查 PHP 错误日志：`/var/log/nginx/blessing-lamp-error.log`
- 检查 PHP-FPM 是否运行：`systemctl status php8.1-fpm`
- 检查文件权限：`chmod -R 755 /var/www/blessing-lamp`

### Q2: 数据库连接失败
- 确认 MySQL 运行：`systemctl status mysql`
- 验证数据库凭据：`mysql -u blessing_user -p blessing_lamp`
- 检查数据库主机配置

### Q3: API 返回 404
- 确认 Nginx URL 重写是否启用
- 检查 `.htaccess` 或 `nginx.conf`

### Q4: 前端无法连接 API
- 检查 CORS 配置
- 确认 API 地址是否正确
- 检查防火墙是否阻止

---

## 七、目录结构

```
blessing-lamp/
├── config/
│   ├── database.php      # 数据库配置和初始化
│   └── payment.php      # 汇付支付配置
├── services/
│   └── huifu_payment.php # 汇付支付服务
├── api/
│   ├── lamp.php         # 灯型、套餐、会员API
│   ├── user.php         # 用户管理API（含充值、会员支付）
│   ├── order.php        # 订单管理API（含支付创建、回调）
│   └── prayer_wall.php # 祈福墙API
├── storage/             # 存储目录（需777权限）
├── .env                 # 环境变量（可选）
└── index.php            # 入口文件
```

---

## 八、一键部署脚本

如需自动化部署，可以使用以下脚本：

```bash
#!/bin/bash
# deploy.sh

# 配置变量
DOMAIN="your-domain.com"
DB_NAME="blessing_lamp"
DB_USER="blessing_user"
DB_PASS="your_password"
PROJECT_DIR="/var/www/blessing-lamp"

# 安装环境
apt update
apt install -y nginx php8.1-fpm php8.1-mysql php8.1-curl php8.1-mbstring

# 创建目录
mkdir -p $PROJECT_DIR

# 配置数据库
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 配置 Nginx
cp nginx.conf /etc/nginx/sites-available/blessing-lamp
ln -s /etc/nginx/sites-available/blessing-lamp /etc/nginx/sites-enabled/
nginx -t

systemctl restart nginx
systemctl restart php8.1-fpm

echo "部署完成！访问 http://$DOMAIN"
```

---

## 九、联系支持

如有问题，请检查：
1. PHP 错误日志
2. Nginx 错误日志
3. MySQL 错误日志

祝部署顺利！🙏
