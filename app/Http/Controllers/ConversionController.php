<?php

namespace App\Http\Controllers;

use App\Models\Conversion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConversionController extends Controller
{
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
            'conversion_rate' => 'required|numeric|min:0',
            'effective_from' => 'required|date',
            'valid_until' => 'nullable|date|after_or_equal:effective_from',
        ]);

        // Check for overlapping date ranges
        $overlaps = Conversion::where(function ($query) use ($validated) {
                $query->where('valid_until', '>=', $validated['effective_from'])
                    ->orWhereNull('valid_until');
            })
            ->where(function ($query) use ($validated) {
                $validUntil = $validated['valid_until'] ?? now()->addYears(100);
                $query->where('effective_from', '<=', $validUntil);
            })
            ->exists();

        if ($overlaps) {
            return back()->withErrors([
                'conversion_rate' => 'This conversion rate overlaps with an existing rate.'
            ]);
        }

        // Determine if status should be active
        $today = now()->toDateString();
        $effectiveFrom = \Carbon\Carbon::parse($validated['effective_from'])->toDateString();
        $validUntil = isset($validated['valid_until'])
            ? \Carbon\Carbon::parse($validated['valid_until'])->toDateString()
            : null;

        $status = ($effectiveFrom === $today && (!$validUntil || $validUntil === $today))
            ? 'active'
            : 'inactive';
        
        if ($status === 'active') {
            Conversion::where('status', 'active')->update(['status' => 'inactive']);
        }

        // Create conversion with status
        $conversion = Conversion::create(array_merge($validated, ['status' => $status]));

        return redirect()
            ->route('admin.conversions.index')
            ->with('success', 'Conversion rate created successfully.');
    }

    public function activate(Conversion $conversion)
    {
        $conversion->update([
            'status' => 'active',
            'effective_from' => now(),
        ]);

        return redirect()->route('admin.conversions.index')->with('success', 'Conversion rate activated successfully!');
    }

    /** Soft deactivate */
    public function deactivate(Conversion $conversion)
    {
        $conversion->update(['status' => 'inactive']);

        return redirect()->route('admin.conversions.index')->with('success', 'Conversion rate deactivated successfully!');
    }
}
