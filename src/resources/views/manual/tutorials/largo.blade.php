@extends('manual.base')

@section('manual-title', 'Largo')

@section('manual-content')
    <div class="row">
        <p class="lead">
            The Label Review Grid Overview and what you can do with it.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/largo/images/manual/largo_1.jpg')}}"><img src="{{asset('vendor/largo/images/manual/largo_1.jpg')}}" width="100%"></a>
        </p>

        <p>
            Largo allows you to view annotations with the same label in a regular grid. The annotations can belong to a single volume or an entire project. You can quickly select annotations to change their labels, attach new labels or delete them.
        </p>

        <h3>How to use Largo</h3>

        <p>
            There are two ways to run Largo. To review annotations of an entire project, click on the <button class="btn btn-xs btn-default"><span class="fa fa-check-square" aria-hidden="true"></span> Largo re-evaluation</button> button in the project overview. To review annotations of a volume, click on the <button class="btn btn-xs btn-default"><span class="fa fa-check-square" aria-hidden="true"></span></button> button in the sidebar of the volume overview. Project guests are not allowed to use Largo.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/largo/images/manual/largo_2.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_2.png')}}" width="100%"></a>
        </p>

        <p>
            The initial view of Largo shows a sidebar with all available label trees of the project or volume. When you select one of the labels, all annotations to which this label is attached will be shown in the grid. You can navigate the grid in the same way than the image grid of the <a href="{{route('manual-tutorials', ['volumes', 'volume-overview'])}}">volume overview</a>.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/largo/images/manual/largo_3.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_3.png')}}" width="100%"></a>
        </p>

        <p>
            When you hover your cursor over an annotation you can see the <span class="fa fa-external-link-square-alt" aria-hidden="true"></span> button in the upper right corner. A click on this button will open the annotation tool in a new window and focus on this annotation. Use this to review an annotation with its surroundings if you are uncertain what it may be.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/largo/images/manual/largo_4.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_4.png')}}" width="33%"></a>
            <a href="{{asset('vendor/largo/images/manual/largo_5.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_5.png')}}" width="33%"></a>
        </p>

        <p>
            Also displayed on hover is the big <span class="fa fa-times" aria-hidden="true"></span> symbol. This symbol indicates the "dismissal" of an annotation. Click on an annotation in the grid to mark it as dismissed. You can dismiss annotations belonging to differen labels, too. Once there are dismissed annotations, the <button class="btn btn-success btn-xs">Continue</button> button in the sidebar becomes clickable. Click this button when you are finished marking annotations as dismissed to continue to the next step.
        </p>

        <p>
            The second step in Largo is the re-label step. In this step all annotations that were previously marked as dismissed are displayed in the grid, no matter what their original label was. If you now hover over an annotation in the grid, the big <span class="fa fa-check" aria-hidden="true"></span> symbol appears. This symbol indicates a re-labeled annotation. To re-label an annotation, select a label from the label trees in the sidebar and then click on an annotation in the grid.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/largo/images/manual/largo_6.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_6.png')}}" width="33%"></a>
            <a href="{{asset('vendor/largo/images/manual/largo_7.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_7.png')}}" width="33%"></a>
        </p>

        <div class="panel panel-info">
            <div class="panel-body text-info">
                To quickly dismiss or re-label consecutive annotations, press the <code>shift</code> key when you click on an annotation. This will dismiss/re-label all annotations between the current one and the last one you have selected.
            </div>
        </div>

        <p>
            You can go <button class="btn btn-default btn-xs">Back</button> to the first step at any time. Your re-labeled annotations will not be forgotten. When you are finished re-labeling the annotations, click <button class="btn btn-success btn-xs">Save</button> in the sidebar. When a Largo session is saved, one of three things can happen for each annotation:
        </p>

        <ul>
            <li>If the annotation was dismissed but <em>not</em> re-labeled, the label will be detached from the annotation (if you attached the label). If this was the only label of the annotation, the annotation will be deleted.</li>
            <li>If the annotation was re-labeled and the previous label was created by you, the previous label will be replaced by the new label.</li>
            <li>If the annotation was re-labeled and the previous label was <em>not</em> created by you, the new label will be attached to the annotation in addition to the previous label.</li>
        </ul>

        <p>
            When the Largo session has been saved, Largo is reset and you can start a new session.
        </p>


        <h3>Example use cases</h3>

        <p>
            Now that you know how to use Largo, here are some use cases for what you can do.
        </p>

        <h4>Review annotation errors</h4>

        <p>
            The annotations displayed in a grid make it very easy to spot errors like in the example above. Use Largo to review the annotations and dismiss all annotations that have the wrong label. In the re-label step, assign the correct labels or delete annotations that make no sense at all by not assigning them a new label.
        </p>

        <h4>Confirm annotations of others</h4>

        <p>
            BIIGLE allows users to attach multiple labels to a single annotation. This way users can confirm labels of other users or suggest a different label. In Largo you can display, "dismiss" and re-label all annotations where you want to confirm or suggest a different label. Don't worry if you forgot to re-label an annotation. If the label attached to the annotation was not created by you, it won't be deleted.
        </p>

        <h4>Two step annotation process</h4>

        <p>
            The first step of a two step annotation process is to find objects of interest in the images you annotate. You don't care what kinds of objects you see but just mark all with the same label (maybe "Interesting"). In the second step you sort these interesting objects into their specific label categories. For this step you can use Largo. Select the "Interesting" label and all of your annotations will be displayed. Now you pick one label (e.g. "Starfish") and dismiss all starfishes that you see. In the re-label step, you simply re-label all dismissed annotations as starfish and save. Then continue with the next label.
        </p>

        <h4>Annotation examples</h4>

        <p>
            The dismiss step of Largo can serve as an annotation reference. Annotators can check existing annotations of specific labels if they are unsure which label to use for a new annotation. Note that this can be done in the label tree overview, too, but Largo displays only project- or volume-specific annotations.
        </p>
    </div>
@endsection
