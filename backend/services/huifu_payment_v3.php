<?php
/**
 * 汇付天下支付服务 - 使用官方SDK
 */

require_once __DIR__ . '/BsPaySdk/init.php';
require_once __DIR__ . '/BsPaySdk/request/V3TradePaymentJspayRequest.php';
require_once __DIR__ . '/BsPaySdk/core/BsPay.php';

use BsPaySdk\core\BsPay;
use BsPaySdk\request\V3TradePaymentJspayRequest;

class HuifuPaymentV3 {

    private $config;
    private $initialized = false;

    public function __construct() {
        require_once __DIR__ . '/../config/payment.php';
        
        $this->config = getHuifuConfig();
        
        // 创建临时配置文件
        $configJson = [
            'sys_id' => HUIFU_SYS_ID,
            'huifu_id' => HUIFU_HUIFU_ID,
            'product_id' => HUIFU_PRODUCT_ID,
            'rsa_merch_private_key' => HUIFU_MCH_PRIV_KEY,
            'rsa_huifu_public_key' => HUIFU_HUIFU_PUBLIC_KEY,
            'sign_type' => 'RSA',
            'private_key' => HUIFU_MCH_PRIV_KEY,
            'public_key' => HUIFU_HUIFU_PUBLIC_KEY,
        ];
        
        $configFile = '/tmp/huifu_config.json';
        @file_put_contents($configFile, json_encode($configJson, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        
        // 初始化SDK
        @BsPay::init($configFile, false);
        $this->initialized = true;
    }

    public function createPayment($params) {
        if (HUIFU_TEST_MODE) {
            return $this->simulatePayment($params);
        }

        try {
            $request = new V3TradePaymentJspayRequest();
            $request->setReqDate(date("Ymd"));
            $request->setReqSeqId($this->generateSeqId($params['order_id']));
            $request->setHuifuId(HUIFU_HUIFU_ID);
            $request->setGoodsDesc($params['goods_desc'] ?? '云端祈福坛');
            $request->setTradeType("T_NATIVE");
            $request->setTransAmt(number_format($params['amount'], 2, '.', ''));
            
            $extendInfo = [];
            $extendInfo["time_expire"] = date("YmdHis", time() + 300);
            $extendInfo["notify_url"] = HUIFU_NOTIFY_URL ?? '';
            $request->setExtendInfo($extendInfo);

            $result = (new \BsPaySdk\core\BsPayClient())->postRequest($request);
            
            if ($result->isError()) {
                return ['success' => false, 'resp_desc' => $result->getErrorInfo() ?: '支付创建失败'];
            }
            
            $respData = $result->getRspDatas();
            $qrCode = $respData['data']['qr_code'] ?? '';
            
            return [
                'success' => true,
                'resp_code' => '00000000',
                'resp_desc' => '下单成功',
                'data' => [
                    'wechat' => [
                        'qr_code' => $qrCode,
                        'hf_seq_id' => $respData['data']['hf_seq_id'] ?? ''
                    ]
                ],
                'order_id' => $params['order_id']
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'resp_desc' => '支付异常: ' . $e->getMessage()];
        }
    }

    private function generateSeqId($orderId) {
        return 'BL_' . $orderId . '_' . date('YmdHis') . rand(100, 999);
    }

    private function simulatePayment($params) {
        $orderId = $params['order_id'];
        $paymentType = $params['payment_type'] ?? 'unified';
        $expireTime = date('YmdHis', time() + 300);

        $result = [];
        $wechatUrl = 'weixin://wxpay/bizpayurl?pr=test' . $orderId;
        $alipayUrl = 'https://qr.alipay.com/test' . $orderId;
        
        $testWechatQR = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($wechatUrl);
        $testAlipayQR = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($alipayUrl);

        if ($paymentType === 'wechat' || $paymentType === 'unified') {
            $result['wechat'] = ['qr_code' => $testWechatQR, 'hf_seq_id' => 'HF_WX' . time()];
        }
        if ($paymentType === 'alipay' || $paymentType === 'unified') {
            $result['alipay'] = ['qr_code' => $testAlipayQR, 'hf_seq_id' => 'HF_ALI' . time()];
        }

        return ['success' => true, 'resp_code' => '00000000', 'data' => $result, 'order_id' => $orderId, 'test_mode' => true];
    }
}

function createHuifuPaymentV3($params) {
    $payment = new HuifuPaymentV3();
    return $payment->createPayment($params);
}