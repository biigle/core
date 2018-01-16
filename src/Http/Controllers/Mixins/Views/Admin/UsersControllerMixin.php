<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Mixins\Views\Admin;

use Biigle\User;
use Biigle\Image;
use Biigle\Volume;

class UsersControllerMixin
{
    /**
     * Add volume statistics to the view.
     *
     * @param User $user
     *
     * @return array
     */
    public function show(User $user)
    {
        $volumesTotal = Volume::count();

        $volumes = Volume::where('creator_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->select('id', 'name')
            ->get();
        $volumesCount = $volumes->count();
        $volumesPercent = $volumesCount > 0 ? round($volumesCount / $volumesTotal * 100, 2) : 0;

        $imagesTotal = Image::count();
        $imagesCount = Image::join('volumes', 'volumes.id', '=', 'images.volume_id')
            ->where('volumes.creator_id', $user->id)
            ->count();
        $imagesPercent = $imagesCount > 0 ? round($imagesCount / $imagesTotal * 100, 2) : 0;

        return compact('volumes', 'volumesCount', 'volumesPercent', 'imagesCount', 'imagesPercent');
    }
}
