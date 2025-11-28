<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Merchant;
use App\Models\Customer;
use App\Models\CustomerWallet;
use App\Models\PurchasePackage;
use App\Models\CustomerCreditTransaction;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Carbon\Carbon;

class AuthController extends Controller
{
     /* Show login page (Web only)*/
    public function showLogin()
    {
        Log::info('Accessed login page');
        return Inertia::render('Auth');
    }

    /**Register (Web = merchant only, API = any role)*/
    public function register(Request $request, WalletService $walletService)
    {
        Log::info('Register request received', $request->all());

        $isApi = $request->expectsJson();

        $rules = [
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ];

        if ($isApi) {
            $rules['role'] = 'required|string|in:customer,merchant,admin';
            $rules['device_id'] = 'required|string';
            $rules['referrer_code'] = 'nullable|string';
        } else {
            $rules['company_name'] = 'required|string|max:255';
        }

        $validated = $request->validate($rules);

        $role = $isApi ? $validated['role'] : 'merchant';

         // Prevent duplicate device ID for API customers
        if ($isApi && $role === 'customer') {
            $existingCustomer = \App\Models\Customer::where('device_id', $validated['device_id'])->first();
            if ($existingCustomer) {
                return response()->json([
                    'message' => 'This device is already registered with another account.'
                ], 422);
            }
        }

        $user = User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role,
        ]);

        Log::info('User registered successfully', ['user_id' => $user->id]);

        // Create Merchant profile for web or if API merchant
        if (!$isApi || $role === 'merchant') {
            Merchant::create([
                'user_id' => $user->id,
                'company_name' => $validated['company_name'] ?? 'N/A',
                'business_status' => 'pending_verification',
            ]);
        }

        // Create customer profile if API customer
        if ($isApi && $role === 'customer') {
            $customer = \App\Models\Customer::create([
                'user_id' => $user->id,
                'device_id' => $validated['device_id'],
            ]);

            if (!empty($validated['referrer_code'])) {
                $referrer = Customer::where('referral_code', $validated['referrer_code'])->first();
                if ($referrer) {
                    $customer->referred_by = $referrer->id;
                    $customer->save();
                }
            }
 
            $walletService->registrationBonus($customer);

            $walletService->referralBonus($customer);
        }

        // Response handling
        if ($isApi) {
            $token = $user->createToken('api_token')->plainTextToken;
            return response()->json([
                'message' => 'Registration successful',
                'user' => $user,
                'token' => $token,
            ], 201);
        }

        Auth::login($user);
        return redirect()->route('events')->with('success', 'Registration successful!');
    }

    /**Login (Web = session, API = token)*/
    public function login(Request $request)
    {
        Log::info('Login attempt', $request->only('email'));
        $isApi = $request->expectsJson();

        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($isApi) {
            // API (React Native)
            $user = User::where('email', $credentials['email'])->first();

            if (! $user || ! Hash::check($credentials['password'], $user->password)) {
                Log::warning('Login failed', ['email' => $request->email]);
                throw ValidationException::withMessages([
                    'email' => ['Invalid credentials.'],
                ]);
            }

            $token = $user->createToken('api_token')->plainTextToken;
            Log::info('Login successful (API)', ['user_id' => $user->id]);

            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'token' => $token,
            ]);
        } else {
            // Web (Inertia)
            if (Auth::attempt($credentials)) {
                $request->session()->regenerate();
                Log::info('Login successful (Web)', ['user_id' => Auth::id()]);
                return redirect()->route('dashboard');
            }

            Log::warning('Login failed (Web)', ['email' => $request->email]);
            return back()->withErrors(['email' => 'Invalid credentials.']);
        }
    }

    /**Logout (Web or API)*/
    public function logout(Request $request)
    {
        if ($request->expectsJson()) {
            // API logout
            $request->user()->tokens()->delete();
            Log::info('Logout successful (API)', ['user_id' => $request->user()->id]);
            return response()->json(['message' => 'Logged out successfully']);
        }

        // Web logout
        Log::info('User logged out (Web)', ['user_id' => Auth::id()]);
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**Password reset link (shared)*/
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $status = Password::sendResetLink($request->only('email'));

        if ($request->expectsJson()) {
            return $status === Password::RESET_LINK_SENT
                ? response()->json(['message' => __($status)])
                : response()->json(['message' => __($status)], 400);
        }

        return $status === Password::RESET_LINK_SENT
            ? back()->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    }

    /**Password reset (shared)*/
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
            }
        );

        if ($request->expectsJson()) {
            return $status === Password::PASSWORD_RESET
                ? response()->json(['message' => __($status)])
                : response()->json(['message' => __($status)], 400);
        }

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('login')->with('status', __($status))
            : back()->withErrors(['email' => [__($status)]]);
    }

    public function profile(Request $request)
{
    return response()->json(['user' => $request->user()]);
}

}
