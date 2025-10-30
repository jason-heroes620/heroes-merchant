<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Basic user details
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('password');

            // Role: admin, merchant, customer
            $table->enum('role', ['admin', 'merchant', 'customer'])->default('customer');

            // Optional contact info
            $table->string('contact_number')->nullable();
            $table->string('address')->nullable();
            $table->string('profile_picture')->nullable();

            // Status
            $table->enum('status', ['active', 'inactive'])->default('active');

            // Token and timestamps
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
