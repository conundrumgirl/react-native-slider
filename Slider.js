'use strict';

var React = require('react-native');
var {
  PropTypes,
  StyleSheet,
  PanResponder,
  View,
  Platform,
  TouchableHighlight,
  Text,
  } = React;

var TRACK_SIZE = 4;
var THUMB_SIZE = 20;

function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

Rect.prototype.containsPoint = function (x, y) {
  return (x >= this.x
  && y >= this.y
  && x <= this.x + this.width
  && y <= this.y + this.height);
};

var Slider = React.createClass({
  propTypes: {
    /**
     * Initial value of the slider. The value should be between minimumValue
     * and maximumValue, which default to 0 and 1 respectively.
     * Default value is 0.
     *
     * *This is not a controlled component*, e.g. if you don't update
     * the value, the component won't be reset to its inital value.
     */
    value: PropTypes.number,

    /*
     * Initial minimum value of the slider. Default value is 0.
     */
    minimumValue: PropTypes.number,

    /**
     * Initial maximum value of the slider. Default value is 1.
     */
    maximumValue: PropTypes.number,

    /**
     * The color used for the track to the left of the button. Overrides the
     * default blue gradient image.
     */
    minimumTrackTintColor: PropTypes.string,

    /**
     * The color used for the track to the right of the button. Overrides the
     * default blue gradient image.
     */
    maximumTrackTintColor: PropTypes.string,

    /**
     * The color used for the thumb.
     */
    thumbTintColor: PropTypes.string,

    /**
     * The size of the touch area that allows moving the thumb.
     * The touch area has the same center has the visible thumb.
     * This allows to have a visually small thumb while still allowing the user
     * to move it easily.
     * The default is {width: 40, height: 40}.
     */
    thumbTouchSize: PropTypes.shape(
      {width: PropTypes.number, height: PropTypes.number}
    ),

    /**
     * Callback continuously called while the user is dragging the slider.
     */
    onValueChange: PropTypes.func,

    /**
     * Callback called when the user starts changing the value (e.g. when
     * the slider is pressed).
     */
    onSlidingStart: PropTypes.func,

    /**
     * Callback called when the user finishes changing the value (e.g. when
     * the slider is released).
     */
    onSlidingComplete: PropTypes.func,

    /**
     * The style applied to the slider container.
     */
    style: View.propTypes.style,

    /**
     * The style applied to the track.
     */
    trackStyle: View.propTypes.style,

    /**
     * The style applied to the thumb.
     */
    thumbStyle: View.propTypes.style,

    /**
     * Set this to true to visually see the thumb touch rect in green.
     */
    debugTouchArea: PropTypes.bool,


    /**
     * Step should be an integer positive value that min and max can be divided by without a remainer
     */
    step: PropTypes.number,
  },
  getInitialState() {
    return {
      containerSize: {width: 0, height: 0},
      trackSize: {width: 0, height: 0},
      thumbSize: {width: 0, height: 0},

      previousLeft: 0,
      value: this.props.value,
    };
  },
  getDefaultProps() {
    return {
      value: 0,
      minimumValue: 0,
      maximumValue: 1,
      minimumTrackTintColor: '#3f3f3f',
      maximumTrackTintColor: '#b3b3b3',
      thumbTintColor: '#343434',
      thumbTouchSize: {width: 40, height: 40},
      debugTouchArea: true,
    };
  },
  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminate: this._handlePanResponderEnd,
    });
  },
  componentWillReceiveProps: function (nextProps) {
    this.setState({value: nextProps.value});
  },
  render() {
    var {
      minimumTrackTintColor,
      maximumTrackTintColor,
      thumbTintColor,
      styles,
      style,
      trackStyle,
      thumbStyle,
      debugTouchArea,
      measureNumbers,
      measureMarks,
      ...other
      } = this.props;
    var {value, containerSize, trackSize, thumbSize} = this.state;
    var mainStyles = styles || defaultStyles;
    var thumbLeft = this._getThumbLeft(value);
    var valueVisibleStyle = {};
    if (containerSize.width === undefined
      || trackSize.width === undefined
      || thumbSize.width === undefined) {
      valueVisibleStyle.opacity = 0;
    }

    var minimumTrackStyle = {
      position: 'absolute',
      width: 300, // needed to workaround a bug for borderRadius
      marginTop: -trackSize.height,
      backgroundColor: minimumTrackTintColor,
      ...valueVisibleStyle
    };

    if (thumbLeft >= 0 && thumbSize.width >= 0) {
      minimumTrackStyle.width = thumbLeft + thumbSize.width / 2;
    }

    var touchOverflowStyle = this._getTouchOverflowStyle();

    /* generate step */
    var measures = [];
    // create tickmarks to insert later
    if (this.props.step)
    // generate track marks
    {
      var numberOfMeasures = (this.props.maximumValue - this.props.minimumValue) / this.props.step;
      for (var i = 0; i <= numberOfMeasures; i++) {
        measures.push(
          <TouchableHighlight
            key={"h1"+i}

            onPress={this._handlePressButton.bind( this, i*this.props.step)}


            ><View key={"v1"+i} style={{
            height: 20,
            alignItems: "center",
            flexDirection: "column",

          width: trackSize.width/(numberOfMeasures+1),

            backgroundColor:"blue"
        }}>
            <Text key={"t1"+i}
                  style={[mainStyles.measureNumbers, measureNumbers]}>{i * this.props.step + this.props.minimumValue}</Text>
            <View key={"v2"+i} style={[mainStyles.measureMarks, measureMarks]}
              />
          </View></TouchableHighlight>);
      }
    }


    return (
      <View {...other} style={[mainStyles.container, style, {paddingTop:20}]} onLayout={this._measureContainer}>

        <View
          style={[{backgroundColor: maximumTrackTintColor}, mainStyles.track, trackStyle]}
          onLayout={this._measureTrack}/>
        <View style={[mainStyles.track, trackStyle, minimumTrackStyle]}/>
        <View
          ref={(thumb) => this.thumb = thumb}
          onLayout={this._measureThumb}
          style={[
            {backgroundColor: thumbTintColor, marginTop: -(trackSize.height + thumbSize.height) / 2},
            mainStyles.thumb, thumbStyle, {left: thumbLeft, ...valueVisibleStyle}
          ]}
          />
        <View
          style={[defaultStyles.touchArea, touchOverflowStyle]}
          {...this._panResponder.panHandlers}>
          {debugTouchArea === true && this._renderDebugThumbTouchRect()}
        </View>
        {/* container for tickmarks*/}
        <View style={[{ height: 16, marginLeft: -((trackSize.width/(numberOfMeasures+1))/2 - thumbSize.width/2),
         marginRight:  -((trackSize.width/(numberOfMeasures+1))/2 - thumbSize.width/2), marginTop: -thumbSize.height, marginBottom: 10,flexDirection: "row",
            alignItems: "flex-start", justifyContent: "space-between"}]}>{measures}</View>
      </View>
    );
  },


  _getValueWithStep(value)
  {
    //if the step is specified -- get the rounded value otherwise get real value
    return (this.props.step) ? Math.round(value / this.props.step) * this.props.step : value;

  },

  _handlePressButton: function (value) {
    //if the user clicks on one of the measures -- set value to the measure value

    this.setState({value: value},
      this._fireChangeEvent.bind(this, 'onSlidingComplete'));
  },


  _handleStartShouldSetPanResponder: function (e:Object, /*gestureState: Object*/):boolean {
    // Until the PR https://github.com/facebook/react-native/pull/3426 is merged, we need to always return "true" for android
    if (Platform.OS === 'android') {
      return true;
    }
    // Should we become active when the user presses down on the thumb?
    return this._thumbHitTest(e);
  },

  _handleMoveShouldSetPanResponder: function (/*e: Object, gestureState: Object*/):boolean {
    // Should we become active when the user moves a touch over the thumb?
    return false;
  },

  _handlePanResponderGrant: function (/*e: Object, gestureState: Object*/) {
    this.setState({previousLeft: this._getThumbLeft(this.state.value)},
      this._fireChangeEvent.bind(this, 'onSlidingStart'));
  },
  _handlePanResponderMove: function (e:Object, gestureState:Object) {
    this.setState({value: this._getValue(gestureState)},
      this._fireChangeEvent.bind(this, 'onValueChange'));
  },
  _handlePanResponderEnd: function (e:Object, gestureState:Object) {
    var val = this._getValueWithStep(this._getValue(gestureState));
    this.setState({value: val},
      this._fireChangeEvent.bind(this, 'onSlidingComplete'));
  },

  _measureContainer(x:Object) {
    var {width, height} = x.nativeEvent.layout;
    var containerSize = {width: width, height: height};
    this.setState({containerSize: containerSize});
  },

  _measureTrack(x:Object) {
    var {width, height} = x.nativeEvent.layout;
    var trackSize = {width: width, height: height};
    this.setState({trackSize: trackSize});
  },

  _measureThumb(x:Object) {
    var {width, height} = x.nativeEvent.layout;
    var thumbSize = {width: width, height: height};
    this.setState({thumbSize: thumbSize});
  },


  _getRatio(value:number) {
    return (value - this.props.minimumValue) / (this.props.maximumValue - this.props.minimumValue);
  },

  _getThumbLeft(value:number) {
    var ratio = this._getRatio(value);
    return ratio * (this.state.containerSize.width - this.state.thumbSize.width);
  },

  _getValue(gestureState:Object) {
    var length = this.state.containerSize.width - this.state.thumbSize.width;
    var thumbLeft = Math.min(length,
      Math.max(0, this.state.previousLeft + gestureState.dx));

    var ratio = thumbLeft / length;
    return ratio * (this.props.maximumValue - this.props.minimumValue) + this.props.minimumValue;
  },

  _fireChangeEvent(event) {
    if (this.props[event]) {
      this.props[event](this.state.value);
    }
  },

  _getTouchOverflowSize() {
    var state = this.state;
    var props = this.props;

    var size = {};
    if (state.containerSize.width !== undefined
      && state.thumbSize.width !== undefined) {

      size.width = Math.max(0, props.thumbTouchSize.width - state.thumbSize.width);
      size.height = Math.max(0, props.thumbTouchSize.height - state.containerSize.height);
    }

    return size;
  },

  _getTouchOverflowStyle() {
    var {width, height} = this._getTouchOverflowSize();

    var touchOverflowStyle = {};
    if (width !== undefined && height !== undefined) {
      var verticalMargin = -height / 2;
      touchOverflowStyle.marginTop = verticalMargin;
      touchOverflowStyle.marginBottom = verticalMargin;

      var horizontalMargin = -width / 2;
      touchOverflowStyle.marginLeft = horizontalMargin;
      touchOverflowStyle.marginRight = horizontalMargin;
    }

    if (this.props.debugTouchArea === true) {
      touchOverflowStyle.backgroundColor = 'orange';
      touchOverflowStyle.opacity = 0.5;
    }

    return touchOverflowStyle;
  },

  _thumbHitTest(e:Object) {
    var nativeEvent = e.nativeEvent;
    var thumbTouchRect = this._getThumbTouchRect();
    return thumbTouchRect.containsPoint(nativeEvent.locationX, nativeEvent.locationY);
  },

  _getThumbTouchRect() {
    var state = this.state;
    var props = this.props;
    var touchOverflowSize = this._getTouchOverflowSize();

    return new Rect(
      touchOverflowSize.width / 2 + this._getThumbLeft(state.value) + (state.thumbSize.width - props.thumbTouchSize.width) / 2,
      touchOverflowSize.height / 2 + (state.containerSize.height - props.thumbTouchSize.height) / 2,
      props.thumbTouchSize.width,
      props.thumbTouchSize.height
    );
  },

  _renderDebugThumbTouchRect() {
    var thumbTouchRect = this._getThumbTouchRect();
    var positionStyle = {
      left: thumbTouchRect.x,
      top: thumbTouchRect.y,
      width: thumbTouchRect.width,
      height: thumbTouchRect.height,
    };

    return (
      <View
        style={[defaultStyles.debugThumbTouchArea, positionStyle]}
        pointerEvents='none'
        />
    );
  }
});


var defaultStyles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_SIZE,
    borderRadius: TRACK_SIZE / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
  touchArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 20,
    left: 0,
    right: 0,
    bottom: 0,
  },
  debugThumbTouchArea: {
    position: 'absolute',
    backgroundColor: 'green',
    opacity: 0.5,
  },
  measureNumbers: {
    textAlign: "center",
    fontSize: 9
  },

  measureMarks: {
    width: 6,
    height: 6,
    marginTop: 10,
    backgroundColor: "#ccc",
    borderRadius: 3
  }
});


module.exports = Slider;
