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
     * @var array<LabelAndAnnotator>
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

    public function addFileLabel(LabelAndAnnotator $la): void
    {
        $this->labels[] = $la;
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
     * The returned array is indexed by label IDs.
     */
    public function getAnnotationLabels(): array
    {
        $labels = [];

        foreach ($this->getAnnotations() as $annotation) {
            foreach ($annotation->labels as $annotationLabel) {
                $labels[$annotationLabel->label->id] = $annotationLabel->label;
            }
        }

        return $labels;
    }
}
