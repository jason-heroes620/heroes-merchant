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

            $table->integer('total_paid_credits');
            $table->decimal('gross_amount_in_rm', 12, 2)->default(0);
            $table->decimal('platform_fee_rate', 12, 2)->default(0);
            $table->decimal('net_amount_in_rm', 12, 2)->default(0);

            $table->integer('total_bookings')->default(0);
            $table->json('booking_ids')->nullable(); 
            $table->json('meta')->nullable();

            $table->timestamp('calculated_at');
            $table->timestamp('available_at')->nullable(); 
            $table->timestamp('paid_at')->nullable();

            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->timestamps();

            $table->unique(['slot_id'], 'unique_slot_payout');
        });
    }

    public function down()
    {
        Schema::dropIfExists('merchant_slot_payouts');
    }
};
