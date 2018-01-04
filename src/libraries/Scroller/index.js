'use strict';

/**
 * Inspired by Android Scroller
 */

import ViscousFluidInterpolator from './ViscousFluidInterpolator';
import {currentAnimationTimeMillis} from'./AnimationUtils';

/**
 * The coefficient of friction applied to flings/scrolls.
 * @type {number}
 */
//const SCROLL_FRICTION = 0.015;
const SCROLL_FRICTION = 0.03;

const DEFAULT_DURATION = 250;
const SCROLL_MODE = 0;
const FLING_MODE = 1;

const DECELERATION_RATE = Math.log(0.78) / Math.log(0.9);
const INFLEXION = 0.35; // Tension lines cross at (INFLEXION, 1)
const START_TENSION = 0.5;
const END_TENSION = 1.0;
const P1 = START_TENSION * INFLEXION;
const P2 = 1.0 - END_TENSION * (1.0 - INFLEXION);

const NB_SAMPLES = 100;
const SPLINE_POSITION = [];
const SPLINE_TIME = [];

const GRAVITY_EARTH = 9.80665;

(function () {
  var x_min = 0;
  var y_min = 0;
  for (let i = 0; i < NB_SAMPLES; i++) {
    let alpha = i / NB_SAMPLES;

    let x_max = 1;
    let x, tx, coef;
    while (true) {
      x = x_min + (x_max - x_min) / 2.0;
      coef = 3.0 * x * (1.0 - x);
      tx = coef * ((1.0 - x) * P1 + x * P2) + x * x * x;
      if (Math.abs(tx - alpha) < 1E-5) break;
      if (tx > alpha) x_max = x;
      else x_min = x;
    }
    SPLINE_POSITION[i] = coef * ((1.0 - x) * START_TENSION + x) + x * x * x;

    let y_max = 1.0;
    let y, dy;
    while (true) {
      y = y_min + (y_max - y_min) / 2.0;
      coef = 3.0 * y * (1.0 - y);
      dy = coef * ((1.0 - y) * START_TENSION + y) + y * y * y;
      if (Math.abs(dy - alpha) < 1E-5) break;
      if (dy > alpha) y_max = y;
      else y_min = y;
    }
    SPLINE_TIME[i] = coef * ((1.0 - y) * P1 + y * P2) + y * y * y;
  }
  SPLINE_POSITION[NB_SAMPLES] = SPLINE_TIME[NB_SAMPLES] = 1.0;
})();

function signum(number) {
  if (isNaN(number)) {
    return NaN;
  }
  var sig = number;
  if (number > 0) {
    sig = 1;
  }
  else if (number < 0) {
    sig = -1;
  }
  return sig;
}

export default class Scroller {
  /**
   *
   * @param flywheel specify whether or not to support progressive "flywheel" behavior in flinging.
   */
  constructor(flywheel, onScrollCallback) {
    this.mCurrX = 0;
    this.mCurrY = 0;
    this.mFinished = true;
    this.mInterpolator = ViscousFluidInterpolator;
    //this.mPpi = PixelRatio.get() * 160;
    this.mPpi = 160;
    this.mDeceleration = this.computeDeceleration(SCROLL_FRICTION);
    this.mFlywheel = flywheel;

    this.mPhysicalCoeff = this.computeDeceleration(0.84); // look and feel tuning

    this.mFlingFriction = SCROLL_FRICTION;
    this.onScrollCallback = onScrollCallback;
  }

  computeDeceleration(friction) {
    return GRAVITY_EARTH * 39.37 * this.mPpi * friction;
  }

  /**
   * Returns whether the scroller has finished scrolling.
   * @returns {Boolean} True if the scroller has finished scrolling, false otherwise.
   */
  isFinished() {
    return this.mFinished;
  }

  /**
   * Force the finished field to a particular value.
   * @param finished The new finished value.
   */
  forceFinished(finished) {
    this.mFinished = finished;
  }

  /**
   * Returns the current X offset in the scroll.
   * @returns {*} The new X offset as an absolute distance from the origin.
   */
  getCurrX() {
    return this.mCurrX;
  }

  /**
   * Returns the current Y offset in the scroll.
   * @returns {*} The new Y offset as an absolute distance from the origin.
   */
  getCurrY() {
    return this.mCurrY;
  }

  getCurrVelocity() {
    return this.mMode === FLING_MODE ?
      this.mCurrVelocity : this.mVelocity - this.mDeceleration * this.timePassed() / 2000.0;
  }

  computeScrollOffset() {
    if (this.mFinished) {
      this.onScrollCallback && this.onScrollCallback(0, 0, this);
      return false;
    }

    var timePassed = currentAnimationTimeMillis() - this.mStartTime;

    if (timePassed < this.mDuration) {
      switch (this.mMode) {
        case SCROLL_MODE:
          let x = this.mInterpolator.getInterpolation(timePassed * this.mDurationReciprocal);
          this.mCurrX = this.mStartX + Math.round(x * this.mDeltaX);
          this.mCurrY = this.mStartY + Math.round(x * this.mDeltaY);
          break;
        case FLING_MODE:
          let t = timePassed / this.mDuration;
          let index = parseInt(NB_SAMPLES * t);
          let distanceCoef = 1;
          let velocityCoef = 0;
          if (index < NB_SAMPLES) {
            let t_inf = index / NB_SAMPLES;
            let t_sup = (index + 1) / NB_SAMPLES;
            let d_inf = SPLINE_POSITION[index];
            let d_sup = SPLINE_POSITION[index + 1];
            velocityCoef = (d_sup - d_inf) / (t_sup - t_inf);
            distanceCoef = d_inf + (t - t_inf) * velocityCoef;
          }

          this.mCurrVelocity = velocityCoef * this.mDistance / this.mDuration * 1000;

          this.mCurrX = this.mStartX + Math.round(distanceCoef * (this.mFinalX - this.mStartX));
          // Pin to mMinX <= mCurrX <= mMaxX
          //this.mCurrX = Math.min(this.mCurrX, this.mMaxX);
          //this.mCurrX = Math.max(this.mCurrX, this.mMinX);

          this.mCurrY = this.mStartY + Math.round(distanceCoef * (this.mFinalY - this.mStartY));
          // Pin to mMinY <= mCurrY <= mMaxY
          this.mCurrY = Math.min(this.mCurrY, this.mMaxY);
          this.mCurrY = Math.max(this.mCurrY, this.mMinY);

          if (this.mCurrX == this.mFinalX && this.mCurrY == this.mFinalY) {
            this.mFinished = true;
          }

          break;
      }
    }
    else {
      this.mCurrX = this.mFinalX;
      this.mCurrY = this.mFinalY;
      this.mFinished = true;
    }

    var dx = this.mCurrX - this.mLastX;
    var dy = this.mCurrY - this.mLastY;

    this.mLastX = this.mCurrX;
    this.mLastY = this.mCurrY;

    this.onScrollCallback && this.onScrollCallback(dx, dy, this);

    if(dx === 0 && dy === 0 && this.mFinished) {
      return false;
    }
    return true;
  }

  startScroll(startX, startY, dx, dy) {
    startScroll(startX, startY, dx, dy, DEFAULT_DURATION);
  }

  startScroll(startX, startY, dx, dy, duration) {
    this.mMode = SCROLL_MODE;
    this.mFinished = false;
    this.mDuration = duration;
    this.mStartTime = currentAnimationTimeMillis();
    this.mStartX = startX;
    this.mStartY = startY;
    this.mFinalX = startX + dx;
    this.mFinalY = startY + dy;
    this.mDeltaX = dx;
    this.mDeltaY = dy;
    this.mDurationReciprocal = 1.0 / this.mDuration;

    this.mLastX = this.mStartX;
    this.mLastY = this.mStartY;

    this.performAnimation();
  }

  /**
   * Start scrolling based on a fling gesture. The distance travelled will
   * depend on the initial velocity of the fling.
   * @param startX
   * @param startY
   * @param velocityX Initial velocity of the fling (X) measured in dp or pt per second
   * @param velocityY Initial velocity of the fling (Y) measured in dp or pt per second
   * @param minX
   * @param maxX
   * @param minY
   * @param maxY
   */
  fling(startX, startY, velocityX, velocityY,
        minX, maxX, minY, maxY) {
    // Continue a scroll or fling in progress
    if (this.mFlywheel && !this.mFinished) {
      let oldVel = this.getCurrVelocity();

      let dx = this.mFinalX - this.mStartX;
      let dy = this.mFinalY - this.mStartY;
      let hyp = Math.hypot(dx, dy);

      let ndx = dx / hyp;
      let ndy = dy / hyp;

      let oldVelocityX = ndx * oldVel;
      let oldVelocityY = ndy * oldVel;
      if (signum(velocityX) === signum(oldVelocityX) &&
        signum(velocityY) === signum(oldVelocityY)) {
        velocityX += oldVelocityX;
        velocityY += oldVelocityY;
      }
    }

    this.mMode = FLING_MODE;
    this.mFinished = false;

    let velocity = Math.hypot(velocityX, velocityY);

    this.mVelocity = velocity;
    this.mDuration = this.getSplineFlingDuration(velocity);
    this.mStartTime = currentAnimationTimeMillis();
    this.mStartX = startX;
    this.mStartY = startY;

    let coeffX = velocity == 0 ? 1.0 : velocityX / velocity;
    let coeffY = velocity == 0 ? 1.0 : velocityY / velocity;

    let totalDistance = this.getSplineFlingDistance(velocity);
    this.mDistance = totalDistance * signum(velocity);

    this.mMinX = minX;
    this.mMaxX = maxX;
    this.mMinY = minY;
    this.mMaxY = maxY;

    this.mFinalX = startX + Math.round(totalDistance * coeffX);
    // Pin to mMinX <= mFinalX <= mMaxX
    this.mFinalX = Math.min(this.mFinalX, this.mMaxX);
    this.mFinalX = Math.max(this.mFinalX, this.mMinX);

    this.mFinalY = startY + Math.round(totalDistance * coeffY);
    // Pin to mMinY <= mFinalY <= mMaxY
    this.mFinalY = Math.min(this.mFinalY, this.mMaxY);
    this.mFinalY = Math.max(this.mFinalY, this.mMinY);

    this.mLastX = this.mStartX;
    this.mLastY = this.mStartY;

    this.performAnimation();
  }

  getSplineDeceleration(velocity) {
    return Math.log(INFLEXION * Math.abs(velocity) / (this.mFlingFriction * this.mPhysicalCoeff));
  }

  getSplineFlingDuration(velocity) {
    var l = this.getSplineDeceleration(velocity);
    var decelMinusOne = DECELERATION_RATE - 1.0;
    return 1000.0 * Math.exp(l / decelMinusOne);
  }

  getSplineFlingDistance(velocity) {
    var l = this.getSplineDeceleration(velocity);
    var decelMinusOne = DECELERATION_RATE - 1.0;
    return this.mFlingFriction * this.mPhysicalCoeff * Math.exp(DECELERATION_RATE / decelMinusOne * l);
  }

  performAnimation() {
    if (this.computeScrollOffset()) {
      requestAnimationFrame(this.performAnimation.bind(this));
    } else {
    }
  }

  abortAnimation() {
    this.mCurrX = this.mFinalX;
    this.mCurrY = this.mFinalY;
    this.mFinished = true;
  }

  extendDuration(extend) {
    var passed = timePassed();
    this.mDuration = passed + extend;
    this.mDurationReciprocal = 1.0 / this.mDuration;
    this.mFinished = false;
  }

  timePassed() {
    return currentAnimationTimeMillis() - this.mStartTime;
  }

  setFinalX(newX) {
    this.mFinalX = newX;
    this.mDeltaX = this.mFinalX - this.mStartX;
    this.mFinished = false;
  }

  setFinalY(newY) {
    this.mFinalY = newY;
    this.mDeltaY = this.mFinalY - this.mStartY;
    this.mFinished = false;
  }

  debugInfo() {
    return 'cur=' + this.mCurrX + ' ' + this.mCurrY + ', final=' + this.mFinalX + ' ' + this.mFinalY;
  }
}