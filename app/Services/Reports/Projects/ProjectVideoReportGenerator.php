<?php

namespace Biigle\Services\Reports\Projects;

class ProjectVideoReportGenerator extends ProjectReportGenerator
{
    /**
     * {@inheritdoc}
     */
    public function getProjectSources()
    {
        return $this->source->videoVolumes;
    }
}
