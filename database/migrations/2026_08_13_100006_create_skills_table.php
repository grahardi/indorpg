<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subclass_id')->constrained('subclasses')->cascadeOnDelete();
            $table->foreignId('element_id')->nullable()->constrained('elements')->nullOnDelete();

            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('tier')->default(1); // 1,2,3
            $table->string('branch')->nullable();            // opsional cabang di tier 2/3

            $table->enum('scaling_stat', ['physical', 'magic']);
            $table->unsignedSmallInteger('stamina_cost')->default(0);
            $table->unsignedSmallInteger('mana_cost')->default(0);
            $table->unsignedSmallInteger('cooldown_seconds')->default(0);
            $table->decimal('base_multiplier', 5, 2)->default(1.00);
            $table->unsignedSmallInteger('required_level')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};
