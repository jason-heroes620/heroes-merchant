<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('event_slots', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // $table->foreignUuid('event_id')->constrained('events')->onDelete('cascade');
            // $table->foreignUuid('event_date_id')->constrained('event_dates')->onDelete('cascade');
            $table->foreignUuid('event_id')->constrained('events');
            $table->foreignUuid('event_date_id');

            $table->date('date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->unsignedInteger('duration')->nullable(); //  minutes

            // Capacity
            $table->unsignedInteger('capacity')->nullable();
            $table->boolean('is_unlimited')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_slots');
    }
};
