<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('conversions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->decimal('credits_per_rm', 14, 6);
            $table->datetime('effective_from');
            $table->datetime('valid_until')->nullable();
            $table->enum('status',['active','inactive'])->default('inactive');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('conversions');
    }
};
