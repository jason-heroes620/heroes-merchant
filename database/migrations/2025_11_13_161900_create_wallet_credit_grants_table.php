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
        Schema::create('wallet_credit_grants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('wallet_id')->constrained('customer_wallets')->onDelete('cascade');

            $table->enum('grant_type', ['free', 'paid', 'referral', 'registration', 'purchase']); 
            $table->integer('free_credits')->nullable();
            $table->integer('paid_credits')->nullable();
            $table->integer('free_credits_remaining')->nullable(); 
            $table->integer('paid_credits_remaining')->nullable(); 
            $table->datetime('expires_at')->nullable();
            $table->uuid('purchase_package_id')->nullable(); 
            $table->uuid('reference_id')->nullable(); 

            $table->decimal('free_credits_per_rm', 14, 6)->nullable();
            $table->decimal('paid_credits_per_rm', 14, 6)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_credit_grants');
    }
};
