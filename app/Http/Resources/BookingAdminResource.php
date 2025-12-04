<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Resources\MissingValue;

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
            // Recurring event → use slot date
            if ($event->is_recurring) {
                $eventDate = $slot->date
                    ? $slot->date->setTimezone('Asia/Kuala_Lumpur')->format('d M Y')
                    : null;
            } else {
                // One-time event → use EventDate (start_date, end_date)
                $start = $event->dates?->first()?->start_date;
                $end = $event->dates?->first()?->end_date;

                if ($start && $end) {
                    if ($start->equalTo($end)) {
                        $eventDate = $start->setTimezone('Asia/Kuala_Lumpur')->format('d M Y');
                    } else {
                        $eventDate =
                            $start->setTimezone('Asia/Kuala_Lumpur')->format('d M Y') .
                            ' - ' .
                            $end->setTimezone('Asia/Kuala_Lumpur')->format('d M Y');
                    }
                }
            }
        }

        return [
            'id' => (string) $this->id,
            'booking_id' => (string) $this->id,
            'status' => $this->status,
            'quantity' => $this->quantity,
            'booked_at' => $this->booked_at?->setTimezone('Asia/Kuala_Lumpur')->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->setTimezone('Asia/Kuala_Lumpur')->toIso8601String(),
            'qr_url' => $this->qr_url,

            'slot' => $slot ? [
                'id' => (string) $slot->id,
                'date' => $eventDate,
                'start_time' => $slot->display_start
                    ? $slot->display_start->setTimezone('Asia/Kuala_Lumpur')->format('h:i A')
                    : null,
                'end_time' => $slot->display_end
                    ? $slot->display_end->setTimezone('Asia/Kuala_Lumpur')->format('h:i A')
                    : null,
            ] : null,

            'event' => ($event instanceof \Illuminate\Database\Eloquent\Model) ? [
                'id' => (string) $event->id,
                'title' => $event->title,
                'type' => $event->type,
                'category' => $event->category,
                'location' => $event->location?->location_name ?? null,
                'media' => $event->media?->first()?->url ?? null,
                'is_recurring' => $event->is_recurring,
            ] : null,

            'items' => ($isAdmin && $items)
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
                    'total_bookings' => $items?->sum('quantity') ?? 0
                ] : []),

            'transactions' => $isAdmin
                ? $this->whenLoaded('transactions', fn() => $this->transactions->map(fn($t) => [
                    'id' => (string)$t->id,
                    'type' => $t->type,
                    'before_free_credits' => (int) $t->before_free_credits,
                    'before_paid_credits' => (int) $t->before_paid_credits,
                    'delta_free' => (int) $t->delta_free,
                    'delta_paid' => (int) $t->delta_paid,  
                    'created_at' => $t->created_at
                        ? $t->created_at->setTimezone('Asia/Kuala_Lumpur')->format('d M Y, h:i A')
                        : null,
                ]))
                : null,

            'customer' => $isAdmin ? ($customer ? [
                'id' => (string)$customer->id,
                'name' => $customer->user->full_name,
                'email' => $customer->user->email,
                'phone' => $customer->user->contact_number,
                'profile_picture' => $customer->user->profile_picture
            ] : null) : null,

            'attendance' => [
                'total_attendees' => $this->attendances?->count() ?? 0,
                'attended_count' => $this->attendances?->where('status', 'attended')->count() ?? 0,
                'pending_count' => $this->attendances?->where('status', 'pending')->count() ?? 0,
                'absent_count' => $this->attendances?->where('status', 'absent')->count() ?? 0,
            ],
        ];
    }
}
