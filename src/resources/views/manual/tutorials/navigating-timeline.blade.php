@extends('manual.base')

@section('manual-title', 'Navigating the Timeline')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn about the video timeline and how to navigate it.
        </p>
        <p>
            Apart from the video itself, the timeline is the second most important element of the video annotation tool. It shows at which point of time you currently are in the video and it visualizes all annotations of the video at a glance. Additionally, it is used for the more advanced ways of <a href="{{route('manual-tutorials', ['videos', 'editing-video-annotations'])}}">editing annotation clips</a>.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/videos/images/manual/navigating_the_timeline_1.jpg')}}"><img src="{{asset('vendor/videos/images/manual/navigating_the_timeline_1.jpg')}}" width="100%" style="border: 1px solid #111;"></a>
        </p>

        <h3><a name="current-time"></a>Current Time</h3>
        <p>
            The current time of the video is displayed at the top left corner of the timeline. Additionally, a red line moves along the time axis at the top of the timeline, indicating the current time. You can quickly jump to a specific time with a click on the time axis. While you move the mouse over the timeline, the time at the mouse position is indicated with a grey line in the time axis and in muted text color beside the current time of the video.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/videos/images/manual/navigating_the_timeline_2.jpg')}}"><img src="{{asset('vendor/videos/images/manual/navigating_the_timeline_2.jpg')}}" width="49%" style="border: 1px solid #111;"></a>
            <a href="{{asset('vendor/videos/images/manual/navigating_the_timeline_3.jpg')}}"><img src="{{asset('vendor/videos/images/manual/navigating_the_timeline_3.jpg')}}" width="49%" style="border: 1px solid #111;"></a>
        </p>
        <p>
            Another way of jumping to a specific time is to click on an annotation clip or keyframe bar (see <a href="#annotation">below</a>), selecting it in the process. If a keyframe bar is clicked, the current time jumps to the time of the keyframe instead of the time at the mouse position.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/videos/images/manual/navigating_the_timeline_4.jpg')}}"><img src="{{asset('vendor/videos/images/manual/navigating_the_timeline_4.jpg')}}" width="49%" style="border: 1px solid #111;"></a>
            <a href="{{asset('vendor/videos/images/manual/navigating_the_timeline_5.jpg')}}"><img src="{{asset('vendor/videos/images/manual/navigating_the_timeline_5.jpg')}}" width="49%" style="border: 1px solid #111;"></a>
        </p>
        <p>
            You can zoom along the time axis by holding the <code>Shift</code> key and using the mouse wheel. Move the zoomed-in timeline left and right by horizontal scrolling with the touchpad or grabbing and moving the timeline with the cursor.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/videos/images/manual/navigating_the_timeline_6.jpg')}}"><img src="{{asset('vendor/videos/images/manual/navigating_the_timeline_6.jpg')}}" width="49%" style="border: 1px solid #111;"></a>
            <a href="{{asset('vendor/videos/images/manual/navigating_the_timeline_7.jpg')}}"><img src="{{asset('vendor/videos/images/manual/navigating_the_timeline_7.jpg')}}" width="49%" style="border: 1px solid #111;"></a>
        </p>

        <h3><a name="annotation-tracks"></a>Annotation Tracks</h3>
        <p>
            The annotations of the video are grouped by their label into several <i>tracks</i>. Each track shows the label name at the left and the annotations along the time axis at the right. Annotations of the same track are displayed in the color of the label to which the track belongs. If multiple annotation clips occur at the same time, they are displayed on top of each other in the same track. Note that multiple labels can be attached to a single annotation, too, so the same annotation may be displayed in more than one track.
        </p>

        <h3><a name="annotations"></a>Annotations</h3>
        <p>
            Single-frame annotations are displayed as single bars at the time they occur along the time axis. Annotation clips, which consist of multiple keyframes, are displayed as multiple connected bars. The first and the last keyframe determine the duration of the annotation clip. Annotation clips can be displayed in three different ways, depending on the space between two of their keyframes and the current zoom along the time axis. In the most condensed form, the keyframes of an annotation clip are invisible. In the partly condensed form, the keyframe bars are visible but smaller than in the regular form.
        </p>
        <p class="text-center">
            <a href="{{asset('vendor/videos/images/manual/navigating_the_timeline_8.jpg')}}"><img src="{{asset('vendor/videos/images/manual/navigating_the_timeline_8.jpg')}}" width="100%"></a>
            <a href="{{asset('vendor/videos/images/manual/navigating_the_timeline_9.jpg')}}"><img src="{{asset('vendor/videos/images/manual/navigating_the_timeline_9.jpg')}}" width="100%"></a>
            <a href="{{asset('vendor/videos/images/manual/navigating_the_timeline_10.jpg')}}"><img src="{{asset('vendor/videos/images/manual/navigating_the_timeline_10.jpg')}}" width="100%"></a>
        </p>
        <p>
            Annotations can be selected by clicking on them in the timeline. This automatically sets the current time of the video to the time at the position where the annotation was selected. If a single-frame annotation or keyframe is selected, the current time jumps to the time of the frame. Multiple annotations can be selected at the same time by pressing the <code>Shift</code> key and clicking on the annotation.
        </p>
        <p>
            Read on and learn how to <a href="{{route('manual-tutorials', ['videos', 'editing-video-annotations'])}}">edit video annotations</a>.
        </p>
    </div>
@endsection
