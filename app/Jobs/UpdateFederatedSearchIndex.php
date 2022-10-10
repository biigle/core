<?php

namespace Biigle\Jobs;

use App;
use Biigle\FederatedSearchInstance;
use Biigle\FederatedSearchModel;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\User;
use Biigle\Volume;
use Carbon\Carbon;
use DB;
use Exception;
use GuzzleHttp\Client;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UpdateFederatedSearchIndex extends Job implements ShouldQueue
{
    use SerializesModels;

    /**
     * The instance from which the index should be updated.
     *
     * @var FederatedSearchInstance
     */
    public $instance;

    /**
     * Ignore this job if the volume does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Retry a failed job after 5 minutes.
     *
     * @var int
     */
    protected $backoff = 300;

    /**
     * Create a new job instance.
     *
     * @param FederatedSearchInstance $instance The instance from which the index should
     * be updated.
     *
     * @return void
     */
    public function __construct(FederatedSearchInstance $instance)
    {
        $this->instance = $instance;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        if (!$this->instance->remote_token) {
            return;
        }

        $url = $this->instance->url.route('federated-search-index', '', false);
        $client = App::make(Client::class);

        $response = $client->get($url, [
            'headers' => [
                'Authorization' => "Bearer {$this->instance->remote_token}",
            ],
        ]);

        $validator = $this->getValidator($response);

        if ($validator->fails()) {
            $body = Str::limit($response->getBody(), 5000);
            $errors = $validator->errors()->toJson();
            throw new Exception("The remote instance returned an invalid response for the federated search index: {$body} {$errors}");
        }

        $index = $validator->validated();

        DB::transaction(function () use ($index) {
            $labelTreeIdMap = $this->updateLabelTreeIndex($index);
            $projectIdMap = $this->updateProjectIndex($index);
            $volumeIdMap = $this->updateVolumeIndex($index);
            $this->updateUserAccess($index, $labelTreeIdMap, $projectIdMap, $volumeIdMap);

            $this->cleanupDanglingModels();
        });

        $this->instance->indexed_at = Carbon::now();
        $this->instance->save();
    }

    /**
     * Get the validator instance for the response.
     *
     * @param \GuzzleHttp\Psr7\Response $response
     *
     * @return \Illuminate\Validation\Validator
     */
    protected function getValidator($response)
    {
        $data = json_decode($response->getBody(), true);

        return Validator::make($data, [
            'label_trees' => 'present|array',
            'label_trees.*.id' => 'required|integer',
            'label_trees.*.name' => 'required|string',
            'label_trees.*.description' => 'nullable|string',
            'label_trees.*.created_at' => 'required|date',
            'label_trees.*.updated_at' => 'required|date',
            'label_trees.*.url' => 'required|string',
            'label_trees.*.members' => 'present|array',
            'label_trees.*.members.*' => 'integer',
            'projects' => 'present|array',
            'projects.*.id' => 'required|integer',
            'projects.*.name' => 'required|string',
            'projects.*.description' => 'required|string',
            'projects.*.created_at' => 'required|date',
            'projects.*.updated_at' => 'required|date',
            'projects.*.url' => 'required|string',
            'projects.*.thumbnail_url' => 'nullable|string',
            'projects.*.members' => 'present|array',
            'projects.*.members.*' => 'integer',
            'projects.*.label_trees' => 'present|array',
            'projects.*.label_trees.*' => 'integer',
            'projects.*.volumes' => 'present|array',
            'projects.*.volumes.*' => 'integer',
            'volumes' => 'present|array',
            'volumes.*.id' => 'required|integer',
            'volumes.*.name' => 'required|string',
            'volumes.*.created_at' => 'required|date',
            'volumes.*.updated_at' => 'required|date',
            'volumes.*.url' => 'required|string',
            'volumes.*.thumbnail_url' => 'nullable|string',
            'volumes.*.thumbnail_urls' => 'nullable|array',
            'volumes.*.thumbnail_urls.*' => 'string',
            'users' => 'present|array',
            'users.*.id' => 'required|integer',
            'users.*.uuid' => 'required|uuid',
        ]);
    }

    /**
     * Update the indexed label trees.
     *
     * @param array $index
     *
     * @return array Map of remote label tree IDs to local federated search model IDs.
     */
    protected function updateLabelTreeIndex($index)
    {
        $this->instance->models()->labelTrees()->delete();

        $trees = collect($index['label_trees']);

        $trees->chunk(1000)->each(function ($chunk) {
            $insert = [];
            foreach ($chunk as $tree) {
                $insert[] = [
                    'name' => $tree['name'],
                    'description' => $tree['description'],
                    'url' => $this->instance->url.$tree['url'],
                    'created_at' => $tree['created_at'],
                    'updated_at' => $tree['updated_at'],
                    'type' => LabelTree::class,
                    'federated_search_instance_id' => $this->instance->id,
                ];
            }

            FederatedSearchModel::insert($insert);
        });

        $treeIds = $trees->pluck('id')->toArray();
        $modelIds = $this->instance->models()
            ->orderBy('id', 'asc')
            ->labelTrees()
            ->pluck('id')
            ->toArray();

        return array_combine($treeIds, $modelIds);
    }

    /**
     * Update the indexed projects.
     *
     * @param array $index
     *
     * @return array Map of remote project IDs to local federated search model IDs.
     */
    protected function updateProjectIndex($index)
    {
        $this->instance->models()->projects()->delete();

        $projects = collect($index['projects']);

        $projects->chunk(1000)->each(function ($chunk) {
            $insert = [];
            foreach ($chunk as $project) {
                $insert[] = [
                    'name' => $project['name'],
                    'description' => $project['description'],
                    'url' => $this->instance->url.$project['url'],
                    'created_at' => $project['created_at'],
                    'updated_at' => $project['updated_at'],
                    'type' => Project::class,
                    'attrs' => json_encode([
                        'thumbnailUrl' => $project['thumbnail_url'],
                    ]),
                    'federated_search_instance_id' => $this->instance->id,
                ];
            }

            FederatedSearchModel::insert($insert);
        });

        $projectIds = $projects->pluck('id')->toArray();
        $modelIds = $this->instance->models()
            ->orderBy('id', 'asc')
            ->projects()
            ->pluck('id')
            ->toArray();

        return array_combine($projectIds, $modelIds);
    }

    /**
     * Update the indexed projects.
     *
     * @param array $index
     *
     * @return array Map of remote volume IDs to local federated search model IDs.
     */
    protected function updateVolumeIndex($index)
    {
        $this->instance->models()->volumes()->delete();

        $volumes = collect($index['volumes']);

        $volumes->chunk(1000)->each(function ($chunk) {
            $insert = [];
            foreach ($chunk as $volume) {
                $insert[] = [
                    'name' => $volume['name'],
                    'url' => $this->instance->url.$volume['url'],
                    'created_at' => $volume['created_at'],
                    'updated_at' => $volume['updated_at'],
                    'type' => Volume::class,
                    'attrs' => json_encode([
                        'thumbnailUrl' => $volume['thumbnail_url'],
                        'thumbnailUrls' => $volume['thumbnail_urls'],
                    ]),
                    'federated_search_instance_id' => $this->instance->id,
                ];
            }

            FederatedSearchModel::insert($insert);
        });

        $volumeIds = $volumes->pluck('id')->toArray();
        $modelIds = $this->instance->models()
            ->orderBy('id', 'asc')
            ->volumes()
            ->pluck('id')
            ->toArray();

        return array_combine($volumeIds, $modelIds);
    }


    /**
     * Update which user may access which federated search model that was created in
     * this job.
     *
     * @param array $index
     * @param array $labelTreeIdMap Map of remote label tree IDs to local federated
     * search model IDs.
     * @param array $projectIdMap Map of remote project IDs to local federated search
     * model IDs.
     * @param array $volumeIdMap Map of remote volume IDs to local federated search
     * model IDs.
     */
    protected function updateUserAccess($index, $labelTreeIdMap, $projectIdMap, $volumeIdMap)
    {
        $remoteUsers = collect($index['users'])->pluck('id', 'uuid');
        $localUsers = User::whereIn('uuid', $remoteUsers->keys())->pluck('id', 'uuid');

        // Map of remote user IDs to local user IDs.
        $userIdMap = [];
        $localUsers->each(function ($id, $uuid) use ($remoteUsers, &$userIdMap) {
            $userIdMap[$remoteUsers[$uuid]] = $id;
        });

        $userCanAccessModels = [];

        foreach ($index['label_trees'] as $tree) {
            foreach ($tree['members'] as $id) {
                if (array_key_exists($id, $userIdMap)) {
                    $localId = $userIdMap[$id];
                    $userCanAccessModels[$localId][] = $labelTreeIdMap[$tree['id']];
                }
            }
        }

        foreach ($index['projects'] as $project) {
            foreach ($project['members'] as $id) {
                if (array_key_exists($id, $userIdMap)) {
                    $localId = $userIdMap[$id];
                    $userCanAccessModels[$localId][] = $projectIdMap[$project['id']];

                    // Members of a project have access to all attached label trees even
                    // if they are not a member of the tree.
                    foreach ($project['label_trees'] as $treeId) {
                        if (array_key_exists($treeId, $labelTreeIdMap)) {
                            $userCanAccessModels[$localId][] = $labelTreeIdMap[$treeId];
                        }
                    }

                    foreach ($project['volumes'] as $volumeId) {
                        if (array_key_exists($volumeId, $volumeIdMap)) {
                            $userCanAccessModels[$localId][] = $volumeIdMap[$volumeId];
                        }
                    }
                }
            }
        }

        $insert = [];
        foreach ($userCanAccessModels as $userId => $modelIds) {
            foreach (array_unique($modelIds) as $modelId) {
                $insert[] = [
                    'user_id' => $userId,
                    'federated_search_model_id' => $modelId,
                ];

                // Chunk this insert.
                if (count($insert) >= 1000) {
                    DB::table('federated_search_model_user')->insert($insert);
                    $insert = [];
                }
            }
        }

        DB::table('federated_search_model_user')->insert($insert);
    }

    /**
     * Delete all federated search models of the current instance that are not
     * accessible by any user.
     */
    protected function cleanupDanglingModels()
    {
        $this->instance->models()->whereDoesntHave('users')->delete();
    }
}
