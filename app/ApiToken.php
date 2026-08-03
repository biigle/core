<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Hidden(['hash'])]
class ApiToken extends Model
{
    use HasFactory;

    /**
     * The user, this token belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this>
     */
    public function owner()
    {
        return $this->belongsTo(User::class);
    }
}
