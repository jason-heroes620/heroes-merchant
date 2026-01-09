<?php

namespace App\Http\Controllers;

use App\Mail\OrderSummaryMail;
use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\Customer;
use App\Models\CustomerCreditTransaction;
use App\Models\CustomerWallet;
use App\Models\Event;
use App\Models\EventSlot;
use App\Models\EventSlotPrice;
use App\Models\OrderProducts;
use App\Models\Orders;
use App\Models\Setting;
use App\Models\User;
use App\Models\WalletCreditGrant;
use App\Services\EghlService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ArtFairController extends Controller
{
    public function createOrderAndRegistration(Request $request)
    {
        // handle create order and registration
        Log::info('Creating order and registration');
        $full_name = $request->fullName;
        $email = $request->email;
        $phone = $request->phone;
        $product_id = $request->productId;
        // $product_name = $request->productName;
        $payment_id = $request->paymentId;
        $price = $request->price;

        $desired_length = 6;
        $order_number = 'ORD' . date('ymd') . $this->generateCode($desired_length);

        $user = User::where('email', $email)->first();
        if (!$user) {
            $user = User::create([
                'full_name' => $full_name,
                'password' => Hash::make($phone),
                'email' => $email,
                'contact_number' => $phone,
                'role' => 'customer',
            ]);
        }

        $customer = Customer::firstOrCreate([
            'user_id' => $user->id,
        ], [
            'user_id' => $user->id,
            'referral_code' => strtoupper(Str::random(8)),
        ]);

        $wallet = CustomerWallet::firstOrCreate([
            'customer_id' => $customer->id,
        ], [
            'customer_id' => $customer->id,
            'cached_free_credits' => 0,
            'cached_paid_credits' => 0,
        ]);

        $event = Event::where('id', $product_id)->first();
        $orders = Orders::create([
            'order_number' => $order_number,
            'payment_id' => $payment_id,
            'user_id' => $user->id,
            'product_id' => $product_id,
            'order_status' => 'pending_payment',
            'total' => $price
        ]);

        OrderProducts::create([
            'order_id' => $orders->order_id,
            'is_event' => true,
            'product_id' => $product_id,
            'product_name' => $event->title,
            'qty' => 1,
            'uom' => 'unit',
            'price' => $price,
            'total' => $price,
        ]);
        Log::info('Order and registration created successfully');

        return response()->json([
            'data' => $orders
        ], 200);
    }

    public function eghlCallback(Request $request, EghlService $eghlService)
    {
        // handle eghl callback
        Log::info('EGHL Callback Received');
        // 1. VERY IMPORTANT: Validate the incoming request hash (checksum)
        if (!$eghlService->validateCallback($request->all())) {
            // Log this as a severe security warning
            return response('FAIL', 403);
        }

        $orderNumber = $request->input('OrderNumber');
        $status = $request->input('TxnStatus'); // 0=Success, 1=Fail (Check eGHL Docs)
        $order = Orders::where('order_number', $orderNumber)->first();
        Log::info($order);
        if (!$order) {
            return response('INVALID_ORDER', 404);
        }

        if ($status == '0') {
            $order->order_status = 'paid';
        } else {
            $order->order_status = 'failed';
        }
        $order->save();

        // 2. Notify the mobile app (optional, but highly recommended)
        // This is necessary if the user has closed the browser or app.
        // EghlNotificationService::sendPushNotification($order, $order->user->expo_token);

        // eGHL requires a simple "OK" response for a successful callback receipt.
        return response('OK', 200);
    }

    public function eghlReturn(Request $request, EghlService $eghlService)
    {
        //redirect back to art fair payment summary page
        Log::info('EGHL Callback Received');
        // 1. VERY IMPORTANT: Validate the incoming request hash (checksum)
        if (!$eghlService->validateCallback($request->all())) {
            // Log this as a severe security warning
            return response('FAIL', 403);
        }
        $status = $request->input('TxnStatus'); // 0=Success, 1=Fail
        $orderNumber = $request->input('OrderNumber');
        Log::info('return');
        Log::info($status);
        Log::info($orderNumber);

        $orderNumber = $request->input('OrderNumber');
        $status = $request->input('TxnStatus'); // 0=Success, 1=Fail (Check eGHL Docs)
        $order = Orders::where('order_number', $orderNumber)->first();
        Log::info($order);
        if (!$order) {
            return response('INVALID_ORDER', 404);
        }

        if ($status == '0') {
            $order->order_status = 'paid';
        } else {
            $order->order_status = 'failed';
        }
        $order->save();

        $user = User::select('id', 'full_name', 'email', 'contact_number')
            ->where('id', $order->user_id)->first();
        $orderProduct = OrderProducts::select('order_product_id', 'product_id', 'product_name', 'qty', 'uom', 'price', 'total')
            ->where('order_id', $order->order_id)->get();

        $customer = Customer::select('id')->where('user_id', $user->id)->first();
        $customerWallet = CustomerWallet::select('id', 'customer_id', 'cached_free_credits', 'cached_paid_credits')
            ->where('customer_id', $customer->id)->first();
        $eventSlots = EventSlot::where('event_id', $orderProduct[0]->product_id)->first();
        $eventSlotPrice = EventSlotPrice::where('event_slot_id', $eventSlots->id)->first();

        $data = [
            'type' => 'purchase',
            'delta_free' => $eventSlotPrice->free_credits,
            'delta_paid' => $eventSlotPrice->paid_credits,
            'amount_in_rm' => $eventSlotPrice->price,
            'description' => $orderProduct[0]->product_name,
            'transaction_id' => $request->input('TransactionID'),
            'purchase_package_id' => null,
        ];
        $transaction = null;
        $this->transactions($customerWallet, $data, $transaction);

        $booking = $this->insertBooking($customer, $eventSlots, $customerWallet, 1);
        $payload = json_encode([
            'code' => $booking,
            'ts'   => round(microtime(true) * 1000), // JS Date.now()
        ]);

        // Encrypt using Laravel APP_KEY
        $encrypted = $this->encryptData($payload);
        $qrCodeSvg = QrCode::format('svg')
            ->size(200)
            ->errorCorrection('H')
            ->generate($encrypted);

        try {
            Mail::bcc(['jason.w@heroes.my'])
                ->to($user->email)
                ->later(now()->addMinutes(0), new OrderSummaryMail($user, $order, $orderProduct, $qrCodeSvg));
        } catch (\Exception $e) {
            Log::error('Order Summary email send failed: ' . $e->getMessage() . $orderNumber);
        }

        // Redirect the user's browser back to the mobile app
        return redirect()->away(config('services.eghl.artFairReturn') . '/' . $orderNumber . '/' . $status);
    }

    private function generateCode($n)
    {
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $randomString = '';

        for ($i = 0; $i < $n; $i++) {
            $index = rand(0, strlen($characters) - 1);
            $randomString .= $characters[$index];
        }

        return $randomString;
    }

    private function transactions($wallet, $data, $transaction)
    {
        $transaction = null;

        DB::transaction(function () use ($wallet, $data, &$transaction) {
            $deltaFree = $data['delta_free'] ?? 0;
            $deltaPaid = $data['delta_paid'] ?? 0;
            $amountInRm = $data['amount_in_rm'] ?? 0;

            $transaction = CustomerCreditTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => $data['type'],
                'before_free_credits' => $wallet->cached_free_credits,
                'before_paid_credits' => $wallet->cached_paid_credits,
                'delta_free' => $deltaFree,
                'delta_paid' => $deltaPaid,
                'amount_in_rm' => $amountInRm,
                'description' => $data['description'] ?? null,
                'transaction_id' => $data['transaction_id'] ?? null,
                'purchase_package_id' => $data['purchase_package_id'] ?? null,
            ]);

            // Update wallet cached credits
            $wallet->cached_free_credits += $deltaFree;
            $wallet->cached_paid_credits += $deltaPaid;

            $wallet->save();

            $expiresAt = null;
            if ($data['type'] === 'registration') {
                $validityDays = (int) Setting::get('registration_bonus_validity', 180);
                $expiresAt = now()->addDays($validityDays);
            } elseif ($data['type'] === 'referral') {
                $validityDays = (int) Setting::get('referral_bonus_validity', 180);
                $expiresAt = now()->addDays($validityDays);
            } else {
                $expiresAt = now()->addMonths(6);
            }

            if (in_array($data['type'], ['registration', 'referral', 'purchase']) && ($deltaFree > 0 || $deltaPaid > 0)) {
                WalletCreditGrant::create([
                    'wallet_id' => $wallet->id,
                    'grant_type' => in_array($data['type'], ['registration', 'referral', 'purchase']) ? $data['type'] : 'other',
                    'free_credits' => $deltaFree,
                    'paid_credits' => $deltaPaid,
                    'free_credits_remaining' => $deltaFree,
                    'paid_credits_remaining' => $deltaPaid,
                    'expires_at' => $expiresAt,
                    'purchase_package_id' => $data['purchase_package_id'] ?? null,
                    'reference_id' => null,
                    'free_credits_per_rm' => $deltaFree > 0 && $amountInRm > 0 ? $deltaFree / $amountInRm : null,
                    'paid_credits_per_rm' => $deltaPaid > 0 && $amountInRm > 0 ? $deltaPaid / $amountInRm : null,
                ]);
            }
        });
    }

    private function insertBooking($customer, $eventSlots, $wallet, $qty)
    {
        $booking = Booking::create([
            'customer_id' => $customer->id,
            'event_id' => $eventSlots->event_id,
            'slot_id' => $eventSlots->id,
            'wallet_id' => $wallet->id,
            'status' => 'confirmed',
            'booked_at' => now(),
            'quantity' => $qty,
        ]);

        BookingItem::create([
            'booking_id' => $booking->id,
            'quantity' => $qty,
        ]);

        return $booking->booking_code;
    }

    private const IV = '1234567890abcdef';
    private function encryptData($data)
    {
        $secret = env('SECRET_KEY');
        $encrypted = openssl_encrypt(
            $data,
            'AES-256-CBC',
            $secret,
            OPENSSL_RAW_DATA,
            self::IV
        );

        return base64_encode($encrypted);
    }
}
