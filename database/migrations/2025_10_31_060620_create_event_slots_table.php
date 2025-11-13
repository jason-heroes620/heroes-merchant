<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('event_slots', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('event_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');

            $table->foreignUuid('frequency_id')
                ->nullable()
                ->constrained('event_frequencies')
                ->onDelete('cascade');

            $table->date('date'); 
            $table->boolean('is_all_day')->default(false);
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();           
            $table->integer('duration'); //  minutes

            // slot capacity (per slot)
            $table->unsignedInteger('capacity')->nullable();
            $table->boolean('is_unlimited')->default(false);
            $table->unsignedInteger('booked')->default(0);
            
            $table->string('slot_type')->nullable(); // weekday, weekend, custom

            // final price assigned automatically based on pricing rules
            $table->unsignedInteger('price_in_cents')->nullable();
            $table->unsignedInteger('price_in_credits')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('event_slots');
    }
};