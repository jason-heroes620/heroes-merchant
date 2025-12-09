<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray($request)
    {
        $slot = $this->whenLoaded('slot');
        $event = $this->whenLoaded('event');
        $items = $this->whenLoaded('items');

        return [
            'id' => (string) $this->id,
            'booking_id' => (string) $this->id,
            'booking_code' => (string) $this->booking_code, 
            'status' => $this->status,
            'quantity' => $this->quantity,
            'booked_at' => $this->booked_at?->setTimezone('Asia/Kuala_Lumpur')->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->setTimezone('Asia/Kuala_Lumpur')->toIso8601String(),
            'qr_url' => $this->qr_url,

            'slot' => $slot ? [
                'id' => (string) $slot->id,
                'date' => $slot->date,
                'start_time' => $slot->display_start?->toIso8601String(),
                'end_time' => $slot->display_end?->toIso8601String(),
            ] : null,

            'event' => $event ? [
                'id' => (string) $event->id,
                'title' => $event->title,
                'type' => $event->type,
                'category' => $event->category,
                'location' => $event->location?->location_name ?? null,
                'media' => $event->media?->first()?->url ?? null,
            ] : null,

            'items' => $items ? $items->map(function ($it) use ($slot) {
                $label = $it->ageGroup?->label;

                if (!$label && $it->age_group_id === null) {
                    $slotPrice = $slot?->prices()->first();
                    $label = $slotPrice?->ageGroup?->label ?? 'General';
                }

                return [
                    'age_group_id' => $it->age_group_id,
                    'age_group_label' => $label,
                    'quantity' => (int) $it->quantity,
                    'paid_credits' => (int) $it->paid_credits,
                    'free_credits' => (int) $it->free_credits,
                    'total_paid' => (int) $it->paid_credits * (int) $it->quantity,
                    'total_free' => (int) $it->free_credits * (int) $it->quantity,
                ];
            }) : [],

            'transactions' => $this->whenLoaded('transactions', function () {
                return $this->transactions->map(fn($t) => [
                    'id' => (string)$t->id,
                    'type' => $t->type,
                    'before_free_credits' => $t->before_free_credits,
                    'before_paid_credits' => $t->before_paid_credits,
                    'delta_free' => $t->delta_free,
                    'delta_paid' => $t->delta_paid,   
                    'created_at' => $t->created_at->toIso8601String(),
                ]);
            }),
        ];
    }
}
