@extends('manual.base')

@section('manual-title') Annotation sessions @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            Annotation sessions can be used to conduct scientific studies.
        </p>
        <p>
            Annotation sessions are a way to organize annotations of a volume. An annotation session has a start date, an end date and a set of members that belong to it. They can initially be created without members and later updated with a user list, which is useful if users still need to accept <a href="{{route('manual-tutorials', ['projects', 'about'])}}">project invitations</a>. Once an annotation session was created, all annotations of the volume that are created after the start date (inclusive) and before the end date (exclusive) by one of the members will belong to the annotation session. Annotation sessions can be created by all users who have admin access to the volume. Each volume can have multiple annotation sessions. Only one annotation session can be active at the same time. Annotation sessions can be managed by volume admins on the volume edit page that you can reach with the <button class="btn btn-default btn-xs"><span class="fa fa-pencil-alt" aria-hidden="true"></span></button> button of the volume overview.
        </p>
        <p>
            Existing annotation sessions can be used to filter <a href="{{route('manual-tutorials', ['export', 'reports-schema'])}}">volume annotation reports</a>. A report restricted to an annotation session only includes annotations that belong to this session (i.e. created by a member between the start an end dates of the annotation session).
        </p>
        <p>
            Similar to filtering volume annotation reports, annotation sessions can be used to filter the displayed annotations in the annotation tool, too. Simply select the filter tool ( <button class="btn btn-default btn-xs" onclick="$biiglePostMessage('info', 'Try the button in the annotation tool 🙂')"><span class="fa fa-filter" aria-hidden="true"></span></button> ), choose the "session" filter, type the name of the annotation session and press enter. Now only annotations belonging to the annotation sessions are displayed. In the image annotation tool, this can be combined with the Annotation Cycle Mode to review all annotations of an annotation session.
        </p>
        <div class="panel panel-info">
            <div class="panel-body">
                <p>
                    <strong class="text-info">Example:</strong>  Jane has admin access, Joe and Jack both have editor access to the volume <em>T</em>. Joe already created the annotations <em>a</em> and <em>b</em> on 2016-10-17 and 2016-10-18 respectively. Jack only created one annotation <em>c</em> on 2016-10-18. Now Jane creates a new annotation session for volume <em>T</em>, which starts at 2016-10-18 and ends at 2016-10-20. She also adds Joe as a member to this new session.
                </p>
                <p>
                    Since annotation <em>a</em> was created before the annotation session started and <em>c</em> was created by Jack who is not a member of the annotation session, only annotation <em>b</em> belongs to the annotation session.
                </p>
            </div>
        </div>

        <div class="embed-responsive embed-responsive-16by9">
            <iframe class="embed-responsive-item" src="https://www.youtube.com/embed/Qwoe9aHIpbc?cc_load_policy=1" allowfullscreen></iframe>
        </div>

        <h3>Annotation studies</h3>

        <p>
            Annotation sessions are great for grouping existing annotations but the main use case for them are annotation studies. By annotation study we mean a survey where researchers want to measure statistics like the intra- or inter observer agreement (as described in <a href="#ref1">[1]</a>). For this purpose, annotation sessions offer some additional options that control the display of annotations during an annotation session. There are three possible scenarios for annotation studies:
        </p>

        <h4>Scenario 1: Measure the intra observer agreement</h4>

        <p>
            In this scenario you want to measure the reproducibility of the annotations of each user. Each user is asked to annotate all or just a subset of the objects of interest of a given volume. After a certain delay (at least 48&nbsp;h), each user is asked <em>again</em> to annotate the same objects of interest. During the second pass the users are not able to see their annotations of the first pass. By comparing the two sets of annotations for each user, the reproducibility or intra observer agreement of their annotations can be calculated. For this type of annotation study, the annotation sessions offer the <em>hide own annotations</em> ( <span class="label label-default">hide own</span> ) option. If this option is activated, all annotations of the own user that were created before the annotation session started are invisible while the annotation session is active. This will only affect users who are member of the annotation session.
        </p>
        <div class="panel panel-info">
            <div class="panel-body">
                <p>
                    <strong class="text-info">Example:</strong> You want to measure the intra observer agreement of the user Jessica for objects of interest in the volume <em>T</em>. Meanwhile Jacob is already performing an annotation task on the same volume (e.g. manually annotating all laserpoints). His annotation task should not be affected by your study.
                </p>
                <p>
                    First make sure that you have admin access and Jessica has at least editor access to volume <em>T</em>. Now create an annotation session <em>A</em> for volume <em>T</em> (e.g. lasting 48&nbsp;h from 2016-10-19 to 2016-10-21), add Jessica as member and activate the hide own annotations option. Then create a second annotation session <em>B</em> that starts with a certain delay after session <em>A</em> and has the same duration (e.g. from 2016-10-24 to 2016-10-26), again with Jessica as member and hide own annotations activated.
                </p>
                <p>
                    Now ask Jessica to annotate the objects of interest for 48&nbsp;h starting with the 18th of October and then all over again starting with the 24th of October. While the sessions <em>A</em> or <em>B</em> are active, Jessica will not see any of her previously created annotations which could distort the results of your study. Jacobs annotation task, on the other hand, will not be affected by the annotation sessions.
                </p>
                <p>
                    Once both annotation sessions were finished you can export the two sets of annotations by creating new volume annotation reports for <em>T</em> and restrict one of them to annotation session <em>A</em> and the other to <em>B</em>. With one report for each annotation session you have the raw data to compare the annotations and compute the intra observer agreement using a method of your choice.
                </p>
            </div>
        </div>

        <h4>Scenario 2: Measure the inter observer agreement</h4>

        <p>
            In contrast to the intra observer agreement to measure the reproducibility of annotations of a single user, the inter observer agreement can be used to measure the reproducibility of annotations between multiple different users. In other words this is a measure for how well different users find the same objects of interest and assign the same label to it. For this, all users are asked to annotate objects of interest in a volume at the same time. While the users are annotating, they must not see the annotations of the other users. By comparing the annotations of different users, the inter observer agreement can be calculated. This type of annotation study requires the <em>hide other annotations</em> ( <span class="label label-default">hide other</span> ) option of annotation sessions. If this option is activated, members of the annotation session will not see annotations of other users while the annotation session is active.
        </p>
        <div class="panel panel-info">
            <div class="panel-body">
                <p>
                    <strong class="text-info">Example:</strong> You want to measure the inter observer agreement of the users Jasmine, Julia and Jake for objects of interest in the volume <em>T</em>. You need admin access and Jasmine, Julia and Jake need at least editor access to <em>T</em>.
                </p>
                <p>
                    First create a new annotation session for <em>T</em> (e.g. lasting 48&nbsp;h), add the three users as members and activate the hide other annotations option. Now you ask the members to annotate objects of interest while the annotation session is active. Each user won't see the annotations of the other users.
                </p>
                <p>
                    Finally you can export a new volume annotation report for volume <em>T</em> which is restricted to your annotation session, similar to scenario 1. Use the exported user IDs to separate annotations of different users and calculate the inter observer agreement with a method of your choice.
                </p>
            </div>
        </div>

        <h4>Scenario 3: Measure intra- and inter observer agreement</h4>

        <p>
            To measure both the intra- and inter observer agreement, you just have to combine scenarios 1 and 2. Create two annotation sessions with a delay of at least 48&nbsp;h in between, and activate the hide own annotations and hide other annotations options in both. Finally, add all users who should participate in the annotation study as members of the annotation sessions.
        </p>
        <p>
            Activating both options of an annotation session may not be relevant for this scenario only. You might want to hide annotations of other users during an intra observer agreement study or the older own annotations during an inter observer agreement study, too, depending on your requirements.
        </p>
    </div>
    <div class="row">
        <h3>References</h3>
        <ol>
            <li><a name="ref1"></a> Schoening T, Osterloff J and Nattkemper TW (2016) RecoMIA—Recommendations for Marine Image Annotation: Lessons Learned and Future Directions. Front. Mar. Sci. 3:59. doi: <a href="http://dx.doi.org/10.3389/fmars.2016.00059">10.3389/fmars.2016.00059</a></li>
        </ol>
    </div>
@endsection
