import './export';
import AuthorizedProjectsPanel from './authorizedProjectsPanel';
import LabelsPanel from './labelsPanel';
import MembersPanel from './membersPanel';
import MergeContainer from './mergeContainer';
import MergeIndexContainer from './mergeIndexContainer';
import Title from './title';
import VersionTitle from './versionTitle';
import VersionToolbar from './versionToolbar';

biigle.$mount('label-tree-version-title', VersionTitle);
biigle.$mount('label-tree-version-toolbar', VersionToolbar);
biigle.$mount('label-trees-authorized-projects', AuthorizedProjectsPanel);
biigle.$mount('label-trees-labels', LabelsPanel);
biigle.$mount('label-trees-members', MembersPanel);
biigle.$mount('label-trees-title', Title);
biigle.$mount('merge-label-trees-container', MergeContainer);
biigle.$mount('merge-label-trees-index-container', MergeIndexContainer);
