<?php

namespace Biigle\Rules;

use App;
use Storage;
use FileCache;
use GuzzleHttp\Client;
use Biigle\FileCache\GenericFile;
use Illuminate\Contracts\Validation\Rule;
use GuzzleHttp\Exception\ServerException;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\RequestException;
use Biigle\Support\VideoCodecExtractor;

class VideoUrl implements Rule
{
    /**
     * The validation message to display.
     *
     * @var string
     */
    protected $message;

    /**
     * Allowed video MIME types
     *
     * @var array
     */
    protected $allowedMimes;

    /**
     * Allowed video codecs
     *
     * @var array
     */
    protected $allowedCodecs;

    /**
     * Create a new instance.
     */
    public function __construct()
    {
        $this->message = 'The video URL is invalid.';
        $this->allowedMimes = [
            'video/mpeg',
            'video/mp4',
            'video/quicktime',
            'video/webm',
        ];
        $this->allowedCodecs = [
            'h264',
            'vp8',
            'vp9',
            'av1',
        ];
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if (strpos($value, 'http') === 0 && !config('biigle.offline_mode')) {
            return $this->passesRemoteUrl($value);
        } else {
            return $this->passesDiskUrl($value);
        }
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return $this->message;
    }

    /**
     * Validate a storage disk video URL.
     *
     * @param string $value
     *
     * @return bool
     */
    protected function passesDiskUrl($value)
    {
        $url = explode('://', $value);

        if (count($url) !== 2) {
            $this->message = "Unable to identify storage disk. Please set the URL as '[disk]://[path]'.";

            return false;
        }

        list($disk, $path) = $url;

        if (!config("filesystems.disks.{$disk}")) {
            $this->message = "Storage disk '{$disk}' does not exist.";

            return false;
        }

        if (!Storage::disk($disk)->exists($path)) {
            $this->message = "Unable to access '{$path}'. Does it exist and you have access permissions?";

            return false;
        }

        if (!$this->passesMimeType(Storage::disk($disk)->mimeType($path))) {
            return false;
        }

        return FileCache::getOnce(new GenericFile($value), function ($file, $path) {
            return $this->passesCodec($path);
        });
    }

    /**
     * Validate a remote video URL.
     *
     * @param string $value
     *
     * @return bool
     */
    protected function passesRemoteUrl($value)
    {
        $client = App::make(Client::class);

        try {
            $response = $client->head($value);
        } catch (ServerException $e) {
            $this->message = 'The remote video URL returned an error response. '.$e->getMessage();

            return false;
        } catch (ClientException $e) {
            $this->message = 'The remote video URL returned an error response. '.$e->getMessage();

            return false;
        } catch (RequestException $e) {
            $this->message = 'The remote video URL does not seem to exist. '.$e->getMessage();

            return false;
        }

        $mime = explode(';', $response->getHeaderLine('Content-Type'))[0];
        if (!$this->passesMimeType($mime)) {
            return false;
        }

        return $this->passesCodec($value);
    }

    /**
     * Validate the MIME type of a video
     *
     * @param string $mime
     *
     * @return bool
     */
    protected function passesMimeType($mime)
    {
        if (!in_array($mime, $this->allowedMimes)) {
            $this->message = "Videos of type '{$mime}' are not supported.";

            return false;
        }

        return true;
    }

    /**
     * Validate the codec of a video
     *
     * @param string $url URL/path to the video file
     *
     * @return bool
     */
    protected function passesCodec($url)
    {
        $codec = App::make(VideoCodecExtractor::class)->extract($url);

        if ($codec === '') {
            $this->message = 'The video codec could not be determined. Is the video file malformed?';

            return false;
        }

        if (!in_array($codec, $this->allowedCodecs)) {
            $this->message = "Videos with codec '{$codec}' are not supported.";

            return false;
        }

        return true;
    }
}
