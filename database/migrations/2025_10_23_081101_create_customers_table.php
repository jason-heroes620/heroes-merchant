<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Link to users table
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            // Auto-calculate age from date_of_birth
            $table->date('date_of_birth')->nullable();
            $table->integer('age')->nullable();
            // Auto-linked device and referral info
            $table->string('device_id')->unique()->nullable(); 
            $table->string('referral_code')->unique()->nullable();
            $table->uuid('referred_by')->nullable(); 
            $table->foreign('referred_by')->references('id')->on('customers')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('customers');
    }
};