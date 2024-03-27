<?php

namespace Biigle\Services\MetadataParsing;

class FileMetadata
{
    /**
     * @var array<ImageAnnotation>
     */
    public array $annotations = [];

    /**
     * The labels directly attached to the file.
     *
     * @var array<LabelAndUser>
     */
    public array $labels = [];

    public function __construct(public string $name)
    {
        $this->name = trim($this->name);
    }

    public function isEmpty(): bool
    {
        return true;
    }

    /**
     * Get the array of metadata that can be used for Model::insert();
     */
    public function getInsertData(): array
    {
        return [];
    }

    public function addAnnotation(Annotation $annotation): void
    {
        $this->annotations[] = $annotation;
    }

    public function getAnnotations(): array
    {
        return $this->annotations;
    }

    public function hasAnnotations(): bool
    {
        return !empty($this->annotations);
    }

    public function addFileLabel(LabelAndUser $lau): void
    {
        $this->labels[] = $lau;
    }

    public function getFileLabels(): array
    {
        return $this->labels;
    }

    public function hasFileLabels(): bool
    {
        return !empty($this->labels);
    }

    /**
     * @return array Labels indexed by ID.
     */
    public function getFileLabelLabels(array $onlyLabels = []): array
    {
        $labels = [];

        foreach ($this->getFileLabelLabelAndUsers($onlyLabels) as $lau) {
            $labels[$lau->label->id] = $lau->label;
        }

        return $labels;
    }

    /**
     * @return array Labels indexed by ID.
     */
    public function getAnnotationLabels(array $onlyLabels = []): array
    {
        $labels = [];

        foreach ($this->getAnnotationLabelAndUsers($onlyLabels) as $lau) {
            $labels[$lau->label->id] = $lau->label;
        }

        return $labels;
    }

    /**
     * @param array $onlyLabels List of metadata label IDs to filter the list of users.
     *
     * @return array Users indexed by ID.
     */
    public function getUsers(array $onlyLabels = []): array
    {
        $users = [];

        foreach ($this->getAnnotationLabelAndUsers($onlyLabels) as $lau) {
            $users[$lau->user->id] = $lau->user;
        }

        foreach ($this->getFileLabelLabelAndUsers($onlyLabels) as $lau) {
            $users[$lau->user->id] = $lau->user;
        }

        return $users;
    }

    protected function getAnnotationLabelAndUsers(array $onlyLabels = []): array
    {
        $ret = [];
        $onlyLabels = array_flip($onlyLabels);

        foreach ($this->getAnnotations() as $annotation) {
            if (!$onlyLabels) {
                $add = $annotation->labels;
            } else {
                $add = array_filter($annotation->labels, fn ($lau) => array_key_exists($lau->label->id, $onlyLabels));
            }

            $ret = array_merge($ret, $add);
        }

        return $ret;
    }

    protected function getFileLabelLabelAndUsers(array $onlyLabels = []): array
    {
        if (!$onlyLabels) {
            return $this->getFileLabels();
        }

        $onlyLabels = array_flip($onlyLabels);

        return array_filter(
            $this->getFileLabels(),
            fn ($lau) => array_key_exists($lau->label->id, $onlyLabels)
        );
    }
}
