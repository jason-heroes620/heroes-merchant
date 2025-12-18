<?php

namespace App\Http\Controllers;

use App\Models\Orders;
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
            'orderId' => $orderId,
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
        $paymentId = $request->payment_id;
        $amount = $request->amount;
        $paymentDesc = $request->payment_desc;
        $packageId = $request->package_id;

        $redirectScheme = env('APP_SCHEME') . '://payment/result';

        $desired_length = 6;
        $order_number = 'ORD-' . sprintf("%0{$desired_length}d", Orders::whereYear('created_at', '=', date('Y'))->count() + 1);
        Log::info('payment id' . $request);
        $order = Orders::create([
            'order_number' => $order_number,
            'payment_id' => $paymentId,
            'user_id' => Auth::id(),
            'package_id' => $packageId,
            'product' => $paymentDesc,
            'quantity' => 1,
            'price' => $amount,
            'order_status' => 'pending_payment',
        ]); // Load and validate order

        // The Deep Link URL for the Expo App
        $redirectScheme = env('APP_SCHEME') . "://payment/result?order_number={$order_number}";

        // Define all required eGHL parameters
        $eghlParams = [
            'PaymentID' => $paymentId,
            'Amount' => number_format($amount, 2, '.', ''), // Must be in correct format
            'CustEmail' => Auth::user()->email,
            'CustName' => Auth::user()->name,
            'CustPhone' => Auth::user()->phone,
            'PymtMethod' => 'ANY',
            'OrderNumber' => $order_number,
            'PaymentDesc' => $paymentDesc,
            'MerchantReturnURL' => $redirectScheme, // Deep link to return to mobile app
            // 'MerchantCallbackURL' => route('eghl.callback')
            'MerchantCallbackURL' => env("EGHL_CALLBACK_URL")
        ];

        // Generate the full eGHL URL with the HashValue (Checksum)
        $eghlUrl = $eghlService->generateEghlRequest($eghlParams);

        // Optional: Save transaction ID or URL for logging
        $order->update(['eghl_url' => $eghlUrl, 'status' => 'pending_payment']);

        return response()->json(['eghl_url' => $eghlUrl]);
    }

    public function paymentStatus(Request $request)
    {
        $order_number = $request->order_number;
        $order = Orders::where('order_number', $order_number)->first()->order_status;
        Log::info('Order Status: ' . $order);
        return response()->json($order, 200);
    }
}
