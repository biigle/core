@extends('manual.base')
@section('manual-title', 'Projects')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn what projects are and how to manage them.
        </p>

        <p>
            Projects are used to associate a group of users with a group of image or video collections (called <em>volumes</em>) and label collections (called <em>label trees</em>). What a project represents is entirely up to you. This may be all members and data of a certain expedition or cruise, the members and data of a certain research group or something entirely different.
        </p>

        <p>
            Every user is allowed to create projects. To create a project, click on the <button class="btn btn-default btn-xs">Create Project</button> button on the <a href="{{route('home')}}">dashboard</a> (or <a href="{{route('projects-create')}}">here</a>). When you successfully created a project you will be redirected to the project overview. The overview shows you tabs for lists of all volumes, label trees and members that are associated with the project as well as several controls to modify the project.
        </p>

        <h3><a name="members"></a><i class="fa fa-users"></i> Members</h3>

        <p>
            Each project is only visible to project members. Each member has one of four roles: admin, expert, editor or guest. To modify project members you must be admin in the project. Click on the <button class="btn btn-default btn-xs"><i class="fa fa-users"></i> Members</button> tab of the project overview to modify members. Enter a username in the input field on the top right, choose a role and click <button class="btn btn-default btn-xs">Add member</button> to add a new member to the project. Hover the mouse over a member in the list to choose a new user role using the dropdown list or click the <button class="btn btn-default btn-xs"><i class="fa fa-trash"></i></button> button to remove a member from the roject. You cannot modify or remove yourself as a member of the project. Instead, ask another project admin to do this.
        </p>
        <p>
            A <strong>guest</strong> is not allowed to modify anything in project. They can see all volumes, label trees and members that belong to the project. But they cannot modify anything related to the project and particularly cannot create or modify annotations in the volumes that belong to the project. A guest is able to access all label trees that are attached to the project, even if a label tree is private and the guest is no member of the tree.
        </p>
        <p>
            In addition to everything that a guest can do, <strong>editors</strong> can create and modify annotations, annotation labels and image/video labels. They cannot delete annotation labels or image/video labels that were created by other users. However, they can modify the position and/or shape of an annotation that was created by another user. Editors should be the default choice for new project members.
        </p>
        <div class="panel panel-info">
            <div class="panel-body text-info">
                The term "annotation" refers to a point or a region that is marked on an image or video. An "annotation label" is a label that is attached to an annotation by a certain user. Each annotation automatically gets its first annotation label attached to it when it is created. Other users (or you) are able to attach additional annotation labels to the same annotation. An "image/video label" is a label attached to a whole image or video instead of an annotation.
            </div>
        </div>
        <p>
            An <strong>expert</strong> can do everything that an editor can do. In addition to that, they can modify or delete annotations or image/video labels <em>of other users</em> as well. Choose this role if a user should be able to "supervise" or correct other editors but should not be a full project admin.
        </p>
        <p>
            A project <strong>admin</strong> has no restrictions in what they can do. They can create and modify annotations, annotation labels and image/video labels, including those of other users. Also, they can add or modify project members, <a href="#label-trees">attach or detach label trees</a> and <a href="#volumes">manage volumes</a>. Finally, project admins are able to <a href="#modify-a-project">edit the project name and description or delete the entire project</a>.
        </p>

        <h3><a name="label-trees"></a><i class="fa fa-tags"></i> Label Trees</h3>

        <p>
            There can be one or more <a href="{{route('manual-tutorials', ['label-trees', 'about'])}}">label trees</a> attached to each project. Only the labels of these label trees will be available when annotations, annotation labels or image/video labels are created in the project.

        </p>
        <p>
             Project admins can attach or detach label trees. To do this, click on the <button class="btn btn-default btn-xs"><i class="fa fa-tags"></i> Label Trees</button> tab of the project overview, enter the name of a label tree in the input field on the right and hit enter to attach it. You can only attach public label trees or those that authorized the project to attach them. Hover the mouse over a label tree in the list and click the <button class="btn btn-default btn-xs"><i class="fa fa-trash"></i></button> button to detach a label tree from the project.
        </p>
        <p>
            You can also create a label tree and attach it to the project at the same time. Do this with a click on the <button class="btn btn-default btn-xs">Create Label Tree</button> button of the label trees tab. This is useful to create a new label tree specifically for the current project.
        </p>

        <h3><a name="volumes"></a><i class="fa fa-folder"></i> Volumes</h3>

        <p>
            A volume is a collection of images or videos that belong together (like a directory in a file system). Each project can have one or more volumes attached to it. Unlike label trees, volumes always belong to at least one project. If a volume belongs to no project any more, it will be deleted.
        </p>
        <p>
            Project admins can create or delete volumes. To create a volume, click the <button class="btn btn-default btn-xs">Create Volume</button> button of the volumes tab in the project overview. A new volume will be automatically attached to the project it was created for. Volumes can be shared between projects, too. You can attach existing volumes of any project where you are also admin. To do this, enter the name of the volume you want to attach in the input field on the top right of the volumes tab and hit enter. Hover the mouse over a volume thumbnail and click the <button class="btn btn-default btn-xs"><i class="fa fa-trash"></i></button> button to detach or delete a volume. A volume is deleted only if this is the last project that it is attached to (there will be an additional request for confirmation in this case). Be careful when doing this since deleting a volume deletes all annotations and cannot be undone!
        </p>
        <p>
            Hover the mouse over a volume thumbnail and click the <button class="btn btn-default btn-xs"><i class="fa fa-chart-bar"></i></button> button in order to see some charts of this volume, such as the per-user contribution of annotations, the ratio of annotated vs. not-annotated files, or the abundance of annotation labels. For further details, have a look at the Charts section below.
        </p>

        <p>
            If a project has lots of volumes, filtering the volumes can help to find a particular volume. To filter the volumes in the project overview, type part of the name of the volume in the input field on the top left of the volumes tab. The volumes list will update as you type. You can also show only image volumes or video volumes with a click on the <button class="btn btn-default btn-xs"><i class="fa fa-image"></i></button> and <button class="btn btn-default btn-xs"><i class="fa fa-film"></i></button> buttons, respectively.
        </p>

        <h3><a name="charts"></a><i class="fa fa-chart-bar"></i> Charts</h3>

        <p>
            The charts tab encapsulates a number of (interactive) visualizations that are presenting metadata about the project. These are comprised of charts on annotated vs. not-annotated files, the contribution of annotations per project-member as well as their contribution to each volume of the project, and finally, information on labels that were used in the project.
        </p>
        <p>
            You can choose to see the charts either across all volumes of the project (the default), or only the image- or video-volumes by pressing the respective filter-button at the top.
        </p>
        <p>
            The NetMap Display depicts labels that co-occur with other labels on the same file. Individual labels can be selected to highlight only the connections of this label. Click the <button class="btn btn-default btn-xs"><i class="fa fa-project-diagram"></i></button> button to toggle between the circular and force layouts.
        </p>

        <h3><a name="modify-a-project"></a>Pin or modify a project</h3>

        <p>
            Up to three projects can be pinned to your dashboard. Pinned projects are always shown at the top of the dashboard, before recently created or joined projects. To pin a project, open the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu at the top of the project overview and click <button class="btn btn-default btn-xs">Pin</button>. To unpin a pinned project, click <button class="btn btn-default btn-xs">Unpin</button> in the dropdown menu.
        </p>

        <p>
            Projects have a name and short description so users can identify them. Project admins can edit these fields in the project overview. Open the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu and click <button class="btn btn-default btn-xs">Edit</button> to make the name and description editable. Click <button class="btn btn-success btn-xs">Save</button> once you are finished or <button class="btn btn-default btn-xs">Cancel</button> to reset your changes.
        </p>
        <p>
            If you want to leave the project, open the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu and click <button class="btn btn-default btn-xs">Leave</button>. If you are a project admin, note that you can only leave a project if it has at least one other admin to manage it.
        </p>
        <p>
            Finally, project admins can delete a project with a click on <button class="btn btn-default btn-xs">Delete</button> in the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu. This will detach all label trees and volumes from the project. All volumes that are not attached to another project will be deleted. Be very careful when you want to delete a project since you can destroy lots of annotations with a single action!
        </p>

    </div>
@endsection
