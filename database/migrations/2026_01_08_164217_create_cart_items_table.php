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
        Schema::create('cart_items', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Cart FK
            $table->foreignUuid('cart_id')->constrained('carts')->onDelete('cascade');

            // Item references
            $table->foreignUuid('purchase_package_id')->nullable()->constrained('purchase_packages')->onDelete('cascade');
            $table->foreignUuid('event_slot_id')->nullable()->constrained('event_slots')->onDelete('cascade');
            $table->foreignUuid('age_group_id')->nullable()->constrained('event_age_groups')->onDelete('set null');
            // $table->foreignUuid('product_id')->nullable()->constrained('products')->onDelete('cascade');

            // Snapshot fields for display / checkout
            // Purchase Package
            $table->string('package_name')->nullable();

            // Event Slot
            $table->string('event_title')->nullable();
            $table->string('age_group_label')->nullable();
            $table->string('slot_date')->nullable();
            $table->time('slot_start_time')->nullable();
            $table->time('slot_end_time')->nullable();

            // Product
            // $table->string('product_name')->nullable();

            // Common pricing/credits
            $table->decimal('price_in_rm', 10, 2)->nullable();
            $table->unsignedInteger('free_credits')->nullable();
            $table->unsignedInteger('paid_credits')->nullable();
            $table->string('activation_mode');

            $table->timestamps();

            // Indexes for faster queries
            $table->index(['cart_id']);
            $table->index(['event_slot_id']);
            $table->index(['purchase_package_id']);
            // $table->index(['product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
