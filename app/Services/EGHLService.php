<?php
// Example: app/Services/EghlService.php
namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerCreditTransaction;
use App\Models\CustomerWallet;
use App\Models\Orders;
use App\Models\Payments;
use App\Models\PurchasePackage;
use App\Models\Setting;
use App\Models\WalletCreditGrant;
use App\Notifications\WalletTransactionNotification;
use Illuminate\Foundation\Auth\User;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class EghlService
{
    protected $verifyKey;
    protected $serviceId;
    protected $paymentUrl;
    protected $returnUrl;
    protected $callbackUrl;
    protected $currency;

    public function __construct()
    {
        $this->verifyKey = env('EGHL_PASSWORD');
        $this->serviceId = env('EGHL_SERVICE_ID');
        $this->paymentUrl = env('EGHL_PAYMENT_URL');
        $this->currency = 'MYR';
    }

    public function generateEghlRequest(array $params)
    {
        // 1. Combine Merchant ID and VerifyKey
        $data = $this->verifyKey . $this->serviceId;

        // 2. Concatenate required parameters (OrderNumber, Amount, Currency, etc.)
        //    **NOTE:** The exact order and parameters depend *strictly* on eGHL's documentation.
        $data .= $params['PaymentID'] .
            $params['MerchantReturnURL'] .
            $params['MerchantCallbackURL'] .
            $params['Amount'] .
            $this->currency;

        // 3. Generate SHA-256 Hash
        $hash = hash('sha256', $data);

        // 4. Construct the final payment parameters
        $finalParams = array_merge($params, [
            'TransactionType' => 'SALE',
            'PaymentMethod' => 'ANY',
            'ServiceID' => $this->serviceId,
            'PaymentID' => $params['PaymentID'],
            'OrderNumber' => $params['OrderNumber'],
            'PaymentDesc' => $params['PaymentDesc'],
            'MerchantName' => 'Heroes',
            'MerchantReturnURL' => $params['MerchantReturnURL'],
            'MerchantCallbackURL' => $params['MerchantCallbackURL'],
            'Amount' => $params['Amount'],
            'CurrencyCode' => $this->currency,
            'CustName' => $params['CustName'],
            'CustEmail' => $params['CustEmail'],
            'CustPhone' => $params['CustPhone'],
            'HashValue' => $hash, // The generated checksum
            'LanguageCode' => 'en'
        ]);
        Log::info('Payment Parameters: ' . json_encode($finalParams));
        // 5. Build the final URL
        return $this->paymentUrl . '?' . http_build_query($finalParams);
    }

    // You will also need a separate function for validating the return callback hash
    public function validateCallback($data)
    {
        Log::info('Validating Callback');
        Log::info($data);

        $hash = hash('sha256', $this->verifyKey . $data['TxnID'] . $this->serviceId . $data['PaymentID'] . $data['TxnStatus'] . $data['Amount'] . $data['CurrencyCode'] . $data['AuthCode'] . $data['OrderNumber']);
        Log::info('Calculated Hash: ' . $hash);
        Log::info('Received Hash: ' . $data['HashValue2']);
        if ($hash !== $data['HashValue2']) {
            Log::info('Hash Mismatch');
            return false;
        }

        $payment = Payments::where('payment_id', $data['PaymentID'])->first();

        if (!$payment) {
            Payments::create([
                'payment_id' => $data['PaymentID'],
                'transaction_id' => $data['TxnID'],
                'order_number' => $data['OrderNumber'],
                'payment_method' => $data['PymtMethod'],
                'transaction_status' => $data['TxnStatus'],
                'amount' => $data['Amount'],
                'transaction_message' => $data['TxnMessage'],
                'bank_ref_no' => $data['BankRefNo'],
                'issuing_bank' => $data['IssuingBank'],
                'card_type' => $data['CardType'],
                'card_number' => $data['CardNoMask']
            ]);

            $order = Orders::where('payment_id', $data['PaymentID'])->first();
            $package = PurchasePackage::where('id', $order->package_id)->first();
            $customer_id = Customer::where('user_id', $order->user_id)->first()->id;
            $user = User::where('id', $order->user_id)->first();
            $this->updateWallet(
                $user,
                [
                    'type' => 'purchase',
                    'delta_free' => $package->free_credits,
                    'delta_paid' => $package->paid_credits,
                    'amount_in_rm' => $package->price_in_rm,
                    'description' => 'Purchase of ' . $package->name,
                    'purchase_package_id' => $package->id,
                ],
                $customer_id
            );
        }
        return true;
        // ... logic to re-calculate hash and compare with the returned HashValue ...
    }

    private function updateWallet($user, $package_info, $customer_id)
    {
        // Ensure wallet exists
        $existWallet = CustomerWallet::where('customer_id', $customer_id)->first();
        $wallet = $existWallet ?? CustomerWallet::create([
            'customer_id' => $customer_id,
            'cached_free_credits' => 0,
            'cached_paid_credits' => 0,
        ]);
        Log::info($wallet);
        $transaction = null;

        try {
            DB::transaction(function () use ($wallet, $package_info, &$transaction) {
                $deltaFree = $package_info['delta_free'] ?? 0;
                $deltaPaid = $package_info['delta_paid'] ?? 0;
                $amountInRm = $package_info['amount_in_rm'] ?? 0;

                $transaction = CustomerCreditTransaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'purchase',
                    'before_free_credits' => $wallet->cached_free_credits,
                    'before_paid_credits' => $wallet->cached_paid_credits,
                    'delta_free' => $deltaFree,
                    'delta_paid' => $deltaPaid,
                    'amount_in_rm' => $amountInRm,
                    'description' => $package_info['description'] ?? null,
                    'transaction_id' => $package_info['transaction_id'] ?? null,
                    'purchase_package_id' => $package_info['purchase_package_id'] ?? null,
                ]);

                Log::info($transaction);
                // Update wallet cached credits
                $wallet->cached_free_credits += $deltaFree;
                $wallet->cached_paid_credits += $deltaPaid;

                $wallet->save();

                $expiresAt = null;
                if ($package_info['type'] === 'registration') {
                    $validityDays = (int) Setting::get('registration_bonus_validity', 180);
                    $expiresAt = now()->addDays($validityDays);
                } elseif ($package_info['type'] === 'referral') {
                    $validityDays = (int) Setting::get('referral_bonus_validity', 180);
                    $expiresAt = now()->addDays($validityDays);
                } elseif (!empty($package_info['purchase_package_id'])) {
                    $package = PurchasePackage::find($package_info['purchase_package_id']);
                    $expiresAt = now()->addDays($package->validity_days);
                } else {
                    $expiresAt = now()->addMonths(6);
                }

                if (in_array($package_info['type'], ['registration', 'referral', 'purchase']) && ($deltaFree > 0 || $deltaPaid > 0)) {
                    WalletCreditGrant::create([
                        'wallet_id' => $wallet->id,
                        'grant_type' => in_array($package_info['type'], ['registration', 'referral', 'purchase']) ? $package_info['type'] : 'other',
                        'free_credits' => $deltaFree,
                        'paid_credits' => $deltaPaid,
                        'free_credits_remaining' => $deltaFree,
                        'paid_credits_remaining' => $deltaPaid,
                        'expires_at' => $expiresAt,
                        'purchase_package_id' => $package_info['purchase_package_id'] ?? null,
                        'reference_id' => null,
                        'free_credits_per_rm' => $deltaFree > 0 && $amountInRm > 0 ? $deltaFree / $amountInRm : null,
                        'paid_credits_per_rm' => $deltaPaid > 0 && $amountInRm > 0 ? $deltaPaid / $amountInRm : null,
                    ]);
                }
            });

            Notification::send(
                User::where('role', 'admin')->get(),
                new WalletTransactionNotification($transaction, $user->full_name, $user->id)
            );
        } catch (\Exception $e) {
            Log::error('Wallet update failed: ' . $e->getMessage());
        }
    }
}
