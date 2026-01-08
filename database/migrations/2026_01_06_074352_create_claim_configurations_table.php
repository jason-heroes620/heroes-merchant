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
        Schema::create('claim_configurations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained('events')->onDelete('cascade');

            // Total redemption per customer
            $table->enum('total_redemption_type', ['unlimited', 'limited'])->default('limited');
            $table->integer('total_redemption_limit')->nullable()->default(1);

            // Daily redemption limit
            $table->enum('daily_redemption_type', ['once', 'multiple'])->default('once');
            $table->integer('daily_redemption_limit')->nullable()->default(1);

            $table->timestamps();
        });

        Schema::table('claims', function (Blueprint $table) {
            $table->foreignUuid('configuration_id')->nullable()->constrained('claim_configurations')->onDelete('set null')->after('customer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claim_configurations');
    }
};
