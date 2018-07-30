@extends('manual.base')

@section('manual-title') Volume overview @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            The volume overview allows you to explore all images that belong to a volume.
        </p>
        <p>
            BIIGLE can handle volumes with many thousands or even tens of thousands of images. The volume overview is designed to help you to explore the images in an effective and efficient way. In order to do so, it provides a few tools to navigate, filter and sort the images so you can quickly find what you are looking for.
        </p>

        <h3>Navigate the images</h3>

        <p>
            The volume overview displays images of a volume as thumbnails in a grid. This is an efficient way to handle the (usually) large amount of images in a volume, which your browser can't handle all at once. You can scroll through the images with your mouse wheel, similar to scrolling through a regular website. Each scroll action advances the rows of the image grid. In case you scroll down, the first row disappears and the last row loads the next images. You can also use the following shortcut keys to scroll the image grid:
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
                    <td><code>W</code>, <code>Arrow up</code></td>
                    <td>Move one row up</td>
                </tr>
                <tr>
                    <td><code>S</code>, <code>Arrow down</code></td>
                    <td>Move one row down</td>
                </tr>
                <tr>
                    <td><code>A</code>, <code>Arrow left</code>, <code>Page up</code></td>
                    <td>Move one page up</td>
                </tr>
                <tr>
                    <td><code>D</code>, <code>Arrow right</code>, <code>Page down</code></td>
                    <td>Move one page down</td>
                </tr>
                <tr>
                    <td><code>Home</code></td>
                    <td>Move up to the first row</td>
                </tr>
                <tr>
                    <td><code>End</code></td>
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

        <h3>Filter the images</h3>

        <p>
            If you are looking for images with special properties (like a certain filename or containing a certain annotation), chances are that you can use a filter to find them. Image filtering can be done in the filter tab <i class="fa fa-filter"></i> of the sidebar at the left of the volume overview. An image filter consists of one or more filter rules. Most of the time you only need one filter rule but you can create more complex filters, too. Follow these steps to create a filter rule:
        </p>
        <ol>
            <li>Choose whether you are looking for an image which "has" or "has no" property that you want to filter by. You can look for an image which "has" a certain filename or one that "has no" image labels attached to it, for example.</li>
            <li>Choose the property of the image that you want to filter by. Each property shows a short description text when it is selected.</li>
            <li>Some properties, like "filename", require additional input. In this case, a new input field appears where you can enter the input.</li>
            <li>Last, click <button class="btn btn-default btn-xs">Add rule</button> to activate the filter rule. It will be added to the list of filter rules that define your image filter.</li>
        </ol>
        <p>
            Whenever a new rule is added to the image filter, the images displayed in the image grid are instantly updated. Only images matching <em>all</em> filter rules are displayed. Alternatively, you can switch to the <button class="btn btn-default btn-xs">or</button> mode, where images are displayed which match only <em>one or more</em> of the filter rules. You can remove a filter rule with a click on the <button type="button" class="close" style="float:none;"><span aria-hidden="true">&times;</span></button> button next to it. Reset all filters with a click on <button class="btn btn-default btn-xs"><span class="fa fa-times" aria-hidden="true"></span></button>.
        </p>
        <p>
            As an alternative to the image filter mode (<button class="btn btn-default btn-xs"><i class="fa fa-filter"></i></button>), where only images are shown that match the image filter, there is the image flagging mode (<button class="btn btn-default btn-xs"><i class="fa fa-flag"></i></button>). In this mode all images are shown but those matching the image filter will get flagged with a blue dot.
        </p>

        <h3>Sort the images</h3>

        <p>
            You can sort the images in the sorting tab <i class="fa fa-exchange-alt fa-rotate-90"></i> of the sidebar at the left of the volume overview. The sorting tab shows a list of available properties to sort by. Click on an item in the list to sort by this property. By default, the images are sorted by their filename in ascending order. You can switch between sorting in ascending (<button class="btn btn-default btn-xs"><i class="fa fa-sort-amount-up"></i></button>) and descending (<button class="btn btn-default btn-xs"><i class="fa fa-sort-amount-down"></i></button>) order with a click on the respective buttons. Reset sorting with a click on <button class="btn btn-default btn-xs"><span class="fa fa-times" aria-hidden="true"></span></button>.
        </p>

        <div class="panel panel-info">
            <div class="panel-body text-info">
                Image filtering, sorting and your current scroll position in the image grid are remembered for each volume. When you leave the volume overview and return sometime later, you will find everything exactly as you left it. However, the filtering information is not updated in the meantime. You might want to reapply filter rules to include the most recent state of the images (e.g. newly attached image labels).
            </div>
        </div>

@endsection
