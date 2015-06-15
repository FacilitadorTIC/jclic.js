//    File    : MediaContent.js  
//    Created : 13/04/2015  
//    By      : Francesc Busquets  
//
//    JClic.js  
//    HTML5 player of [JClic](http://clic.xtec.cat) activities  
//    https://github.com/projectestac/jclic.js  
//    (c) 2000-2015 Catalan Educational Telematic Network (XTEC)  
//    This program is free software: you can redistribute it and/or modify it under the terms of
//    the GNU General Public License as published by the Free Software Foundation, version. This
//    program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
//    even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
//    General Public License for more details. You should have received a copy of the GNU General
//    Public License along with this program. If not, see [http://www.gnu.org/licenses/].  

define([
  "jquery",
  "../AWT",
  "../Utils"
], function ($, AWT, Utils) {

//
// This object encapsulates a description of any multimedia content (sound,
// video, MIDI, voice recording..) or special actions (jump to another point in
// the sequence, link to an URL, etc.) associated to an [ActiveBox](ActiveBox.html)
// object.
//
  var MediaContent = function (type) {
    this.mediaType = type;
  };

  MediaContent.prototype = {
    constructor: MediaContent,
    // 
    // Valid `mediaType` values are: `UNKNOWN`, `PLAY_AUDIO`, `PLAY_VIDEO`, 
    // `PLAY_MIDI`, `PLAY_CDAUDIO`, `RECORD_AUDIO`, `PLAY_RECORDED_AUDIO`,
    // `RUN_CLIC_ACTIVITY`, `RUN_CLIC_PACKAGE`, `RUN_EXTERNAL`, `URL`, `EXIT`
    // and `RETURN`
    mediaType: 'UNKNOWN',
    //
    // Priority level, used when different medias want to play together. Higest
    // level objects silent lowest ones.
    level: 1,
    // 
    // Media file
    mediaFileName: null,
    //
    // Optional params passed to external calls
    externalParam: null,
    //
    // Special settings used to play only a fragment of media. `-1` means
    // not used (plays full length, from the beginning)
    from: -1,
    to: -1,
    //
    // When `mediaType` is `RECORD_AUDIO`, maximum time to record sound (in seconds),
    // and buffer ID where the recording must be stored
    length: 3,
    recBuffer: 0,
    // 
    // Stretch video size to fit cell space
    stretch: false,
    //
    // Play the video out of the cell, centered on the activity window
    free: false,
    //
    // Place the video window at specific location:
    // Location Point:
    absLocation: null,
    // Point measured from `BOX`, `WINDOW` or `FRAME`
    absLocationFrom: null,
    // Video window must catch mouse clicks
    catchMouseEvents: false,
    // 
    // Plays media in loop
    loop: false,
    //
    // Media automatically starts when its [ActiveBox](ActiveBox.html) becomes
    // active.
    autoStart: false,
    //
    // Loads the object settings from a specific JQuery XML element 
    setProperties: function ($xml) {
      var media = this;
      $.each($xml.get(0).attributes, function () {
        var name = this.name;
        var val = this.value;
        switch (name) {
          case 'type':
            media['mediaType'] = val;
            break;
          case 'file':
            media['mediaFileName'] = val;
            break;
          case 'params':
            media['externalParam'] = val;
            break;

          case 'pFrom':
            media['absLocationFrom'] = val;
            break;

          case 'buffer':
            media ['recBuffer'] = Number(val);
            break;
          case 'level':
          case 'from':
          case 'to':
          case 'length':
            media [name] = Number(val);
            break;

          case 'px':
          case 'py':
            if (media.absLocation === null)
              media.absLocation = new AWT.Point(0, 0);
            if (name === 'px')
              media.absLocation.x = Number(val);
            else
              media.absLocation.y = Number(val);
            break;

          case 'stretch':
          case 'free':
          case 'catchMouseEvents':
          case 'loop':
          case 'autostart':
            media[name] = Utils.getBoolean(val);
            break;
        }
      });
      return this;
    },
    //
    // Compare with another `MediaContent`
    isEquivalent: function (mc) {
      return this.mediaType === mc.mediaType &&
          this.mediaFileName.toLocaleLowerCase() === mc.mediaFileName.toLocaleLowerCase() &&
          this.from === mc.from &&
          this.to === mc.to &&
          this.recBuffer === mc.recBuffer;
    },
    //
    // Gets a string representing this media content, useful for checking if two different elements
    // are in fact equivalent
    getDescription: function () {
      var result = '';
      result += this.mediaType;
      if (this.mediaFileName) {
        result += ' ' + this.mediaFileName;
        if (this.from >= 0)
          result += ' from:' + this.from;
        if (this.to >= 0)
          result += ' to:' + this.to;
      }
      else if (this.externalParam) {
        result += ' ' + this.externalParam;
      }
      return result;
    },
    //
    // Returns an image to be used as icon for representing this media content
    getIcon: function () {

      var icon = null;

      // TODO: implement the creation of SVG icons for each media type
      switch (this.mediaType) {
        case 'PLAY_AUDIO':
        case 'PLAY_RECORDED_AUDIO':
          icon = 'audio';
          break;
        case 'RECORD_AUDIO':
          icon = 'mic';
          break;
        case 'PLAY_VIDEO':
          icon = 'movie';
          break;
        case 'PLAY_MIDI':
          icon = 'music';
          break;
        default:
          icon = 'default';
          break;
      }
      return icon ? this._icoImg[icon] : null;
    },
    //
    // Default icons for the different media types
    // Should be accessed only via `MediaContent.prototype`
    _icoData: {
      default: 'data:image/svg+xml;base64,' +
          'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGhlaWdodD0iNDgiIHZp' +
          'ZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjQ4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAw' +
          'MC9zdmciPjxwYXRoIGQ9Ik0yOC44IDEyTDI4IDhIMTB2MzRoNFYyOGgxMS4ybC44IDRoMTRWMTJ6' +
          'Ij48L3BhdGg+PC9zdmc+Cg==',
      audio: 'data:image/svg+xml;base64,' +
          'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGZpbGw9IiMwMDAwMDAi' +
          'IGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjQ4IiB4bWxucz0iaHR0cDov' +
          'L3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0zIDl2Nmg0bDUgNVY0TDcgOUgzem0xMy41' +
          'IDNjMC0xLjc3LTEuMDItMy4yOS0yLjUtNC4wM3Y4LjA1YzEuNDgtLjczIDIuNS0yLjI1IDIuNS00' +
          'LjAyek0xNCAzLjIzdjIuMDZjMi44OS44NiA1IDMuNTQgNSA2Ljcxcy0yLjExIDUuODUtNSA2Ljcx' +
          'djIuMDZjNC4wMS0uOTEgNy00LjQ5IDctOC43N3MtMi45OS03Ljg2LTctOC43N3oiPjwvcGF0aD48' +
          'cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIj48L3BhdGg+PC9zdmc+Cg==',
      movie: 'data:image/svg+xml;base64,' +
          'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGZpbGw9IiMwMDAwMDAi' +
          'IGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjQ4IiB4bWxucz0iaHR0cDov' +
          'L3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xOCA0bDIgNGgtM2wtMi00aC0ybDIgNGgt' +
          'M2wtMi00SDhsMiA0SDdMNSA0SDRjLTEuMSAwLTEuOTkuOS0xLjk5IDJMMiAxOGMwIDEuMS45IDIg' +
          'MiAyaDE2YzEuMSAwIDItLjkgMi0yVjRoLTR6Ij48L3BhdGg+PHBhdGggZD0iTTAgMGgyNHYyNEgw' +
          'eiIgZmlsbD0ibm9uZSI+PC9wYXRoPjwvc3ZnPgo=',
      mic: 'data:image/svg+xml;base64,' +
          'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGZpbGw9IiMwMDAwMDAi' +
          'IGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjQ4IiB4bWxucz0iaHR0cDov' +
          'L3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMiAxNGMxLjY2IDAgMi45OS0xLjM0IDIu' +
          'OTktM0wxNSA1YzAtMS42Ni0xLjM0LTMtMy0zUzkgMy4zNCA5IDV2NmMwIDEuNjYgMS4zNCAzIDMg' +
          'M3ptNS4zLTNjMCAzLTIuNTQgNS4xLTUuMyA1LjFTNi43IDE0IDYuNyAxMUg1YzAgMy40MSAyLjcy' +
          'IDYuMjMgNiA2LjcyVjIxaDJ2LTMuMjhjMy4yOC0uNDggNi0zLjMgNi02LjcyaC0xLjd6Ij48L3Bh' +
          'dGg+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSI+PC9wYXRoPjwvc3ZnPgo=',
      music: 'data:image/svg+xml;base64,' +
          'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGZpbGw9IiMwMDAwMDAi' +
          'IGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjQ4IiB4bWxucz0iaHR0cDov' +
          'L3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUi' +
          'PjwvcGF0aD48cGF0aCBkPSJNMTIgM3YxMC41NWMtLjU5LS4zNC0xLjI3LS41NS0yLS41NS0yLjIx' +
          'IDAtNCAxLjc5LTQgNHMxLjc5IDQgNCA0IDQtMS43OSA0LTRWN2g0VjNoLTZ6Ij48L3BhdGg+PC9z' +
          'dmc+Cg=='
    },
    //
    // Icon `ImageData` objects
    _icoImg: {}
  };

  // Load icons
  $.each(MediaContent.prototype._icoData, function (key, value) {
    var img = new Image();
    // Assign an empty image
    MediaContent.prototype._icoImg[key] = img;
    $(img).attr('src', value);
    $(img).load();
    // TODO: Provide a callback function to track the loading process of the media icon
  });

  return MediaContent;
});
