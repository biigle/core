@extends('manual.base')

@section('manual-title', 'Sidebar')

@section('manual-content')
    <div class="row">
        <p class="lead">
            All sidebar tabs of the video annotation tool explained.
        </p>

        <h3><a name="annotations-tab"></a> <i class="fa fa-map-marker-alt"></i> Annotations</h3>
        <p>
            The annotations tab shows a list of all annotations in the video, grouped by their label. A click on a label expands the list item to show all annotations that have this label attached. Each annotation is represented by the icon of the shape of the annotation and the user who attached the label to the annotation. A click on an annotation list item selects the annotation. A selected annotation is highlighted both on the image an in the annotations list.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/sidebar_annotations_1.jpg')}}"><img src="{{asset('assets/images/manual/sidebar_annotations_1.jpg')}}" width="50%"></a>
        </p>
        <p>
            An annotation can have multiple labels by multiple users attached to it. This means that there may be multiple highlighted items in the annotation list for a single selected annotation.
        </p>
        <p>
            At the very top of the annotations tab there is the annotation filter. Annotations can be filtered by label, user or shape. You can use the filter e.g. to display only your own annotations in the video. Whenever the annotation filter is active, the button of the annotations tab will be highlighted so you don't forget the active filter.
        </p>
        <p class="text-center">
            <a href="{{asset('assets/images/manual/sidebar_annotations_2.jpg')}}"><img src="{{asset('assets/images/manual/sidebar_annotations_2.jpg')}}" width="50%"></a>
        </p>

        <h3><a name="label-trees-tab"></a> <i class="fa fa-tags"></i> Label Trees</h3>

        <p>
            The label trees tab shows all label trees that are available for the video. Here you can find and choose the labels you want to attach to new annotations. Use the search field at the top to quickly find labels of deeply nested label trees. Mark up to ten labels as favorites to quickly select them with the <kbd>0</kbd>-<kbd>9</kbd> keys of your keyboard. To select a label as favorite, click the <i class="fa fa-star"></i> icon next to the label in the label tree. Now it will appear in the "Favorites" label tree at the top and can be selected with a shortcut key. Click the <i class="fa fa-star"></i> icon of a favorite label again to remove it from the favorites.
        </p>

        <h3><a name="video-labels-tab"></a> <i class="fa fa-film"></i> Video Labels</h3>

        <p>
            Video labels are labels that are attached to a whole video instead of annotations. Only project editors, experts or admins can modify video labels. To attach a new video label, select a label in the <a href="#label-trees-tab">label trees tab</a> (or use a <a href="{{route('manual-tutorials', ['videos', 'shortcuts'])}}">shortcut</a>), then open the video label tab and click the <button class="btn btn-default btn-xs"><i class="fa fa-plus"></i></button> button in the top right corner. To detach a video label, click the <button class="close" style="float: none;"><span aria-hidden="true">×</span></button> button next to it.
        </p>
        <p>
            Attaching video labels with the video label tab is useful if you need to explore the whole video in order to determine the correct video label. If a video thumbnail is enough (e.g. to sort out bad videos where the camera didn't operate properly) you can attach and detach video labels more quickly <a href="{{route('manual-tutorials', ['volumes', 'file-labels'])}}">in the volume overview</a>.
        </p>

        @mixin('manualVideosSidebar')

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
            You can set a jump step value in seconds that allows you to jump backaward and forward in the video by that amount of time with the <button class="btn btn-default btn-xs"><i class="fa fa-backward"></i></button> and <button class="btn btn-default btn-xs"><i class="fa fa-forward"></i></button> control buttons. Set the value to 0 to disable the feature and hide the controls.
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

        <p>
            The thumbnail switch controls the display of a thumbnail preview that appears when you hover your cursor over the video progress bar. The thumbnail shows a preview of the video frame at the hovered time position.
        </p>

        <p>
            <a name="jump-by-frame"></a>The jump by frame switch allows you to navigate frame by frame (forward and backward) in the video. Note that this is an experimental feature as it is only available in Chrome and may not always give the right frame, so please use it with caution. When the feature is enabled, the <button class="btn btn-default btn-xs"><i class="fa fa-caret-square-left"></i></button> and <button class="btn btn-default btn-xs"><i class="fa fa-caret-square-right"></i></button> control buttons will appear in the tool bar at the bottom of the video. Use these to jump to the previous/next frame. Also, the <a href="{{route('manual-tutorials', ['videos', 'shortcuts'])}}#jump-by-frame">keyboard shortcuts</a> are updated.
        </p>

        <p>
            The mute video switch enables or disables the audio track of the video.
        </p>

        <p>
            The single frame annotation automatically complete new annotations after the first frame. When enabled, additional controls for finishing or tracking will be disabled.
        </p>
    </div>
@endsection
