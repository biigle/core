<?php

namespace Biigle\Services\Reports\Projects;

class ProjectImageReportGenerator extends ProjectReportGenerator
{
    /**
     * {@inheritdoc}
     */
    public function getProjectSources()
    {
        return $this->source->imageVolumes;
    }
}
