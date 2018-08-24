<?php

namespace Biigle\Modules\Sync\Support\Import;

use File;
use Exception;
use ZipArchive;
use Carbon\Carbon;
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

        try {
            $this->validate($token);
        } catch (Exception $e) {
            File::deleteDirectory($destination);
            throw $e;
        }

        return $token;
    }

    /**
     * Determine if the files of an import with tthe given token exist.
     *
     * @param string $token Import token.
     *
     * @return bool
     */
    public function has($token)
    {
        return File::isDirectory("{$this->path}/{$token}");
    }

    /**
     * Get the correct import instance for the import with the given token.
     *
     * @param string $token Import token.
     * @throws Exception If the import files are invalid.
     * @return Import|null
     */
    public function get($token)
    {
        if ($this->has($token)) {
            foreach ($this->importTypes as $type) {
                $import = new $type("{$this->path}/{$token}");
                if ($import->filesMatch()) {
                    $import->validateFiles();

                    return $import;
                }
            }
        }

        return;
    }

    /**
     * Delete the files of an import.
     *
     * @param string $token Import token.
     */
    public function delete($token)
    {
        if ($this->has($token)) {
            File::deleteDirectory("{$this->path}/{$token}");
        }
    }

    /**
     * Delete uploaded import files that are older than one week.
     */
    public function prune()
    {
        $directories = File::directories($this->path);
        $limit = Carbon::now()->subWeek()->getTimestamp();
        foreach ($directories as $directory) {
            if (File::lastModified($directory) < $limit) {
                File::deleteDirectory($directory);
            }
        }
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
     * Validate the uploaded import archive.
     *
     * @param string $token
     * @throws  Exception If the import archive is invalid.
     */
    protected function validate($token)
    {
        $type = $this->get($token);

        if (is_null($type)) {
            throw new Exception('The file is not a valid import archive.');
        }

        if ($type instanceof UserImport) {
            if (!in_array('users', config('sync.allowed_imports'))) {
                throw new Exception('User imports are not allowed for this instance.');
            }
        } elseif ($type instanceof LabelTreeImport) {
            if (!in_array('labelTrees', config('sync.allowed_imports'))) {
                throw new Exception('Label tree imports are not allowed for this instance.');
            }
        } elseif ($type instanceof VolumeImport) {
            if (!in_array('volumes', config('sync.allowed_imports'))) {
                throw new Exception('Volume imports are not allowed for this instance.');
            }
        }
    }
}
