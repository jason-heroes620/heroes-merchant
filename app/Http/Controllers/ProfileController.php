<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Merchant;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    /** Show current user's profile */
    public function show(Request $request)
    {
        $user = Auth::user()->load(['merchant', 'customer.wallet']);

        $profile = [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'profile_picture' => $user->profile_picture,
        ];

        $details = [
            'email' => $user->email,
            'contact_number' => $user->contact_number,
            'address' => $user->address,
            'role' => $user->role,
            'merchant' => $user->merchant,
            'customer' => $user->customer,
        ];

        if ($request->wantsJson()) {
            return response()->json([
                'profile' => $profile,
                'details' => $details,
            ]);
        }

        return Inertia::render('Profile', [
            'user' => $user,
            'profile' => $profile,
            'details' => $details,
        ]);
    }

    /** Update profile */
    public function update(Request $request)
    {
        $user = Auth::user();

        \Log::info('Incoming profile update data:', $request->all());

        $validated = $request->validate([
            'full_name' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'company_name' => 'nullable|string|max:255',
            'business_registration_number' => 'nullable|string|max:255',
            'company_details' => 'nullable|string|max:1000',
            'date_of_birth' => 'nullable|date',
            'device_id' => 'nullable|string|unique:customers,device_id,' . optional($user->customer)->id,
        ]);

        DB::transaction(function () use ($user, $request, $validated) {

            // Handle profile picture upload
            if ($request->hasFile('profile_picture')) {
                if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
                    Storage::disk('public')->delete($user->profile_picture);
                }
                $user->profile_picture = $request->file('profile_picture')->store('profile_pictures', 'public');
            }

            // Update base user info
            $user->fill([
                'full_name' => $validated['full_name'] ?? $user->full_name,
                'contact_number' => $validated['contact_number'] ?? $user->contact_number,
                'address' => $validated['address'] ?? $user->address,
            ])->save();

            // Update merchant details
            if ($user->role === 'merchant' && $user->merchant) {
                $user->merchant->update([
                    'company_name' => $validated['company_name'] ?? $user->merchant->company_name,
                    'business_registration_number' => $validated['business_registration_number'] ?? $user->merchant->business_registration_number,
                    'company_details' => $validated['company_details'] ?? $user->merchant->company_details,
                ]);
            }

            // Update customer details
            if ($user->role === 'customer') {
                $customer = $user->customer ?? Customer::create(['user_id' => $user->id]);

                $customer->date_of_birth = $validated['date_of_birth'] ?? $customer->date_of_birth;
                if ($customer->date_of_birth) {
                    $customer->age = Carbon::parse($customer->date_of_birth)->age;
                }

                if (!empty($validated['device_id'])) {
                    $customer->device_id = $validated['device_id'];
                }

                if (!$customer->referral_code) {
                    do {
                        $code = strtoupper(Str::random(8));
                    } while (Customer::where('referral_code', $code)->exists());
                    $customer->referral_code = $code;
                }

                $customer->save();
            }
        });

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Profile updated successfully.',
                'user' => $user->load(['merchant', 'customer']),
            ]);
        }

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }

    /** Change password */
    public function changePassword(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return $request->wantsJson()
                ? response()->json(['error' => 'Current password is incorrect.'], 422)
                : back()->withErrors(['current_password' => 'Current password is incorrect.']);
        }

        if (Hash::check($validated['new_password'], $user->password)) {
            return $request->wantsJson()
                ? response()->json(['error' => 'New password cannot be the same as your current password.'], 422)
                : back()->withErrors(['new_password' => 'New password cannot be the same as your current password.']);
        }

        $user->update(['password' => Hash::make($validated['new_password'])]);

        return $request->wantsJson()
            ? response()->json(['message' => 'Password changed successfully.'])
            : redirect()->back()->with('success', 'Password changed successfully.');
    }

    /** Deactivate account */
    public function destroy(Request $request)
    {
        $user = Auth::user();
        $user->status = 'inactive';
        $user->save();

        if ($request->wantsJson()) {
            $user->tokens()->delete();
            return response()->json(['message' => 'Account deactivated successfully.']);
        }

        return redirect()->back()->with('success', 'Account deactivated successfully.');
    }
}
