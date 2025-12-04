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
        Schema::create('merchant_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('merchant_id')->constrained('merchants')->onDelete('cascade');

            $table->string('month'); 
            $table->unsignedInteger('tickets_sold')->default(0);

            $table->decimal('gross_in_rm', 10, 2)->default(0);
            $table->decimal('admin_fee_in_rm', 10, 2)->default(0);
            $table->decimal('merchant_net_in_rm', 10, 2)->default(0);

            $table->enum('status', ['pending', 'paid', 'failed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('merchant_payouts');
    }
};
