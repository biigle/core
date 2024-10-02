import './filters/videoTime';
import Navbar from './navbar';
import SearchResults from './searchResults';
import VideoContainer from './videoContainer';
biigle.$mount('search-results', SearchResults);
biigle.$mount('video-annotations-navbar', Navbar);
biigle.$mount('video-container', VideoContainer);