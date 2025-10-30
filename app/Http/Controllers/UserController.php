<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Merchant;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    // 🔹 Get all users with their related profiles
    public function index()
    {
        $users = User::with(['merchant', 'customer'])->get();
        return response()->json($users);
    }

    // 🔹 Show a specific user
    public function show($id)
    {
        $user = User::with(['merchant', 'customer'])->findOrFail($id);
        return response()->json($user);
    }

    // 🔹 Create a new user (auto-create merchant or customer profile)
    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email'     => 'required|string|email|max:255|unique:users',
            'password'  => 'required|string|min:8|confirmed',
            'role'      => 'required|in:admin,merchant,customer',
            'contact_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $profilePicturePath = null;
        if ($request->hasFile('profile_picture')) {
            $profilePicturePath = $request->file('profile_picture')->store('profile_pictures', 'public');
        }

        $user = User::create([
            'full_name' => $request->full_name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role'      => $request->role,
            'contact_number' => $request->contact_number,
            'address' => $request->address,
            'profile_picture' => $profilePicturePath,
        ]);

        // ✅ Auto-create merchant or customer profile
        if ($user->role === 'merchant') {
            Merchant::create([
                'user_id' => $user->id,
                'company_name' => $request->company_name ?? 'Unnamed Merchant',
                'business_registration_number' => $request->business_registration_number ?? null,
                'company_details' => $request->company_details ?? null,
            ]);
        } elseif ($user->role === 'customer') {
            Customer::create([
                'user_id' => $user->id,
                'date_of_birth' => $request->date_of_birth ?? null,
                'device_id' => $request->device_id ?? null,
                'referred_by' => $request->referred_by ?? null,
            ]);
        }

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load('merchant', 'customer'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::with(['merchant', 'customer'])->findOrFail($id);

        $request->validate([
            'full_name' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $user->id,
            'contact_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,inactive',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Update basic info
        $data = $request->only(['full_name', 'email', 'contact_number', 'address', 'status']);
        $user->update($data);

        // Handle image upload
        if ($request->hasFile('profile_picture')) {
            if ($user->profile_picture) {
                Storage::disk('public')->delete($user->profile_picture);
            }
            $user->profile_picture = $request->file('profile_picture')->store('profile_pictures', 'public');
        }

        // Update related profile
        if ($user->role === 'merchant' && $user->merchant) {
            $user->merchant->update($request->only([
                'company_name',
                'business_registration_number',
                'company_details',
                'business_status',
                'rejection_reason',
            ]));
        } elseif ($user->role === 'customer' && $user->customer) {
            $user->customer->update($request->only([
                'date_of_birth',
                'device_id',
                'referred_by',
            ]));
        }

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load('merchant', 'customer'),
        ]);
    }

    // 🔹 Soft delete (deactivate)
    public function deactivate($id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'inactive']);

        return response()->json(['message' => 'User deactivated successfully']);
    }
}
