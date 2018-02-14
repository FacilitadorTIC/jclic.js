/**
 *  File    : skins/OrangeSkin.js
 *  Created : 04/07/2016
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
  "jquery",
  "./Skin",
  "./DefaultSkin"
], function ($, Skin, DefaultSkin) {

  /**
   * This is a variant of the default {@link Skin} used by JClic.js
   * It differs from {@link DefaultSkin} only in some colors
   * @exports OrangeSkin
   * @class
   * @extends DefaultSkin
   */
  class OrangeSkin extends DefaultSkin {
    /**
     * OrangeSkin constructor
     * @param {PlayStation} ps - The PlayStation (currently a {@link JClicPlayer}) used to load and
     * realize the media objects meeded tot build the Skin.
     * @param {string=} name - The skin class name
     * @param {object=} options - Optional parameter with additional options
     */
    constructor(ps, name = null, options = {}) {
      // OrangeSkin extends [DefaultSkin](DefaultSkin.html)
      super(ps, name, options)
    }

    /**
     *
     * Returns the CSS styles used by this skin. This method should be called only from
     * `Skin` constructor, and overridden by subclasses if needed.
     * @override
     * @returns {string}
     */
    _getStyleSheets() {
      return super._getStyleSheets() + this.skinCSS
    }
  }

  Object.assign(OrangeSkin.prototype, {
    /**
     * Class name of this skin. It will be used as a base selector in the definition of all CSS styles.
     * @name OrangeSkin#skinId
     * @override
     * @type {string} */
    skinId: 'JClicOrangeSkin',
    /**
     * Styles used in this skin
     * @name OrangeSkin#skinCSS
     * @type {string} */
    skinCSS: '.SKINID {background-color:#FF8B19;}'
  })

  // Register this class in the list of available skins
  Skin.CLASSES['orange'] = OrangeSkin

  return OrangeSkin
})
