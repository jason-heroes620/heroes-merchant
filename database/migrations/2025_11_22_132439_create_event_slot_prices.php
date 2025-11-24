<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('event_slot_prices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_slot_id')->constrained('event_slots')->onDelete('cascade');
            $table->foreignUuid('event_age_group_id')->nullable()->constrained('event_age_groups')->onDelete('cascade');

            $table->decimal('price_in_rm', 10, 2)->nullable();

            $table->unsignedInteger('total_credits')->nullable();
            $table->unsignedInteger('free_credits')->nullable();
            $table->unsignedInteger('paid_credits')->nullable();

            $table->timestamps();

            $table->index(['event_slot_id', 'event_age_group_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_slot_prices');
    }
};
