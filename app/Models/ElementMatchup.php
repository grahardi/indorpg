<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElementMatchup extends Model
{
    protected $fillable = ['attacker_element_id', 'defender_element_id', 'multiplier'];

    public function attackerElement(): BelongsTo
    {
        return $this->belongsTo(Element::class, 'attacker_element_id');
    }

    public function defenderElement(): BelongsTo
    {
        return $this->belongsTo(Element::class, 'defender_element_id');
    }
}
