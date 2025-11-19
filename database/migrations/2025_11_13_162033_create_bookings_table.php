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
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('customer_id');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');

            $table->uuid('event_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');

            $table->uuid('slot_id');
            $table->foreign('slot_id')->references('id')->on('event_slots')->onDelete('cascade');

            $table->integer('credits_spent')->default(0); 
            $table->integer('quantity')->default(1); 
            
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'refunded'])->default('confirmed');
            $table->string('qr_code_path')->nullable();

            $table->timestamp('booked_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('cancelled_at')->nullable();
            
            $table->uuid('wallet_id')->nullable();
            $table->foreign('wallet_id')->references('id')->on('customer_wallets')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
