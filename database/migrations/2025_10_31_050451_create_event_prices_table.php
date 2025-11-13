<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('event_prices', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('event_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');

            $table->uuid('event_age_group_id')->nullable();
            $table->foreign('event_age_group_id')->references('id')->on('event_age_groups')->onDelete('cascade');

            $table->string('pricing_type'); // fixed, age_based, day_type, mixed
            $table->unsignedInteger('fixed_price_in_cents')->nullable();
            $table->unsignedInteger('weekday_price_in_cents')->nullable();
            $table->unsignedInteger('weekend_price_in_cents')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('event_prices');
    }
};
