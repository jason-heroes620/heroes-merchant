<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    // 🔹 Get all customers
    public function index()
    {
        $customers = Customer::with(['user', 'referrer'])->get();
        return response()->json($customers);
    }

    // 🔹 Show specific customer
    public function show($id)
    {
        $customer = Customer::with(['user', 'referrer', 'referees'])->findOrFail($id);
        return response()->json($customer);
    }

    // 🔹 Update customer details
    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $customer->update($request->only([
            'date_of_birth',
            'device_id',
            'referred_by',
        ]));

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer,
        ]);
    }

    // 🔹 Soft deactivate customer (and linked user)
    public function deactivate($id)
    {
        $customer = Customer::with('user')->findOrFail($id);

        if ($customer->user) {
            $customer->user->update(['status' => 'inactive']);
        }

        return response()->json(['message' => 'Customer deactivated successfully']);
    }
}
