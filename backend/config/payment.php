<?php
/**
 * 汇付天下支付配置
 * =======================
 * 使用说明：
 * 1. 在环境变量中配置以下参数，或直接在此文件中修改
 * 2. 签名密钥需要从汇付天下后台获取
 * =======================
 */

// 汇付天下商户配置
// 方式一：使用环境变量（推荐，更安全）
define('HUIFU_SYS_ID', getenv('HUIFU_SYS_ID') ?: '');          // 系统号（渠道商/商户huifu_id）
define('HUIFU_HUIFU_ID', getenv('HUIFU_HUIFU_ID') ?: '');      // 商户号
define('HUIFU_PRODUCT_ID', getenv('HUIFU_PRODUCT_ID') ?: 'MCS'); // 产品号
define('HUIFU_MCH_PRIV_KEY', getenv('HUIFU_MCH_PRIV_KEY') ?: '');  // 商户私钥（RSA签名用）
define('HUIFU_HUIFU_PUBLIC_KEY', getenv('HUIFU_HUIFU_PUBLIC_KEY') ?: '');  // 汇付公钥（验签用）

// 方式二：直接配置（仅测试环境使用）
// define('HUIFU_SYS_ID', '6666000123120000');    // 替换为您的系统号
// define('HUIFU_HUIFU_ID', '6666000123123123');  // 替换为您的商户号
// define('HUIFU_PRODUCT_ID', 'MCS');              // 产品号
// define('HUIFU_MCH_PRIV_KEY', '-----BEGIN PRIVATE KEY-----
// 您的商户私钥
// -----END PRIVATE KEY-----');
// define('HUIFU_HUIFU_PUBLIC_KEY', '-----BEGIN PUBLIC KEY-----
// 汇付公钥
// -----END PUBLIC KEY-----');

// 支付配置
define('HUIFU_NOTIFY_URL', getenv('HUIFU_NOTIFY_URL') ?: '');  // 异步通知地址
define('HUIFU_API_URL', 'https://api.huifu.com');              // 汇付API地址
define('HUIFU_PAYMENT_API', '/v3/trade/payment/jspay');        // 支付API路径
define('HUIFU_QUERY_API', '/v3/trade/query');                  // 订单查询API

// 签名类型
define('HUIFU_SIGN_TYPE', 'RSA');  // RSA 或 MD5

// 测试模式（不发送真实请求）
define('HUIFU_TEST_MODE', getenv('HUIFU_TEST_MODE') ?: true);

/**
 * 获取汇付配置
 */
function getHuifuConfig() {
    return [
        'sys_id' => HUIFU_SYS_ID,
        'huifu_id' => HUIFU_HUIFU_ID,
        'product_id' => HUIFU_PRODUCT_ID,
        'notify_url' => HUIFU_NOTIFY_URL,
        'sign_type' => HUIFU_SIGN_TYPE,
        'test_mode' => HUIFU_TEST_MODE,
    ];
}

/**
 * 检查汇付配置是否完整
 */
function isHuifuConfigured() {
    return !empty(HUIFU_SYS_ID) && !empty(HUIFU_HUIFU_ID);
}
