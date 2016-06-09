angular.module("dias.label-trees",["dias.api","dias.ui"]),angular.module("dias.label-trees").config(["$compileProvider",function(e){"use strict";e.debugInfoEnabled(!1)}]),angular.module("dias.label-trees").controller("AuthorizedProjectsController",["$scope","LABEL_TREE","AUTH_PROJECTS","AUTH_OWN_PROJECTS","Project","LabelTreeAuthorizedProject",function(e,n,i,t,r,o){"use strict";var l=!1,u=!1,a=null,d=null,s=function(e){for(var n=i.length-1;n>=0;n--)if(i[n].id===e.id)return!1;return!0},c=function(e){d=e.filter(s)},f=function(e){msg.responseError(e),u=!1},b=function(e){i.push(e),t.push(e.id),c(a),u=!1},m=function(e){var n;for(n=i.length-1;n>=0;n--)if(i[n].id===e.id){i.splice(n,1);break}n=t.indexOf(e.id),-1!==n&&t.splice(n,1),c(a),u=!1};e.hasProjects=function(){return i.length>0},e.getProjects=function(){return i},e.isOwnProject=function(e){return-1!==t.indexOf(e.id)},e.isEditing=function(){return l},e.getVisibilityId=function(){return n.visibility_id},e.toggleEditing=function(){a||(a=r.query(c)),l=!l},e.isLoading=function(){return u},e.getProjectsForAuthorization=function(){return d},e.addAuthorizedProject=function(e){u=!0,o.addAuthorized({id:n.id},{id:e.id},function(){b(e)},f)},e.removeAuthorizedProject=function(e){u=!0,o.removeAuthorized({id:n.id},{id:e.id},function(){m(e)},f)}}]),angular.module("dias.label-trees").controller("LabelTreeController",["$scope","LABEL_TREE","LabelTree","msg",function(e,n,i,t){"use strict";var r=!1,o=!1;e.labelTreeInfo={name:n.name,description:n.description,visibility_id:n.visibility_id.toString()};var l=function(e){meg.responseError(e),o=!1},u=function(e){n.name=e.name,n.description=e.description,n.visibility_id=parseInt(e.visibility_id),r=!1,o=!1};e.isEditing=function(){return r},e.toggleEditing=function(){r=!r},e.isSaving=function(){return o},e.getVisibilityId=function(){return n.visibility_id},e.getName=function(){return n.name},e.getDescription=function(){return n.description},e.saveChanges=function(){o=!0,i.update({id:n.id,name:e.labelTreeInfo.name,description:e.labelTreeInfo.description,visibility_id:parseInt(e.labelTreeInfo.visibility_id)},u,l)},e.discardChanges=function(){e.labelTreeInfo.name=n.name,e.labelTreeInfo.description=n.description,e.labelTreeInfo.visibility_id=n.visibility_id.toString(),r=!1}}]),angular.module("dias.label-trees").controller("LabelsController",["$scope","LABELS","LABEL_TREE","Label","msg",function(e,n,i,t,r){"use strict";var o=!1,l=!1,u={LABEL:null,COLOR:"#0099ff",NAME:""};e.tree={},e.selected={label:u.LABEL,color:u.COLOR,name:u.NAME};var a=function(e){r.responseError(e),l=!1},d=function(){e.tree={},n.forEach(function(n){var i=n.parent_id;e.tree[i]?e.tree[i].push(n):e.tree[i]=[n]})},s=function(i){n.push(i),d(),e.$broadcast("labels.refresh"),e.resetName(),l=!1},c=function(i){for(var t=n.length-1;t>=0;t--)if(n[t].id===i.id){n.splice(t,1);break}d(),e.selected.label&&e.selected.label.id===i.id&&(e.selected.label=null),e.selectLabel(e.selected.label),l=!1};e.selectLabel=function(n){e.selected.label=n,e.$broadcast("labels.selected",n?n.id:null)},e.hasLabels=function(){return n.length>0},e.isEditing=function(){return o},e.toggleEditing=function(){o=!o},e.getLabels=function(){return n},e.resetParent=function(){e.selectLabel(u.LABEL)},e.resetColor=function(){e.selected.color=u.COLOR},e.resetName=function(){e.selected.name=u.NAME},e.addLabel=function(){l=!0;var n={name:e.selected.name,color:e.selected.color,label_tree_id:i.id};e.selected.label&&(n.parent_id=e.selected.label.id),t.create(n,s,a)},e.removeLabel=function(e,n){l=!0,n.stopPropagation(),t["delete"]({id:e.id},function(){c(e)},a)},e.isLoading=function(){return l},d()}]),angular.module("dias.label-trees").controller("MembersController",["$scope","LABEL_TREE","MEMBERS","ROLES","USER_ID","LabelTreeUser","msg","User",function(e,n,i,t,r,o,l,u){"use strict";var a=!1,d=!1;e.newMember={user:null,role_id:null};var s=function(e){l.responseError(e),d=!1},c=function(e){e.role_id=parseInt(e.tmp_role_id),d=!1},f=function(e,n){e.tmp_role_id=e.role_id.toString(),s(n)},b=function(e){for(var n=i.length-1;n>=0;n--)if(i[n].id===e.id){i.splice(n,1);break}d=!1},m=function(e){for(var n=i.length-1;n>=0;n--)if(i[n].id===e.id)return!1;return!0},g=function(e){return e.filter(m)},p=function(n){n.tmp_role_id=n.role_id.toString(),i.push(n),e.newMember.user=null,d=!1};e.isEditing=function(){return a},e.toggleEditing=function(){a=!a},e.isLoading=function(){return d},e.getMembers=function(){return i},e.getRoles=function(){return t},e.getRole=function(e){return t[e]},e.isOwnUser=function(e){return r===e.id},e.updateRole=function(e){d=!0,o.update({label_tree_id:n.id},{id:e.id,role_id:parseInt(e.tmp_role_id)},function(){c(e)},function(n){f(e,n)})},e.detachMember=function(e){d=!0,o.detach({label_tree_id:n.id},{id:e.id},function(){b(e)},s)},e.username=function(e){return e&&e.firstname&&e.lastname?e.firstname+" "+e.lastname:""},e.findUser=function(e){return u.find({query:encodeURIComponent(e)}).$promise.then(g)},e.newMemberValid=function(){return e.newMember.user&&void 0!==e.newMember.user.id&&m(e.newMember.user)&&null!==e.newMember.role_id},e.attachMember=function(){if(e.newMemberValid()){d=!0;var i=e.newMember.user;i.role_id=parseInt(e.newMember.role_id),o.attach({label_tree_id:n.id},{id:i.id,role_id:i.role_id},function(){p(i)},s)}};for(var _=i.length-1;_>=0;_--)i[_].tmp_role_id=i[_].role_id.toString()}]),angular.module("dias.label-trees").directive("labelTreeItem",["$compile","$timeout","$templateCache",function(e,n,i){"use strict";return{restrict:"C",templateUrl:"label-item.html",scope:!0,link:function(t,r,o){var l=angular.element(i.get("label-subtree.html"));n(function(){r.append(e(l)(t))})},controller:["$scope",function(e){var n=function(){return e.tree&&!!e.tree[e.item.id]},i=!1,t=n(),r=!1;e.getClass=function(){return{open:i,expandable:t,selected:r}},e.$on("labels.selected",function(n,t){e.item.id===t?(i=!0,r=!0,e.$emit("labels.openParents")):(i=!1,r=!1)}),e.$on("labels.openParents",function(n){i=!0,null===e.item.parent_id&&n.stopPropagation()}),e.$on("labels.refresh",function(){t=n()})}]}}]);