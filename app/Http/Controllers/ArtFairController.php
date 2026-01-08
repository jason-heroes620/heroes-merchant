<?php

namespace App\Http\Controllers;

use App\Models\OrderProducts;
use App\Models\Orders;
use App\Models\User;
use App\Services\EghlService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

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
        $product_name = $request->productName;
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
            'product_name' => $product_name,
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
}
