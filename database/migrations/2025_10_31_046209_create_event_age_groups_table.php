<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('event_age_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('event_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');

            $table->string('label')->nullable(); // e.g., Kids, Teens, Adults
            $table->boolean('is_suitable_for_all_ages')->default(false);
            $table->unsignedInteger('min_age')->nullable();
            $table->unsignedInteger('max_age')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('event_age_groups');
    }
};
