@extends('manual.base')
@section('manual-title', 'Remote volumes')

@section('manual-content')
    <div class="row">
        <p class="lead">
            With remote volumes you can use images from your own data source in BIIGLE.
        </p>

        @if (config('biigle.offline_mode'))
            <div class="panel panel-danger">
                <div class="panel-body text-danger">
                    <strong>This BIIGLE instance is in offline mode.</strong> Remote volumes cannot be created if BIIGLE has no working internet connection.
                </div>
            </div>
        @endif

        <p>
            Typically the image files of volumes are loaded through a network filesystem or even stored on the same machine that runs the BIIGLE application. If you request an image (e.g. in the annotation tool), the application receives the request, loads the image from a storage disk and returns the image file in the response.
        </p>
        <p>
            Depending on where you come from (literally), this setup might pose some problems. Usually you want to work with your own images. This means that you have to transfer all the images to the people that run the BIIGLE instance. So first, you have to inconveniently transfer a large amount of data and second, you lose control of that data. This might not be a problem most of the time but sometimes you might want to keep (control of) your data.
        </p>
        <p>
            This is where remote volumes come in. When you request an image in BIIGLE, your browser doesn't care where this image comes from. So it actually doesn't have to be served from the same machine that runs the BIIGLE application. Instead, BIIGLE only has to know the "remote" location from where the image is served to redirect your request there. And this remote location can be under your control. In addition to that, a remote image location may speed up loading times of the images if your internet connection to the BIIGLE server is rather slow but the connection to the remote location is fast.
        </p>
        <h3>How to set up a remote location for images</h3>
        <p>
            Images from a remote location must be accessible both by the BIIGLE application and your browser. The simplest setup is to make the images publicly available through a web server. After a successful setup you should be able to access the images in your browser via a URL like this <code>https://your-institute.com/subdirectory/image_001.jpg</code>. The domain, directory and image file names are just examples and can be completely arbitrary (<code>http(s)://&lt;domain>/&lt;subdirectories>/&lt;image file></code>).
        </p>
        <p>
            Once the remote location is set up you can create a new volume with the images. Just enter the first part of the location (<code>http(s)://&lt;domain>/&lt;subdirectories></code>) as the volume URL and a comma separated list of all image filenames (<code>&lt;image file></code>) as images. BIIGLE will automatically detect volume images coming from a remote location. The remote location should be available as long as the remote volume exists in BIIGLE.
        </p>
        <p>
            If you want to revoke access to the images of your remote location, just turn your webserver off. Although BIIGLE will keep all information of the volume (annotations, etc.) BIIGLE users won't be able to access the original images any more.
        </p>
        <h3>How to secure a remote location</h3>
        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                Note that every BIIGLE user who has access to the remote volume will always know and have access to your remote location as well (as long as it exists).
            </div>
        </div>
        <p>
            The simplest method to prevent unauthorized access to the images of your remote location is to keep the URL secret. This way only authorized BIIGLE users know and have access to the location. Although <em>theoretically</em> anyone has access to the images, the probability of someone accidentally stumbling on the correct URL can be kept as low as someone accidentally (or by brute force) guessing a correct password.
        </p>
        <p>
            One way to keep this probability low is to use long random names for the image directory and/or the image files. If your remote location URL is <code>https://your-institute.com/images</code>, the directory name is an easy guess. But with <code>https://your-institute.com/4e29be7a-4bfa-4a5e-98c4-c99ce6a94226</code> it becomes almost impossible to guess the URL.
        </p>
        @if (class_exists(\Ramsey\Uuid\Uuid::class))
            <p>
                Here is your personal random string that you can use as a directory name (a <a href="https://github.com/ramsey/uuid">UUID 4</a>). Refresh the page to get a new one:
            </p>
            <pre>{{\Ramsey\Uuid\Uuid::uuid4()}}</pre>
        @endif
        <p>
            Another way is HTTP <a href="https://en.wikipedia.org/wiki/Basic_access_authentication">basic access authentication</a>. With basic auth you can specify a username and password that has to be supplied in order to access the remote location. Let's say you have set up basic auth with the username "admin" and the password "eiYie8ou". To create a remote volume that uses these basic auth credentials, just format the volume URL like this: <code>https://admin:eiYie8ou@your-institute.com</code>. That is <code>https://&lt;username>:&lt;password>@&lt;domain></code>.
        </p>
        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                Never use basic auth without HTTP encryption. If you cannot access your remote location via an <code>https</code> URL, then you should not use basic auth.
            </div>
        </div>
        <p>
            It is also important to note, that HTTP basic auth credentials are always stored and sent in clear text. This basically means that basic auth is <strong>not</strong> more secure than the method with a long random directory name described previously! Every BIIGLE user who has access to the remote volume will see the basic auth credentials.
        </p>
        <h3>Drawbacks of remote volumes</h3>
        <p>
            One drawback of remote volumes obviously is the fact that you have to make the images quasi-publicly accessible. There is always the possibility of a BIIGLE user who has access to a remote volume to take the URL of the remote location and share it with a third party (but they could share their BIIGLE login credentials just the same, for that matter).
        </p>
        <p>
            A bigger drawback is that some of the features of BIIGLE require the images to be stored locally. This means that a few features are disabled for remote volumes. The core functionality for annotations and reports is always available, though. The following features are not available:
        </p>
        <ul>
            @mixin('volumesManualRemoteVolumes')
        </ul>
    </div>
@endsection
