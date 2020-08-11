import Dashboard from './dashboard';
import LabelTreesPanel from './labelTreesPanel';
import MembersPanel from './membersPanel';
import Title from './title';
import VolumesContainer from './volumesContainer';
import VolumesPanel from './volumesPanel';

biigle.$mount('projects-dashboard-main', Dashboard);
biigle.$mount('projects-label-trees', LabelTreesPanel);
biigle.$mount('projects-members', MembersPanel);
biigle.$mount('projects-show-volumes', VolumesContainer);
biigle.$mount('projects-show-volume-list', VolumesPanel);
biigle.$mount('projects-title', Title);
