<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('merchant_slot_payout_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('payout_id')->constrained('merchant_slot_payouts')->onDelete('cascade');
            $table->foreignUuid('booking_item_id')->constrained('booking_items')->onDelete('cascade');
            $table->foreignUuid('event_slot_price_id')->constrained('event_slot_prices')->onDelete('cascade');
            $table->decimal('amount_in_rm', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('merchant_slot_payout_items');
    }
};
