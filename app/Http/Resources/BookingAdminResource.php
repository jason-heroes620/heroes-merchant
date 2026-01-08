<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Database\Eloquent\Model;

class BookingAdminResource extends JsonResource
{
    public function toArray($request)
    {
        $user = $request->user();
        $isAdmin = $user->role === 'admin';
        $isMerchant = $user->role === 'merchant';

        $slot = $this->whenLoaded('slot');
        $event = $this->whenLoaded('event');
        $items = $this->whenLoaded('items');
        $customer = $this->whenLoaded('customer');

        $eventDate = null;

        if ($event instanceof Model) {
            if ($event->is_recurring && $slot instanceof Model && $slot->date) {
                $eventDate = $slot->date->setTimezone('Asia/Kuala_Lumpur')->format('d M Y');
            } elseif ($event->dates?->first()) {
                $start = $event->dates->first()->start_date;
                $end = $event->dates->first()->end_date;

                if ($start && $end) {
                    $eventDate = $start->equalTo($end)
                        ? $start->setTimezone('Asia/Kuala_Lumpur')->format('d M Y')
                        : $start->setTimezone('Asia/Kuala_Lumpur')->format('d M Y') .
                        ' - ' .
                        $end->setTimezone('Asia/Kuala_Lumpur')->format('d M Y');
                }
            }
        }

        return [
            'id' => (string) $this->id,
            'booking_id' => (string) $this->id,
            'booking_code' => (string) $this->booking_code,
            'status' => $this->status,
            'quantity' => $this->quantity,
            'booked_at' => $this->booked_at?->setTimezone('Asia/Kuala_Lumpur')->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->setTimezone('Asia/Kuala_Lumpur')->toIso8601String(),

            'slot' => $slot instanceof Model ? [
                'id' => (string) $slot->id,
                'date' => $eventDate,
                'start_time' => $slot->display_start?->setTimezone('Asia/Kuala_Lumpur')->format('h:i A'),
                'end_time' => $slot->display_end?->setTimezone('Asia/Kuala_Lumpur')->format('h:i A'),
            ] : null,

            'event' => $event instanceof Model ? [
                'id' => (string) $event->id,
                'title' => $event->title,
                'type' => $event->type,
                'category' => $event->category,
                'location' => $event->location?->location_name,
                'media' => $event->media?->first()?->url,
                'is_recurring' => $event->is_recurring,
            ] : null,

            'items' => $items instanceof \Illuminate\Support\Collection ? (
                $isAdmin
                    ? $items->map(fn($it) => [
                        'age_group_id' => $it->age_group_id,
                        'age_group_label' => $it->ageGroup?->label ?? 'General',
                        'quantity' => (int) $it->quantity,
                        'paid_credits' => (int) $it->paid_credits,
                        'free_credits' => (int) $it->free_credits,
                        'total_paid' => (int) $it->paid_credits * (int) $it->quantity,
                        'total_free' => (int) $it->free_credits * (int) $it->quantity,
                    ])
                    : ($isMerchant ? [
                        'total_bookings' => $items->sum('quantity')
                    ] : [])
            ) : ($isMerchant ? ['total_bookings' => 0] : []),

            'transactions' => $isAdmin && $this->relationLoaded('transactions')
                ? $this->transactions->map(fn($t) => [
                    'id' => (string)$t->id,
                    'type' => $t->type,
                    'before_free_credits' => (int) $t->before_free_credits,
                    'before_paid_credits' => (int) $t->before_paid_credits,
                    'delta_free' => (int) $t->delta_free,
                    'delta_paid' => (int) $t->delta_paid,  
                    'created_at' => $t->created_at?->setTimezone('Asia/Kuala_Lumpur')->format('d M Y, h:i A'),
                ]) : null,

            'customer' => ($isAdmin || $isMerchant) && $customer instanceof Model ? [
                'id' => (string)$customer->id,
                'name' => $customer->user?->full_name,
                'email' => $customer->user?->email,
                'phone' => $customer->user?->contact_number,
                'profile_picture' => $customer->user?->profile_picture
            ] : null,

            'claim' => [
                'summary' => [
                    'total' => $this->claim?->count() ?? 0,
                    'claimed' => $this->claim?->where('status', 'claimed')->count() ?? 0,
                    'pending' => $this->claim?->where('status', 'pending')->count() ?? 0,
                    'expired' => $this->claim?->where('status', 'expired')->count() ?? 0,
                ],
                'list' => $this->whenLoaded('claim', fn () =>
                    $this->claim->map(fn ($a) => [
                        'id' => (string) $a->id,
                        'customer_name' => $a->customer?->user?->full_name,
                        'status' => $a->status,
                        'scanned_at' => $a->scanned_at?->setTimezone('Asia/Kuala_Lumpur')->format('d M Y, h:i A'),
                    ])
                ),
            ],
        ];
    }
}
