@extends('app')

@section('title', 'Manual')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
            <h1>Manual</h1>
            <p class="lead">
                This is the application manual of BIIGLE. Here you can find articles on how to use the application as well as reference publications and the developer documentation.
            </p>
            <h3>
                <a href="{{route('manual-tutorials', 'login-and-account-settings')}}">Account settings</a>
            </h3>

            <p>
                Learn how you can manage your user account.
            </p>

            <h3>
                <a href="{{route('manual-tutorials', 'notifications')}}">Notifications</a>
            </h3>

            <p>
                View and manage BIIGLE notifications in the notification center.
            </p>

            <h3><a href="{{route('manual-tutorials', ['projects', 'about'])}}">Projects</a></h3>
            <p>
                Learn what projects are and how to manage them.
            </p>


            <h3>Label Trees</h3>
            <h4>
                <a href="{{route('manual-tutorials', ['label-trees', 'about'])}}">About Label Trees</a>
            </h4>
            <p>
                Learn what label trees are and how you can manage them.
            </p>
            <h4>
                <a href="{{route('manual-tutorials', ['label-trees', 'manage-labels'])}}">Manage Labels</a>
            </h4>
            <p>
                Learn how to create, modify or delete labels of a label tree.
            </p>
            <h4>
                <a href="{{route('manual-tutorials', ['label-trees', 'label-tree-versions'])}}">Label Tree Versions</a>
            </h4>
            <p>
                Everything you need to know about versioned label trees.
            </p>
            <h4>
                <a href="{{route('manual-tutorials', ['label-trees', 'merge-label-trees'])}}">Merge Label Trees</a>
            </h4>
            <p>
                View and resolve differences between label trees.
            </p>
            @mixin('labelTreesManual')

            <h3>Volumes</h3>

            <h4>
                <a href="{{route('manual-tutorials', ['volumes', 'volume-overview'])}}">Volume overview</a>
            </h4>

            <p>
                The volume overview allows you to explore all files that belong to a volume.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['volumes', 'annotation-sessions'])}}">Annotation sessions</a>
            </h4>

            <p>
                Annotation sessions can be used to conduct scientific studies.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['volumes', 'file-metadata'])}}">File metadata</a>
            </h4>

            <p>
                Upload metadata to add information that can't be extracted from the files.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['volumes', 'file-labels'])}}">File Labels</a>
            </h4>

            <p>
                File labels are labels that are attached to whole images or videos.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['volumes', 'annotation-import'])}}">Annotation and file label import</a>
            </h4>

            <p>
                Import annotations and file labels from metadata files.
            </p>

            <h3>Files</h3>

            <h4>
                <a href="{{route('manual-tutorials', ['volumes', 'remote-locations'])}}">Remote locations</a>
            </h4>

            <p>
                Remote locations serve volume files from a public web server.
            </p>

            @mixin('filesManual')

            <h3>Image Annotations</h3>
            <h4>
                <a href="{{route('manual-tutorials', ['annotations', 'getting-started'])}}">Getting Started</a>
            </h4>
            <p>
                A quick introduction to the image annotation tool.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['annotations', 'creating-annotations'])}}">Creating Image Annotations</a>
            </h4>

            <p>
                Learn about all the tools that are available to create new image annotations.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['annotations', 'editing-annotations'])}}">Editing Image Annotations</a>
            </h4>

            <p>
                Learn about all the tools to modify or delete existing image annotations.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['annotations', 'navigating-images'])}}">Navigating Images</a>
            </h4>

            <p>
                Learn about advanced ways to navigate the images in the image annotation tool.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['annotations', 'sidebar'])}}">Sidebar</a>
            </h4>

            <p>
                All sidebar tabs of the image annotation tool explained.
            </p>


            <h4>
                <a href="{{route('manual-tutorials', ['annotations', 'shortcuts'])}}">Shortcuts</a>
            </h4>

            <p>
                A list of all available shortcut keys in the image annotation tool.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['annotations', 'url-parameters'])}}">URL Parameters</a>
            </h4>

            <p>
                Advanced configuration of the image annotation tool.
            </p>

            <h3>Video Annotations</h3>
            <h4>
                <a href="{{route('manual-tutorials', ['videos', 'getting-started'])}}">Getting Started</a>
            </h4>
            <p>
                An introduction to the video annotation tool.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['videos', 'creating-video-annotations'])}}">Creating Video Annotations</a>
            </h4>

            <p>
                Learn how to create different kinds of video annotations.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['videos', 'navigating-timeline'])}}">Navigating the Timeline</a>
            </h4>

            <p>
                Learn about the video timeline and how to navigate it.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['videos', 'editing-video-annotations'])}}">Editing Video Annotations</a>
            </h4>

            <p>
                Learn about all the tools to modify or delete existing video annotations.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['videos', 'sidebar'])}}">Sidebar</a>
            </h4>

            <p>
                All sidebar tabs of the video annotation tool explained.
            </p>


            <h4>
                <a href="{{route('manual-tutorials', ['videos', 'shortcuts'])}}">Shortcuts</a>
            </h4>

            <p>
                A list of all available shortcut keys in the video annotation tool.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', ['videos', 'url-parameters'])}}">URL Parameters</a>
            </h4>

            <p>
                Advanced configuration of the video annotation tool.
            </p>



            @mixin('manualTutorial')

            <h2><a name="references"></a>References</h2>

            <p>
                Reference publications that you should cite if you use BIIGLE for one of your studies.
            </p>
            <p>
                <strong>BIIGLE 2.0</strong><br>
                <a href="https://doi.org/10.3389/fmars.2017.00083">Langenkämper, D., Zurowietz, M., Schoening, T., & Nattkemper, T. W. (2017). Biigle 2.0-browsing and annotating large marine image collections.</a><br>Frontiers in Marine Science, 4, 83. doi: <code>10.3389/fmars.2017.00083</code>
            </p>
            <p>
                <strong>Observations From Four Years of BIIGLE 2.0</strong><br>
                <a href="https://doi.org/10.3389/fmars.2021.760036">Zurowietz, M., & Nattkemper, T. W. (2021). Current Trends and Future Directions of Large Scale Image and Video Annotation: Observations From Four Years of BIIGLE 2.0.</a><br>Frontiers in Marine Science, 8, 760036. doi: <code>10.3389/fmars.2021.760036</code>
            </p>
            <p>
                <strong>Video Object Tracking</strong><br>
                <a href="https://doi.org/10.1109/CVPR.2017.515">Lukezic, A., Vojir, T., ˇCehovin Zajc, L., Matas, J., & Kristan, M. (2017). Discriminative correlation filter with channel and spatial reliability.</a> In Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (pp. 6309-6318). doi: <code>10.1109/CVPR.2017.515</code>
            </p>
            @mixin('manualReferences')

            <a name="developer-documentation"></a>
            <h2><a name="api"></a>API</h2>
            <p>
                You may access most of the functionality of this application using the RESTful API. Most of the API requires user authentication via session cookie (being logged in to the website) but it is also available for external requests using a personal API token. You can manage your API tokens in the <a href="{{ route('settings-tokens') }}">user settings</a>.
            </p>
            <p>
                API access is rate-limited to 10,800 requests per hour (3,600 for unauthenticated users). You may access the rate limit and the current number of remaining requests through the <code>X-RateLimit-Limit</code> and <code>X-RateLimit-Remaining</code> HTTP headers.
            </p>
            <p>
                The API works with form (<code>x-www-form-urlencoded</code>) as well as JSON requests. For form requests, you can use <a href="https://laravel.com/docs/9.x/routing#form-method-spoofing">method spoofing</a> to use different HTTP methods. For the complete documentation, check out the link below.
            </p>
            <p>
                <a class="btn btn-default btn-lg btn-block" href="{{ url('doc/api/index.html') }}">API Documentation</a>
            </p>

            <h2><a name="further-resources"></a>Further Resources</h2>

            <div class="row">
                <div class="col-sm-6">
                    <p>
                        <a class="btn btn-default btn-lg btn-block" href="https://github.com/biigle">Source Code</a>
                    </p>
                </div>

                <div class="col-sm-6">
                    <p>
                        <a class="btn btn-default btn-lg btn-block" href="https://github.com/biigle/community-resources">Community Resources</a>
                    </p>
                </div>
            </div>

            <div class="row">
                <div class="col-sm-6">
                    <p>
                        <a class="btn btn-default btn-lg btn-block" href="https://biigle.github.io/schema/index.html">Database Schema</a>
                    </p>
                </div>
                <div class="col-sm-6">
                    <p>
                        <a class="btn btn-default btn-lg btn-block" href="{{ url('doc/server/index.html') }}">Server API</a>
                    </p>
                </div>
            </div>

            <div class="row">
                <div class="col-sm-6 col-sm-offset-3">
                    <p>
                        <a class="btn btn-default btn-lg btn-block" href="https://biigle-admin-documentation.readthedocs.io">Admin Documentation</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>
@include('partials.footer', [
    'links' => [
        'GitHub' => 'https://github.com/biigle',
    ],
])
@endsection
