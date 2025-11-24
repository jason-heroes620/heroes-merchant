<?php
namespace App\Services;

use App\Models\Conversion;

class ConversionService
{
    public function getActiveRate(): float
    {
        $conversion = Conversion::where('status', 'active')
            ->where('effective_from', '<=', now())
            ->where(function ($q) {
                $q->whereNull('valid_until')
                  ->orWhere('valid_until', '>=', now());
            })
            ->orderByDesc('effective_from')
            ->first();

        return $conversion?->conversion_rate ?? 1.0;
    }
}