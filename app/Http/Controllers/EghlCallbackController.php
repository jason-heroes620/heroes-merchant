<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Orders;
use App\Services\EghlService;
use Illuminate\Support\Facades\Log;

// You might also need a service for sending Expo Notifications

class EghlCallbackController extends Controller
{
    // 1. SECURE SERVER-TO-SERVER CALLBACK (POST)
    public function handleCallback(Request $request, EghlService $eghlService)
    {
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

    // 2. BROWSER RETURN URL (GET)
    // The user's browser hits this, and Laravel immediately redirects to the Deep Link.
    public function handleReturn(Request $request)
    {
        // We trust the secure callback for final status, but this URL passes data to the app.

        $status = $request->input('TxnStatus'); // 0=Success, 1=Fail
        $orderNumber = $request->input('OrderNumber');
        Log::info('return');
        Log::info($status);
        Log::info($orderNumber);
        // Construct the deep link URL with relevant query parameters
        $deepLinkUrl = env('APP_SCHEME') . "://payment/result?order_number={$orderNumber}&status={$status}";

        // Redirect the user's browser back to the mobile app
        return redirect()->away($deepLinkUrl);
    }
}
