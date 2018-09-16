/**
 *  File    : Activity.js
 *  Created : 07/04/2015
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

/* global define */

define([
  "./Utils",
  "./AWT",
  "./media/EventSounds",
  "./boxes/ActiveBoxContent",
  "./boxes/ActiveBagContent",
  "./boxes/BoxBase",
  "./automation/AutoContentProvider",
  "./boxes/TextGridContent",
  "./activities/text/Evaluator",
  "./activities/text/TextActivityDocument"], function (
    Utils, AWT, EventSounds, ActiveBoxContent, ActiveBagContent,
    BoxBase, AutoContentProvider, TextGridContent, Evaluator, TextActivityDocument) {

    // Direct access to global setings
    const K = Utils.settings;

    // Event used for detecting touch devices
    const TOUCH_TEST_EVENT = 'touchstart';

    /**
     * Activity is the abstract base class of JClic activities. It defines also the inner class
     * {@link Activity.ActivityPanel}, wich is responsible for user interaction with the activity
     * content.
     * Activities should extend both `Activity` and `ActivityPanel` classes in order to become fully
     * operative.
     * @exports Activity
     * @class
     * @abstract
     */
    class Activity {
      /**
       * Activity constructor
       * @param {JClicProject} project - The {@link JClicProject} to which this activity belongs
       */
      constructor(project) {
        this.project = project;
        this.eventSounds = new EventSounds(this.project.settings.eventSounds);
        this.messages = {};
        this.abc = {};
      }

      /**
       * Factory constructor that returns a specific type of Activity based on the `class` attribute
       * declared in the xml parameter.
       * @param {external:Element} xml - The XML element to be parsed
       * @param {JClicProject} project - The {@link JClicProject} to which this activity belongs
       * @returns {Activity}
       */
      static getActivity(xml, project) {
        let act = null;
        if (xml && project) {
          const
            className = (xml.getAttribute('class') || '').replace(/^edu\.xtec\.jclic\.activities\./, '@'),
            cl = Activity.CLASSES[className];
          if (cl) {
            act = new cl(project);
            act.setProperties(xml);
          } else
            Utils.log('error', `Unknown activity class: ${className}`);
        }
        return act;
      }

      /**
       * Loads this object settings from an XML element
       * @param {external:Element} xml - The XML element to parse
       */
      setProperties(xml) {

        // Read attributes
        Utils.attrForEach(xml.attributes, (name, val) => {
          switch (name) {
            // Generic attributes:
            case 'name':
              val = Utils.nSlash(val);
            /* falls through */
            case 'code':
            case 'type':
            case 'description':
              this[name] = val;
              break;

            case 'class':
              this.className = val.replace(/^edu\.xtec\.jclic\.activities\./, '@');
              break;

            case 'inverse':
              this.invAss = Utils.getBoolean(val, false);
              break;

            case 'autoJump':
            case 'forceOkToAdvance':
            case 'amongParagraphs':
              this[name] = Utils.getBoolean(val, false);
              break;
          }
        });

        // Read specific nodes
        xml.childNodes.forEach(child => {
          switch (child.nodeName) {
            case 'settings':
              // Read more attributes
              Utils.attrForEach(child.attributes, (name, val) => {
                switch (name) {
                  case 'infoUrl':
                  case 'infoCmd':
                    this[name] = val;
                    break;

                  case 'margin':
                  case 'maxTime':
                  case 'maxActions':
                    this[name] = Number(val);
                    break;

                  case 'report':
                    this.includeInReports = Utils.getBoolean(val, false);
                    break;
                  case 'countDownTime':
                  case 'countDownActions':
                  case 'reportActions':
                  case 'useOrder':
                  case 'dragCells':
                    this[name] = Utils.getBoolean(val, false);
                    break;
                }
              });

              // Read elements of _settings_
              child.childNodes.forEach(child => {
                switch (child.nodeName) {
                  case 'skin':
                    this.skinFileName = child.getAttribute('file');
                    break;

                  case 'helpWindow':
                    this.helpMsg = Utils.getXmlText(child);
                    this.showSolution = Utils.getBoolean(child.getAttribute('showSolution'), false);
                    this.helpWindow = this.helpMsg !== null || this.showSolution;
                    break;

                  case 'container':
                    // Read settings related to the 'container'
                    // (the main panel containing the activity and other elements)
                    this.bgColor = Utils.checkColor(child.getAttribute('bgColor'), Utils.settings.BoxBase.BACK_COLOR);

                    child.childNodes.forEach(child => {
                      switch (child.nodeName) {
                        case 'image':
                          this.bgImageFile = child.getAttribute('name');
                          this.tiledBgImg = Utils.getBoolean(child.getAttribute('tiled'), false);
                          break;
                        case 'counters':
                          this.bTimeCounter = Utils.getBoolean(child.getAttribute('time'), true);
                          this.bActionsCounter = Utils.getBoolean(child.getAttribute('actions'), true);
                          this.bScoreCounter = Utils.getBoolean(child.getAttribute('score'), true);
                          break;
                        case 'gradient':
                          this.bgGradient = new AWT.Gradient().setProperties(child);
                          break;
                      }
                    });
                    break;

                  case 'window':
                    // Read settings related to the 'window'
                    // (the panel where the activity deploys its content)
                    this.activityBgColor = Utils.checkColor(child.getAttribute('bgColor'), K.DEFAULT_BG_COLOR);
                    this.transparentBg = Utils.getBoolean(child.getAttribute('transparent'), false);
                    this.border = Utils.getBoolean(child.getAttribute('border'), false);
                    child.childNodes.forEach(child => {
                      switch (child.nodeName) {
                        case 'gradient':
                          this.activityBgGradient = new AWT.Gradient().setProperties(child);
                          break;
                        case 'position':
                          this.absolutePosition = new AWT.Point().setProperties(child);
                          this.absolutePositioned = true;
                          break;
                        case 'size':
                          this.windowSize = new AWT.Dimension().setProperties(child);
                          break;
                      }
                    });
                    break;

                  case 'eventSounds':
                    // eventSounds is already created in constructor,
                    // just read properties
                    this.eventSounds.setProperties(child);
                    break;
                }
              });
              break;

            case 'messages':
              child.querySelectorAll('cell').forEach(child => {
                const m = this.readMessage(child);
                // Possible message types are: `initial`, `final`, `previous`, `finalError`
                this.messages[m.type] = m;
              });
              break;

            case 'automation':
              // Read the automation settings ('Arith' or other automation engines)
              this.acp = AutoContentProvider.getProvider(child, this.project);
              break;

            // Settings specific to panel-type activities (puzzles, associations...)
            case 'cells':
              // Read the [ActiveBagContent](ActiveBagContent.html) objects
              const cellSet = new ActiveBagContent().setProperties(child, this.project.mediaBag);
              // Valid ids:
              // - Panel activities: 'primary', 'secondary', solvedPrimary'
              // - Textpanel activities: 'acrossClues', 'downClues', 'answers'
              this.abc[cellSet.id] = cellSet;
              break;

            case 'scramble':
              // Read the 'scramble' mode
              this.shuffles = Number(child.getAttribute('times'));
              this.scramble.primary = Utils.getBoolean(child.getAttribute('primary'));
              this.scramble.secondary = Utils.getBoolean(child.getAttribute('secondary'));
              break;

            case 'layout':
              Utils.attrForEach(child.attributes, (name, value) => {
                switch (name) {
                  case 'position':
                    this.boxGridPos = value;
                    break;
                  case 'wildTransparent':
                  case 'upperCase':
                  case 'checkCase':
                    this[name] = Utils.getBoolean(value);
                }
              });
              break;

            // Element specific to {@link Menu} activities:
            case 'menuElement':
              this.menuElements.push({
                caption: child.getAttribute('caption') || '',
                icon: child.getAttribute('icon') || null,
                projectPath: child.getAttribute('path') || null,
                sequence: child.getAttribute('sequence') || null,
                description: child.getAttribute('description') || ''
              });
              break;

            // Element specific to {@link CrossWord} and
            // {@link WordSearch} activities:
            case 'textGrid':
              // Read the 'textGrid' element into a {@link TextGridContent}
              this.tgc = new TextGridContent().setProperties(child);
              break;

            // Read the clues of {@link WordSearch} activities
            case 'clues':
              // Read the array of clues
              this.clues = [];
              this.clueItems = [];
              child.querySelectorAll('clue').forEach((child, n) => {
                this.clueItems[n] = Number(child.getAttribute('id'));
                this.clues[n] = child.textContent;
              });
              break;

            // Elements specific to text activities:
            case 'checkButton':
              this.checkButtonText = child.textContent || 'check';
              break;

            case 'prevScreen':
              this.prevScreen = true;
              this.prevScreenMaxTime = child.getAttribute('maxTime') || -1;
              child.childNodes.forEach(child => {
                switch (child.nodeName) {
                  case 'style':
                    this.prevScreenStyle = new BoxBase().setProperties(child);
                    break;
                  case 'p':
                    if (this.prevScreenText === null)
                      this.prevScreenText = '';
                    this.prevScreenText += `<p>${child.textContent}</p>`;
                    break;
                }
              });
              break;

            case 'evaluator':
              this.ev = Evaluator.getEvaluator(child);
              break;

            case 'document':
              // Read main document of text activities
              this.document = new TextActivityDocument().setProperties(child, this.project.mediaBag);
              break;
          }
        });
        return this;
      }

      /**
       * Read an activity message from an XML element
       * @param {external:Element} xml - The XML element to be parsed
       * @returns {ActiveBoxContent}
       */
      readMessage(xml) {
        const msg = new ActiveBoxContent().setProperties(xml, this.project.mediaBag);
        //
        // Allowed types are: `initial`, `final`, `previous`, `finalError`
        msg.type = xml.getAttribute('type');
        // Check for `null` or `undefined`
        if (msg.bb == null)
          msg.bb = new BoxBase(null);
        return msg;
      }

      /**
       * Initialises the {@link AutoContentProvider}, when defined.
       */
      initAutoContentProvider() {
        if (this.acp !== null)
          this.acp.init();
      }

      /**
       * Preloads the media content of the activity.
       * @param {PlayStation} ps - The {@link PlayStation} used to realize the media objects.
       */
      prepareMedia(ps) {
        this.eventSounds.realize(ps, this.project.mediaBag);
        this.messages.forEach(msg => {
          if (msg)
            msg.prepareMedia(ps);
        });
        this.abc.forEach(abc => {
          if (abc)
            abc.prepareMedia(ps);
        });
        return true;
      }

      /**
       * Whether the activity allows the user to request the solution.
       * @returns {boolean}
       */
      helpSolutionAllowed() {
        return false;
      }

      /**
       * Whether the activity allows the user to request help.
       * @returns {boolean}
       */
      helpWindowAllowed() {
        return this.helpWindow &&
          (this.helpSolutionAllowed() && this.showSolution || this.helpMsg !== null);
      }

      /**
       * Retrieves the minimum number of actions needed to solve this activity.
       * @returns {number}
       */
      getMinNumActions() {
        return 0;
      }

      /**
       * When this method returns `true`, the automatic jump to the next activity must be paused at
       * this activity.
       * @returns {boolean}
       */
      mustPauseSequence() {
        return this.getMinNumActions() !== 0;
      }

      /**
       * Whether or not the activity can be reset
       * @returns {boolean}
       */
      canReinit() {
        return true;
      }

      /**
       * Whether or not the activity has additional information to be shown.
       * @returns {boolean}
       */
      hasInfo() {
        return this.infoUrl !== null && this.infoUrl.length > 0 ||
          this.infoCmd !== null && this.infoCmd.length > 0;
      }

      /**
       * Whether or not the activity uses random to scramble internal components
       * @returns {boolean}
       */
      hasRandom() {
        return false;
      }

      /**
       * When `true`, the activity must always be scrambled
       * @returns {boolean}
       */
      shuffleAlways() {
        return false;
      }

      /**
       * When `true`, the activity makes use of the keyboard
       * @returns {boolean}
       */
      needsKeyboard() {
        return false;
      }

      /**
       * Called when the activity must be disposed
       */
      end() {
        this.eventSounds.close();
        this.clear();
      }

      /**
       * Called when the activity must reset its internal components
       */
      clear() {
      }

      /**
       *
       * Getter method for `windowSize`
       * @returns {AWT.Dimension}
       */
      getWindowSize() {
        return new AWT.Dimension(this.windowSize);
      }

      /**
       * Setter method for `windowSize`
       * @param {AWT.Dimension} windowSize
       */
      setWindowSize(windowSize) {
        this.windowSize = new AWT.Dimension(windowSize);
      }

      /**
       * Builds the {@link Activity.Panel} object.
       * Subclasses must update the `Panel` member of its prototypes to produce specific panels.
       * @param {PlayStation} ps - The {@link PlayStation} used to build media objects.
       * @returns {ActivityPanel}
       */
      getActivityPanel(ps) {
        return new this.constructor.Panel(this, ps);
      }
    }

    /**
     * Classes derived from `Activity` should register themselves by adding a field to
     * `Activity.CLASSES` using its name as identifier and the class constructor as a value.
     * @example
     * // To be included at the end of MyActivity class:
     * Activity.CLASSES['custom@myActivity'] = MyActivity
     * @type {object}
     */
    Activity.CLASSES = {
      '@panels.Menu': Activity
    };

    Object.assign(Activity.prototype, {
      /**
       * The {@link JClicProject} to which this activity belongs
       * @name Activity#project
       * @type {JClicProject} */
      project: null,
      /**
       * The Activity name
       * @name Activity#name
       * @type {string} */
      name: K.DEFAULT_NAME,
      /**
       * The class name of this Activity
       * @name Activity#className
       * @type {string} */
      className: null,
      /**
       * Code used in reports to filter queries. Default is `null`.
       * @name Activity#code
       * @type {string} */
      code: null,
      /**
       * Type of activity, used in text activities to distinguish between different variants of the
       * same activity. Possible values are: `orderWords`, `orderParagraphs`, `identifyWords` and
       * `identifyChars`.
       * @name Activity#type
       * @type {string} */
      type: null,
      /**
       * A short description of the activity
       * @name Activity#description
       * @type {string} */
      description: null,
      /**
       * The space between the activity components measured in pixels.
       * @name Activity#margin
       * @type {number} */
      margin: K.DEFAULT_MARGIN,
      /**
       * The background color of the activity panel
       * @name Activity#bgColor
       * @type {string} */
      bgColor: K.DEFAULT_BG_COLOR,
      /**
       * When set, gradient used to draw the activity window background
       * @name Activity#bgGradient
       * @type {AWT.Gradient} */
      bgGradient: null,
      /**
       * Whether the bgImage (if any) has to be tiled across the panel background
       * @name Activity#tiledBgImg
       * @type {boolean} */
      tiledBgImg: false,
      /**
       * Filename of the image used as a panel background.
       * @name Activity#bgImageFile
       * @type {string} */
      bgImageFile: null,
      /**
       * Whether to draw a border around the activity panel
       * @name Activity#border
       * @type {boolean} */
      border: true,
      /**
       * Whether to place the activity panel at the point specified by `absolutePosition` or leave
       * it centered on the main player's window.
       * @name Activity#absolutePositioned
       * @type {boolean} */
      absolutePositioned: false,
      /**
       * The position of the activity panel on the player.
       * @name Activity#absolutePosition
       * @type {AWT.Point} */
      absolutePosition: null,
      /**
       * Whether to generate usage reports
       * @name Activity#includeInReports
       * @type {boolean} */
      includeInReports: true,
      /**
       * Whether to send action events to the {@link Reporter}
       * @name Activity#reportActions
       * @type {boolean} */
      reportActions: false,
      /**
       * Whether to allow help about the activity or not.
       * @name Activity#helpWindow
       * @type {boolean} */
      helpWindow: false,
      /**
       * Whether to show the solution on the help window.
       * @name Activity#showSolution
       * @type {boolean} */
      showSolution: false,
      /**
       * Message to be shown in the help window when `showSolution` is `false`.
       * @name Activity#helpMsg
       * @type {string} */
      helpMsg: '',
      /**
       * Specific set of {@link EventSounds} used in the activity. The default is `null`, meaning
       * to use the default event sounds.
       * @name Activity#eventSounds
       * @type {EventSounds} */
      eventSounds: null,
      /**
       * Wheter the activity must be solved in a specific order or not.
       * @name Activity#useOrder
       * @type {boolean} */
      useOrder: false,
      /**
       * Wheter the cells of the activity will be dragged across the screen.
       * When `false`, a line will be painted to link elements.
       * @name Activity#dragCells
       * @type {boolean} */
      dragCells: false,
      /**
       * File name of the Skin used by the activity. The default value is `null`, meaning that the
       * activity will use the skin specified for the project.
       * @name Activity#skinFileName
       * @type {string} */
      skinFileName: null,
      /**
       * Maximum amount of time (seconds) to solve the activity. The default value is 0, meaning
       * unlimited time.
       * @name Activity#maxTime
       * @type {number}*/
      maxTime: 0,
      /**
       * Whether the time counter should display a countdown when `maxTime > 0`
       * @name Activity#countDownTime
       * @type {boolean} */
      countDownTime: false,
      /**
       * Maximum number of actions allowed to solve the activity. The default value is 0, meaning
       * unlimited actions.
       * @name Activity#maxActions
       * @type {number}*/
      maxActions: 0,
      /**
       * Whether the actions counter should display a countdown when `maxActions > 0`
       * @name Activity#countDownActions
       * @type {boolean} */
      countDownActions: false,
      /**
       * URL to be launched when the user clicks on the 'info' button. Default is `null`.
       * @name Activity#infoUrl
       * @type {string} */
      infoUrl: null,
      /**
       * System command to be launched when the user clicks on the 'info' button. Default is `null`.
       * Important: this parameter is currently not being used
       * @name Activity#infoCmd
       * @type {string} */
      infoCmd: null,
      /**
       * The content of the initial, final, previous and error messages shown by the activity.
       * @name Activity#messages
       * @type {ActiveBoxContent[]} */
      messages: null,
      /**
       * Preferred dimension of the activity window
       * @name Activity#windowSize
       * @type {AWT.Dimension} */
      windowSize: new AWT.Dimension(K.DEFAULT_WIDTH, K.DEFAULT_HEIGHT),
      /**
       * Whether the activity window has transparent background.
       * @name Activity#transparentBg
       * @type {boolean} */
      transparentBg: false,
      /**
       * The background color of the activity
       * @name Activity#activityBgColor
       * @type {string} */
      activityBgColor: K.DEFAULT_BG_COLOR,
      /**
       * Gradient used to draw backgrounds inside the activity.
       * @name Activity#activityBgGradient
       * @type {AWT.Gradient} */
      activityBgGradient: null,
      /**
       * Whether to display or not the 'time' counter
       * @name Activity#bTimeCounter
       * @type {boolean} */
      bTimeCounter: true,
      /**
       * Whether to display or not the 'score' counter
       * @name Activity#bScoreCounter
       * @type {boolean} */
      bScoreCounter: true,
      /**
       * Whether to display or not the 'actions' counter
       * @name Activity#bActionsCounter
       * @type {boolean} */
      bActionsCounter: true,
      /**
       * Special object used to generate random content at the start of the activity
       * @name Activity#acp
       * @type {AutoContentProvider} */
      acp: null,
      //
      // Fields used only in certain activity types
      // ------------------------------------------
      //
      /**
       * Array of bags with the description of the content to be displayed on panels and cells.
       * @name Activity#abc
       * @type {ActiveBagContent[]} */
      abc: null,
      /**
       * Content of the grid of letters used in crosswords and scrambled letters
       * @name Activity#tgc
       * @type {TextGridContent} */
      tgc: null,
      /**
       * The main document used in text activities
       * @name Activity#document
       * @type {TextActivityDocument} */
      document: null,
      /**
       * Relative position of the text grid (uses the same position codes as box grids)
       * @name Activity#boxGridPos
       * @type {string} */
      boxGridPos: 'AB',
      /**
       * Number of times to shuffle the cells at the beginning of the activity
       * @name Activity#shuffles
       * @type {number} */
      shuffles: K.DEFAULT_SHUFFLES,
      /**
       * @typedef Activity~scrambleType
       * @type {object}
       * @property {boolean} primary
       * @property {boolean} secondary */
      /**
       * Object that indicates if box grids A and B must be scrambled.
       * @name Activity#scramble
       * @type {Activity~scrambleType} */
      scramble: { primary: true, secondary: true },
      /**
       * Flag to indicate "inverse resolution" in complex associations
       * @name Activity#invAss
       * @type {boolean} */
      invAss: false,
      /**
       * Array of menu elements, used in activities of type {@link Menu}
       * @name Activity#menuElements
       * @type {array} */
      menuElements: null,
    });

    /**
     * This object is responsible for rendering the contents of the activity on the screen and
     * managing user's interaction.
     * Each type of Activity must implement its own `ActivityPanel`.
     * In JClic, {@link http://projectestac.github.io/jclic/apidoc/edu/xtec/jclic/Activity.Panel.html Activity.Panel}
     * extends {@link http://docs.oracle.com/javase/7/docs/api/javax/swing/JPanel.html javax.swing.JPanel}.
     * In this implementation, the JPanel will be replaced by an HTML `div` tag.
     * @class
     * @extends AWT.Container
     */
    class ActivityPanel extends AWT.Container {
      /**
       * ActivityPanel constructor
       * @param {Activity} act - The {@link Activity} to which this Panel belongs
       * @param {JClicPlayer} ps - Any object implementing the methods defined in the
       * {@link http://projectestac.github.io/jclic/apidoc/edu/xtec/jclic/PlayStation.html PlayStation}
       * Java interface.
       * @param {external:jQuery=} div - The DOM element where this Panel will deploy
       */
      constructor(act, ps, div) {
        // ActivityPanel extends AWT.Container
        super();
        this.act = act;
        this.ps = ps;
        this.minimumSize = new AWT.Dimension(100, 100);
        this.preferredSize = new AWT.Dimension(500, 400);
        this.div = div || Utils.HTML.div(null, 'JClicActivity', null, { 'aria-label': ps.getMsg('Activity panel') });
        this.accessibleCanvas = Utils.settings.CANVAS_HITREGIONS;
        this.act.initAutoContentProvider();
      }

      /**
       * Sets the size and position of this activity panel
       * @param {AWT.Rectangle} rect
       */
      setBounds(rect) {
        this.pos.x = rect.pos.x;
        this.pos.y = rect.pos.y;
        this.dim.width = rect.dim.width;
        this.dim.height = rect.dim.height;

        this.invalidate(rect);
        Utils.HTML.css(this.div, {
          position: 'relative',
          left: rect.pos.x,
          top: rect.pos.y,
          width: rect.dim.width,
          height: rect.dim.height,
        });
      }

      /**
       * Prepares the visual components of the activity
       */
      buildVisualComponents() {
        this.playing = false;
        this.skin = null;
        if (this.act.skinFileName && this.act.skinFileName.length > 0 && this.act.skinFileName !== this.act.project.settings.skinFileName)
          this.skin = this.act.project.mediaBag.getSkinElement(this.act.skinFileName, this.ps);

        this.bgImage = null;
        if (this.act.bgImageFile && this.act.bgImageFile.length > 0) {
          const mbe = this.act.project.mediaBag.getElement(this.act.bgImageFile, true);
          if (mbe)
            this.bgImage = mbe.data;
        }

        this.backgroundColor = this.act.activityBgColor;

        if (this.act.transparentBg)
          this.backgroundTransparent = true;

        // TODO: fix bevel-border type
        if (this.act.border)
          this.border = true;

        const cssAct = {
          display: 'block',
          'background-color': this.backgroundTransparent ? 'transparent' : this.backgroundColor
        };

        // Border shadow style Material Design, inspired in [http://codepen.io/Stenvh/pen/EaeWqW]
        if (this.border) {
          cssAct['box-shadow'] = '0 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12)';
          cssAct['border-radius'] = '2px';
          cssAct['color'] = '#272727';
        }

        if (this.act.activityBgGradient)
          cssAct['background-image'] = this.act.activityBgGradient.getCss();

        Utils.HTML.css(this.div, cssAct);
      }

      /**
       * Activities should implement this method to update the graphic content of its panel. The method
       * will be called from {@link AWT.Container#update} when needed.
       * @param {AWT.Rectangle} dirtyRegion - Specifies the area to be updated. When `null`,
       * it's the whole panel.
       */
      updateContent(dirtyRegion) {
        // To be overridden by subclasses. Here does nothing.
        return super.updateContent(dirtyRegion);
      }

      /**
       * Plays the specified event sound
       * @param {string} event - The type of event to be performed
       */
      playEvent(event) {
        this.act.eventSounds.play(event);
      }

      /**
       * Basic initialization procedure, common to all activities.
       */
      initActivity() {
        if (this.playing) {
          this.playing = false;
          this.ps.reportEndActivity(this.act, this.solved);
        }
        this.solved = false;
        this.ps.reportNewActivity(this.act, 0);
        this.attachEvents();
        this.enableCounters();
      }

      /**
       * Called when the activity starts playing
       */
      startActivity() {
        this.playing = true;
      }

      /**
       * Called by {@link JClicPlayer} when this activity panel is fully visible, just after the
       * initialization process.
       */
      activityReady() {
        // To be overrided by subclasses
      }

      /**
       * Displays help about the activity
       */
      showHelp() {
        // To be overrided by subclasses
      }

      /**
       * Sets the real dimension of this ActivityPanel.
       * @param {AWT.Dimension} maxSize - The maximum surface available for the activity panel
       * @returns {AWT.Dimension}
       */
      setDimension(maxSize) {
        return new AWT.Dimension(
          Math.min(maxSize.width, this.act.windowSize.width),
          Math.min(maxSize.height, this.act.windowSize.height));
      }

      /**
       * Attaches the events specified in the `events` member to the `div` member
       */
      attachEvents() {
        this.events.forEach(ev => this.attachEvent(this.div, ev));
        // Prepare handler to check if we are in a touch device
        if (!K.TOUCH_DEVICE && !this.events.includes(TOUCH_TEST_EVENT))
          this.attachEvent(this.div, TOUCH_TEST_EVENT);
      }

      /**
       * Attaches a single event to the specified object
       * @param {external:EventTarget} obj - The object to which the event will be attached
       * @param {string} evt - The event name
       */
      attachEvent(obj, evt) {
        const handler = event => {
          if (event.type === TOUCH_TEST_EVENT) {
            if (!K.TOUCH_DEVICE)
              K.TOUCH_DEVICE = true;
            if (!this.events.includes(TOUCH_TEST_EVENT)) {
              // Disconnect handler
              obj.removeEventListener(evt, handler);
              return;
            }
          }
          return event.data.processEvent.call(event.data, event);
        };
        obj.addEventListener(evt, handler);
      }

      /**
       * Main handler used to process mouse, touch, keyboard and edit events.
       * @param {HTMLEvent} event - The HTML event to be processed
       * @returns {boolean=} - When this event handler returns `false`, jQuery will stop its
       * propagation through the DOM tree. See: {@link http://api.jquery.com/on}
       */
      processEvent(_event) {
        return false;
      }

      /**
       * Fits the panel within the `proposed` rectangle. The panel can occupy more space, but always
       * not surpassing the `bounds` rectangle.
       * @param {AWT.Rectangle} proposed - The proposed rectangle
       * @param {AWT.Rectangle} bounds - The maximum allowed bounds
       */
      fitTo(proposed, bounds) {
        const origin = new AWT.Point();
        if (this.act.absolutePositioned && this.act.absolutePosition !== null) {
          origin.x = Math.max(0, this.act.absolutePosition.x + proposed.pos.x);
          origin.y = Math.max(0, this.act.absolutePosition.y + proposed.pos.y);
          proposed.dim.width -= this.act.absolutePosition.x;
          proposed.dim.height -= this.act.absolutePosition.y;
        }
        const d = this.setDimension(new AWT.Dimension(
          Math.max(2 * this.act.margin + Utils.settings.MINIMUM_WIDTH, proposed.dim.width),
          Math.max(2 * this.act.margin + Utils.settings.MINIMUM_HEIGHT, proposed.dim.height)));
        if (!this.act.absolutePositioned) {
          origin.moveTo(
            Math.max(0, proposed.pos.x + (proposed.dim.width - d.width) / 2),
            Math.max(0, proposed.pos.y + (proposed.dim.height - d.height) / 2));
        }
        if (origin.x + d.width > bounds.dim.width)
          origin.x = Math.max(0, bounds.dim.width - d.width);
        if (origin.y + d.height > bounds.dim.height)
          origin.y = Math.max(0, bounds.dim.height - d.height);
        this.setBounds(new AWT.Rectangle(origin.x, origin.y, d.width, d.height));

        // Build accessible components at the end of current tree
        window.setTimeout(() => this.buildAccessibleComponents(), 0);
      }

      /**
       * 
       * Builds the accessible components needed for this ActivityPanel
       * This method is called when all main elements are placed and visible, when the activity is ready
       * to start or when resized.
       */
      buildAccessibleComponents() {
        // Clear existing elements
        if (this.accessibleCanvas && this.canvas && this.canvas.children().length > 0) {
          this.canvas.get(-1).getContext('2d').clearHitRegions();
          this.canvas.empty();
        }
        // Create accessible elements in subclasses
      }

      /**
       *  Forces the ending of the activity.
       */
      forceFinishActivity() {
        // to be overrided by subclasses
      }

      /**
       * Ordinary ending of the activity, usually called form `processEvent`
       * @param {boolean} result - `true` if the activity was successfully completed, `false` otherwise
       */
      finishActivity(result) {
        this.playing = false;
        this.solved = result;

        if (this.bc !== null)
          this.bc.end();

        if (result) {
          this.setAndPlayMsg('final', 'finishedOk');
        } else {
          this.setAndPlayMsg('finalError', 'finishedError');
        }
        this.ps.activityFinished(this.solved);
        this.ps.reportEndActivity(this.act, this.solved);
      }

      /**
       * Sets the message to be displayed in the skin message box and optionally plays a sound event.
       * @param {string} msgCode - Type of message (initial, final, finalError...)
       * @param {string=} eventSoundsCode - Optional name of the event sound to be played.
       */
      setAndPlayMsg(msgCode, eventSoundsCode) {
        const msg = this.act.messages[msgCode] || null;
        this.ps.setMsg(msg);
        if (msg === null || msg.mediaContent === null)
          this.playEvent(eventSoundsCode);
      }

      /**
       * Ends the activity
       */
      end() {
        this.forceFinishActivity();
        if (this.playing) {
          if (this.bc !== null)
            this.bc.end();
          this.ps.reportEndActivity(this.act, this.solved);
          this.playing = false;
          this.solved = false;
        }
        this.clear();
      }

      /**
       * Miscellaneous cleaning operations
       */
      clear() {
        // to be overridden by subclasses
      }

      /**
       * Enables or disables the three counters (time, score and actions)
       * @param {boolean} eTime - Whether to enable or disable the time counter
       * @param {boolean} eScore - Whether to enable or disable the score counter
       * @param {boolean} eActions - Whether to enable or disable the actions counter
       */
      enableCounters(eTime, eScore, eActions) {
        if (typeof eTime === 'undefined')
          eTime = this.act.bTimeCounter;
        if (typeof eScore === 'undefined')
          eScore = this.act.bScoreCounter;
        if (typeof eActions === 'undefined')
          eActions = this.act.bActionsCounter;

        this.ps.setCounterEnabled('time', eTime);
        if (this.act.countDownTime)
          this.ps.setCountDown('time', this.act.maxTime);
        this.ps.setCounterEnabled('score', eScore);
        this.ps.setCounterEnabled('actions', eActions);
        if (this.act.countDownActions)
          this.ps.setCountDown('actions', this.act.maxActions);
      }

      /**
       * Shuffles the contents of the activity
       * @param {ActiveBoxBag[]} bg - The sets of boxes to be shuffled
       * @param {boolean} visible - The shuffle process must be animated on the screen (not yet implemented!)
       * @param {boolean} fitInArea - Shuffled pieces cannot go out of the current area
       */
      shuffle(bg, visible, fitInArea) {
        const steps = this.act.shuffles;
        let i = steps;
        while (i > 0) {
          const k = i > steps ? steps : i;
          bg.forEach(abb => { if (abb) abb.scrambleCells(k, fitInArea); });
          i -= steps;
        }
      }
    }

    Object.assign(ActivityPanel.prototype, {
      /**
       * The Activity this panel is related to
       * @name ActivityPanel#act
       * @type {Activity} */
      act: null,
      /**
       * The div element used by this panel
       * @name ActivityPanel#div
       * @type {external:HTMLElement} */
      div: null,
      /**
       * The main canvas element used by this panel
       * @name ActivityPanel#canvas
       * @type {external:HTMLElement} */
      canvas: null,
      /**
       * True when the navigator implements canvas hit regions
       * See: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Hit_regions_and_accessibility
       * @name ActivityPanel#accessibleCanvas
       * @type {boolean}
       */
      accessibleCanvas: false,
      /**
       * The realized current {@link Skin}
       * @name ActivityPanel#skin
       * @type {Skin} */
      skin: null,
      /**
       * Background element (currently a `span`) used to place animated GIFs when needed
       * @name ActivityPanel#animatedBg
       * @type {external:HTMLElement} */
      animatedBg: null,
      /**
       * Additional background element for animated GIFs, used in associations
       * @name ActivityPanel#animatedBgB
       * @type {external:HTMLElement} */
      animatedBgB: null,
      /**
       * `true` when the activity is solved, `false` otherwise
       * @name ActivityPanel#solved
       * @type {boolean} */
      solved: false,
      /**
       * The realized image used as a background
       * @name ActivityPanel#bgImage
       * @type {external:HTMLImageElement} */
      bgImage: null,
      /**
       * `true` while the activity is playing
       * @name ActivityPanel#playing
       * @type {boolean} */
      playing: false,
      /**
       * `true` if the activity is running for first time (not due to a click on the `replay` button)
       * @name ActivityPanel#firstRun
       * @type {boolean} */
      firstRun: true,
      /**
       * Currently selected item. Used in some types of activities.
       * @name ActivityPanel#currentItem
       * @type {number} */
      currentItem: 0,
      /**
       * The object used to connect cells and other elements in some types of activity
       * @name ActivityPanel#bc
       * @type {BoxConnector} */
      bc: null,
      /**
       * The PlayStation used to realize media objects and communicate with the player services
       * (usually a {@link JClicPlayer}
       * @name ActivityPanel#ps
       * @type {PlayStation} */
      ps: null,
      /**
       * The minimum size of this kind of ActivityPanel
       * @name ActivityPanel#minimumSize
       * @type {AWT.Dimension} */
      minimumSize: null,
      /**
       * The preferred size of this kind of ActivityPanel
       * @name ActivityPanel#preferredSize
       * @type {AWT.Dimension} */
      preferredSize: null,
      /**
       * List of events intercepted by this ActivityPanel. Current events are: 'keydown', 'keyup',
       * 'keypress', 'mousedown', 'mouseup', 'click', 'dblclick', 'mousemove', 'mouseenter',
       * 'mouseleave', 'mouseover', 'mouseout', 'touchstart', 'touchend', 'touchmove' and 'touchcancel'.
       * @name ActivityPanel#events
       * @type {string[]} */
      events: ['click'],
      backgroundColor: null,
      backgroundTransparent: false,
      border: null,
    });

    /**
     * The panel class associated to each type of activity
     * @type {class} */
    Activity.Panel = ActivityPanel;

    return Activity;
  });
