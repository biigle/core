@extends('manual.base')
@section('manual-title', 'Remote locations')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Remote locations serve volume files from a public web server.
        </p>

        @if (config('biigle.offline_mode'))
            <div class="panel panel-danger">
                <div class="panel-body text-danger">
                    <strong>This BIIGLE instance is in offline mode.</strong> Remote locations cannot be created if BIIGLE has no working internet connection.
                </div>
            </div>
        @endif

        <p>
            Typically the files of volumes are loaded through a network filesystem or even stored on the same machine that runs the BIIGLE application. If you request an image or video (e.g. in the annotation tool), the application receives the request, loads the file from a storage disk and returns the file in the response.
        </p>
        <p>
            Depending on where you come from (literally), this setup might pose some problems. Usually you want to work with your own files. This means that you have to transfer all the files to the BIIGLE instance. So first, you have to inconveniently transfer a large amount of data and second, you lose control of that data. This might not be a problem most of the time but sometimes you might want to keep (control of) your data.
        </p>
        <p>
            This is where remote locations come in. When you request an image or video in BIIGLE, your browser doesn't care where this file comes from. So it actually doesn't have to be served from the same machine that runs the BIIGLE application. Instead, BIIGLE only has to know the (remote) location from where the file is served to redirect your request there. And this remote location can be under your control. In addition to that, a remote location may speed up loading times of the files if your internet connection to the BIIGLE server is rather slow but the connection to the remote location is fast. This can be particularly effective for large video files.
        </p>
        <h3><a name="how-to-set-up"></a>How to set up a remote location</h3>
        <p>
            Files from a remote location must be accessible both by the BIIGLE application and your browser. The simplest setup is to make the file publicly available through a web server. After a successful setup, you should be able to access the files in your browser via a URL like this <code>https://your-institute.com/subdirectory/image_001.jpg</code>. The domain, directory and file names are just examples and can be completely arbitrary (<code>http(s)://&lt;domain>/&lt;subdirectories>/&lt;file></code>).
        </p>
        <p>
            Once the remote location is set up, you can create a new volume with the files. Just enter the first part of the location (<code>http(s)://&lt;domain>/&lt;subdirectories></code>) as the volume URL and a comma-separated list of all filenames (<code>&lt;file></code>) as files. BIIGLE will automatically detect volume files coming from a remote location. The remote location should be available as long as the volume exists in BIIGLE.
        </p>
        <p>
            If you want to revoke access to the files of your remote location, just turn your webserver off. Although BIIGLE will keep all information of the volume (annotations, etc.), BIIGLE users won't be able to access the original files any more.
        </p>

        <h3><a name="cors"></a>Cross-Origin Resource Sharing</h3>

        <div class="panel panel-info">
            <div class="panel-body text-info">
                BIIGLE used to support remote images without CORS but this is no longer possible because of recent changes in web browsers.
            </div>
        </div>

        <p>
            The cross-origin policy is a security mechanism of web browsers that prevents malicious third parties from extracting sensitive information from your web pages. This includes cases like loading files from remote sources in BIIGLE. <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS">Cross-Origin Resource Sharing</a> (CORS) is a mechanism to manually configure exceptions for the cross-origin policy. BIIGLE can only process files from remote sources that have a correct CORS configuration.
        </p>
        <p>
            To set up CORS for the files of your remote source, you have to update the configuration of the webserver that serves the files. Some cloud storage services specifically provide configuration options for CORS. The webserver has to add the following HTTP headers to any <code>GET</code> or <code>OPTIONS</code> HTTP request for a file:
        </p>
<pre>
Access-Control-Allow-Origin "*"
Access-Control-Allow-Headers "x-requested-with"
</pre>
        <p>
            In addition to that, you have to use a secure HTTP connection (<code>https://</code>) to access the files.
        </p>

        <h3><a name="how-to-secure"></a>How to secure a remote location</h3>
        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                Note that every BIIGLE user who has access to the volume will always know and have access to your remote location as well (as long as it exists).
            </div>
        </div>
        <p>
            A method to prevent unauthorized access to the files of your remote location is to keep the URL secret. This way, only authorized BIIGLE users know and have access to the location. Although <em>theoretically</em> anyone has access to the files, the probability of someone accidentally stumbling on the correct URL can be kept as low as someone accidentally (or by brute force) guessing a correct password.
        </p>
        <p>
            One way to keep this probability low is to use long random names for the directory and/or the files. If your remote location URL is <code>https://your-institute.com/files</code>, the directory name is an easy guess. But with <code>https://your-institute.com/4e29be7a-4bfa-4a5e-98c4-c99ce6a94226</code> it becomes almost impossible to guess the URL.
        </p>
        @if (class_exists(\Ramsey\Uuid\Uuid::class))
            <p>
                Here is your personal random string that you can use as a directory name (a <a href="https://github.com/ramsey/uuid">UUID4</a>). Refresh the page to get a new one:
            </p>
            <pre>{{\Ramsey\Uuid\Uuid::uuid4()}}</pre>
        @endif
        <p>
            In addition to a URL that is hard to guess, you must use secure HTTP connections. This means that you always use <code>https://</code> URLs instead of <code>http://</code> URLs. Furthermore, you must disable directory listing in your web server.
        </p>
    </div>
@endsection
