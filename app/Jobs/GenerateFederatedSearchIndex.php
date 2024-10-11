<?php

namespace Biigle\Jobs;

use Biigle\LabelTree;
use Biigle\Project;
use Biigle\User;
use Biigle\Volume;
use Cache;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateFederatedSearchIndex extends Job implements ShouldQueue
{
    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $index = [];
        $index['label_trees'] = $this->generateLabelTreeIndex();

        $index['projects'] = $this->generateProjectIndex();
        $index['volumes'] = $this->generateVolumeIndex();

        $userIds = [];
        foreach ($index['label_trees'] as $tree) {
            $userIds = array_merge($userIds, $tree['members']);
        }

        foreach ($index['projects'] as $project) {
            $userIds = array_merge($userIds, $project['members']);
        }

        $index['users'] = [];
        User::whereIn('id', array_unique($userIds))
            ->select('id', 'uuid')
            ->eachById(function (User $user) use (&$index) {
                $index['users'][] = [
                    'id' => $user->id,
                    'uuid' => $user->uuid,
                ];
            });

        $key = config('biigle.federated_search.cache_key');
        // The index is updated hourly. Make the cached value valid for 3 hours so there
        // is plenty of time to renew it. Otherwise the index is generated on the fly when
        // it is requested and this might time out.
        Cache::put($key, $index, 10800);
    }

    /**
     * Generate the label tree index.
     *
     * @return array
     */
    protected function generateLabelTreeIndex()
    {
        $trees = [];

        // Versions and global label trees should not be indexed.
        LabelTree::withoutVersions()
            ->whereHas('members')
            ->eachById(function (LabelTree $tree) use (&$trees) {
                $trees[] = [
                    'id' => $tree->id,
                    'name' => $tree->name,
                    'description' => $tree->description,
                    'created_at' => strval($tree->created_at),
                    'updated_at' => strval($tree->updated_at),
                    'url' => route('label-trees', $tree->id, false),
                    'members' => $tree->members()->pluck('id')->toArray(),
                ];
            });

        return $trees;
    }

    /**
     * Generate the project index.
     *
     * @return array
     */
    protected function generateProjectIndex()
    {
        $projects = [];
        Project::eachById(function (Project $project) use (&$projects) {
            $projects[] = [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'created_at' => strval($project->created_at),
                'updated_at' => strval($project->updated_at),
                'thumbnail_url' => $project->thumbnailUrl,
                'url' => route('project', $project->id, false),
                'members' => $project->users()->pluck('id')->toArray(),
                // Versions and global label trees should not be indexed.
                'label_trees' => $project->labelTrees()
                    ->withoutVersions()
                    ->has('members')
                    ->pluck('id')
                    ->toArray(),
                'volumes' => $project->volumes()
                    ->pluck('id')
                    ->toArray(),
            ];
        });

        return $projects;
    }

    /**
     * Generate the volume index.
     *
     * @return array
     */
    protected function generateVolumeIndex()
    {
        $volumes = [];
        Volume::eachById(function (Volume $volume) use (&$volumes) {
            $volumes[] = [
                'id' => $volume->id,
                'name' => $volume->name,
                'created_at' => strval($volume->created_at),
                'updated_at' => strval($volume->updated_at),
                'url' => route('volume', $volume->id, false),
                'thumbnail_url' => $volume->thumbnailUrl,
                'thumbnail_urls' => $volume->thumbnailsUrl,
            ];
        });

        return $volumes;
    }
}
