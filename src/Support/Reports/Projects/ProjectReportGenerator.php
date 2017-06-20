<?php

namespace Biigle\Modules\Export\Support\Reports\Projects;

use App;
use Exception;
use Biigle\Project;
use Biigle\Modules\Export\Support\File;
use Biigle\Modules\Export\Support\Reports\ReportGenerator;
use Biigle\Modules\Export\Support\Reports\MakesZipArchives;

class ProjectReportGenerator extends ReportGenerator
{
    use MakesZipArchives;

    /**
     * The class of the volume report generator to use for this project report.
     *
     * @var string
     */
    protected $volumeReportClass;

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension = 'zip';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $filesForZip = [];

        foreach ($this->source->volumes as $volume) {
            $report = App::make($this->volumeReportClass, [
                'source' => $volume,
                'options' => $this->options,
            ]);
            $file = File::makeTmp();
            $report->generate($file->getPath());
            // The individual volume reports should be deleted again after
            // the ZIP of this report was created.
            $this->tmpFiles[] = $file;
            $filesForZip[$file->getPath()] = $volume->id.'_'.$report->getFullFilename();
        }

        $this->makeZip($filesForZip, $path);
    }
}
