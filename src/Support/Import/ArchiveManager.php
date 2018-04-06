<?php

namespace Biigle\Modules\Sync\Support\Import;

use File;
use Exception;
use ZipArchive;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class ArchiveManager
{
    /**
     * Base path to the import archive storage directory.
     *
     * @var string
     */
    protected $path;

    /**
     * CLass names of available imports.
     *
     * @var array
     */
    protected $importTypes;

    /**
     * Create a new instance.
     */
    public function __construct()
    {
        $this->path = config('sync.import_storage');
        $this->importTypes = [
            UserImport::class,
            LabelTreeImport::class,
            VolumeImport::class,
        ];
    }

    /**
     * Stores an uploaded archive file and returns its token.
     *
     * @param UploadedFile $file
     *
     * @throws Exception If the import archive is corrupt.
     * @return string
     */
    public function store(UploadedFile $file)
    {
        $zip = new ZipArchive;
        $success = $zip->open($file->getPathName());
        if ($success !== true) {
            throw new Exception('Could not open import archive. Is it a valid ZIP?');
        }
        $token = $this->generateToken();
        $destination = $this->path."/{$token}";
        $success = $zip->extractTo($destination);
        if ($success !== true) {
            throw new Exception('Could not extract import archive.');
        }
        $zip->close();

        if ($this->get($token) === null) {
            File::deleteDirectory($destination);
            throw new Exception('The file is not a valid import archive.');
        }

        return $token;
    }

    /**
     * Generates a new token for an import.
     *
     * @return string
     */
    protected function generateToken()
    {
        return hash_hmac('sha256', str_random(40), config('app.key'));
    }

    /**
     * Get the correct import instance for the import with the given token.
     *
     * @param string $token Import token.
     * @throws Exception If the import files are invalid.
     * @return Import|null
     */
    protected function get($token)
    {
        $path = $this->path."/{$token}";

        foreach ($this->importTypes as $type) {
            $import = new $type($path);
            if ($import->filesMatch()) {
                $import->validateFiles();

                return $import;
            }
        }

        return null;
    }
}

