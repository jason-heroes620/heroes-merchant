<?php

namespace App\Http\Controllers;

use App\Models\Orders;
use Illuminate\Http\Request;

class OrdersController extends Controller
{
    public function getOrderByOrderNumber($orderNumber)
    {
        $order = Orders::with(['products'])->where('order_number', $orderNumber)->first();

        return response()->json($order);
    }
}
