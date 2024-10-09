<?php

use Biigle\MediaType;
use Biigle\Project;
use Biigle\Video;
use Biigle\Volume;
use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddVideoVolumes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        MediaType::insert([
            ['name' => 'image'],
            ['name' => 'video'],
        ]);

        Volume::query()->update([
            'media_type_id' => MediaType::where('name', 'image')->first()->id,
        ]);

        MediaType::whereIn('name', ['time-series', 'location-series'])->delete();

        Schema::table('videos', function (Blueprint $table) {
            $table->integer('volume_id')->unsigned()->index()->nullable();
            $table->foreign('volume_id')
                ->references('id')
                ->on('volumes')
                ->onDelete('cascade');

            $table->string('filename', 512)->nullable();
            $table->unique(['filename', 'volume_id']);
        });

        $projectIds = Video::select('project_id')->distinct()->pluck('project_id');
        Project::whereIn('id', $projectIds)->eachById([$this, 'migrateProjectVideos']);

        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn([
                'project_id',
                'url',
                'creator_id',
                'name',
                'created_at',
                'updated_at',
            ]);
            $table->integer('volume_id')->nullable(false)->unsigned()->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->integer('project_id')->unsigned()->index()->nullable();
            $table->foreign('project_id')
                ->references('id')
                ->on('projects')
                ->onDelete('cascade');

            $table->integer('creator_id')->unsigned()->nullable();
            $table->foreign('creator_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->integer('volume_id')->nullable(true)->unsigned()->change();

            $table->string('url')->nullable();
            $table->string('name')->nullable();
            $table->timestamps();
        });

        $id = MediaType::where('name', 'video')->first()->id;
        Volume::where('media_type_id', $id)->eachById(function ($volume) {
            $projectId = $volume->projects()->first()->id;
            Video::where('volume_id', $volume->id)
                ->eachById(function ($video) use ($volume, $projectId) {
                    $video->forceFill([
                        'name' => $video->filename,
                        'url' => "{$volume->url}/{$video->filename}",
                        'project_id' => $projectId,
                        'creator_id' => $volume->creator_id,
                        'created_at' => $volume->created_at,
                        'updated_at' => Carbon::now(),
                    ])->save();
                });
        });

        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn(['volume_id', 'filename']);
            $table->integer('project_id')->nullable(false)->unsigned()->change();
            $table->string('url')->nullable(false)->change();
            $table->string('name')->nullable(false)->change();
        });

        Volume::where('media_type_id', $id)->delete();

        MediaType::insert([
            ['name' => 'time-series'],
            ['name' => 'location-series'],
        ]);

        Volume::query()->update([
            'media_type_id' => MediaType::where('name', 'time-series')->first()->id,
        ]);

        MediaType::whereIn('name', ['image', 'video'])->delete();
    }

    /**
     * Performs the migration for the videos of a project.
     *
     * @param Project $project
     */
    public function migrateProjectVideos($project)
    {
        $videoGroups = $this->groupVideosByUrl(
            Video::where('project_id', $project->id)->orderBy('created_at', 'asc')->get()
        );

        $index = 1;
        $videoGroups->each(function ($subGroup, $url) use ($project, &$index) {
            $subGroup->each(function ($videos) use ($project, $url, &$index) {
                $this->createVideoVolume($project, "Videos-{$index}", $url, $videos);
                $index += 1;
            });
        });
    }

    /**
     * Group videos by a common URL prefix.
     *
     * @param \Illuminate\Support\Collection $videos
     *
     * @return \Illuminate\Support\Collection
     */
    protected function groupVideosByUrl($videos)
    {
        $groups = collect([]);
        $videos->each(function ($video) use ($groups) {
            [$disk, $path] = explode('://', $video->getOriginal('url'));
            $path = explode('/', $path);

            $group = $disk.'://'.array_shift($path);
            $filename = join('/', $path);
            if (!$groups->has($group)) {
                $groups[$group] = collect([collect([])]);
            }

            // Some videos are duplicated in a project. These should be put into
            // separate video volumes.
            if ($groups[$group]->last()->has($filename)) {
                $groups[$group]->push(collect([]));
            }

            $index = 0;
            while ($groups[$group][$index]->has($filename)) {
                $index += 1;
            }

            $groups[$group][$index]->put($filename, $video);
        });



        return $groups;
    }

    /**
     * Create a new video volume
     *
     * @param Project $project
     * @param string $name
     * @param string $url
     * @param \Illuminate\Support\Collection $videos
     */
    protected function createVideoVolume($project, $name, $url, $videos)
    {
        $volume = new Volume;
        $volume->name = $name;
        $volume->media_type_id = MediaType::videoId();
        $volume->url = $url;
        $volume->creator_id = $videos->first()->creator_id;
        $volume->created_at = $videos->first()->created_at;
        $volume->updated_at = Carbon::now();
        if (is_null($volume->creator_id)) {
            $volume->creator_id = $project->creator_id;
        }
        $volume->save();
        $project->addVolumeId($volume->id);

        $videos->each(function ($video, $filename) use ($project, $volume) {
            $video->forceFill([
                'volume_id' => $volume->id,
                'filename' => $filename,
                'attrs' => [
                    'size' => $video->attrs['size'],
                    'mimetype' => $video->attrs['mimetype'],
                ],
            ])->save();
        });
    }
}
