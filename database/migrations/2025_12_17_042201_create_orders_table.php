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
        Schema::create('orders', function (Blueprint $table) {
            $table->char('order_id', 36)->primary(); // UUID as primary key
            $table->string('order_number', 20);       // VARCHAR(10)
            $table->string('payment_id', 50);       // VARCHAR(10)
            $table->char('user_id', 36);
            $table->string('package_id', 36);        // Assuming UUID
            $table->string('product', 200);
            $table->unsignedInteger('quantity');
            $table->decimal('price', 10, 2);
            $table->string('order_status', 50);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
