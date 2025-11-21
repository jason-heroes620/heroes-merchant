<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('event_frequencies', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('event_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');

            $table->enum('type', [
                'daily',
                'weekly',
                'biweekly',
                'monthly',
                'annually',
                'custom'
            ])->default('weekly');

            $table->json('days_of_week')->nullable(); // [0,1,2,3,4,5,6] for selected days
            $table->json('selected_dates')->nullable(); // for custom dates

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('event_frequencies');
    }
};
