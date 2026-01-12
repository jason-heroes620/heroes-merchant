<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\EventSlot;
use App\Models\PurchasePackage;
use App\Models\Product;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CartController extends Controller
{
    /**
     * Get the active cart for the authenticated customer
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer ?? null;

        if (!$customer) {
            return response()->json(['message' => 'Customer record not found.'], 404);
        }

        $cart = Cart::firstOrCreate([
            'customer_id' => $customer->id,
            'status' => 'active',
        ]);

        // Get all items for totals calculation
        $allItems = $cart->items()
            ->with(['eventSlot.event.media', 'eventSlot', 'package'])
            ->get();

        // Group items by event_slot_id or purchase_package_id
        $grouped = $allItems->groupBy(function ($item) {
            if ($item->event_slot_id) {
                return 'event_' . $item->event_slot_id;
            } elseif ($item->purchase_package_id) {
                return 'package_' . $item->purchase_package_id;
            }
            return 'product_' . ($item->product_id ?? 'unknown');
        });

        // Pagination settings
        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', 1);
        
        // Get unique groups (events/packages)
        $groupKeys = $grouped->keys()->toArray();
        $totalGroups = count($groupKeys);
        $lastPage = (int) ceil($totalGroups / $perPage);
        
        // Slice groups for current page
        $offset = ($page - 1) * $perPage;
        $paginatedGroupKeys = array_slice($groupKeys, $offset, $perPage);
        
        // Get items for paginated groups
        $paginatedItems = collect();
        foreach ($paginatedGroupKeys as $key) {
            $paginatedItems = $paginatedItems->merge($grouped[$key]);
        }

        // Map items to response format
        $items = $paginatedItems->map(function (CartItem $item) {
            return [
                'id' => (string) $item->id,
                'cart_id' => (string) $item->cart_id,
                'purchase_package_id' => $item->purchase_package_id,
                'event_slot_id' => $item->event_slot_id,
                'product_id' => $item->product_id,
                'event_title' => $item->event_title,
                'package_name' => $item->package_name,
                'age_group_id' => $item->age_group_id,
                'age_group_label' => $item->age_group_label,
                'slot_date' => $item->slot_date,
                'slot_start_time' => $item->slot_start_time?->format('H:i'),
                'slot_end_time' => $item->slot_end_time?->format('H:i'),
                'price_in_rm' => $item->price_in_rm,
                'free_credits' => $item->free_credits,
                'paid_credits' => $item->paid_credits,
                'activation_mode'  => $item->activation_mode,
                'event' => $item->eventSlot?->event ? [
                    'id' => (string) $item->eventSlot->event->id,
                    'title' => $item->eventSlot->event->title,
                    'type' => $item->eventSlot->event->type,
                    'media' => $item->eventSlot->event->media?->first()?->url ?? null,
                ] : null,
                'package' => $item->package ? [
                    'id' => (string) $item->package->id,
                    'name' => $item->package->name,
                ] : null,
            ];
        });

        $totalFreeCreditsEarned = $allItems
            ->where('activation_mode', 'custom_free_credits')
            ->sum('free_credits');

        return response()->json([
            'id' => (string) $cart->id,
            'status' => $cart->status,
            'items' => $items->values(),
            'pagination' => [
                'current_page' => (int) $page,
                'last_page' => $lastPage,
                'per_page' => (int) $perPage,
                'total' => $totalGroups, 
                'total_items' => $allItems->count(),
            ],
            'totals' => [
                'total_rm' => (float) $cart->total_rm,
                'total_credits' => (int) ($cart->total_paid_credits + $cart->total_free_credits),
                'total_free_credits' => (int) $cart->total_free_credits,
                'total_paid_credits' => (int) $cart->total_paid_credits,
                'total_free_credits_earned' => (int) $totalFreeCreditsEarned,
                'total_items' => $allItems->count(),
                'total_groups' => $totalGroups, 
            ],
        ]);
    }

    /**
     * Add an item (event, package, or product) to the cart
     */
    public function add(Request $request)
    {
        $request->validate([
            'event_slot_id' => 'nullable|uuid|exists:event_slots,id',
            'purchase_package_id' => 'nullable|uuid|exists:purchase_packages,id',
            'product_id' => 'nullable|uuid|exists:products,id',
            'age_group_id' => 'nullable|uuid', 
        ]);

        if (!$request->event_slot_id && !$request->purchase_package_id && !$request->product_id) {
            return response()->json([
                'message' => 'At least one of event_slot_id, purchase_package_id, or product_id is required.'
            ], 422);
        }

        $customer = $request->user()->customer
            ?? throw new \Exception('Customer record not found for this user.');

        // Create or retrieve active cart
        $cart = Cart::firstOrCreate(
            ['customer_id' => $customer->id, 'status' => 'active']
        );

        $cartItem = new CartItem();
        $cartItem->cart_id = $cart->id;

        // -------------------------------
        // Handle purchase package
        // -------------------------------
        if ($request->purchase_package_id) {
            $package = PurchasePackage::findOrFail($request->purchase_package_id);

            $cartItem->purchase_package_id = $package->id;
            $cartItem->package_name = $package->name ?? null;
            $cartItem->price_in_rm = $package->price_in_rm ?? null;
            $cartItem->free_credits = $package->free_credits ?? null;
            $cartItem->paid_credits = $package->paid_credits ?? null;
        }

        // -------------------------------
        // Handle event slot
        // -------------------------------
        if ($request->event_slot_id) {
            $slot = EventSlot::with(['event.ageGroups', 'prices.ageGroup'])->findOrFail($request->event_slot_id);
            $event = $slot->event;

            $cartItem->event_slot_id = $slot->id;

            // Pick the slot price for the requested age group, fallback to first available
            $ageGroupId = $request->age_group_id ?? null;

            $slotPrice = $slot->prices
                ->firstWhere('event_age_group_id', $ageGroupId)
                ?? $slot->prices->first();

            // If slot price exists, automatically set age_group_id
            $cartItem->age_group_id = $slotPrice?->event_age_group_id ?? null;

            // Snapshot label as before
            $cartItem->age_group_label = $slotPrice?->ageGroup?->label ?? null;

            // Validate age group if required
            if (!$event->is_suitable_for_all_ages && $cartItem->age_group_id) {
                $validIds = $event->ageGroups->pluck('id')->toArray();
                if (!in_array($cartItem->age_group_id, $validIds)) {
                    return response()->json(['message' => 'Invalid age group selected'], 422);
                }
            }

            // Snapshot event details
            $cartItem->event_title = $event->title ?? null;

            if (!$event->is_recurring) {
                $eventDate = $event->dates;

                if ($eventDate) {
                    $startDate = $eventDate->start_date ? Carbon::parse($eventDate->start_date)->format('Y-m-d') : null;
                    $endDate = $eventDate->end_date ? Carbon::parse($eventDate->end_date)->format('Y-m-d') : null;

                    $cartItem->slot_date = $startDate === $endDate || !$endDate
                        ? $startDate
                        : "{$startDate}-{$endDate}";

                    $cartItem->slot_start_time = $slot->start_time;
                    $cartItem->slot_end_time = $slot->end_time;
                }
            } else {
                $cartItem->slot_date = $slot->date ? Carbon::parse($slot->date)->format('Y-m-d') : null;
                $cartItem->slot_start_time = $slot->start_time;
                $cartItem->slot_end_time = $slot->end_time;
            }

            $cartItem->price_in_rm = $slotPrice?->price_in_rm;
            $cartItem->free_credits = $slotPrice?->free_credits;
            $cartItem->paid_credits = $slotPrice?->paid_credits;
            $cartItem->activation_mode = $slotPrice?->activation_mode;
        }

        // -------------------------------
        // Handle product
        // -------------------------------
        // if ($request->product_id) {
        //     $product = Product::findOrFail($request->product_id);

        //     $cartItem->product_id = $product->id;
        //     $cartItem->product_name = $product->name ?? null;
        //     $cartItem->price_in_rm = $product->price_in_rm ?? null;
        //     $cartItem->free_credits = $product->free_credits ?? null;
        //     $cartItem->paid_credits = $product->paid_credits ?? null;
        // }

        $cartItem->save();

        $cart->total_rm = $cart->items
            ->filter(fn ($item) => $item->paid_credits === null)
            ->sum(fn ($item) => $item->price_in_rm ?? 0);
        $cart->total_paid_credits = $cart->items->sum(fn($item) => $item->paid_credits ?? 0);
        $cart->total_free_credits = $cart->items->sum(fn($item) => $item->free_credits ?? 0);
        $cart->save();

        return response()->json([
            'message' => 'Item added to cart successfully',
            'cart_item' => $cartItem,
        ], 201);
    }

    /**
     * Remove a cart item
     */
    public function remove(Request $request)
    {
        $request->validate([
            'cart_item_id' => 'nullable|uuid',
            'purchase_package_id' => 'nullable|uuid|exists:purchase_packages,id',
            'event_slot_id' => 'nullable|uuid|exists:event_slots,id',
            'age_group_id' => 'nullable|uuid',
        ]);

        if (
            !$request->cart_item_id &&
            !$request->purchase_package_id &&
            !$request->event_slot_id
        ) {
            return response()->json([
                'message' => 'cart_item_id, purchase_package_id, or event_slot_id is required.'
            ], 422);
        }

        $customer = $request->user()->customer
            ?? throw new \Exception('Customer record not found.');

        $cart = Cart::where('customer_id', $customer->id)
            ->where('status', 'active')
            ->firstOrFail();

        /*
        |--------------------------------------------------------------------------
        | 1️⃣ Remove by cart_item_id 
        |--------------------------------------------------------------------------
        */
        if ($request->cart_item_id) {
            $item = $cart->items()
                ->where('id', $request->cart_item_id)
                ->firstOrFail();

            $item->delete();
        }

        /*
        |--------------------------------------------------------------------------
        | 2️⃣ Remove purchase package
        |--------------------------------------------------------------------------
        */
        elseif ($request->purchase_package_id) {
            $item = $cart->items()
                ->where('purchase_package_id', $request->purchase_package_id)
                ->orderBy('created_at', 'desc') // remove latest
                ->firstOrFail();

            $item->delete();
        }

        /*
        |--------------------------------------------------------------------------
        | 3️⃣ Remove event slot 
        |--------------------------------------------------------------------------
        */
        elseif ($request->event_slot_id) {
            $query = $cart->items()
                ->where('event_slot_id', $request->event_slot_id);

            // If age_group_id is provided, match exactly
            if ($request->filled('age_group_id')) {
                $query->where('age_group_id', $request->age_group_id);
            }

            $item = $query
                ->orderBy('created_at', 'desc')
                ->firstOrFail();

            $item->delete();
        }

        /*
        |--------------------------------------------------------------------------
        | Recalculate cart totals 
        |--------------------------------------------------------------------------
        */
        $cart->total_rm = $cart->items->sum(fn ($item) => $item->price_in_rm ?? 0);
        $cart->total_paid_credits = $cart->items->sum(fn ($item) => $item->paid_credits ?? 0);
        $cart->total_free_credits = $cart->items->sum(fn ($item) => $item->free_credits ?? 0);
        $cart->save();

        return response()->json([
            'message' => 'Item removed from cart successfully',
        ]);
    }

    /**
     * Clear the cart
     */
    public function clear(Request $request)
    {
        $cart = Cart::where('customer_id', $request->user()->id)
                    ->where('status', 'active')
                    ->first();

        if ($cart) {
            $cart->items()->delete();
        }

        return response()->json(['message' => 'Cart cleared']);
    }
}
