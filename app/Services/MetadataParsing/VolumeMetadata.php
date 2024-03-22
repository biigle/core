<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\MediaType;
use Biigle\User as DbUser;
use Illuminate\Support\Collection;

class VolumeMetadata
{
    public Collection $files;

    public function __construct(
        public ?MediaType $type = null,
        public ?string $name = null,
        public ?string $url = null,
        public ?string $handle = null
    ) {
        $this->files = collect([]);
    }

    public function addFile(FileMetadata $file)
    {
        $this->files[$file->name] = $file;
    }

    public function getFiles(): Collection
    {
        return $this->files->values();
    }

    public function getFile(string $name): ?FileMetadata
    {
        return $this->files->get($name);
    }

    /**
     * Determine if there is any file metadata.
     */
    public function isEmpty(): bool
    {
        foreach ($this->files as $file) {
            if (!$file->isEmpty()) {
                return false;
            }
        }

        return true;
    }

    public function hasAnnotations(): bool
    {
        foreach ($this->files as $file) {
            if ($file->hasAnnotations()) {
                return true;
            }
        }

        return false;
    }

    public function hasFileLabels(): bool
    {
        foreach ($this->files as $file) {
            if ($file->hasFileLabels()) {
                return true;
            }
        }

        return false;
    }

    /**
     * The returned array is indexed by label IDs.
     */
    public function getAnnotationLabels(): array
    {
        $labels = [];

        foreach ($this->files as $file) {
            // Use union to automatically remove duplicates.
            $labels += $file->getAnnotationLabels();
        }

        return $labels;
    }

    /**
     * The returned array is indexed by label IDs.
     */
    public function getFileLabels(): array
    {
        $labels = [];

        foreach ($this->files as $file) {
            foreach ($file->getFileLabels() as $fileLabel) {
                $labels[$fileLabel->label->id] = $fileLabel->label;
            }
        }

        return $labels;
    }

    /**
     * Get all users associated with annotations and/or file labels.
     *
     * @param array $onlyLabels List of metadata label IDs to filter the list of users.
     *
     * @return array Users indexed by ID.
     */
    public function getUsers(array $onlyLabels = []): array
    {
        $users = [];

        foreach ($this->files as $file) {
            // Use union to automatically remove duplicates.
            $users += $file->getUsers($onlyLabels);
        }

        return $users;
    }

    /**
     * @param array $map Optional map of metadata user IDs to database user IDs. Metadata
     * users not in this list will be matched by their UUID (if any).
     * @param array $onlyLabels Consider only users belonging to annotation labels or
     *  file labels with one of the specified metadata label IDs.
     *
     * @return array Map of metadata user IDs to User database model instances or null
     * if no match was found.
     */
    public function getMatchingUsers(array $map = [], array $onlyLabels = []): array
    {
        $users = $this->getUsers($onlyLabels);

        // Remove database user IDs that don't actually exist.
        $idMap = DbUser::whereIn('id', array_unique($map))->pluck('id', 'id');
        $map = array_filter($map, fn ($id) => $idMap->has($id));

        // Fetch database user IDs based on UUIDs.
        $fetchUuids = array_filter($users,
            fn ($u) => !array_key_exists($u->id, $map) && !is_null($u->uuid)
        );
        $fetchUuids = array_map(fn ($u) => $u->uuid, $fetchUuids);
        $uuidMap = DbUser::whereIn('uuid', $fetchUuids)->pluck('id', 'uuid');

        foreach ($users as $user) {
            if (array_key_exists($user->id, $map)) {
                continue;
            }

            $map[$user->id] = $uuidMap->get($user->uuid, null);
        }

        return $map;
    }
}
