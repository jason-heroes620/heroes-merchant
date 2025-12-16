<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); 
            $table->decimal('price_in_rm', 10, 2)->nullable();
            $table->integer('paid_credits')->nullable(); 
            $table->integer('free_credits')->nullable();
            $table->datetime('effective_from');
            $table->datetime('valid_until')->nullable();
            $table->integer('validity_days')->default(180);
            $table->boolean('active')->default(true);
            $table->boolean('best_value')->default(false);
            $table->boolean('system_locked')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_packages');
    }
};
