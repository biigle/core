@extends('manual.base')

@section('manual-title', 'Sidebar')

@section('manual-content')
    <div class="row">
        <p class="lead">
            All sidebar tabs of the video annotation tool explained.
        </p>

        <h3><a name="label-trees-tab"></a> <i class="fa fa-tags"></i> Label Trees</h3>

        <p>
            The label trees tab shows all label trees that are available for the video. Here you can find and choose the labels you want to attach to new annotations. Use the search field at the top to quickly find labels of deeply nested label trees. Mark up to ten labels as favorites to quickly select them with the <code>0</code>-<code>9</code> keys of your keyboard. To select a label as favorite, click the <i class="fa fa-star"></i> icon next to the label in the label tree. Now it will appear in the "Favorites" label tree at the top and can be selected with a shortcut key. Click the <i class="fa fa-star"></i> icon of a favorite label again to remove it from the favorites.
        </p>

        <h3><a name="settings-tab"></a> <i class="fa fa-cog"></i> Settings</h3>

        <p>
            The settings tab allows you to customize the video annotation tool and provides some advanced features.
        </p>

        <p>
            The annotation opacity slider allows you to make video annotations more transparent or hide them completely. Note that this setting will be remembered permanently so don't be confused if no annotations show up the next time you open a video in the video annotation tool.
        </p>

        <p>
            <a name="play-pause-while-drawing"></a> With the play/pause while drawing value you can configure a time in seconds that the video should automatically play and pause after you have drawn a keyframe of a new annotation. Set the value to 0 to disable the feature.
        </p>

        <p>
            The playback rate determines the speed in which the video is played. Set it below 1 to slow the video down or above 1 to speed it up. The default video playback rate is 1.
        </p>

        <p>
            The minimap switch enables you to show or hide the minimap.
        </p>

        <p>
            The label tooltip switch controls the display of a tooltip that appears when you hover your cursor over annotations. The tooltip shows the names of the labels that are attached to these annotations.
        </p>

        <p>
            The mouse position switch controls the display of an additional map overlay that shows the current position of the cursor on the video in pixels.
        </p>
    </div>
@endsection
