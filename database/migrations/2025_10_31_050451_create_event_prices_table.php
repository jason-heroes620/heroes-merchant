<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('event_prices', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('event_id')->constrained('events')->onDelete('cascade');

            $table->foreignUuid('event_age_group_id')->nullable()->constrained('event_age_groups')->onDelete('cascade');

            $table->enum('pricing_type', ['fixed','age_based','day_type','mixed']);
            $table->decimal('fixed_price_in_rm', 10, 2)->nullable();
            $table->decimal('weekday_price_in_rm', 10, 2)->nullable();
            $table->decimal('weekend_price_in_rm', 10, 2)->nullable();
            
            $table->timestamps();
            $table->index(['event_id', 'pricing_type']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('event_prices');
    }
};
