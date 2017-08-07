<?php

namespace Biigle\Modules\Annotations\Http\Controllers\Mixins\Views;

use Biigle\User;
use Biigle\Image;

class SearchControllerMixin
{
    /**
     * Add image results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    public function index(User $user, $query, $type)
    {
        if ($user->isAdmin) {
            $imageQuery = Image::query();
        } else {
            $imageQuery = Image::join('project_volume', 'images.volume_id', '=', 'project_volume.volume_id')
                ->join('project_user', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                // Use distinct as volumes may be attached to more than one project.
                ->distinct()
                ->select('images.id', 'images.filename', 'images.uuid', 'images.volume_id');
        }


        if ($query) {
            if (\DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
                $operator = 'ilike';
            } else {
                $operator = 'like';
            }

            $imageQuery = $imageQuery->where('images.filename', $operator, "%{$query}%");
        }

        $values = [
            'imageResultCount' => $imageQuery->count('images.id'),
        ];

        if ($type === 'images') {
            $values['results'] = $imageQuery->orderBy('images.id', 'desc')
                ->paginate(12);
        }

        return $values;
    }
}
