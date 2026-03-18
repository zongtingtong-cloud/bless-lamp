<?php
/**
 * 汇付天下支付服务
 */

require_once __DIR__ . '/../config/payment.php';

class HuifuPayment {

    private $config;
    private $privateKey;
    private $huifuPublicKey;

    public function __construct() {
        $this->config = getHuifuConfig();
        $this->privateKey = HUIFU_MCH_PRIV_KEY;
        $this->huifuPublicKey = HUIFU_HUIFU_PUBLIC_KEY;
    }

    /**
     * 创建支付订单（支持微信和支付宝）
     *
     * @param array $params 支付参数
     * @return array
     */
    public function createPayment($params) {
        // 必填参数验证
        $required = ['order_id', 'amount', 'goods_desc'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                return $this->error("缺少必填参数: {$field}");
            }
        }

        // 测试模式
        if (HUIFU_TEST_MODE) {
            return $this->simulatePayment($params);
        }

        // 检查配置
        if (!isHuifuConfigured()) {
            return $this->error('汇付支付未配置，请联系管理员');
        }

        // 获取支付类型
        $paymentType = $params['payment_type'] ?? 'wechat'; // wechat, alipay, unified

        $result = [];

        // 创建微信支付（如需要）
        if ($paymentType === 'wechat' || $paymentType === 'unified') {
            $wechatData = $this->createWechatPayment($params);
            $result['wechat'] = $wechatData;
        }

        // 创建支付宝支付（如需要）
        if ($paymentType === 'alipay' || $paymentType === 'unified') {
            $alipayData = $this->createAlipayPayment($params);
            $result['alipay'] = $alipayData;
        }

        // 返回结果
        if (!empty($result)) {
            return [
                'success' => true,
                'resp_code' => '00000000',
                'resp_desc' => '下单成功',
                'data' => $result,
                'order_id' => $params['order_id'],
            ];
        }

        return $this->error('创建支付失败');
    }

    /**
     * 创建微信支付
     */
    private function createWechatPayment($params) {
        $data = [
            'req_date' => date('Ymd'),
            'req_seq_id' => $this->generateSeqId($params['order_id'], 'WX'),
            'huifu_id' => HUIFU_HUIFU_ID,
            'goods_desc' => $params['goods_desc'],
            'trade_type' => 'T_NATIVE', // 微信正扫
            'trans_amt' => number_format($params['amount'], 2, '.', ''),
            'time_expire' => date('YmdHis', time() + 7200),
        ];

        if (!empty($this->config['notify_url'])) {
            $data['notify_url'] = $this->config['notify_url'];
        }

        $request = [
            'sys_id' => HUIFU_SYS_ID,
            'product_id' => HUIFU_PRODUCT_ID,
            'sign' => '',
            'data' => json_encode($data),
        ];

        $request['sign'] = $this->sign(json_encode($data));
        $response = $this->sendRequest(HUIFU_API_URL . HUIFU_PAYMENT_API, $request);

        if ($response['success']) {
            return [
                'success' => true,
                'qr_code' => $response['data']['qr_code'] ?? '',
                'hf_seq_id' => $response['data']['hf_seq_id'] ?? '',
                'trade_type' => 'wechat',
            ];
        }

        return ['success' => false, 'message' => $response['resp_desc'] ?? '微信支付创建失败'];
    }

    /**
     * 创建支付宝支付
     */
    private function createAlipayPayment($params) {
        // 汇付支付宝正扫API
        $data = [
            'req_date' => date('Ymd'),
            'req_seq_id' => $this->generateSeqId($params['order_id'], 'ALI'),
            'huifu_id' => HUIFU_HUIFU_ID,
            'goods_desc' => $params['goods_desc'],
            'trade_type' => 'T_NATIVE', // 支付宝正扫
            'trans_amt' => number_format($params['amount'], 2, '.', ''),
            'time_expire' => date('YmdHis', time() + 7200),
            'alipay_data' => json_encode([
                'product_code' => 'FAST_INSTANT_TRADE_PAY',
            ]),
        ];

        if (!empty($this->config['notify_url'])) {
            $data['notify_url'] = $this->config['notify_url'];
        }

        $request = [
            'sys_id' => HUIFU_SYS_ID,
            'product_id' => HUIFU_PRODUCT_ID,
            'sign' => '',
            'data' => json_encode($data),
        ];

        $request['sign'] = $this->sign(json_encode($data));
        $response = $this->sendRequest(HUIFU_API_URL . HUIFU_PAYMENT_API, $request);

        if ($response['success']) {
            return [
                'success' => true,
                'qr_code' => $response['data']['qr_code'] ?? '',
                'hf_seq_id' => $response['data']['hf_seq_id'] ?? '',
                'trade_type' => 'alipay',
            ];
        }

        return ['success' => false, 'message' => $response['resp_desc'] ?? '支付宝支付创建失败'];
    }

    /**
     * 模拟支付（测试模式）
     */
    private function simulatePayment($params) {
        $orderId = $params['order_id'];
        $paymentType = $params['payment_type'] ?? 'unified';
        $expireTime = date('YmdHis', time() + 300); // 5分钟过期

        $result = [];

        // 生成模拟二维码（使用测试二维码转图片）
        $wechatUrl = 'weixin://wxpay/bizpayurl?pr=test' . $orderId . '&timeout=' . $expireTime;
        $alipayUrl = 'https://qr.alipay.com/test' . $orderId . '?timeout=300';
        
        $testWechatQR = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($wechatUrl);
        $testAlipayQR = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($alipayUrl);

        if ($paymentType === 'wechat' || $paymentType === 'unified') {
            $result['wechat'] = [
                'success' => true,
                'qr_code' => $testWechatQR,
                'hf_seq_id' => 'HF_WX' . time() . rand(1000, 9999),
                'trade_type' => 'wechat',
                'expire_time' => $expireTime,
            ];
        }

        if ($paymentType === 'alipay' || $paymentType === 'unified') {
            $result['alipay'] = [
                'success' => true,
                'qr_code' => $testAlipayQR,
                'hf_seq_id' => 'HF_ALI' . time() . rand(1000, 9999),
                'trade_type' => 'alipay',
                'expire_time' => $expireTime,
            ];
        }

        return [
            'success' => true,
            'resp_code' => '00000000',
            'resp_desc' => '交易受理成功',
            'data' => $result,
            'order_id' => $orderId,
            'test_mode' => true,
            'expire_time' => $expireTime,
        ];
    }

    /**
     * 生成请求流水号
     */
    private function generateSeqId($orderId, $prefix = 'BL') {
        return $prefix . '_' . $orderId . '_' . date('YmdHis') . rand(100, 999);
    }

    /**
     * 查询订单状态
     */
    public function queryOrder($orderId, $huifuSeqId = null) {
        if (HUIFU_TEST_MODE) {
            return [
                'success' => true,
                'resp_code' => '00000000',
                'data' => [
                    'resp_code' => '00000000',
                    'resp_desc' => '交易成功',
                    'trans_stat' => 'S',
                    'trans_amt' => '0.01',
                ],
            ];
        }

        if (!isHuifuConfigured()) {
            return $this->error('汇付支付未配置');
        }

        $data = [
            'req_date' => date('Ymd'),
            'req_seq_id' => $this->generateSeqId($orderId),
            'huifu_id' => HUIFU_HUIFU_ID,
            'out_trans_id' => $orderId,
        ];

        $request = [
            'sys_id' => HUIFU_SYS_ID,
            'product_id' => HUIFU_PRODUCT_ID,
            'sign' => '',
            'data' => json_encode($data),
        ];

        $request['sign'] = $this->sign(json_encode($data));

        $response = $this->sendRequest(HUIFU_API_URL . HUIFU_QUERY_API, $request);

        return $response;
    }

    /**
     * 验证异步通知签名
     */
    public function verifyNotify($data, $sign) {
        if (HUIFU_TEST_MODE) {
            return true; // 测试模式跳过验证
        }

        if (empty($this->huifuPublicKey)) {
            return false;
        }

        return $this->verifySign($data, $sign, $this->huifuPublicKey);
    }

    /**
     * 处理异步通知
     */
    public function processNotify($postData) {
        $respData = json_decode($postData['resp_data'] ?? '{}', true);

        if (empty($respData)) {
            return ['resp_code' => '失败', 'resp_desc' => '数据解析失败'];
        }

        // 验证签名
        $sign = $postData['sign'] ?? '';
        if (!$this->verifyNotify($postData['resp_data'], $sign)) {
            return ['resp_code' => '失败', 'resp_desc' => '签名验证失败'];
        }

        // 检查响应码
        if ($respData['resp_code'] !== '00000000') {
            return ['resp_code' => '失败', 'resp_desc' => $respData['resp_desc']];
        }

        // 返回处理结果
        return [
            'success' => true,
            'order_id' => $respData['req_seq_id'] ?? '',
            'huifu_id' => $respData['hf_seq_id'] ?? '',
            'amount' => $respData['trans_amt'] ?? '0',
            'status' => $respData['trans_stat'] ?? '',
            'pay_time' => $respData['end_time'] ?? '',
        ];
    }

    /**
     * RSA签名
     */
    private function sign($data) {
        if (HUIFU_SIGN_TYPE === 'MD5') {
            return md5($data . HUIFU_MCH_PRIV_KEY);
        }

        // RSA签名
        $privateKey = openssl_pkey_get_private($this->privateKey);
        if (!$privateKey) {
            throw new Exception('无效的私钥');
        }

        $signature = '';
        openssl_sign($data, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        return base64_encode($signature);
    }

    /**
     * 验证签名
     */
    private function verifySign($data, $sign, $publicKey) {
        if (HUIFU_SIGN_TYPE === 'MD5') {
            return md5($data . HUIFU_MCH_PRIV_KEY) === $sign;
        }

        $publicKey = openssl_pkey_get_public($publicKey);
        if (!$publicKey) {
            return false;
        }

        return openssl_verify($data, base64_decode($sign), $publicKey, OPENSSL_ALGO_SHA256) === 1;
    }

    /**
     * 发送HTTP请求
     */
    private function sendRequest($url, $data) {
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json',
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($httpCode !== 200) {
            return $this->error("HTTP请求失败: {$httpCode} - {$error}");
        }

        $result = json_decode($response, true);

        if (empty($result)) {
            return $this->error('解析响应失败');
        }

        // 检查业务响应码
        $respData = json_decode($result['data'] ?? '{}', true);
        if ($respData['resp_code'] !== '00000000' && $respData['resp_code'] !== '00000100') {
            return $this->error($respData['resp_desc'] ?? '交易失败', $result);
        }

        return [
            'success' => true,
            'resp_code' => $respData['resp_code'] ?? '00000000',
            'resp_desc' => $respData['resp_desc'] ?? '',
            'data' => $respData,
        ];
    }

    /**
     * 返回错误
     */
    private function error($message, $data = []) {
        return [
            'success' => false,
            'resp_code' => 'ERROR',
            'resp_desc' => $message,
            'data' => $data,
        ];
    }
}

/**
 * 快捷函数：创建支付订单
 */
function createHuifuPayment($params) {
    $payment = new HuifuPayment();
    return $payment->createPayment($params);
}

/**
 * 快捷函数：查询订单
 */
function queryHuifuOrder($orderId, $huifuSeqId = null) {
    $payment = new HuifuPayment();
    return $payment->queryOrder($orderId, $huifuSeqId);
}

/**
 * 快捷函数：处理支付回调
 */
function processHuifuNotify($postData) {
    $payment = new HuifuPayment();
    return $payment->processNotify($postData);
}
