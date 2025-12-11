<?php

namespace App\Http\Controllers;

use App\Models\Merchant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class MerchantController extends Controller
{
    // 🔹 Show create merchant form
    public function create()
    {
        return inertia('Admin/CreateMerchant');
    }

    // 🔹 Store new merchant
    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'contact_number' => 'nullable|string|max:20',
            'street_name' => 'nullable|string|max:255',
            'postcode'    => 'nullable|integer',
            'city'        => 'nullable|string|max:255',
            'state'       => 'nullable|string|max:255',
            'country'     => 'nullable|string|max:255',
            'company_name' => 'required|string|max:255',
            'business_registration_number' => 'nullable|string|max:255',
            'company_details' => 'nullable|string',
        ]);

        // Create user
        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'merchant',
            'contact_number' => $request->contact_number,
            'street_name'    => $request->street_name,
            'postcode'       => $request->postcode,
            'city'           => $request->city,
            'state'          => $request->state,
            'country'        => $request->country,
        ]);

        // Create merchant profile
        Merchant::create([
            'user_id' => $user->id,
            'company_name' => $request->company_name,
            'business_registration_number' => $request->business_registration_number,
            'company_details' => $request->company_details,
            'business_status' => 'pending_verification',
        ]);

        return redirect()->route('admin.merchants.index')->with('success', 'Merchant created successfully!');
    }

    // 🔹 List all merchants (for admin)
    public function index()
    {
        $merchants = Merchant::with('user')->get();
        return inertia('Admin/MerchantList', [
            'merchants' => $merchants,
        ]);
    }

    // 🔹 View a specific merchant's profile 
    public function showProfile($id)
    {
        $merchant = Merchant::with('user')->findOrFail($id);

        return inertia('Admin/ViewMerchantProfile', [
            'merchant' => $merchant,
        ]);
    }

    // 🔹 Update merchant details (user info, status, rejection reason, etc.)
    public function update(Request $request, $id)
    {
        $merchant = Merchant::with('user')->findOrFail($id);

        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($merchant->user_id),
            ],
            'password' => 'nullable|string|min:8|confirmed',
            'contact_number' => 'nullable|string|max:20',
            'street_name' => 'nullable|string|max:255',
            'postcode'    => 'nullable|integer',
            'city'        => 'nullable|string|max:255',
            'state'       => 'nullable|string|max:255',
            'country'     => 'nullable|string|max:255',
            'company_name' => 'required|string|max:255',
            'business_registration_number' => 'nullable|string|max:255',
            'company_details' => 'nullable|string',
            'business_status' => 'required|in:verified,pending_verification,rejected',
            'rejection_reason' => 'nullable|string',
        ]);

        // Update user information
        $userData = [
            'full_name' => $request->full_name,
            'email' => $request->email,
            'contact_number' => $request->contact_number,
            'street_name'    => $request->street_name,
            'postcode'       => $request->postcode,
            'city'           => $request->city,
            'state'          => $request->state,
            'country'        => $request->country,
        ];

        // Only update password if provided
        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $merchant->user->update($userData);

        // Update merchant information
        $merchant->update([
            'company_name' => $request->company_name,
            'business_registration_number' => $request->business_registration_number,
            'company_details' => $request->company_details,
            'business_status' => $request->business_status,
            'rejection_reason' => $request->rejection_reason,
        ]);

        return redirect()->route('admin.merchants.index')->with('success', 'Merchant updated successfully!');
    }
}
