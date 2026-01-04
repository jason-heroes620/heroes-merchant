<?php

namespace App\Services;

use App\Models\Conversion;
use App\Models\PurchasePackage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;


class ConversionService
{
    /**
     * Get the currently active conversion
     */
    public function getActiveConversion(): ?Conversion
    {
        $now = now('Asia/Kuala_Lumpur');

        return Conversion::query()
            ->where('status', 'active')
            ->where('effective_from', '<=', $now)
            ->where(fn ($q) =>
                $q->whereNull('valid_until')
                ->orWhere('valid_until', '>=', $now)
            )
            ->orderByDesc('effective_from')
            ->first();
    }

    /**
     * Calculate credits based on conversion
     */
    public function calculateCredits(float $priceInRM, Conversion $conversion): array
    {
        $paidCredits = (int) ceil($priceInRM * $conversion->credits_per_rm);
        $freeCredits = (int) ceil(
            ($paidCredits / $conversion->paid_credit_percentage) * $conversion->free_credit_percentage
        );

        return [
            'paid_credits' => $paidCredits,
            'free_credits' => $freeCredits,
        ];
    }

    public function getCreditsForConversion(Conversion $conversion, float $priceInRM): array
    {
        return $this->calculateCredits($priceInRM, $conversion);
    }

    /**
     * Check if the given period overlaps with any existing active conversion
     */
    public function hasOverlap(
        Carbon $from,
        ?Carbon $until,
        string|int|null $ignoreId = null
    ): bool {
        return Conversion::query()
            ->where('status', '!=', 'inactive')
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->where(function ($q) use ($from, $until) {
                $q->where('effective_from', '<=', $until ?? '9999-12-31')
                ->where(function ($q2) use ($from) {
                    $q2->whereNull('valid_until')
                        ->orWhere('valid_until', '>=', $from);
                });
            })
            ->exists();
    }

    /**
     * Apply a conversion immediately
     */
   public function applyConversion(Conversion $conversion): void
    {
        $now = now('Asia/Kuala_Lumpur');

        if ($this->hasOverlap(
            $conversion->effective_from,
            $conversion->valid_until,
            $conversion->id
        )) {
            throw new \RuntimeException(
                'An overlapping conversion already exists.'
            );
        }

        if ($conversion->rm === null) {
            throw new \RuntimeException('Conversion RM value is missing.');
        }

        $credits = $this->getCreditsForConversion(
            $conversion,
            (float) $conversion->rm
        );

        DB::transaction(function () use ($conversion, $credits) {

            $package = PurchasePackage::where('name', 'Standard Package')->first();
            $hasTransactions = $package?->transactions()->exists();

            if ($package && !$hasTransactions) {
                $package->update([
                    'price_in_rm' => $conversion->rm,
                    'paid_credits' => $credits['paid_credits'],
                    'free_credits' => $credits['free_credits'],
                    'effective_from' => $conversion->effective_from,
                    'valid_until' => $conversion->valid_until,
                    'active' => true,
                ]);
            } else {
                PurchasePackage::create([
                    'name' => 'Standard Package',
                    'price_in_rm' => $conversion->rm,
                    'paid_credits' => $credits['paid_credits'],
                    'free_credits' => $credits['free_credits'],
                    'effective_from' => $conversion->effective_from,
                    'valid_until' => $conversion->valid_until,
                    'active' => true,
                    'system_locked' => true,
                ]);
            }

            $conversion->update(['status' => 'active']);
        });
    }

    /**
     * Apply scheduled conversions whose effective_from <= now and are not active
     */
    public function applyScheduledConversions(): void
    {
        $now = now('Asia/Kuala_Lumpur');

        Conversion::where('status', 'scheduled')
            ->where('effective_from', '<=', $now)
            ->orderBy('effective_from')
            ->each(fn ($conversion) => $this->applyConversion($conversion));
    }
}
