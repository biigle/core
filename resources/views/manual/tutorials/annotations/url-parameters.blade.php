@extends('manual.base')

@section('manual-title', 'URL Parameters')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Advanced configuration of the image annotation tool.
        </p>
        <p>
            The image annotation tool provides various configuration options in the <a href="{{route('manual-tutorials', ['annotations', 'sidebar'])}}#settings-tab">settings tab</a> as well as different <a href="{{route('manual-tutorials', ['annotations', 'navigating-images'])}}#annotation-modes">annotation modes</a>. Most of these features can be controlled via URL parameters, too.
        </p>
        <div class="panel panel-info">
            <div class="panel-body text-info">
                URL parameters are the part of the URL in your browser's address bar after the <code>?</code>. Example: <code>{{url('')}}?myParameter=myValue</code>.
            </div>
        </div>
        <p>
            By using URL parameters, you can send your colleagues a link to an image in the image annotation tool and control how the image annotation tool should behave. This can be useful e.g. if you want to conduct an annotation study and want each participant to have the same configuration of the image annotation tool.
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
                    <td><code>mousePosition</code></td>
                    <td>Show or hide the mouse position on the image.</td>
                    <td><code>true</code>, <code>false</code></td>
                </tr>
                <tr>
                    <td><code>zoomLevel</code></td>
                    <td>Show or hide the current zoom level.</td>
                    <td><code>true</code>, <code>false</code></td>
                </tr>
                <tr>
                    <td><code>scaleLine</code></td>
                    <td>Show or hide a scale line on the image.</td>
                    <td><code>true</code>, <code>false</code></td>
                </tr>
                <tr>
                    <td><code>labelTooltip</code></td>
                    <td>Show or hide the annotation tooltip when you hover over an annotation.</td>
                    <td><code>true</code>, <code>false</code></td>
                </tr>
                <tr>
                    <td><code>minimap</code></td>
                    <td>Show or hide the minimap.</td>
                    <td><code>true</code>, <code>false</code></td>
                </tr>
                <tr>
                    <td><code>annotationMode</code></td>
                    <td>Set the annotation mode to activate.</td>
                    <td><code>volare</code>,<br><code>lawnmower</code>,<br><code>randomSampling</code>,<br><code>regularSampling</code></td>
                </tr>
                <tr>
                    <td><code>randomSamplingNumber</code></td>
                    <td>Set the number of samples used in random sampling.</td>
                    <td>integer</td>
                </tr>
                <tr>
                    <td><code>regularSamplingRows</code></td>
                    <td>Set the number of rows used in regular sampling.</td>
                    <td>integer</td>
                </tr>
                <tr>
                    <td><code>regularSamplingColumns</code></td>
                    <td>Set the number of columns used in regular sampling.</td>
                    <td>integer</td>
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
            </tbody>
        </table>

        <div class="panel panel-info">
            <div class="panel-body text-info">
                The <code>x</code>, <code>y</code> and <code>r</code> parameters are automatically updated as you modify the viewport. This allows you to store or send a link to the exact same viewport you are currently seeing.
            </div>
        </div>

        <h3>Examples</h3>

        <h4>Show an object with a scale line</h4>

        <p>
            You want to show a specific object to a colleague, who is also a BIIGLE user, to discuss the object's size. First, center the viewport on the object. The <code>x</code>, <code>y</code> and <code>r</code> URL parameters will automatically update accordingly. Now append the <code>scaleLine</code> parameter, so the scale line indicator is activated for your colleague. Example URL:
        </p>

        <pre><code>/images/123/annotations?<strong>r=50&amp;x=683&amp;y=512&amp;scaleLine=true</strong></code></pre>

        <h4>Set a starting point for annotating with Lawnmower Mode</h4>

        <p>
            You would like some of your colleagues to annotate images using <a href="{{route('manual-tutorials', ['annotations', 'navigating-images'])}}#lawnmower-mode">Lawnmower Mode</a>. For comparability, they should all use the same zoom factor. In addition to that, you want to remove distracting elements from the viewport.
        </p>
        <p>
            Open the first image in the image annotation tool. Now zoom in to the resolution that you want your colleagues to use. You can also use the <a href="{{route('manual-tutorials', ['annotations', 'navigating-images'])}}#zoom-to-extent">zoom to original resolution</a> button, which will set the resolution to <code>100</code>. Next, append the URL parameters to disable distracting elements like the minimap, the mouse position or the zoom level indicator from the viewport. Finally, add the URL parameter for the Lawnmower annotation mode. Example URL:
        </p>

        <pre><code>/images/123/annotations?<strong>r=100&amp;minimap=false&amp;mousePosition=false&amp;zoomLevel=false&amp;scaleLine=false&amp;annotationMode=lawnmower</strong></code></pre>

        <h4>Set a base configuration for random sampling</h4>

        <p>
            You wish to conduct an annotation study using <a href="{{route('manual-tutorials', ['annotations', 'navigating-images'])}}#random-sampling">random sampling</a>. Of course every participant should use the exact same number of random annotation samples per image. To do this, configure the <code>randomSamplingNumber</code> parameter with the number of samples. Then append the parameter for the random sampling annotation mode. Example URL:
        </p>

        <pre><code>/images/123/annotations?<strong>randomSamplingNumber=20&amp;annotationMode=randomSampling</strong></code></pre>

    </div>



@endsection
