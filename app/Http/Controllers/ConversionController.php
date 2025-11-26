<?php

namespace App\Http\Controllers;

use App\Models\Conversion;
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
                'credits_per_rm' => 'required|numeric|min:0',
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
                    'credits_per_rm' => 'This conversion rate overlaps with an existing rate.'
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
            }

            $conversion = Conversion::create(array_merge($validated, ['status' => $status]));

            return redirect()
                ->route('admin.conversions.index')
                ->with('success', 'Conversion rate created successfully.');
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
            Log::warning('⚠️ Cannot activate conversion, overlaps with another active conversion', [
                'conversion_id' => $conversion->id
            ]);
            return redirect()
                ->route('admin.conversions.index')
                ->with('error', 'Cannot activate this conversion because it overlaps with an existing active conversion.');
        }

        Conversion::where('status', 'active')->update(['status' => 'inactive']);

        $conversion->update([
            'status' => 'active',
            'effective_from' => now(),
        ]);

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