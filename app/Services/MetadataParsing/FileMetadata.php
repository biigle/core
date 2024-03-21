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
    public function getAnnotationLabels(): array
    {
        $labels = [];

        foreach ($this->getAnnotations() as $annotation) {
            foreach ($annotation->labels as $lau) {
                $labels[$lau->label->id] = $lau->label;
            }
        }

        return $labels;
    }

    /**
     * @return array Users indexed by ID.
     */
    public function getUsers(): array
    {
        $users = [];

        foreach ($this->getAnnotations() as $annotation) {
            foreach ($annotation->labels as $lau) {
                $users[$lau->user->id] = $lau->user;
            }
        }

        foreach ($this->getFileLabels() as $lau) {
            $users[$lau->user->id] = $lau->user;
        }

        return $users;
    }
}
