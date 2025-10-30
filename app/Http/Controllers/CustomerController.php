<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    // 🔹 Show create customer form
    public function create()
    {
        return inertia('Admin/CreateCustomer');
    }

    // 🔹 Store new customer
    public function store(Request $request)
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
        Customer::create([
            'user_id' => $user->id,
            'date_of_birth' => $request->date_of_birth ?? null,
            'device_id' => $request->device_id ?? null,
            'referred_by' => $request->referred_by ?? null,
        ]);

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
        $customer = Customer::with(['user', 'referrer', 'referees'])->findOrFail($id);
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
}
