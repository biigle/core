@extends('manual.base')
@section('manual-title', 'About projects')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn what projects are and how to create them.
        </p>

        <p>
            In BIIGLE projects are used to associate a group of users with a group of image collections (called <em>volumes</em>) and label collections (called label trees). What a project represents is entirely up to you. This may be all members and images of a certain expedition or cruise, the members and data of a certain research group or something entirely different.
        </p>

        <p>
            Every user is allowed to create projects. To create a project, click on the <button class="btn btn-default btn-xs">New Project</button> button on the <a href="{{route('home')}}">dashboard</a> (or <a href="{{route('projects-create')}}">here</a>). When you successfully created a project you will be redirected to the project overview. The overview shows you a list of all volumes, label trees and users that are associated with the project as well as several controls to modify the project.
        </p>


        <h3><a name="members"></a>Members</h3>

        <p>
            Each project is only visible to project members. Each member has one of three roles: admin, editor or guest. To modify project members you must be admin in the project. Click on the <button class="btn btn-default btn-xs"><i class="glyphicon glyphicon-pencil"></i></button> button of the members panel to modify members. Enter a username and chosse a role to add a new member. Choose a new user role for existing members to modify them. Click the <strong>&times;</strong> button to remove a member.
        </p>
        <p>
            A <strong>guest</strong> is only able to <em>read</em> from the project. They can see all volumes, label trees and users that belong to the project. But they cannot modify anything related to the project and particularly cannot create or modify annotations in the volumes that belong to the project. Although users with this role can see all label trees that are attached to the project, they cannot access these unless the label trees are public or the users are members of the label trees.
        </p>
        <p>
            In addition to everything that a guest can do, <strong>editors</strong> can create and modify annotations, annotation labels and image labels. However, they cannot delete annotation labels or image labels that were created by other users. Editors should be the default choice for new project members.
        </p>
        <div class="panel panel-info">
            <div class="panel-body text-info">
                The term "annotation" refers to a point or a region that is marked on an image. An "annotation label" is a label that is attached to an annotation by a certain user. Each annotation automatically gets its first annotation label attached to it when it is created. Other users (or you) are able to attach additional annotation labels to the same annotation. An "image label" is a label attached to a whole image instead of an annotation.
            </div>
        </div>
        <p>
            A project <strong>admin</strong> has no restrictions in what they can do. They can create and modify annotations, annotation labels and image labels, <em>including</em> those of other users. Also, they can add or modify project members, <a href="#label-trees">attach or detach label trees</a> and <a href="#volumes">manage volumes</a>. Finally, project admins are able to <a href="#modify-a-project">edit the project name and description or delete the entire project</a>.
        </p>

        <h3><a name="label-trees"></a>Label trees</h3>

        <p>
            There can be one or more <a href="{{route('manual-tutorials', ['label-trees', 'about'])}}">label trees</a> attached to each project. Only the labels of these label trees will be available when annotations, annotation labels or image labels are created in the project.

        </p>
        <p>
             Project admins can attach or detach label trees. To do this, click on the <button class="btn btn-default btn-xs"><i class="glyphicon glyphicon-pencil"></i></button> button of the label trees panel. Enter the name of a label tree and hit enter to attach it. You can only attach public label trees or those that authorized the project to attach them. Click the <strong>&times;</strong> button to detach a label tree.
        </p>
        <p>
            You can also create a label tree and attach it to the project at the same time. Do this with the <button class="btn btn-default btn-xs"><i class="glyphicon glyphicon-plus"></i></button> button of the label trees panel. This is useful to create a new label tree specifically for the current project.
        </p>

        <h3><a name="volumes"></a>Volumes</h3>

        <p>
            A volume is a collection of images that belong together (like a directory in a file system). Each project can have one or more volumes attached to it. Unlike label trees, volumes always belong to at least one project. If a volume belongs to no project any more, it will be deleted.
        </p>
        <p>
            Project admins can create or delete volumes. To create a volume, click the <button class="btn btn-default btn-xs"><i class="glyphicon glyphicon-plus"></i></button> button of the volumes panel. A new volume will be automatically attached to the project it was created for. But volumes can be shared between projects, too. You can attach existing volumes of any project where you are also admin. To do this, click on the <button class="btn btn-default btn-xs"><i class="glyphicon glyphicon-pencil"></i></button> button of the volumes panel, enter the name of the volume you want to attach and hit enter. Click the <strong>&times;</strong> button to detach or delete a volume. A volume is deleted only if this is the last project that it is attached to (there will be an additional request for confirmation in this case). Be careful when doing this since deleting a volume deletes all annotations which cannot be undone!
        </p>

        <h3><a name="modify-a-project"></a>Modify a project</h3>

    </div>
@endsection
