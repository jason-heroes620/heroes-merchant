<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Merchant reference
            $table->foreignUuid('merchant_id')->constrained('merchants')->onDelete('cascade');

            $table->string('type'); // event, trial_class, location_based
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->nullable();

            // Age restriction
            $table->boolean('is_suitable_for_all_ages')->default(false);

            // Frequency
            $table->boolean('is_recurring')->default(false);

            // Engagement
            $table->boolean('featured')->default(false);
            $table->unsignedBigInteger('like_count')->default(0);
            $table->unsignedBigInteger('click_count')->default(0);

            // Status and conversion
            $table->enum('status', ['draft', 'pending', 'active', 'inactive', 'rejected'])->default('pending');
            $table->text('rejected_reason')->nullable();

            $table->integer('cancellation_policy_hours')->default(24); 
            $table->boolean('allow_refund')->default(true);

            $table->timestamps();
            $table->index(['merchant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
