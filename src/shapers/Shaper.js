/**
 *  File    : shapers/Shaper.js
 *  Created : 13/04/2015
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
  "../Utils",
  "../AWT"
], function (Utils, AWT) {

  /**
   * The function of this class and its subclasses is to draw a set of "shapes" that will be used to
   * place {@link ActiveBox} objects at a specific position, and to determine its dimension and
   * appearance.
   * @exports Shaper
   * @class
   */
  class Shaper {
    /**
     * Shaper constructor
     * @param {number} nx - Number of columns (in grid-based shapers)
     * @param {number} ny - Number of rows (in grid-based shapers)
     */
    constructor(nx, ny) {
      this.reset(nx, ny);
    }

    /**
     * Factory constructor that returns a Shaper of the requested class.
     * @param {string} className - The class name of the requested Shaper.
     * @param {number} nx - Number of columns (in grid-based shapers)
     * @param {number} ny - Number of rows (in grid-based shapers)
     * @returns {Shaper}
     */
    static getShaper(className, nx, ny) {
      const cl = Shaper.CLASSES[(className || '').replace(/^edu\.xtec\.jclic\.shapers\./, '@')];
      if (!cl)
        Utils.log('error', `Unknown shaper: ${className}`);
      return cl ? new cl(nx, ny) : null;
    }

    /**
     * Initializes this Shaper to default values
     * @param {number} nCols - Number of columns
     * @param {number} nRows - Number of rows
     */
    reset(nCols, nRows) {
      this.nCols = nCols;
      this.nRows = nRows;
      this.nCells = nRows * nCols;
      this.initiated = false;
      this.shapeData = [];
      for (let i = 0; i < this.nCells; i++)
        this.shapeData[i] = new AWT.Shape();
    }

    /**
     * Loads this shaper settings from a specific JQuery XML element
     * @param {external:Element} xml - The XML element with the shaper data
     */
    setProperties(xml) {
      Utils.attrForEach(xml.attributes, (name, value) => {
        switch (name) {
          case 'class':
            this.className = value;
            break;
          case 'cols':
            this.nCols = Number(value);
            break;
          case 'rows':
            this.nRows = Number(value);
            break;
          case 'baseWidthFactor':
          case 'toothHeightFactor':
          case 'scaleX':
          case 'scaleY':
            this[name] = Number(value);
            break;
          case 'randomLines':
          case 'showEnclosure':
            this[name] = Utils.getBoolean(value, true);
            break;
        }
      });

      // Reads the 'enclosing'
      // (main shape area where the other shape elements are placed)
      const shape = xml.querySelector('shaper > enclosing > shape');
      if (shape) {
        let sh = Shaper.readShapeData(shape, this.scaleX, this.scaleY);
        this.enclosing = sh;
        this.showEnclosure = true;
        this.hasRemainder = true;
      }

      // Read the shape elements
      xml.querySelectorAll('shaper > shape').forEach((child, n) => {
        this.shapeData[n] = Shaper.readShapeData(child, this.scaleX, this.scaleY);
      });

      // Correction needed for '@Holes' shaper
      if (this.shapeData.length > 0) {
        this.nCells = this.shapeData.length;
      }
      return this;
    }

    /**
     * Reads an individual shape from an XML element.
     * Shapes are arrays of `stroke` objects.
     * Each `stroke` has an `action` (_move to_, _line to_, _quad to_...) and associated `data`.
     * @param {external:Element} xml - The XML element with the shape data
     * @param {number} scaleX
     * @param {number} scaleY
     * @returns {AWT.Shape}
     */
    static readShapeData(xml, scaleX, scaleY) {
      const shd = [];
      let result = null;

      xml.innerHTML.split('|').forEach(txt => {
        const sd = txt.split(':');
        // Possible strokes are: `rectangle`, `ellipse`, `M`, `L`, `Q`, `B`, `X`
        // Also possible, but not currently used in JClic: `roundRectangle` and `pie`
        let data = sd.length > 1 ? sd[1].split(',') : null;
        //
        // Data should be always divided by the scale (X or Y)
        if (data)
          data = data.map((d, n) => d / (n % 2 ? scaleY : scaleX));

        switch (sd[0]) {
          case 'rectangle':
            result = new AWT.Rectangle(data[0], data[1], data[2], data[3]);
            break;
          case 'ellipse':
            result = new AWT.Ellipse(data[0], data[1], data[2], data[3]);
            break;
          default:
            // It's an `AWT.PathStroke`
            shd.push(new AWT.PathStroke(sd[0], data));
            break;
        }
      });

      return !result && shd.length > 0 ? new AWT.Path(shd) : result;
    }

    /**
     * Builds the individual shapes that will form this Shaper
     */
    buildShapes() {
    }

    /**
     * Gets a clone of the nth Shape object, scaled and located inside a Rectangle
     * @param {number} n
     * @param {AWT.Rectangle} rect
     * @returns {AWT.Shape}
     */
    getShape(n, rect) {
      if (!this.initiated)
        this.buildShapes();
      if (n >= this.nCells || this.shapeData[n] === null)
        return null;
      return this.shapeData[n].getShape(rect);
    }

    /**
     * Gets the nth Shape data object
     * @param {number} n
     * @returns {object}
     */
    getShapeData(n) {
      return n >= 0 && n < this.shapeData.length ? this.shapeData[n] : null;
    }

    /**
     * Gets the AWT.Rectangle that contains all shapes of this Shaper.
     * @returns {AWT.Rectangle}
     */
    getEnclosingShapeData() {
      return new AWT.Rectangle(0, 0, 1, 1);
    }

    /**
     * When `hasRemainder` is true, this method gets the rectangle containing the full surface where
     * the Shaper develops.
     * @param {AWT.Rectangle} rect - The frame where to move and scale all the shapes
     * @returns {AWT.Rectangle}
     */
    getRemainderShape(rect) {
      if (!this.hasRemainder)
        return null;

      if (!this.initiated)
        this.buildShapes();

      const sh = this.getEnclosingShapeData();
      const r = sh ? sh.getShape(rect) : new AWT.Rectangle();
      for (let i = 0; i < this.nCells; i++) {
        if (this.shapeData[i])
          r.add(this.shapeData[i].getShape(rect), false);
      }
      return r;
    }
  }

  /**
   * List of known classes derived from Shaper. It should be filled by real shaper classes at
   * declaration time.
   * @type {object} */
  Shaper.CLASSES = {};

  Object.assign(Shaper.prototype, {
    /**
     * This shaper class name
     * @name Shaper#className
     * @type {string} */
    className: 'Shaper',
    /**
     * Number of columns (useful in grid-based shapers)
     * @name Shaper#nCols
     * @type {number} */
    nCols: 0,
    /**
     * Number of rows (useful in grid-based shapers)
     * @name Shaper#nRows
     * @type {number} */
    nRows: 0,
    /**
     * Number of cells managed by this shaper
     * @name Shaper#nCells
     * @type {number} */
    nCells: 0,
    /**
     * Contains the specific definition of each shape
     * @name Shaper#shapeData
     * @type {object} */
    shapeData: null,
    /**
     * Flag used to check if the `Shaper` has been initialized against a real surface
     * @name Shaper#initiated
     * @type {boolean} */
    initiated: false,
    //
    // Fields used only in JigSaw shapers
    /**
     * In {@link JigSaw}, ratio between the base width of the tooth and the total length of the side.
     * @name Shaper#baseWidthFactor
     * @type {number} */
    baseWidthFactor: 1.0 / 3,
    /**
     * In {@link JigSaw}, ratio between the tooth height and the total length of the side.
     * @name Shaper#toothHeightFactor
     * @type {number} */
    toothHeightFactor: 1.0 / 6,
    /**
     * In {@link JigSaw}, whether the tooths take random directions or not
     * @name Shaper#randomLines
     * @type {boolean} */
    randomLines: false,
    //
    // Fields used only in the `Holes` shaper
    /**
     * In {@link Holes}, scale to be applied to horizontal positions and lengths to achieve the real
     * value of the shape placed on a real surface.
     * @name Shaper#scaleX
     * @type {number} */
    scaleX: 1.0,
    /**
     * In {@link Holes}, scale to be applied to vertical positions and lengths to achieve the real
     * value of the shape placed on a real surface.
     * @name Shaper#scaleY
     * @type {number} */
    scaleY: 1.0,
    /**
     * In {@link Holes}, the enclosing area where all shapes are placed.
     * @name Shaper#enclosing
     * @type {AWT.Shape} */
    enclosing: null,
    /**
     * In {@link Holes}, when `true`, the enclosing area will be drawn
     * @name Shaper#showEnclosure
     * @type {boolean} */
    showEnclosure: false,
    /**
     * Flag indicating if this shaper organizes its cells in rows and columns
     * @name Shaper#rectangularShapes
     * @type {boolean} */
    rectangularShapes: false,
    /**
     * Flag indicating if this Shaper deploys over a surface biggest than the rectangle enclosing
     * all its shapes
     * @name Shaper#hasRemainder
     * @type {boolean} */
    hasRemainder: false,
  });

  return Shaper;
});
