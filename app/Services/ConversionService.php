<?php

namespace App\Services;

use App\Models\Conversion;

class ConversionService
{
    public function getActiveConversion(): ?Conversion
    {
        return Conversion::where('status', 'active')
            ->where('effective_from', '<=', now())
            ->where(function ($q) {
                $q->whereNull('valid_until')
                  ->orWhere('valid_until', '>=', now());
            })
            ->orderByDesc('effective_from')
            ->first();
    }

    public function calculateCredits(float $priceInRM, Conversion $conversion): array
    {
        $totalCredits = (int) ceil($priceInRM * $conversion->credits_per_rm);

        // Paid credits: must be at least conversion->credits_per_rm
        $paidCredits = max(
            (int) ceil($totalCredits * ($conversion->paid_credit_percentage / 100)),
            (int) ceil($conversion->credits_per_rm)
        );

        // Free credits: marketing only
        $freeCredits = (int) ceil($paidCredits / ($conversion->paid_credit_percentage / 100) * ($conversion->free_credit_percentage / 100));

        return [
            'paid_credits' => $paidCredits,
            'free_credits' => $freeCredits,
        ];
    }

    public function getCreditsForConversion(Conversion $conversion, float $priceInRM = 1): array
    {
        return $this->calculateCredits($priceInRM, $conversion);
    }
}
