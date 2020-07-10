@extends('manual.base')

@section('manual-title', 'URL Parameters')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Advanced configuration of the video annotation tool.
        </p>
        <p>
            Just like with the still image annotation tool, various configuration options of the video annotation tool can be controlled with URL parameters. Take a look at the <a href="{{route('manual-tutorials', ['annotations', 'url-parameters'])}}">manual article</a> of the still image annotation tool to learn more about URL parameters and how to use them.
        </p>
        <h3>Available parameters</h3>

        <table class="table">
            <thead>
                <tr>
                    <th>Parameter name</th>
                    <th>Description</th>
                    <th>values</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><code>annotationOpacity</code></td>
                    <td>Opacity of annotations on the image.</td>
                    <td><code>0.0</code> - <code>1.0</code></td>
                </tr>
                <tr>
                    <td><code>showMinimap</code></td>
                    <td>Show or hide the minimap.</td>
                    <td><code>true</code>, <code>false</code></td>
                </tr>
                <tr>
                    <td><code>autoplayDraw</code></td>
                    <td>The automatic play/pause interval when a new annotation keyframe is drawn.</td>
                    <td> &gt;=<code>0.0</code></td>
                </tr>
                <tr>
                    <td><code>showLabelTooltip</code></td>
                    <td>Show or hide the label tooltip when you hover over an annotation.</td>
                    <td><code>true</code>, <code>false</code></td>
                </tr>
                <tr>
                    <td><code>showMousePosition</code></td>
                    <td>Show or hide the mouse position on the image.</td>
                    <td><code>true</code>, <code>false</code></td>
                </tr>
                <tr>
                    <td><code>x</code></td>
                    <td>Set the x position of the center of the viewport.</td>
                    <td>integer</td>
                </tr>
                <tr>
                    <td><code>y</code></td>
                    <td>Set the y position of the center of the viewport.</td>
                    <td>integer</td>
                </tr>
                <tr>
                    <td><code>r</code></td>
                    <td>Set the resolution (zoom) of the viewport.</td>
                    <td>integer</td>
                </tr>
                <tr>
                    <td><code>t</code></td>
                    <td>Set the current time of the video in tens of milliseconds (1=0.01s).</td>
                    <td>integer</td>
                </tr>
            </tbody>
        </table>
        <div class="panel panel-info">
            <div class="panel-body text-info">
                The <code>x</code>, <code>y</code> and <code>r</code> parameters are automatically updated as you modify the viewport. The <code>t</code> parameter is updated whenever the current time of the video changes. This allows you to store or send a link to the exact same viewport and time you are currently seeing.
            </div>
        </div>
    </div>
@endsection
