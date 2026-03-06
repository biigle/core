@extends('manual.base')

@section('manual-title', 'Shortcuts')

@section('manual-content')
    <div class="row">
        <p class="lead">
            A list of all available shortcut keys in the image annotation tool.
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
                    <td><kbd>Arrow left</kbd></td>
                    <td>Previous image</td>
                </tr>
                <tr>
                    <td><kbd>Arrow right</kbd>, <kbd>Space</kbd></td>
                    <td>Next image</td>
                </tr>
                    <td><kbd>Shift</kbd>+<kbd>Scroll</kbd></td>
                    <td>Previous or Next image</td>
                <tr>
                    <td><kbd>+</kbd></td>
                    <td>Zoom the image to the original resolution</td>
                </tr>
                <tr>
                    <td><kbd>-</kbd></td>
                    <td>Zoom to show the whole image</td>
                </tr>
                <tr>
                    <td><kbd>Backquote</kbd><br>(key left of <kbd>1</kbd>)</td>
                    <td>Toggle <a href="{{route('manual-tutorials', ['labelbot', 'labelbot'])}}">LabelBOT</a></td>
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
                    <td><kbd>o</kbd></td>
                    <td>Toggle the annotation opactiy between 0.0 and 1.0</td>
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
                    <td><kbd>Shift</kbd>+<kbd>s</kbd></td>
                    <td>Select the aligned rectangle annotation tool</td>
                </tr>
                <tr>
                    <td><kbd>d</kbd></td>
                    <td>Select the circle annotation tool</td>
                </tr>
                <tr>
                    <td><kbd>Shift</kbd>+<kbd>d</kbd></td>
                    <td>Select the ellipse annotation tool</td>
                </tr>
                <tr>
                    <td><kbd>f</kbd></td>
                    <td>Select the line string annotation tool</td>
                </tr>
                <tr>
                    <td><kbd>Shift</kbd>+<kbd>f</kbd></td>
                    <td>Select the ruler tool</td>
                </tr>
                <tr>
                    <td><kbd>g</kbd></td>
                    <td>Select the polygon annotation tool</td>
                </tr>
                <tr>
                    <td><kbd>Shift</kbd>+<kbd>g</kbd></td>
                    <td>Select the magic wand annotation tool</td>
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
                @mixin('manualAnnotationShortcutsPolygon')
                <tr>
                    <td><kbd>m</kbd></td>
                    <td>Select the tool to move selected annotations</td>
                </tr>
                <tr>
                    <td><kbd>l</kbd></td>
                    <td>Select tool to attach labels to existing annotations</td>
                </tr>
                <tr>
                    <td><kbd>Shift</kbd>+<kbd>l</kbd></td>
                    <td>Select tool to swap labels of existing annotations</td>
                </tr>
                <tr>
                    <td><kbd>Shift</kbd>+<kbd>Mouse left</kbd></td>
                    <td>Select multiple annotation at the same time</td>
                </tr>
                <tr>
                    <td><kbd>Del</kbd></td>
                    <td>Delete all selected annotations</td>
                </tr>
                <tr>
                    <td><kbd>Backspace</kbd></td>
                    <td>Delete the last drawn annotation</td>
                </tr>
                <tr>
                    <td><kbd>Esc</kbd></td>
                    <td>Cancel current action<br><small>e.g. drawing or moving an annotation</small></td>
                </tr>
                <tr>
                    <td><kbd>p</kbd></td>
                    <td>Capture a screenshot</td>
                </tr>
                <tr>
                    <td><kbd>c</kbd></td>
                    <td>Select last created annotation</td>
                </tr>
                <tr>
                    <td><kbd>Ctrl</kbd>+<kbd>k</kbd></td>
                    <td>Open label trees sidebar and focus the find label input field</td>
                </tr>
            </tbody>
        </table>

        <p>
            When any of the rectangle, ellipse, line string or polygon annotation tools are activated:
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
                    <td><kbd>Ctrl</kbd> (held)</td>
                    <td>Snap drawn lines to 45° angles<br></td>
                </tr>
            </tbody>
        </table>

        <p>
            When the ruler tool is activated:
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
                    <td><kbd>Enter</kbd></td>
                    <td>Convert measurement to a line string annotation</td>
                </tr>
            </tbody>
        </table>

        <p>
            When Volare (cycle through annotations) is activated:
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
                    <td><kbd>Arrow left</kbd></td>
                    <td>Previous annotation</td>
                </tr>
                <tr>
                    <td><kbd>Arrow right</kbd>, <kbd>Space</kbd></td>
                    <td>Next annotation</td>
                </tr>
                <tr>
                    <td><kbd>Enter</kbd></td>
                    <td>Attach the currently selected label<br>to the current annotation</td>
                </tr>
            </tbody>
        </table>

        <p>
            When Lawnmower Mode (cycle through image sections) is activated:
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
                    <td><kbd>Arrow left</kbd></td>
                    <td>Previous section</td>
                </tr>
                <tr>
                    <td><kbd>Arrow right</kbd>, <kbd>Space</kbd></td>
                    <td>Next section</td>
                </tr>
            </tbody>
        </table>

        <p>
            When the random/regular sampling annotation modes are activated:
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
                    <td><kbd>Arrow left</kbd></td>
                    <td>Previous sample location</td>
                </tr>
                <tr>
                    <td><kbd>Arrow right</kbd>, <kbd>Space</kbd></td>
                    <td>Next sample location</td>
                </tr>
                <tr>
                    <td><kbd>Enter</kbd></td>
                    <td>Create an annotation with the currently selected<br>label at the current sample location</td>
                </tr>
            </tbody>
        </table>

        <p>
            When the image labels tab is open:
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
                    <td><kbd>Enter</kbd></td>
                    <td>Attach the currently selected label to the current image</td>
                </tr>
            </tbody>
        </table>

        <p>
            <a name="labelbot"></a>When a LabelBOT overlay is active:
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
                    <td><kbd>Enter</kbd></td>
                    <td>Confirm the first suggested label in the overlay</td>
                </tr>
                <tr>
                    <td><kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd></td>
                    <td>Select the corresponding suggested label (if available)</td>
                </tr>
                <tr>
                    <td><kbd>Tab</kbd></td>
                    <td>Toggle focus of the typeahead in the overlay</td>
                </tr>
                <tr>
                    <td><kbd>Esc</kbd></td>
                    <td>Cancel the overlay timeout if it is active or confirm the label choice and close the overlay otherwise</td>
                </tr>
                <tr>
                    <td><kbd>Backspace</kbd></td>
                    <td>Delete the new annotation</td>
                </tr>
            </tbody>
        </table>
    </div>



@endsection
