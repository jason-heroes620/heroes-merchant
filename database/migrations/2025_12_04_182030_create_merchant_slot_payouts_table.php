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
        Schema::create('merchant_slot_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('merchant_id')->constrained('merchants')->onDelete('cascade');
            $table->foreignUuid('slot_id')->constrained('event_slots')->onDelete('cascade');
            $table->foreignUuid('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->decimal('total_amount_in_rm', 12, 2)->default(0);
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->timestamp('paid_at')->nullable();
          
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('merchant_slot_payouts');
    }
};
