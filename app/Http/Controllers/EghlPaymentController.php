<?php

namespace App\Http\Controllers;

use App\Models\OrderProducts;
use App\Models\Orders;
use App\Models\Cart;
use App\Models\CartItem;
use App\Services\EghlService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EghlPaymentController extends Controller
{
    public function create(Request $request)
    {
        $total = number_format($request->total, 2, '.', '');
        $orderId = 'ORD-' . Str::uuid();

        $serviceId = config('services.eghl.service_id');
        $password = config('services.eghl.password');
        $paymentId = '1';
        $returnUrl = config('services.eghl.return');
        $callbackUrl = config('services.eghl.callback');

        // 🔐 eGHL signature (example MD5)
        $hash = md5(
            $password .
                $serviceId .
                $paymentId .
                $returnUrl .
                $callbackUrl .
                $total .
                'MYR'
        );

        $html = view('eghl.eghlpayment', [
            'paymentUrl' => config('services.eghl.payment_url'),
            'serviceId' => $serviceId,
            'orderId' => $paymentId,
            'description' => '',
            'hash' => $hash,
            'returnUrl' => $returnUrl,
            'callbackUrl' => $callbackUrl,
            'total' => $total,
            'currency' => 'MYR',
            'customerName' => '',
            'customerEmail' => '',
            'customerPhone' => '',
            'hashValue' => $hash,
        ])->render();

        return response()->json([
            'order_id' => $orderId,
            'html' => $html,
        ]);
    }

    public function initiate(Request $request, EghlService $eghlService)
    {
        $customer = $request->user()->customer ?? null;
        if (!$customer) {
            return response()->json(['message' => 'Customer record not found.'], 404);
        }

        $cart = Cart::where('customer_id', $customer->id)
            ->where('status', 'active')
            ->with('items')
            ->firstOrFail();

        $amount = $cart->total_rm;

        $paymentDesc = $cart->items
            ->map(function (CartItem $item) {
                if ($item->purchase_package_id) {
                    return $item->package_name;
                } elseif ($item->event_slot_id) {
                    return str_replace("\n", " | ", $this->buildEventDisplayName($item));
                }
                return null;
            })
            ->filter()
            ->implode(', ');

        $paymentId = $request->payment_id;
        $order_number = 'ORD' . date('ymd') . $this->generateCode(6);

        $order = Orders::create([
            'order_number' => $order_number,
            'payment_id' => $paymentId,
            'user_id' => $request->user()->id,
            'total' => $amount,
            'order_status' => 'pending_payment',
        ]);

        foreach ($cart->items as $item) {
            $this->createOrderProductFromCartItem($order, $item);
        }

        $redirectScheme = env('APP_SCHEME') . "://payment/result?order_number={$order_number}";

        $eghlParams = [
            'PaymentID' => $paymentId,
            'Amount' => number_format($amount, 2, '.', ''),
            'CustEmail' => $request->user()->email,
            'CustName' => $request->user()->name,
            'CustPhone' => $request->user()->phone,
            'PymtMethod' => 'ANY',
            'OrderNumber' => $order_number,
            'PaymentDesc' => $paymentDesc,
            'MerchantReturnURL' => $redirectScheme,
            'MerchantCallbackURL' => env("EGHL_CALLBACK_URL")
        ];

        $eghlUrl = $eghlService->generateEghlRequest($eghlParams);
        $order->update(['eghl_url' => $eghlUrl, 'status' => 'pending_payment']);

        return response()->json(['eghl_url' => $eghlUrl, 'order_number' => $order_number]);
    }

    protected function createOrderProductFromCartItem(Orders $order, CartItem $item): void
    {
        if ($item->purchase_package_id) {
            $productId = $item->purchase_package_id;
            $flags = ['is_package' => true, 'is_event' => false, 'is_product' => false];
            $name = $item->package_name;
        } elseif ($item->event_slot_id) {
            $productId = $item->event_slot_id;
            $flags = ['is_package' => false, 'is_event' => true, 'is_product' => false];
            $name = $this->buildEventDisplayName($item);
        } else {
            return;
        }

        OrderProducts::create([
            'order_id' => $order->order_id,
            'product_id' => $productId,
            ...$flags,
            'product_name' => $name,
            'qty' => 1,
            'uom' => 'unit',
            'price' => $item->price_in_rm,
            'total' => $item->price_in_rm,
            'reward' => $item->free_credits ?? 0,
        ]);
    }

    protected function buildEventDisplayName(CartItem $item): string
    {
        $lines = [];

        // Event title
        if ($item->event_title) {
            $lines[] = $item->event_title;
        }

        // Slot date + time
        $slotParts = [];

        if ($item->slot_date) {
            $slotParts[] = $item->slot_date;
        }

        if ($item->slot_start_time && $item->slot_end_time) {
            $slotParts[] =
                $item->slot_start_time->format('H:i') .
                '–' .
                $item->slot_end_time->format('H:i');
        }

        if ($slotParts) {
            $lines[] = '• ' . implode(' · ', $slotParts);
        }

        // Age group label
        $lines[] = '  ◦ ' . ($item->age_group_label ?: 'All ages');

        return implode("\n", $lines);
    }

    public function paymentStatus(Request $request)
    {
        $order_number = $request->order_number;
        $order = Orders::where('order_number', $order_number)->first()->order_status;
        Log::info('Order Status: ' . $order);
        return response()->json($order, 200);
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
}
