'use strict';

export function distance (touchTrackA, touchTrackB, ofCurrent) {
    let xa, ya, xb, yb;
    if (ofCurrent) {
        xa = touchTrackA.currentPageX;
        ya = touchTrackA.currentPageY;
        xb = touchTrackB.currentPageX;
        yb = touchTrackB.currentPageY;
    } else {
        xa = touchTrackA.previousPageX;
        ya = touchTrackA.previousPageY;
        xb = touchTrackB.previousPageX;
        yb = touchTrackB.previousPageY;
    }
    return Math.sqrt(Math.pow(xa - xb, 2) + Math.pow(ya - yb, 2));
}

export function maxDistance (touchBank, ofCurrent) {
    let max = 0;
    for (let i = 0; i < touchBank.length - 1; i++) {
        for (let j = i + 1; j < touchBank.length; j++) {
            let d = distance(touchBank[i], touchBank[j], ofCurrent);
            if (d > max) {
                max = d;
            }
        }
    }
    return max;
}

export function pinchDistance (touchHistory, touchesChangedAfter, ofCurrent) {
    let touchBank = touchHistory.touchBank;
    if (touchHistory.numberActiveTouches > 1) {
        let filteredTouchBank = touchBank.filter((touchTrack) => {
            return touchTrack && touchTrack.currentTimeStamp >= touchesChangedAfter;
        });
        return maxDistance(filteredTouchBank, ofCurrent);
    }
}
