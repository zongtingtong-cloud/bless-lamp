<?php
/**
 * 汇付天下支付服务 - 使用官方SDK
 */

require_once __DIR__ . '/BsPaySdk/init.php';
require_once __DIR__ . '/BsPaySdk/core/BsPay.php';
require_once __DIR__ . '/BsPaySdk/core/BsPayClient.php';
require_once __DIR__ . '/BsPaySdk/request/V3TradePaymentJspayRequest.php';
require_once __DIR__ . '/BsPaySdk/core/BsPayTools.php';

use BsPaySdk\core\BsPay;
use BsPaySdk\request\V3TradePaymentJspayRequest;

class HuifuPaymentV3 {

    private $config;

    public function __construct() {
        require_once __DIR__ . '/../config/payment.php';
        
        $this->config = getHuifuConfig();
        
        // 创建SDK配置文件
        $configData = [
            'sys_id' => HUIFU_SYS_ID,
            'huifu_id' => HUIFU_HUIFU_ID,
            'product_id' => HUIFU_PRODUCT_ID,
            'rsa_merch_private_key' => HUIFU_MCH_PRIV_KEY,
            'rsa_huifu_public_key' => HUIFU_HUIFU_PUBLIC_KEY,
            'sign_type' => 'RSA',
        ];
        
        $configFile = '/tmp/huifu_sdk_config.json';
        @file_put_contents($configFile, json_encode($configData, JSON_PRETTY_PRINT));
        
        // 初始化SDK - 和官方Demo一样
        @BsPay::init($configFile, false);
    }

    public function createPayment($params) {
        // 测试模式
        if (HUIFU_TEST_MODE) {
            return $this->simulatePayment($params);
        }

        try {
            // 创建扫码支付请求
            $request = new V3TradePaymentJspayRequest();
            
            // 必填参数
            $request->setReqDate(date("Ymd"));
            $request->setReqSeqId($this->generateSeqId($params['order_id']));
            $request->setHuifuId(HUIFU_HUIFU_ID);
            $request->setGoodsDesc($params['goods_desc'] ?? '云端祈福坛');
            $request->setTradeType("T_NATIVE");  // 微信正扫
            $request->setTransAmt(number_format($params['amount'], 2, '.', ''));
            
            // 扩展参数
            $extendInfo = [];
            $extendInfo["time_expire"] = date("YmdHis", time() + 300); // 5分钟过期
            $extendInfo["notify_url"] = HUIFU_NOTIFY_URL ?? '';
            
            // 微信参数
            $wxData = ["product_id" => $params['order_id']];
            $extendInfo["wx_data"] = json_encode($wxData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            
            $request->setExtendInfo($extendInfo);

            // 调用SDK - 使用默认商户配置
            $result = (new \BsPaySdk\core\BsPayClient())->postRequest($request);
            
            if ($result->isError()) {
                return [
                    'success' => false, 
                    'resp_desc' => $result->getErrorInfo() ?: '支付创建失败'
                ];
            }
            
            $respData = $result->getRspDatas();
            
            // 提取二维码
            $qrCode = '';
            if (isset($respData['data']['qr_code'])) {
                $qrCode = $respData['data']['qr_code'];
            }
            
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
            return [
                'success' => false, 
                'resp_desc' => '支付异常: ' . $e->getMessage()
            ];
        }
    }

    private function generateSeqId($orderId) {
        return 'BL_' . $orderId . '_' . date('YmdHis') . rand(100, 999);
    }

    private function simulatePayment($params) {
        $orderId = $params['order_id'];
        
        $wechatUrl = 'weixin://wxpay/bizpayurl?pr=test' . $orderId;
        $alipayUrl = 'https://qr.alipay.com/test' . $orderId;
        
        $testWechatQR = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($wechatUrl);
        $testAlipayQR = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($alipayUrl);

        return [
            'success' => true,
            'resp_code' => '00000000',
            'data' => [
                'wechat' => [
                    'qr_code' => $testWechatQR, 
                    'hf_seq_id' => 'HF_WX' . time()
                ],
                'alipay' => [
                    'qr_code' => $testAlipayQR, 
                    'hf_seq_id' => 'HF_ALI' . time()
                ]
            ],
            'order_id' => $orderId,
            'test_mode' => true
        ];
    }
}

function createHuifuPaymentV3($params) {
    $payment = new HuifuPaymentV3();
    return $payment->createPayment($params);
}