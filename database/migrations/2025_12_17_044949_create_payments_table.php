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
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('payment_id', 50);
            $table->string('transaction_id', 100);
            $table->string('order_number', 10);
            $table->string('payment_method', 50);
            $table->string('transaction_status', 2);
            $table->decimal('amount', 10, 2);
            $table->string('transaction_message', 255);
            $table->string('bank_ref_no', 100)->nullable();
            $table->string('issuing_bank', 100)->nullable();
            $table->string('card_type', 50)->nullable();
            $table->string('card_number', 100)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
