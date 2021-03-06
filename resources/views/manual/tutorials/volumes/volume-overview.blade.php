@extends('manual.base')

@section('manual-title') Volume overview @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            The volume overview allows you to explore all files that belong to a volume.
        </p>
        <p>
            BIIGLE can handle volumes with many thousands or even tens of thousands of images or videos. The volume overview is designed to help you to explore the files in an effective and efficient way. In order to do so, it provides a few tools to navigate, filter and sort the files so you can quickly find what you are looking for.
        </p>

        <h3>Navigate the files</h3>

        <p>
            The volume overview displays files of a volume as thumbnails in a grid. This is an efficient way to handle a large amount of files in a volume, which your browser can't handle all at once. You can scroll through the files with your mouse wheel, similar to scrolling through a regular website. Each scroll action advances the rows of the thumbnail grid. In case you scroll down, the first row disappears and the last row loads the next thumbnails. You can also use the following shortcut keys to scroll the thumbnail grid:
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
                    <td><kbd>W</kbd>, <kbd>Arrow up</kbd></td>
                    <td>Move one row up</td>
                </tr>
                <tr>
                    <td><kbd>S</kbd>, <kbd>Arrow down</kbd></td>
                    <td>Move one row down</td>
                </tr>
                <tr>
                    <td><kbd>A</kbd>, <kbd>Arrow left</kbd>, <kbd>Page up</kbd></td>
                    <td>Move one page up</td>
                </tr>
                <tr>
                    <td><kbd>D</kbd>, <kbd>Arrow right</kbd>, <kbd>Page down</kbd></td>
                    <td>Move one page down</td>
                </tr>
                <tr>
                    <td><kbd>Home</kbd></td>
                    <td>Move up to the first row</td>
                </tr>
                <tr>
                    <td><kbd>End</kbd></td>
                    <td>Move down to the last row</td>
                </tr>
            </tbody>
        </table>
        <p>
            Moving a "page" up/down means that you advance as many rows in the grid backward/forward as are currently displayed.
        </p>
        <p>
            As you might have noticed, there is a progress bar at the right of the volume overview. This bar works similar to a scroll bar and shows your current position in the volume. You can click or drag the bar to instantly jump to another position in the volume. You can also use the buttons to scroll rows (<i class="fa fa-chevron-up"></i>, <i class="fa fa-chevron-down"></i>), pages (<i class="fa fa-step-backward fa-rotate-90"></i>, <i class="fa fa-step-forward fa-rotate-90"></i>), or jump to the first (<i class="fa fa-fast-backward fa-rotate-90"></i>) or last (<i class="fa fa-fast-forward fa-rotate-90"></i>) row.
        </p>

        <h3>Filter the files</h3>

        <p>
            If you are looking for files with special properties (like a certain filename or containing a certain annotation), chances are that you can use a filter to find them. File filtering can be done in the filter tab <i class="fa fa-filter"></i> of the sidebar at the left of the volume overview. A file filter consists of one or more filter rules. Most of the time you only need one filter rule but you can create more complex filters, too. Follow these steps to create a filter rule:
        </p>
        <ol>
            <li>Choose whether you are looking for an file which "has" or "has no" property that you want to filter by. You can look for a file which "has" a certain filename or one that "has no" labels attached to it, for example.</li>
            <li>Choose the property of the file that you want to filter by. Each property shows a short description text when it is selected.</li>
            <li>Some properties, like "filename", require additional input. In this case, a new input field appears where you can enter the input.</li>
            <li>Last, click <button class="btn btn-default btn-xs">Add rule</button> to activate the filter rule. It will be added to the list of filter rules that define your file filter.</li>
        </ol>
        <p>
            Whenever a new rule is added to the file filter, the files displayed in the thumbnail grid are instantly updated. Only files matching <em>all</em> filter rules are displayed. Alternatively, you can switch to the <button class="btn btn-default btn-xs">or</button> mode, where files are displayed which match only <em>one or more</em> of the filter rules. You can remove a filter rule with a click on the <button type="button" class="close" style="float:none;"><span aria-hidden="true">&times;</span></button> button next to it. Reset all filters with a click on <button class="btn btn-default btn-xs"><span class="fa fa-times" aria-hidden="true"></span></button>.
        </p>
        <p>
            As an alternative to the file filter mode (<button class="btn btn-default btn-xs"><i class="fa fa-filter"></i></button>), where only files are shown that match the file filter, there is the file flagging mode (<button class="btn btn-default btn-xs"><i class="fa fa-flag"></i></button>). In this mode all files are shown but those matching the file filter will get flagged with a blue dot.
        </p>

        <h4>Show filenames</h4>

        <p>
            In addition to the "filename" filter you can enable the display of filenames in the volume overview. Simply activate the "Show filenames" switch in the filter tab <i class="fa fa-filter"></i>. This may be useful if you are browsing lots of very similar looking files. If a filename is too long to be displayed whole, it is cut off. Hover the cursor over the filename for a tooltip with the complete filename.
        </p>

        <h3>Sort the files</h3>

        <p>
            You can sort the files in the sorting tab <i class="fa fa-exchange-alt fa-rotate-90"></i> of the sidebar at the left of the volume overview. The sorting tab shows a list of available properties to sort by. Click on an item in the list to sort by this property. By default, the files are sorted by their filename in ascending order. You can switch between sorting in ascending (<button class="btn btn-default btn-xs"><i class="fa fa-sort-amount-up"></i></button>) and descending (<button class="btn btn-default btn-xs"><i class="fa fa-sort-amount-down"></i></button>) order with a click on the respective buttons. Reset sorting with a click on <button class="btn btn-default btn-xs"><span class="fa fa-times" aria-hidden="true"></span></button>.
        </p>

        <div class="panel panel-info">
            <div class="panel-body text-info">
                File filtering, sorting and your current scroll position in the thumbnail grid are remembered for each volume. When you leave the volume overview and return sometime later, you will find everything exactly as you left it. However, the filtering information is not updated in the meantime. You might want to reapply filter rules to include the most recent state of the files (e.g. newly attached labels).
            </div>
        </div>
    </div>
@endsection
