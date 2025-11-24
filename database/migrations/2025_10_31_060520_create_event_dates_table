<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('event_dates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignUuid('event_frequency_id')->nullable()->constrained('event_frequencies')->onDelete('cascade');

            $table->date('start_date'); 
            $table->date('end_date'); 

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('event_dates');
    }
};