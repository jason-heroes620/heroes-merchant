<?php

namespace App\Http\Controllers;

use App\Models\Merchant;
use Illuminate\Http\Request;

class MerchantController extends Controller
{
    // 🔹 Get all merchants
    public function index()
    {
        $merchants = Merchant::with('user')->get();
        return response()->json($merchants);
    }

    // 🔹 Show specific merchant
    public function show($id)
    {
        $merchant = Merchant::with('user')->findOrFail($id);
        return response()->json($merchant);
    }

    // 🔹 Update merchant details
    public function update(Request $request, $id)
    {
        $merchant = Merchant::findOrFail($id);

        $merchant->update($request->only([
            'company_name',
            'business_registration_number',
            'company_details',
            'business_status',
            'rejection_reason',
        ]));

        return response()->json([
            'message' => 'Merchant updated successfully',
            'merchant' => $merchant,
        ]);
    }

    // 🔹 Soft deactivate merchant (and linked user)
    public function deactivate($id)
    {
        $merchant = Merchant::with('user')->findOrFail($id);

        if ($merchant->user) {
            $merchant->user->update(['status' => 'inactive']);
        }

        return response()->json(['message' => 'Merchant deactivated successfully']);
    }
}
