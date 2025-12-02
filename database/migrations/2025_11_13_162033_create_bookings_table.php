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

            $table->foreignUuid('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignUuid('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignUuid('slot_id')->constrained('event_slots')->onDelete('cascade');
            $table->foreignUuid('age_group_id')->nullable()->constrained('event_age_groups')->onDelete('set null');
            $table->foreignUuid('wallet_id')->nullable()->constrained('customer_wallets')->onDelete('set null');

            $table->integer('quantity')->default(1);

            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'refunded'])->default('confirmed');
            $table->string('qr_code_path')->nullable();

            $table->timestamp('booked_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('cancelled_at')->nullable();    

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
