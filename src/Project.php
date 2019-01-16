<?php

namespace Biigle\Modules\Videos;

use Biigle\Project as BaseProject;

class Project extends BaseProject
{
    /**
     * The videos of this project.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function videos()
    {
        return $this->hasMany(Video::class);
    }
}
