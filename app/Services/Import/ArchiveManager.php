<?php

namespace Biigle\Services\Import;

use Carbon\Carbon;
use Exception;
use File;
use Storage;
use Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use ZipArchive;

class ArchiveManager
{
    /**
     * Storage disk for uploaded import archives.
     *
     * @var string
     */
    protected $disk;

    /**
     * Base path to the temporary directory to store extracted imports.
     *
     * @var string
     */
    protected $tmpPath;

    /**
     * Class names of available imports.
     *
     * @var array
     */
    protected $importTypes;

    /**
     * Create a new instance.
     */
    public function __construct()
    {
        $this->disk = Storage::disk(config('sync.import_storage_disk'));
        $this->tmpPath = config('sync.tmp_storage');
        $this->importTypes = [
            UserImport::class,
            LabelTreeImport::class,
            VolumeImport::class,
            PublicLabelTreeImport::class,
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
        $token = $this->generateToken();
        $this->disk->putFileAs('', $file, $token);
        try {
            $this->validate($token);
        } catch (Exception $e) {
            $this->delete($token);
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
        return $this->disk->has($token);
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
        $tmpDestination = "{$this->tmpPath}/{$token}";
        $tmpDestinationZip = "{$tmpDestination}.zip";

        if (File::isDirectory($tmpDestination)) {
            File::deleteDirectory($tmpDestination);
        }

        if ($this->has($token)) {
            File::put($tmpDestinationZip, $this->disk->readStream($token));
            $zip = new ZipArchive;

            try {
                $success = $zip->open($tmpDestinationZip);
                if ($success !== true) {
                    throw new Exception('Could not open import archive. Is it a valid ZIP?');
                }

                try {
                    $success = $zip->extractTo($tmpDestination);
                    if ($success !== true) {
                        throw new Exception('Could not extract import archive.');
                    }
                } finally {
                    $zip->close();
                }
            } finally {
                File::delete($tmpDestinationZip);
            }

            foreach ($this->importTypes as $type) {
                $import = new $type($tmpDestination);
                if ($import->filesMatch()) {
                    $import->validateFiles();

                    return $import;
                }
            }
        }

        return null;
    }

    /**
     * Delete the files of an import.
     *
     * @param string $token Import token.
     */
    public function delete($token)
    {
        if ($this->has($token)) {
            $this->disk->delete($token);
        }
    }

    /**
     * Delete uploaded import files that are older than one week.
     */
    public function prune()
    {
        $files = $this->disk->listContents('/');
        $limit = Carbon::now()->subWeek()->getTimestamp();
        foreach ($files as $file) {
            if ($file->lastModified() < $limit) {
                $this->disk->delete($file->path());
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
        return hash_hmac('sha256', Str::random(40), config('app.key'));
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
