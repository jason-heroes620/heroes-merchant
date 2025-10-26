<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('merchants', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Relationship to users table
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Merchant details
            $table->string('company_name');
            $table->string('business_registration_number')->nullable();
            $table->text('company_details')->nullable();

            // Business status and rejection reason
            $table->enum('business_status', ['verified', 'pending_verification', 'rejected'])->default('pending_verification');
            $table->text('rejection_reason')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('merchants');
    }
};
