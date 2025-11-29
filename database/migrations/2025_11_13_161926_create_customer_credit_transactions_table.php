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
        Schema::create('customer_credit_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('wallet_id')->constrained('customer_wallets')->onDelete('cascade');
            $table->uuid('wallet_credit_grant_id')->nullable()->after('wallet_id');
            $table->foreign('wallet_credit_grant_id')
                ->references('id')
                ->on('wallet_credit_grants')
                ->onDelete('set null');
                
            $table->enum('type', ['purchase', 'booking', 'refund', 'bonus']);
            $table->integer('before_free_credits')->nullable();
            $table->integer('before_paid_credits')->nullable();

            // delta shows actual change (+/-)
            $table->integer('delta_free')->default(0);
            $table->integer('delta_paid')->default(0);
            $table->decimal('amount_in_rm', 10, 2)->nullable();

            $table->text('description')->nullable();
            $table->uuid('booking_id')->nullable();
            $table->uuid('purchase_package_id')->nullable();
            $table->string('transaction_id')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_credit_transactions');
    }
};
