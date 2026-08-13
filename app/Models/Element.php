<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Element extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    public function subclasses(): HasMany
    {
        return $this->hasMany(Subclass::class);
    }

    public function attackerMatchups(): HasMany
    {
        return $this->hasMany(ElementMatchup::class, 'attacker_element_id');
    }

    /**
     * Get the damage multiplier when this element attacks $defenderElement.
     */
    public function multiplierAgainst(Element $defenderElement): float
    {
        $matchup = $this->attackerMatchups()
            ->where('defender_element_id', $defenderElement->id)
            ->first();

        return $matchup?->multiplier ?? 1.00;
    }
}
