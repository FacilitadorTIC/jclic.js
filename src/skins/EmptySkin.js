/**
 *  File    : skins/EmptySkin.js
 *  Created : 14/03/2017
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
  "./Skin",
  "../boxes/ActiveBox"
], function (Skin, ActiveBox) {

  /**
   * A minimalist {@link Skin} for JClic.js with just the player, without messages, counters nor any button.
   * @exports EmptySkin
   * @class
   * @extends Skin
   */
  class EmptySkin extends Skin {

    /**
     * EmptySkin constructor
     *
     * @param {PlayStation} ps - The PlayStation (currently a {@link JClicPlayer}) used to load and
     * realize the media objects needed tot build the Skin.
     * @param {string=} name - The skin class name
     * @param {object=} options - Optional parameter with additional options
     */
    constructor(ps, name = null, options = {}) {
      // EmptySkin extends [Skin](Skin.html)
      super(ps, name, options)
      this.msgBox = new ActiveBox()
      this.msgBox.role = 'message'
    }

    /**
     * Returns the CSS styles used by this skin. This method should be called only from
     * the `Skin` constructor, and overridded by subclasses if needed.
     * @param {string} media - A specific media size. Possible values are: 'default', 'half' and 'twoThirds'
     * @returns {string}
     */
    _getStyleSheets(media = 'default') {
      return super._getStyleSheets(media) + (media === 'default' ? this.mainCSS : '')
    }

  }

  Object.assign(EmptySkin.prototype, {
    /**
     * Class name of this skin. It will be used as a base selector in the definition of all CSS styles.
     * @name EmptySkin#skinId
     * @override
     * @type {string} */
    skinId: 'JClicEmptySkin',
    /**
     * Styles used in this skin
     * @name EmptySkin#skinCSS
     * @override
     * @type {string} */
    mainCSS: '.ID .JClicPlayerCnt {margin:0;}'
  })

  // Register this class in the list of available skins
  Skin.CLASSES['empty'] = EmptySkin

  return EmptySkin
})
