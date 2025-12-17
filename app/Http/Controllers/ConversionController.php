<?php

namespace App\Http\Controllers;

use App\Models\Conversion;
use App\Models\PurchasePackage;
use App\Services\ConversionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class ConversionController extends Controller
{
    protected ConversionService $conversionService;

    public function __construct(ConversionService $conversionService)
    {
        $this->conversionService = $conversionService;
    }

    public function create()
    {
        return inertia('Admin/CreateConversion');
    }

    public function index()
    {
        $conversions = Conversion::orderByDesc('effective_from')->get();

        return Inertia::render('Admin/Conversions', [
            'conversions' => $conversions
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'rm' => 'required|numeric|min:0.01', 
                'credits_per_rm' => 'required|numeric|min:0',
                'paid_to_free_ratio' => 'required|numeric|min:0|max:100',
                'paid_credit_percentage' => 'required|numeric|min:0|max:100',
                'free_credit_percentage' => 'required|numeric|min:0|max:100',
                'effective_from' => 'required|date',
                'valid_until' => 'nullable|date|after_or_equal:effective_from',
            ]);

            if (($validated['paid_credit_percentage'] + $validated['free_credit_percentage']) !== 100) {
                Log::warning('⚠️ Paid + Free percentage mismatch', $validated);
                throw ValidationException::withMessages([
                    'paid_credit_percentage' => 'Paid + Free percentages must equal 100',
                ]);
            }

            if ($validated['paid_to_free_ratio'] <= 0) {
                throw ValidationException::withMessages([
                    'paid_to_free_ratio' => 'Paid to free ratio must be greater than 0.',
                ]);
            }

            $overlaps = Conversion::where('status', 'active')
                ->where(function ($query) use ($validated) {
                    $query->where('valid_until', '>=', $validated['effective_from'])
                        ->orWhereNull('valid_until');
                })
                ->where(function ($query) use ($validated) {
                    $validUntil = $validated['valid_until'] ?? now()->addYears(100);
                    $query->where('effective_from', '<=', $validUntil);
                })
                ->exists();

            if ($overlaps) {
                Log::warning('⚠️ Conversion overlap detected', $validated);
                throw ValidationException::withMessages([
                    'credits_per_rm' => 'This conversion rate overlaps with an existing rate. Please deactivate the existing rate first.',
                ]);
            }

            $today = now()->toDateString();
            $effectiveFrom = \Carbon\Carbon::parse($validated['effective_from'])->toDateString();
            $validUntil = isset($validated['valid_until'])
                ? \Carbon\Carbon::parse($validated['valid_until'])->toDateString()
                : null;

            $status = ($effectiveFrom === $today && (!$validUntil || $validUntil === $today))
                ? 'active'
                : 'inactive';

            Log::info('ℹ️ Conversion status calculated:', ['status' => $status]);

            if ($status === 'active') {
                Conversion::where('status', 'active')->update(['status' => 'inactive']);
                Log::info('ℹ️ Previous active conversions deactivated');

                $conversionService = new ConversionService();
                $activeConversion = $conversionService->getActiveConversion();

                // Use the RM amount entered by admin instead of hardcoded 1
                $rm = $validated['rm'];
                $credits = $conversionService->getCreditsForConversion($activeConversion, $rm);

                $package = PurchasePackage::where('name', 'Standard Package')->first();
                $hasTransactions = $package?->transactions()->exists() ?? false;

                if ($package) {
                    if ($hasTransactions) {
                        // Step 3a: Deactivate current package
                        $package->update(['active' => false]);

                        // Step 3b: Create a new Standard Package
                        $package = PurchasePackage::create([
                            'name' => 'Standard Package',
                            'price_in_rm' => $rm, 
                            'paid_credits' => $credits['paid_credits'],
                            'free_credits' => $credits['free_credits'],
                            'effective_from' => now(),
                            'active' => true,
                            'system_locked' => true,
                        ]);
                    } else {
                        // Safe to update directly
                        $package->update([
                            'price_in_rm' => $rm,
                            'paid_credits' => $credits['paid_credits'],
                            'free_credits' => $credits['free_credits'],
                            'effective_from' => now(),
                            'active' => true,
                            'system_locked' => true,
                        ]);
                    }
                } else {
                    // Step 3c: No package exists, just create
                    $package = PurchasePackage::create([
                        'name' => 'Standard Package',
                        'price_in_rm' => $rm,
                        'paid_credits' => $credits['paid_credits'],
                        'free_credits' => $credits['free_credits'],
                        'effective_from' => now(),
                        'active' => true,
                        'system_locked' => true,
                    ]);
                }
            }
            Conversion::create(array_merge($validated, ['status' => $status]));

            return redirect()
                ->route('admin.conversions.index')
                ->with('success', 'Conversion rate created successfully. Standard Package is updated.');
        } catch (\Throwable $e) {
            Log::error('❌ Conversion store failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);

            throw $e;
        }
    }

    public function activate(Conversion $conversion)
    {
        $overlaps = Conversion::where('status', 'active')
            ->where(function ($query) use ($conversion) {
                $validUntil = $conversion->valid_until ?? now()->addYears(100);
                $query->where('valid_until', '>=', $conversion->effective_from)
                    ->orWhereNull('valid_until');
            })
            ->where(function ($query) use ($conversion) {
                $validUntil = $conversion->valid_until ?? now()->addYears(100);
                $query->where('effective_from', '<=', $validUntil);
            })
            ->where('id', '!=', $conversion->id) 
            ->exists();

        if ($overlaps) {
            return redirect()->back()->with('error', 'This conversion rate overlaps with an existing rate. Please deactivate the existing rate first.');
        }

        Conversion::where('status', 'active')->update(['status' => 'inactive']);

        $conversion->update([
            'status' => 'active',
            'effective_from' => now(),
        ]);

        $conversionService = new ConversionService();
        $activeConversion = $conversionService->getActiveConversion();
        $rm = $conversion->rm ?? 1;
        $credits = $conversionService->getCreditsForConversion($activeConversion, $rm);

        $package = PurchasePackage::where('name', 'Standard Package')->first();
        $hasTransactions = $package?->transactions()->exists() ?? false;

        if ($package) {
            if ($hasTransactions) {
                // Deactivate the current package so old transactions stay intact
                $package->update(['active' => false]);

                // Create a new Standard Package
                $package = PurchasePackage::create([
                    'name' => 'Standard Package',
                    'price_in_rm' => $rm, // replace 1 with the actual RM value
                    'paid_credits' => $credits['paid_credits'],
                    'free_credits' => $credits['free_credits'],
                    'effective_from' => now(),
                    'active' => true,
                    'system_locked' => true,
                ]);
            } else {
                // Safe to update directly
                $package->update([
                    'price_in_rm' => $rm,
                    'paid_credits' => $credits['paid_credits'],
                    'free_credits' => $credits['free_credits'],
                    'effective_from' => now(),
                    'active' => true,
                    'system_locked' => true,
                ]);
            }
        } else {
            // No existing package, create a new one
            $package = PurchasePackage::create([
                'name' => 'Standard Package',
                'price_in_rm' => $rm,
                'paid_credits' => $credits['paid_credits'],
                'free_credits' => $credits['free_credits'],
                'effective_from' => now(),
                'active' => true,
                'system_locked' => true,
            ]);
        }

        return redirect()
            ->route('admin.conversions.index')
            ->with('success', 'Conversion rate activated successfully!');
    }

    public function deactivate(Conversion $conversion)
    {
        $conversion->update(['status' => 'inactive']);

        return redirect()->route('admin.conversions.index')->with('success', 'Conversion rate deactivated successfully!');
    }
}