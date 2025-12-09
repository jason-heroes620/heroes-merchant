<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;

class CustomerController extends Controller
{
    // 🔹 Show create customer form
    public function create()
    {
        return inertia('Admin/CreateCustomer');
    }

    // 🔹 Store new customer
    public function store(Request $request, WalletService $walletService)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'contact_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'device_id' => 'nullable|string|unique:customers,device_id,',
        ]);

        // Create user
        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'customer',
            'contact_number' => $request->contact_number,
            'address' => $request->address,
        ]);

        // Create customer profile
        $customer = Customer::create([
            'user_id' => $user->id,
            'date_of_birth' => $request->date_of_birth ?? null,
            'device_id' => $request->device_id ?? null,
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

        return redirect()->route('admin.customers.index')->with('success', 'Customer created successfully!');
    }

     // 🔹 List all customers (for admin)
    public function index()
    {
        $customers = Customer::with(['user', 'referrer'])->get();
        return inertia('Admin/CustomerList', [
            'customers' => $customers,
        ]);
    }

    // 🔹 Show specific customer
    public function showProfile($id)
    {
        $customer = Customer::with(['user', 'referrer.user', 'referees.user'])->findOrFail($id);
        return inertia('Admin/ViewCustomerProfile', [
            'customer' => $customer,
        ]);
    }

    // 🔹 Update customer details
    public function update(Request $request, $id)
    {
        $customer = Customer::with('user')->findOrFail($id);

        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($customer->user_id),
            ],
            'password' => 'nullable|string|min:8|confirmed',
            'contact_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
        ]);

        // Update user information
        $userData = [
            'full_name' => $request->full_name,
            'email' => $request->email,
            'contact_number' => $request->contact_number,
            'address' => $request->address,
        ];

        // Only update password if provided
        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $customer->user->update($userData);

        // Update customer information
        $customer->update([
            'date_of_birth' => $request->date_of_birth ?? null,
            'device_id' => $request->device_id ?? null,
            'referred_by' => $request->referred_by ?? null,
        ]);

        return redirect()->route('admin.customers.index')->with('success', 'Customer updated successfully!');
    }

    public function wallet($id)
    {
        $customer = Customer::with('user')->findOrFail($id);

        $wallet = [
            'free_credits' => $customer->wallet?->cached_free_credits ?? 0,
            'paid_credits' => $customer->wallet?->cached_paid_credits ?? 0,
        ];

        $transactions = $customer->wallet?->transactions()
            ->where('created_at', '>=', now()->subMonths(6))
            ->orderBy('created_at', 'desc')
            ->get() ?? [];

        $credit_grants = $customer->wallet?->creditGrants()
            ->orderBy('created_at', 'desc')
            ->get() ?? [];

        return inertia('Admin/ViewCustomerTransaction', [
            'customer' => $customer,
            'wallet' => $wallet,
            'transactions' => $transactions,
            'credit_grants' => $credit_grants,
        ]);
    }

    public function exportPdf(Customer $customer)
    {
        $wallet = $customer->wallet;
        $credit_grants = $customer->wallet?->creditGrants()->get();
        $transactions = $customer->wallet?->transactions()->latest()->get();

        $pdf = Pdf::loadView('pdf', [
            'customer' => $customer,
            'wallet' => $wallet,
            'credit_grants' => $credit_grants,
            'transactions' => $transactions,
        ]);

        return $pdf->download("{$customer->user->full_name}_transactions.pdf");
    }

    // Show referral page for a specific customer
    public function viewReferral($id)
    {
        $customer = Customer::with([
            'user',                  
            'referrer.user',         
            'referees.user',       
            'wallet.creditGrants'     
        ])->findOrFail($id);

        // Calculate total referral bonus earned
        $referralBonuses = $customer->wallet?->creditGrants
            ->where('grant_type', 'bonus')
            ->whereNotNull('reference_id') ?? collect();

        $totalFreeBonus = $referralBonuses->sum('free_credits');

        if (request()->wantsJson()) {
            return response()->json([
                'customer' => $customer,
                'referrer' => $customer->referrer ? [
                    'id' => $customer->referrer->id,
                    'name' => $customer->referrer->user->full_name,
                    'email' => $customer->referrer->user->email,
                ] : null,
                'referees' => $customer->referees->map(fn($r) => [
                    'id' => $r->id,
                    'name' => $r->user->full_name,
                    'email' => $r->user->email,
                    'referral_code' => $r->referral_code,
                    'created_at' => $r->created_at,
                ]),
                'referral_bonus' => [
                    'free' => $totalFreeBonus,
                ],
            ]);
        }

        return inertia('Admin/ViewReferralPage', [
            'customer' => $customer,
            'referrer' => $customer->referrer ? [
                'id' => $customer->referrer->id,
                'name' => $customer->referrer->user->full_name,
                'profile_picture' => $customer->referrer->user->profile_picture,
                'email' => $customer->referrer->user->email,
            ] : null,
            'referees' => $customer->referees->map(fn($r) => [
                'id' => $r->id,
                'name' => $r->user->full_name,
                'email' => $r->user->email,
                'profile_picture' => $r->user->profile_picture,
                'referral_code' => $r->referral_code,
                'created_at' => $r->created_at,
            ]),
            'referral_bonus' => [
                'free' => $totalFreeBonus,
            ],
        ]);
    }
}
