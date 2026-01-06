<?php

namespace App\Services;

use App\Models\ClaimConfiguration;
use App\Models\Event;

class ClaimConfigurationService
{
    /**
     * Create or update claim configuration for an event
     */
    public function saveConfiguration(Event $event, array $data): ClaimConfiguration
    {
        return ClaimConfiguration::updateOrCreate(
            ['event_id' => $event->id],
            [
                'total_redemption_type' => $data['total_redemption_type'] ?? 'unlimited',
                'total_redemption_limit' => $data['total_redemption_limit'] ?? null,
                'daily_redemption_type' => $data['daily_redemption_type'] ?? 'once',
                'daily_redemption_limit' => $data['daily_redemption_limit'] ?? null,
            ]
        );
    }

    /**
     * Check if a customer can redeem a claim
     */
    public function canCustomerRedeem(ClaimConfiguration $config, string $customerId, string $eventId): array
    {
        $totalClaims = $config->claims()
            ->where('event_id', $eventId)
            ->where('customer_id', $customerId)
            ->count();

        $todayClaims = $config->claims()
            ->where('event_id', $eventId)
            ->where('customer_id', $customerId)
            ->whereDate('created_at', now()->toDateString())
            ->count();

        $canRedeem = true;
        $message = 'Eligible to redeem.';

        if ($config->total_redemption_type === 'limited' && $totalClaims >= $config->total_redemption_limit) {
            $canRedeem = false;
            $message = 'Total redemption limit reached.';
        } elseif ($config->daily_redemption_type === 'once' && $todayClaims >= 1) {
            $canRedeem = false;
            $message = 'You can only redeem once per day.';
        } elseif ($config->daily_redemption_type === 'multiple' && $config->daily_redemption_limit !== null && $todayClaims >= $config->daily_redemption_limit) {
            $canRedeem = false;
            $message = 'Daily redemption limit reached.';
        }

        return [
            'can_redeem' => $canRedeem,
            'message' => $message,
        ];
    }
}
