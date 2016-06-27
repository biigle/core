@extends('manual.base')

@section('manual-title') Annotator shortcuts @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            A list of all available shortcut keys in the annotation tool.
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
                    <td><code>Arrow left</code></td>
                    <td>Previous image</td>
                </tr>
                <tr>
                    <td><code>Arrow right</code>, <code>Space</code></td>
                    <td>Next image</td>
                </tr>
                <tr>
                    <td><code>1</code> - <code>9</code></td>
                    <td>Select favourite label 1-9</td>
                </tr>
                <tr>
                    <td><code>Tab</code></td>
                    <td>Show/hide the label trees</td>
                </tr>
                <tr>
                    <td><code>A</code></td>
                    <td>Select the point annotation tool</td>
                </tr>
                <tr>
                    <td><code>S</code></td>
                    <td>Select the rectangle annotation tool</td>
                </tr>
                <tr>
                    <td><code>D</code></td>
                    <td>Select the Circle annotation tool</td>
                </tr>
                <tr>
                    <td><code>F</code></td>
                    <td>Select the line string annotation tool</td>
                </tr>
                <tr>
                    <td><code>G</code></td>
                    <td>Select the polygon annotation tool</td>
                </tr>
                <tr>
                    <td><code>M</code></td>
                    <td>Select the move annotation tool</td>
                </tr>
                <tr>
                    <td><code>Del</code></td>
                    <td>Delete all selected annotations</td>
                </tr>
                <tr>
                    <td><code>Backspace</code></td>
                    <td>Delete the last drawn annotation</td>
                </tr>
                <tr>
                    <td><code>Esc</code></td>
                    <td>Cancel current action<br><small>e.g. drawing or moving an annotation</small></td>
                </tr>
            </tbody>
        </table>

        <p>
            When "cycle through image sections" is activated:
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
                    <td><code>Arrow left</code></td>
                    <td>Previous section</td>
                </tr>
                <tr>
                    <td><code>Arrow right</code>, <code>Space</code></td>
                    <td>Next section</td>
                </tr>
                <tr>
                    <td><code>Esc</code></td>
                    <td>Exit cycle through image sections</td>
                </tr>
            </tbody>
        </table>

        <p>
            When "cycle through annotations" is activated:
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
                    <td><code>Arrow left</code></td>
                    <td>Previous annotation</td>
                </tr>
                <tr>
                    <td><code>Arrow right</code>, <code>Space</code></td>
                    <td>Next annotation</td>
                </tr>
                <tr>
                    <td><code>Enter</code></td>
                    <td>Attach the currently selected label<br>to the current annotation</td>
                </tr>
                <tr>
                    <td><code>Esc</code></td>
                    <td>Exit cycle through annotations</td>
                </tr>
            </tbody>
        </table>
    </div>



@endsection
