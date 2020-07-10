@extends('manual.base')

@section('manual-title', 'Shortcuts')

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
                    <td><kbd>Space</kbd></td>
                    <td>Play/pause the video</td>
                </tr>
                <tr>
                    <td><kbd>1</kbd> - <kbd>9</kbd></td>
                    <td>Select favourite label 1-9</td>
                </tr>
                <tr>
                    <td><kbd>Tab</kbd></td>
                    <td>Show/hide the current sidebar tab</td>
                </tr>
                <tr>
                    <td><kbd>a</kbd></td>
                    <td>Select the point annotation tool</td>
                </tr>
                <tr>
                    <td><kbd>s</kbd></td>
                    <td>Select the rectangle annotation tool</td>
                </tr>
                <tr>
                    <td><kbd>d</kbd></td>
                    <td>Select the circle annotation tool</td>
                </tr>
                <tr>
                    <td><kbd>f</kbd></td>
                    <td>Select the line string annotation tool</td>
                </tr>
                <tr>
                    <td><kbd>g</kbd></td>
                    <td>Select the polygon annotation tool</td>
                </tr>
                <tr>
                    <td><kbd>e</kbd></td>
                    <td>Select the polygon brush tool</td>
                </tr>
                <tr>
                    <td><kbd>r</kbd></td>
                    <td>Select the polygon eraser tool</td>
                </tr>
                <tr>
                    <td><kbd>t</kbd></td>
                    <td>Select the polygon fill tool</td>
                </tr>
                <tr>
                    <td><kbd>m</kbd></td>
                    <td>Select the tool to move selected annotations</td>
                </tr>
                <tr>
                    <td><kbd>Enter</kbd></td>
                    <td>Finish the video annotation that is currently drawn</td>
                </tr>
                <tr>
                    <td><kbd>Shift</kbd>+<kbd>Mouse left</kbd></td>
                    <td>Select multiple annotation at the same time</td>
                </tr>
                <tr>
                    <td><kbd>Del</kbd></td>
                    <td>Delete all selected annotations/keyframes</td>
                </tr>
                <tr>
                    <td><kbd>Esc</kbd></td>
                    <td>Cancel current action<br><small>e.g. drawing or moving an annotation</small></td>
                </tr>
            </tbody>
        </table>
    </div>
@endsection
