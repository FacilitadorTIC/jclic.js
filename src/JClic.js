/*!
 *  File    : JClic.js
 *  Created : 01/04/2015
 *  By      : Francesc Busquets <francesc@gmail.com>
 *
 *  JClic.js
 *  An HTML5 player of JClic activities
 *  https://projectestac.github.io/jclic.js
 *
 *  @source https://github.com/projectestac/jclic.js
 *
 *  @license EUPL-1.1
 *  @licstart
 *  (c) 2000-2018 Catalan Educational Telematic Network (XTEC)
 *
 *  Licensed under the EUPL, Version 1.1 or -as soon they will be approved by
 *  the European Commission- subsequent versions of the EUPL (the "Licence");
 *  You may not use this work except in compliance with the Licence.
 *
 *  You may obtain a copy of the Licence at:
 *  https://joinup.ec.europa.eu/software/page/eupl
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the Licence is distributed on an "AS IS" basis, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  Licence for the specific language governing permissions and limitations
 *  under the Licence.
 *  @licend
 */

// Declaration of external objects needed by JSDoc:

/**
 * The HTMLElement interface represents any HTML element. Some elements directly implement this
 * interface, others implement it via an interface that inherits it.
 * @external HTMLElement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement}
 */

/**
 * Element is the most general base class from which all objects in a Document inherit. It only
 * has methods and properties common to all kinds of elements. More specific classes inherit from Element.
 * @external HTMLElement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element}
 */

/**
 * The CanvasRenderingContext2D interface provides the 2D rendering context for the drawing surface
 * of a &lt;canvas&gt; element.
 * @external CanvasRenderingContext2D
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D}
 */

/**
 * The HTMLImageElement interface provides special properties and methods (beyond the regular
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement HTMLElement} interface it
 * also has available to it by inheritance) for manipulating the layout and presentation of
 * &lt;img&gt; elements.
 * @external HTMLImageElement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement}
 */

/**
 * The HTMLAudioElement interface provides access to the properties of &lt;audio&gt; elements, as
 * well as methods to manipulate them. It derives from the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement HTMLMediaElement} interface.
 * @external HTMLAudioElement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement}
 */

/**
 * The Intl.Collator object is a constructor for collators, objects that enable language sensitive
 * string comparison.
 * @external Collator
 * @see {@link https://developer.mozilla.org/ca/docs/Web/JavaScript/Reference/Global_Objects/Collator}
 */

/**
 * A JSZip object
 * @external JSZip
 * @see {@link https://stuk.github.io/jszip}
 */

/**
 * The MediaRecorder interface of the {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder_API MediaRecorder API}
 * provides functionality to easily capture media.
 * @external MediaRecorder
 * @see {@link https://developer.mozilla.org/ca/docs/Web/API/MediaRecorder}
 */

/**
 * An i18next object, used to translate literals
 * @external i18next
 * @see {@link http://i18next.com}
 */

/**
 * The Promise object is used for asynchronous computations. A Promise represents an operation
 * that hasn't completed yet, but is expected in the future.
 * @external Promise
 * @see {@link https://developer.mozilla.org/ca/docs/Web/JavaScript/Reference/Global_Objects/Promise}
 */

/**
* The Storage interface of the Web Storage API provides access to the session storage or local storage for a particular domain,
* allowing you to for example add, modify or delete stored data items.
* @external Storage
* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Storage}
*/

/**
 * The NamedNodeMap interface represents a collection of Attr objects. Objects inside a NamedNodeMap are not in any particular
 * order, unlike NodeList, although they may be accessed by an index as in an array.
 * @external NamedNodeMap
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap}
 */

/* global define:true, JClicDataProject, JClicDataOptions */

// Mock `define` when called from a JavaScript environment without native AMD support (like Node.js)
// For an example of how to call JClic.js in node.js, see:
// `/test/nodejs/listProjectContents.js`
if (typeof define === 'undefined')
  define = (deps, callback) => callback.apply(null, deps.map(dep => require(dep)));

// Initial empty definition of `JClicObject`, to be filled with real data in `define`
const JClicObject = {};

define([
  "./JClicPlayer",
  "./project/JClicProject",
  "./AWT",
  "./Utils",
  "./Deps"
], function (JClicPlayer, JClicProject, AWT, Utils /*, deps*/) {

  /**
   * This is the main method of JClic
   *
   * Executes on `document.ready()`.
   *
   * The method iterates over all `div` objects with `JClic` class and creates a {@link JClicPlayer}
   * within them. Each player loads the JClic project file specified in the `data-project` attribute of
   * the `div` tag.
   *
   * The `div` elements must preferabily be empty. Inner content may become overlapped by objects
   * created by the JClic player.
   *
   * This method exports the global variable `window.JClicObject`, useful when other scripts
   * need to make direct calls to the main components of JClic.
   *
   * The main members of the global variable `JClicObject` are:
   * - `JClicObject.JClicPlayer` (the {@link JClicPlayer} object)
   * - `JClicObject.JClicProject` (the {@link JClicProject} object)
   * - `JClicObject.AWT` (the {@link AWT} object)
   * - `JClicObject.Utils` (the {@link Utils} object)
   * - `JClicObject.options` (the main options loaded at startup, usually the content of the global variable `JClicDataOptions`)
   * - `JClicObject.projectFiles` (used by JSONP to store the content of some files when inaccessible to the browser because CORS or other restrictions)
   * - `JClicObject.currentPlayers` (array with references to the players currently running)
   * - `JClicObject.loadProject` (a function that starts a JClicPlayer on a specific `div`)
   *
   * @module JClic
   * @exports JClicObject
   * @example
   * Creates a JClic div and loads "myproject.jclic" on it:
   * `<div class ="JClic" data-project="myproject.jclic"></div>`
   * @example
   * Creates a JClic div that loads "myproject.jclic" with additional parameters, passed as a
   * JSON string. Note that `data-options` should be delimited by apostrophes `'` because quotation
   * marks `"` are used for JSON keys and values:
   * `<div class ="JClic" data-project="myproject.jclic" data-options='{"fade":"400","lang":"es","reporter":"TCPReporter","user":"test01","path":"localhost:9090"}'></div>`
   *
   */
  Object.assign(JClicObject, {
    JClicPlayer: JClicPlayer,
    JClicProject: JClicProject,
    AWT: AWT,
    Utils: Utils,
    options: typeof JClicDataOptions === 'undefined' ? {} : JClicDataOptions || {},
    projectFiles: {},
    currentPlayers: [],
    /**
     *
     * Creates a new JClicPlayer hosted on the specified `div`, and loads an specific project on it.
     * @param {HTMLElement} div - The HTML element (usually a `<div/>`) that will be used as a main container of the player.
     * @param {string} projectName - The file name or URL of the JClic project to be loaded
     * @param {object=} options - An optional set of preferences
     * @returns {JClicPlayer}
     */
    loadProject: function (div, projectName, options = {}) {

      options = Utils.init(Object.assign({}, JClicObject.options, options));
      let player = null;

      // Find if there is another player already running on 'div'
      for (const pl of JClicObject.currentPlayers) {
        if (pl && pl.topDiv === div) {
          // Player found! Check if it has the same options
          Utils.log('debug', 'Existing JClicPlayer found in div. I will try to reuse it.');
          player = pl;
          for (const prop of Object.getOwnPropertyNames(options)) {
            if (!player.options.hasOwnProperty(prop) || player.options[prop] !== options[prop]) {
              Utils.log('debug', 'Existing JClicPlayer has diferent options! Creating a new one from scratch.');
              player = null;
              break;
            }
          }
          break;
        }
      }

      if (player)
        player.reset();
      else {
        Utils.log('debug', 'Creating a new instance of JClicPlayer');
        div.innerHTML = '';
        player = new JClicPlayer(div, options);
      }

      if (projectName)
        player.initReporter()
          .then(() => player.load(projectName))
          .catch(err => {
            Utils.log('error', `Unable to start reporting: ${err.toString()}.\n JClicPlayer will be removed.'`);
            div.innerHTML = '';
            div.setAttribute('style', '');
            div.appendChild(Utils.HTML.element('h2', player.getMsg('ERROR')));
            div.appendChild(Utils.HTML.p(err));
            const i = JClicObject.currentPlayers.indexOf(player);
            if (i >= 0)
              JClicObject.currentPlayers.splice(i, 1);
            player = null;
          });

      if (player && options.savePlayersRef !== false && JClicObject.currentPlayers.indexOf(player) === -1)
        JClicObject.currentPlayers.push(player);

      return player;
    }
  });

  // Make JClicObject global and attach resize handler
  if (typeof window !== 'undefined') {
    window.JClicObject = JClicObject;
    const fnFit = () => JClicObject.currentPlayers.forEach(player => { if (player && player.skin) player.skin.fit(); });
    ['webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange'].forEach(ev => document.addEventListener(ev, fnFit));
    window.addEventListener('resize', fnFit);
  }

  let initialized = false;
  const fnInit = () => {
    initialized = true;
    // If defined, load the global variable `JClicDataProject` or `JClicObject.projectFile`
    let projectName =
      typeof JClicDataProject === 'string' ?
        JClicDataProject :
        typeof JClicObject.projectFile === 'string' ?
          JClicObject.projectFile :
          null;

    // Search DOM elements with class "JClic" (usually of type 'div') and iterate over them
    // initializing players
    document.querySelectorAll('.JClic').forEach(element => {
      JClicObject.loadProject(element, element.dataset.project || projectName, Object.assign({}, JClicObject.options, element.dataset.options || {}));
    });
  };

  // Execute on document ready
  if (!JClicObject.options.noInit) {
    if (!initialized && document.readyState === 'interactive' || document.readyState === 'complete')
      fnInit();
    else
      // wait for a change on readyState:
      document.addEventListener('readystatechanged', () => {
        if (!initialized && document.readyState === 'interactive' || document.readyState === 'complete')
          fnInit();
      });
  }

  return JClicObject;
});

// Export JClicObject as a result
if (typeof module !== 'undefined') {
  exports = module.exports = JClicObject;
}
