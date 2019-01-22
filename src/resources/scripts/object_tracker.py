import cv2
import numpy as np
import sys
import json

class ObjectTracker(object):
    def __init__(self, params):
        self.video_path = params['video_path']
        self.start_time = params['start_time']
        self.track_window = tuple(params['start_window'])

        self.video = cv2.VideoCapture(self.video_path)
        self.fps = self.video.get(cv2.CAP_PROP_FPS)
        self.width = self.video.get(cv2.CAP_PROP_FRAME_WIDTH)
        self.height = self.video.get(cv2.CAP_PROP_FRAME_HEIGHT)

        start_frame = round(self.start_time * self.fps)
        self.video.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        self.roi_hist = self.get_roi_hist(self.track_window)
        self.term_criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 0, 1)

        self.debug = False

    def get_roi_hist(self, window):
        x, y, w, h = window
        _, frame = self.video.read()
        roi = frame[y:(y + h), x:(x + w)]
        hsv_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

        return cv2.calcHist([hsv_roi], [0], None, [180], [0, 180])

    def track_window_stop_condition(self, window):
        x, y, w, h = window

        return x == 0 or y == 0 or (x + w) == self.width or (y + h) == self.height

    def __iter__(self):
        return self

    def __del__(self):
        if self.video:
            self.video.release()

        if self.debug:
            cv2.destroyAllWindows()

    def __next__(self):
        success, frame = self.video.read()
        if not success:
            raise StopIteration
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = cv2.calcBackProject([hsv], [0], self.roi_hist, [0, 180], 1)
        ret, track_window = cv2.meanShift(mask, self.track_window, self.term_criteria)
        self.track_window = track_window

        if self.track_window_stop_condition(self.track_window):
            raise StopIteration

        current_frame = self.video.get(cv2.CAP_PROP_POS_FRAMES)
        current_time = current_frame / self.fps

        if self.debug:
            x, y, w, h = self.track_window
            cv2.rectangle(frame, (x, y), (x + w, y + h), 255, 2)
            # for CamShift:
            # pts = cv2.boxPoints(ret)
            # pts = np.int0(pts)
            # cv2.polylines(frame, [pts], True, (255, 0, 0), 2)
            cv2.imshow("frame", frame)
            cv2.waitKey(1)

        return (current_time,) + self.track_window


with open(sys.argv[1]) as f:
    params = json.load(f)

last_time = 0
current_time = 0
keyframe_distance = params['keyframe_distance']

for t, x, y, w, h in ObjectTracker(params):
    if t - last_time >= keyframe_distance:
        last_time = t
        print('{},{},{},{},{}'.format(t, x, y, w, h))
