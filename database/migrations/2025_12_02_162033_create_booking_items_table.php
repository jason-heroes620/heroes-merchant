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
       Schema::create('booking_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignUuid('age_group_id')->nullable()->constrained('event_age_groups')->onDelete('set null');
            $table->integer('quantity')->default(1);
            $table->integer('free_credits')->default(0);
            $table->integer('paid_credits')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_items');
    }
};