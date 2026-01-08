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
        Schema::create('order_products', function (Blueprint $table) {
            $table->uuid('order_product_id')->primary();
            $table->uuid('order_id')->index();
            $table->uuid('product_id')->index();
            $table->boolean('is_package')->default(false);
            $table->string('product_name', 255);
            $table->unsignedSmallInteger('qty', $autoIncrement = false);
            $table->string('uom', 50);
            $table->decimal('price', 8, 2);
            $table->decimal('total', 8, 2);
            $table->unsignedSmallInteger('reward', $autoIncrement = false)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_products');
    }
};
