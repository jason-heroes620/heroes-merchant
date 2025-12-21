<?php

namespace App\Http\Controllers;

use App\Models\Conversion;
use App\Services\ConversionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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
        $validated = $request->validate([
            'rm' => 'required|numeric|min:0.01',
            'credits_per_rm' => 'required|numeric|min:0',
            'paid_credit_percentage' => 'required|numeric|min:0|max:100',
            'free_credit_percentage' => 'required|numeric|min:0|max:100',
            'paid_to_free_ratio' => 'required|numeric|min:0|max:100',
            'effective_from' => 'required|date',
            'valid_until' => 'nullable|date|after_or_equal:effective_from',
        ]);

        if (($validated['paid_credit_percentage'] + $validated['free_credit_percentage']) !== 100) {
            throw ValidationException::withMessages([
                'paid_credit_percentage' => 'Paid + Free must equal 100',
            ]);
        }

        $from = Carbon::parse($validated['effective_from'], 'Asia/Kuala_Lumpur');
        $until = isset($validated['valid_until'])
            ? Carbon::parse($validated['valid_until'], 'Asia/Kuala_Lumpur')
            : null;

        if ($this->conversionService->hasOverlap($from, $until)) {
            return back()->with('error', 'This conversion overlaps with an existing one.');
        }

        $now = now('Asia/Kuala_Lumpur');

        $status = $from->gt($now)
            ? 'scheduled'
            : 'active';

        $conversion = Conversion::create([
            ...$validated,
            'effective_from' => $from,
            'valid_until' => $until,
            'status' => $status,
        ]);

        if ($status === 'active') {
            $this->conversionService->applyConversion($conversion);
        }

        return redirect()
            ->route('admin.conversions.index')
            ->with(
                'success',
                $status === 'active'
                    ? 'Conversion created and applied.'
                    : 'Conversion scheduled successfully.'
            );
    }

  public function activate(Conversion $conversion)
    {
        Log::info('[Conversion Activate] Request received', [
            'conversion_id' => $conversion->id,
        ]);

        try {
            DB::transaction(function () use ($conversion) {

                $now = now('Asia/Kuala_Lumpur');

                // Check overlap as if this conversion starts now
                if ($this->conversionService->hasOverlap(
                    $now,
                    $conversion->valid_until,
                    $conversion->id
                )) {
                    throw new \RuntimeException(
                        'An active conversion already exists. Please deactivate it first.'
                    );
                }

                // Update effective_from and activate
                $conversion->update([
                    'effective_from' => $now,
                    'status' => 'active',
                ]);

                // Apply conversion (packages, credits, etc.)
                $this->conversionService->applyConversion($conversion);

                Log::info('[Conversion Activate] Conversion activated', [
                    'conversion_id' => $conversion->id,
                    'effective_from' => $now,
                ]);
            });

            return redirect()
                ->route('admin.conversions.index')
                ->with('success', 'Conversion activated successfully.');

        } catch (\Throwable $e) {
            Log::error('[Conversion Activate] Failed', [
                'conversion_id' => $conversion->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', $e->getMessage());
        }
    }

    public function deactivate(Conversion $conversion)
    {
        Log::info('[Conversion Deactivate] Request received', [
            'conversion_id' => $conversion->id,
        ]);

        if (! $conversion->update(['status' => 'inactive'])) {
            Log::error('[Conversion Deactivate] Update failed', [
                'conversion_id' => $conversion->id,
            ]);

            session()->flash('error', 'Failed to deactivate conversion.');
            return redirect()->back();
        }

        Log::info('[Conversion Deactivate] Success', [
            'conversion_id' => $conversion->id,
        ]);

         return redirect()
            ->route('admin.conversions.index')
            ->with('success', 'Conversion rate deactivated successfully!');
    }
}