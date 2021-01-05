<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects;

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
