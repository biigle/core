<?php

use Biigle\MediaType;
use Biigle\Project;
use Biigle\Video;
use Biigle\Volume;
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
            $table->dropColumn(['project_id', 'url', 'creator_id', 'name']);
            $table->integer('volume_id')->nullable(false)->change();
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

            $table->integer('volume_id')->nullable(true)->change();

            $table->string('url')->nullable();
            $table->string('name')->nullable();
        });

        $id = MediaType::where('name', 'video')->first()->id;
        Volume::where('media_type_id', $id)->eachById(function ($volume) {
            $projectId = $volume->projects()->first()->id;
            Video::where('volume_id', $volume->id)
                ->eachById(function ($video) use ($volume, $projectId) {
                    $video->update([
                        'name' => $video->filename,
                        'url' => "{$volume->url}/{$video->filename}",
                        'project_id' => $projectId,
                        'creator_id' => $volume->creator_id,
                    ]);
                });
        });

        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn(['volume_id', 'filename']);
            $table->integer('project_id')->nullable(false)->change();
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
        $videoGroups = $this->groupVideosByUrl($project->videos);

        if ($videoGroups->count() === 1) {
            $volume = new Volume;
            $volume->name = 'Videos';
            $volume->url = $videoGroups->keys()->first();
            $volume->creator_id = $videoGroups->first()->first()->creator_id;
            $volume->save();
            $project->addVolumeId($volume->id);

            $videoGroups[$volume->url]->each(function ($video) use ($volume) {
                $video->update([
                    'volume_id' => $volume->id,
                    'filename' => basename($video->url),
                    'attrs' => [
                        'size' => $video->attrs['size'],
                        'mimetype' => $video->attrs['mimetype'],
                    ],
                ]);
            });
        } else {
            $index = 1;
            $videoGroups->each(function ($videos, $url) use ($project, &$index) {
                $volume = new Volume;
                $volume->name = "Videos-{$index}";
                $volume->url = $url;
                $volume->creator_id = $videos->first()->creator_id;
                $volume->save();
                $project->addVolumeId($volume->id);
                $videos->each(function ($video) use ($volume) {
                    $video->update([
                        'volume_id' => $volume->id,
                        'filename' => basename($video->url),
                    ]);
                });
                $index += 1;
            });
        }
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
        $videos->each(function ($video) {
            $group = dirname($video->url);
            if (!$groups->has($group)) {
                $groups[$group] = [];
            }

            $groups[$group]->push($video);
        });

        return $groups;
    }
}
