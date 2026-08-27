<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Resep crafting buat naikin 1 Accession Item ke tier tertentu (20/40/60/
 * 80/100 - "Part 1" s/d "Part 5"). `materials` = JSON {item_id: quantity},
 * item_id yang dimaksud harus item category='material' (Mithril, Ore, dll).
 * Item Legendary biasanya butuh material yang lebih langka/banyak dari item
 * Common/Rare buat tier yang sama - diatur bebas per resep lewat admin.
 */
class AccessionRecipe extends Model
{
    protected $fillable = ['item_id', 'tier', 'materials'];

    protected $casts = [
        'materials' => 'array',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
