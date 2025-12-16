<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PurchasePackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PurchasePackageController extends Controller
{
    private function checkAdmin()
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized');
        }
    }

    public function index(Request $request)
    {
        $packages = PurchasePackage::orderBy('effective_from', 'desc')->get();

        if ($request->expectsJson()) {
            return response()->json([
                'data' => $packages
            ]);
        }

        return Inertia::render('Admin/PurchasePackages/Index', compact('packages'));
    }

    public function create()
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('Admin/PurchasePackages/Create');
    }

    public function store(Request $request)
    {
        $this->checkAdmin();

        $request->merge([
            'validity_days' => $request->input('validity_days', 180),
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price_in_rm' => 'nullable|numeric|min:0',
            'paid_credits' => 'nullable|integer|min:0',
            'free_credits' => 'nullable|integer|min:0',
            'effective_from' => 'required|date',
            'valid_until' => 'nullable|date|after_or_equal:effective_from',
            'validity_days' => 'integer|min:1',
            'active' => 'boolean',
            'best_value' => 'boolean',
        ]);

        PurchasePackage::create($validated);

        return redirect()->route('admin.packages.index')
            ->with('success', 'Package created successfully!');
    }

    public function edit(PurchasePackage $package)
    {
        $this->checkAdmin();

        return inertia('Admin/PurchasePackages/Edit', [
            'pkg' => [
                ...$package->toArray(),
                'effective_from' => $package->effective_from
                    ? $package->effective_from->format('Y-m-d\TH:i')
                    : null,
                'valid_until' => $package->valid_until
                    ? $package->valid_until->format('Y-m-d\TH:i')
                    : null,
            ]
        ]);
    }

    public function update(Request $request, PurchasePackage $package)
    {
       $this->checkAdmin();

       if ($package->system_locked) {
            abort(403, 'This package cannot be edited.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price_in_rm' => 'nullable|numeric|min:0',
            'paid_credits' => 'nullable|integer|min:0',
            'free_credits' => 'nullable|integer|min:0',
            'effective_from' => 'required|date',
            'valid_until' => 'nullable|date|after_or_equal:effective_from',
            'validity_days' => 'integer|min:1',
            'active' => 'boolean',
            'best_value' => 'boolean',
        ]);

        $package->update($validated);

        return redirect()->route('admin.packages.index')
            ->with('success', 'Package updated successfully!');
    }

    public function destroy(PurchasePackage $package)
    {
        $this->checkAdmin();

        if ($package->system_locked) {
            abort(403, 'This package cannot be deleted.');
        }

        $package->update(['active' => false]);

        return redirect()->route('admin.packages.index')
            ->with('success', 'Package deleted successfully!');
    }
}
