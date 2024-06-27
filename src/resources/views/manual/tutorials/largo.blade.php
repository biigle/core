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

        <p>
            Contents:
        </p>

        <ol>
            <li><a href="#how-to-use-largo">How to use Largo</a></li>
            <li><a href="#advanced-usage">Advanced usage</a></li>
            <li><a href="#example-use-cases">Example use cases</a></li>
        </ol>

        <h3><a name="how-to-use-largo"></a>How to use Largo</h3>

        <p>
            There are two ways to run Largo. To review annotations of an entire project, click on the <button class="btn btn-xs btn-default"><span class="fa fa-check-square" aria-hidden="true"></span> Largo re-evaluation</button> button in the project overview. To review annotations of a volume, click on the <button class="btn btn-xs btn-default"><span class="fa fa-check-square" aria-hidden="true"></span></button> button in the sidebar of the volume overview. Project guests are not allowed to use Largo.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/largo/images/manual/largo_2.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_2.png')}}" width="100%"></a>
        </p>

        <p>
            The initial view of Largo shows a sidebar with all available label trees of the project or volume. When you select one of the labels, all annotations to which this label is attached will be shown in the grid. You can navigate the grid in the same way than the thumbnail grid of the <a href="{{route('manual-tutorials', ['volumes', 'volume-overview'])}}">volume overview</a>.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/largo/images/manual/largo_3.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_3.png')}}" width="100%"></a>
        </p>

        <p>
            When you hover your cursor over an annotation you can see the <span class="fa fa-external-link-square-alt" aria-hidden="true"></span> button in the upper right corner. A click on this button will open the image or video annotation tool in a new window and focus on this annotation. Use this to review an annotation with its surroundings if you are uncertain what it may be.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/largo/images/manual/largo_4.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_4.png')}}" width="33%"></a>
            <a href="{{asset('vendor/largo/images/manual/largo_5.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_5.png')}}" width="33%"></a>
        </p>

        <p>
            Also displayed on hover is the big <span class="fa fa-times" aria-hidden="true"></span> symbol. This symbol indicates the "dismissal" of an annotation. Click on an annotation in the grid to mark it as dismissed. You can dismiss annotations belonging to different labels, too. Once there are dismissed annotations, the <button class="btn btn-success btn-xs">Continue</button> button in the sidebar becomes clickable. Click this button when you are finished marking annotations as dismissed to continue to the next step.
        </p>

        <p>
            The second step in Largo is the relabel step. In this step all annotations that were previously marked as dismissed are displayed in the grid, no matter what their original label was. If you now hover over an annotation in the grid, the big <span class="fa fa-check" aria-hidden="true"></span> symbol appears. This symbol indicates a relabeled annotation. To relabel an annotation, select a label from the label trees in the sidebar and then click on an annotation in the grid.
        </p>

        <p class="text-center">
            <a href="{{asset('vendor/largo/images/manual/largo_6.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_6.png')}}" width="33%"></a>
            <a href="{{asset('vendor/largo/images/manual/largo_7.png')}}"><img src="{{asset('vendor/largo/images/manual/largo_7.png')}}" width="33%"></a>
        </p>

        <div class="panel panel-info">
            <div class="panel-body text-info">
                To quickly dismiss or relabel consecutive annotations, press the <kbd>Shift</kbd> key when you click on an annotation. This will dismiss/relabel all annotations between the current one and the last one you have selected.
            </div>
        </div>

        <p>
            You can go <button class="btn btn-default btn-xs">Back</button> to the first step at any time. Your relabeled annotations will not be forgotten. When you are finished relabeling the annotations, click <button class="btn btn-success btn-xs">Save</button> in the sidebar. When a Largo session is saved, one of three things can happen for each annotation:
        </p>

        <ul>
            <li>If the annotation was dismissed but not relabeled and if the label that should be detached was attached by you, the label is detached from the annotation. If this was the only label of the annotation, the annotation is deleted.</li>
            <li>If the annotation was relabeled and the previous label was attached by you, the previous label is replaced by the new label.</li>
            <li>If the annotation was relabeled and the previous label was not attached by you, the new label is attached to the annotation in addition to the previous label.</li>
        </ul>

        <p>
            Project experts and admins can choose to enable the "Force delete/relabel" switch. If a Largo session is saved with this switch enabled, the behavior described above changes as follows:
        </p>

        <ul>
            <li>If the annotation was dismissed and not relabeled, <em>all</em> instances of the dismissed label are detached from the annotation. If these were the only labels of the annotation, the annotation is deleted.</li>
            <li>If the annotation was relabeled, <em>all</em> instances of the dismissed label are replaced by (one instance of) the new label.</li>
        </ul>

        <p>
            When the Largo session has been saved, Largo is reset and you can start a new session.
        </p>


        <h3><a name="advanced-usage"></a>Advanced usage</h3>

        <p>
            Largo offers some features that go beyond the basic usage. Depending on the use case (see <a href="#example-use-cases">below</a>), these features can help to accelerate the annotation review process.
        </p>

        <h4>Sorting</h4>

        <p>
            By default, the annotation patches displayed by Largo are displayed with the newest annotations at the top and the oldest at the bottom. You can change the sorting with a click on the sorting tab (<i class="fa fa-exchange-alt fa-rotate-90"></i>) of the sidebar. Each sorting can be shown in descending (<i class="fa fa-sort-amount-down"></i>) or ascending (<i class="fa fa-sort-amount-up"></i>) order. The following sorting options are available:
        </p>

        <ul>
            <li>
                <p>
                    <strong>Created</strong>: Sorts the annotation patches by timestamp. In descending order, the newest annotations are shown first. In ascending order, the oldest annotations are shown first.
                </p>
            </li>
            <li>
                <p>
                    <strong>Outliers</strong>: Sort the annotation patches by unusual objects. In descending order, the annotation patches are shown first that look most "unusual" compared to all the other patches that are currently shown. In ascending order, the most "common" patches are shown first.
                </p>
                <p>
                    Sorting by unusual annotation patches can help you to quickly identify errors. If most of the patches show objects with a similar visual appearance, those patches that show different objects will be shown at the top and you can quickly select them.
                </p>
            </li>
            <li>
                <p>
                    <strong>Similarity</strong>: Sort the annotation patches by similarity to a reference annotation. When this sorting method is selected, you have to select a reference annotation by clicking on the <button class="btn btn-default btn-xs"><i class="fa fa-thumbtack fa-fw"></i></button> button of an annotation patch next. Once the reference annotation is selected, the patches are sorted. In descending order, the annotations looking most similar to the reference annotation are shown first.
                </p>
                <p>
                    The selected reference annotation will be pinned to the top left of the grid of annotation patches. You can select a new reference annotation by clicking on its <button class="btn btn-default btn-xs"><i class="fa fa-thumbtack fa-fw"></i></button> button. If you select a different label while similarity sorting is active, the sorting method will be reset, as the reference annotation is no longer available.
                </p>
            </li>
        </ul>

        <h4>Settings</h4>

        <p>
            Some features of Largo can be configured in the settings tab (<i class="fa fa-cog"></i>) of the sidebar.
        </p>

        <dl>
            <dt>Show annotation outlines</dt>
            <dd>Disable this option to hide the outlines of the annotation on each patch (enabled by default).</dd>
        </dl>

        <h3><a name="example-use-cases"></a>Example use cases</h3>

        <p>
            Now that you know how to use Largo, here are some use cases for what you can do.
        </p>

        <h4>Review annotation errors</h4>

        <p>
            The annotations displayed in a grid make it very easy to spot errors like in the example above. Use Largo to review the annotations and dismiss all annotations that have the wrong label. In the relabel step, assign the correct labels or delete annotations that make no sense at all by not assigning them a new label.
        </p>

        <h4>Confirm annotations of others</h4>

        <p>
            BIIGLE allows users to attach multiple labels to a single annotation. This way users can confirm labels of other users or suggest a different label. In Largo you can display, "dismiss" and relabel all annotations where you want to confirm or suggest a different label. Don't worry if you forgot to relabel an annotation. If the label attached to the annotation was not created by you, it won't be deleted. Take care not to enable the "Force delete/relabel" switch in this case.
        </p>

        <h4>Two step annotation process</h4>

        <p>
            The first step of a two step annotation process is to find objects of interest in the images or videos you annotate. You don't care what kinds of objects you see but just mark all with the same label (maybe "Interesting"). In the second step you sort these interesting objects into their specific label categories. For this step you can use Largo. Select the "Interesting" label and all of your annotations will be displayed. Now you pick one label (e.g. "Starfish") and dismiss all starfishes that you see. Use the sort by similarity feature described above for extra speed! In the relabel step, you simply relabel all dismissed annotations as starfish and save. Then continue with the next label.
        </p>

        <p>
            You can perform the two step annotation process with multiple users, too. One user is responsible of finding objects of interest in the images or videos. The other user (e.g. an expert) then assigns specific labels to the annotations using Largo. With the "Force delete/relabel" switch enabled, the expert can replace the generic "Interesting" labels with the specific ones.
        </p>

        <h4>Annotation examples</h4>

        <p>
            The dismiss step of Largo can serve as an annotation reference. Annotators can check existing annotations of specific labels if they are unsure which label to use for a new annotation. Note that this can be done in the <a href="{{route('manual-tutorials', ['largo', 'annotation-catalog'])}}">annotation catalog</a> of a label tree, too, but Largo displays only project- or volume-specific annotations.
        </p>
    </div>
@endsection
