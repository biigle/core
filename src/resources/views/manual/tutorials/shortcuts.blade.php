@extends('manual.base')

@section('manual-title', 'Sidebar')

@section('manual-content')
    <div class="row">
        <p class="lead">
            A list of all available shortcut keys in the video annotation tool.
        </p>

        <table class="table">
            <thead>
                <tr>
                    <th>Key</th>
                    <th>Function</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><code>Space</code></td>
                    <td>Play/pause the video</td>
                </tr>
                <tr>
                    <td><code>1</code> - <code>9</code></td>
                    <td>Select favourite label 1-9</td>
                </tr>
                <tr>
                    <td><code>Tab</code></td>
                    <td>Show/hide the current sidebar tab</td>
                </tr>
                <tr>
                    <td><code>a</code></td>
                    <td>Select the point annotation tool</td>
                </tr>
                <tr>
                    <td><code>s</code></td>
                    <td>Select the rectangle annotation tool</td>
                </tr>
                <tr>
                    <td><code>d</code></td>
                    <td>Select the circle annotation tool</td>
                </tr>
                <tr>
                    <td><code>f</code></td>
                    <td>Select the line string annotation tool</td>
                </tr>
                <tr>
                    <td><code>g</code></td>
                    <td>Select the polygon annotation tool</td>
                </tr>
                <tr>
                    <td><code>m</code></td>
                    <td>Select the tool to move selected annotations</td>
                </tr>
                <tr>
                    <td><code>Enter</code></td>
                    <td>Finish the video annotation that is currently drawn</td>
                </tr>
                <tr>
                    <td><code>Shift</code>+<code>Mouse left</code></td>
                    <td>Select multiple annotation at the same time</td>
                </tr>
                <tr>
                    <td><code>Del</code></td>
                    <td>Delete all selected annotations/keyframes</td>
                </tr>
                <tr>
                    <td><code>Esc</code></td>
                    <td>Cancel current action<br><small>e.g. drawing or moving an annotation</small></td>
                </tr>
            </tbody>
        </table>
    </div>
@endsection
