<?php

namespace Biigle\Http\Controllers\Views;

use Biigle\User;
use Biigle\Video;
use Biigle\Image;
use Biigle\Volume;
use Biigle\Project;
use Biigle\LabelTree;
use Biigle\Services\Modules;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;

class SearchController extends Controller
{
    /**
     * Shows the search page.
     *
     * @param Guard $auth
     * @param Request $request
     * @param Modules $modules
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth, Request $request, Modules $modules)
    {
        $query = $request->input('q', '');
        // Type (e.g. projects, volumes)
        $type = $request->input('t', '');
        $user = $auth->user();

        $args = compact('user', 'query', 'type');
        $values = $this->searchProjects($user, $query, $type);
        $values = array_merge($values, $this->searchLabelTrees($user, $query, $type));
        $values = array_merge($values, $this->searchVolumes($user, $query, $type));
        $values = array_merge($values, $this->searchAnnotations($user, $query, $type));
        $values = array_merge($values, $this->searchVideos($user, $query, $type));
        $values = array_merge($values, $modules->callControllerMixins('search', $args));

        if (array_key_exists('results', $values)) {
            if ($query) {
                $values['results']->appends('q', $query);
            }

            if ($type) {
                $values['results']->appends('t', $type);
            }
        }

        return view('search.index', array_merge($args, $values));
    }

    /**
     * Add label tree results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    protected function searchLabelTrees(User $user, $query, $type)
    {
        $queryBuilder = LabelTree::withoutVersions()->accessibleBy($user);

        if ($query) {
            $queryBuilder = $queryBuilder->where(function ($q) use ($query) {
                $q->where('label_trees.name', 'ilike', "%{$query}%")
                    ->orWhere('label_trees.description', 'ilike', "%{$query}%");
            });
        }

        $values = [];

        if ($type === 'label-trees') {
            $values['results'] = $queryBuilder
                ->orderBy('label_trees.updated_at', 'desc')
                ->paginate(10);

            $values['labelTreeResultCount'] = $values['results']->total();
        } else {
            $values = ['labelTreeResultCount' => $queryBuilder->count()];
        }

        return $values;
    }

    /**
     * Add project results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    protected function searchProjects(User $user, $query, $type)
    {
        if ($user->can('sudo')) {
            $queryBuilder = Project::query();
        } else {
            $queryBuilder = $user->projects();
        }

        if ($query) {
            $queryBuilder = $queryBuilder->where(function ($q) use ($query) {
                $q->where('projects.name', 'ilike', "%{$query}%")
                    ->orWhere('projects.description', 'ilike', "%{$query}%");
            });
        }

        $values = [];

        if (!$type || $type === 'projects') {
            $values['results'] = $queryBuilder->orderBy('updated_at', 'desc')
                ->paginate(10);

            $values['projectResultCount'] = $values['results']->total();
        } else {
            $values = ['projectResultCount' => $queryBuilder->count()];
        }

        return $values;
    }

    /**
     * Add volume results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    protected function searchVolumes(User $user, $query, $type)
    {
        $queryBuilder = Volume::accessibleBy($user)
            ->select('volumes.id', 'volumes.updated_at', 'volumes.name');

        if ($query) {
            $queryBuilder = $queryBuilder->where('volumes.name', 'ilike', "%{$query}%");
        }

        $values = [];

        if ($type === 'volumes') {
            $values['results'] = $queryBuilder->orderBy('volumes.updated_at', 'desc')
                ->paginate(12);

            $values['volumeResultCount'] = $values['results']->total();
        } else {
            $values = ['volumeResultCount' => $queryBuilder->count()];
        }

        return $values;
    }

    /**
     * Add image results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    protected function searchAnnotations(User $user, $query, $type)
    {
        if ($user->can('sudo')) {
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
            $imageQuery = $imageQuery->where('images.filename', 'ilike', "%{$query}%");
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

    /**
     * Add video results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    protected function searchVideos(User $user, $query, $type)
    {
        $queryBuilder = Video::accessibleBy($user);

        if ($query) {
            $queryBuilder = $queryBuilder->where(function ($q) use ($query) {
                $q->where('videos.name', 'ilike', "%{$query}%");
            });
        }

        $values = [];

        if ($type === 'videos') {
            $values['results'] = $queryBuilder
                ->orderBy('videos.updated_at', 'desc')
                ->paginate(12);

            $values['videoResultCount'] = $values['results']->total();
        } else {
            $values = ['videoResultCount' => $queryBuilder->count()];
        }

        return $values;
    }
}
