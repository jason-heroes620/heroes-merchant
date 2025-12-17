<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('conversions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            $table->decimal('credits_per_rm', 5, 2);
            $table->decimal('paid_to_free_ratio', 5, 2);

            $table->decimal('paid_credit_percentage', 5, 2)->default(80);
            $table->decimal('free_credit_percentage', 5, 2)->default(20);
            
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
