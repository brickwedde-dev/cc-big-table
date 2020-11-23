class CcBigTable extends HTMLElement {
  constructor() {
    super();

    this.lineHeight = 25;
    this.data = [];

    this.headerDef = {
      cols : [],
    };
  }

  cellrenderer (rowelem, colelem, datacol, datarow, uiRowIndex, uiColIndex) {
    colelem.innerText = datacol ? datacol : "";
  }

  connectedCallback() {
    switch (this.style.position) {
      case "absolute":
      case "relative":
        break;
      default:
        this.style.position = "relative";
        break;
    }

    this.headerheight = 25;

    this.scrollarea = document.createElement("div");
    this.scrollarea.style.position = "absolute";
    this.scrollarea.style.top = "0px";
    this.scrollarea.style.left = "0px";
    this.scrollarea.style.right = "0px";
    this.scrollarea.style.bottom = "0px";
    this.scrollarea.style.overflow = "auto";
    this.appendChild(this.scrollarea);

    this.scrollarea.addEventListener("scroll", () => {
      this.fillRows ();
    });

    this.fillRows ();
  }

  fillRows () {
    var uiTop = this.scrollarea.scrollTop;
    var uiLeft = this.scrollarea.scrollLeft;
    var uiBottom = uiTop + this.scrollarea.offsetHeight;
    var uiRight = uiLeft + this.scrollarea.offsetWidth;
    var uiTopCount = 0;
    var uiFixedTopCount = uiTop;

    var uiTableWidth = 0;
    for(var uiColIndex = 0; uiColIndex < this.headerDef.cols.length; uiColIndex++) {
      var coldef = this.headerDef.cols[uiColIndex];
      var width = 200;
      if (coldef instanceof CcBigTableDataCol) {
        if (coldef.getHidden()) {
          continue;
        }
        width = coldef.getWidth();
      } else {
        continue;
      }
      uiTableWidth += width;
    }

    var lastPixel = this.scrollarea.querySelector("cc-big-table-lastpixel");

    var aRows = Array.from(this.scrollarea.querySelectorAll("cc-big-table-row") || []);
    var aRowsIndex = -1;

    var aFixed = [];

    for(var uiRowIndex = 0; uiRowIndex < this.data.length; uiRowIndex++) {
      var datarow = this.data[uiRowIndex];
      if (!datarow instanceof CcBigTableDataRow) {
        continue;
      }
      if (datarow.getHidden()) {
        continue;
      }
      var height = datarow.getHeight();
      var fixed = datarow.getFixed();

      if (uiTopCount > uiBottom) {
        uiTopCount += height;
        continue;
      }

      var uiRowTop;
      if (fixed) {
        uiRowTop = uiFixedTopCount;
      } else {
        if (uiTopCount + height < uiTop) {
          uiTopCount += height;
          continue;
        }
        uiRowTop = uiTopCount;
      }

      var rowelem = null;
      if (aRowsIndex + 1 < aRows.length) {
        aRowsIndex++;
        rowelem = aRows[aRowsIndex];
      }
      if (!rowelem) {
        rowelem = new CcBigTableRow ();
        this.scrollarea.appendChild(rowelem);
      }

      if (fixed) {
        aFixed.push(rowelem);
      } else {
        rowelem.style.backgroundColor = "";
      }

      rowelem.style.position = "absolute";
      rowelem.style.left = "0px";
      rowelem.style.width = uiTableWidth + "px";
      rowelem.style.height = height + "px";
      rowelem.style.top = uiRowTop + "px";
      uiTopCount += height;
      uiFixedTopCount += height;

      rowelem.fillCols(this.cellrenderer, uiRowIndex, datarow, this.headerDef, uiLeft, uiRight);
    }

    aRowsIndex++;
    for (;aRowsIndex < aRows.length; aRowsIndex++) {
      aRows[aRowsIndex].parentNode.removeChild(aRows[aRowsIndex]);
    }

    if (!lastPixel) {
      lastPixel = document.createElement("cc-big-table-lastpixel");
      this.scrollarea.appendChild(lastPixel);
    }
    lastPixel.style.top = uiTopCount + "px";
    lastPixel.style.left = uiTableWidth + "px";

    for(var i = 0; i < aFixed.length; i++) {
      this.scrollarea.appendChild(aFixed[i]);
    }
  }
}

class CcBigTableDataRow {
  constructor (hidden, fixed, height) {
    this.hidden = hidden;
    this.fixed = fixed;
    this.height = height;
  }
  getHidden() {
    return this.hidden;
  }

  getFixed() {
    return this.fixed;
  }

  getHeight() {
    return this.height;
  }
}

class CcBigTableDataCol {
  constructor (hidden, fixed, width) {
    this.hidden = hidden;
    this.fixed = fixed;
    this.width = width;
  }

  getHidden() {
    return this.hidden;
  }

  getFixed() {
    return this.fixed;
  }

  getWidth() {
    return this.width;
  }
}

class CcBigTableRow extends HTMLElement {
  constructor() {
    super();
    this.style.boxSizing = "border-box";
  }

  fillCols(cellrenderer, uiRowIndex, datarow, headerDef, uiLeft, uiRight) {
    var aCols = this.querySelectorAll("cc-big-table-cell") || [];
    var aColsIndex = -1;
    var uiLeftCount = 0;
    var uiFixedLeftCount = uiLeft;
    var aFixed = [];

    for(var uiColIndex = 0; uiColIndex < headerDef.cols.length; uiColIndex++) {
      if (uiLeftCount > uiRight) {
        break;
      }

      var coldef = headerDef.cols[uiColIndex];
      if (!coldef instanceof CcBigTableDataCol) {
        continue;
      }
      if (coldef.getHidden()) {
        continue;
      }
      var width = coldef.getWidth();
      var fixed = coldef.getFixed();

      var uiColLeft;
      if (fixed) {
        uiColLeft = uiFixedLeftCount;
      } else {
        if (uiLeftCount + width < uiLeft) {
          uiLeftCount += width;
          continue;
        }
        uiColLeft = uiLeftCount;
      }

      var colelem = null;
      if (aColsIndex + 1 < aCols.length) {
        aColsIndex++;
        colelem = aCols[aColsIndex];
      }
      if (!colelem) {
        colelem = new CcBigTableCell ();
        this.appendChild(colelem);
      }

      if (fixed) {
        aFixed.push (colelem);
      } else {
        colelem.style.backgroundColor = "";
      }
      colelem.style.overflow = "hidden";
      colelem.style.left = uiColLeft + "px";
      colelem.style.position = "absolute";
      colelem.style.width = width + "px";
      colelem.style.height = "100%";
      colelem.style.top = "0px";
      uiLeftCount += width;
      uiFixedLeftCount += width;

      var datacol = (datarow && datarow.coldata) ? datarow.coldata[uiColIndex] : null;
      cellrenderer (this, colelem, datacol, datarow, uiRowIndex, uiColIndex);
    }

    aColsIndex++;
    for (;aColsIndex < aCols.length; aColsIndex++) {
      aCols[aColsIndex].parentNode.removeChild(aCols[aColsIndex]);
    }

    for(var i = 0; i < aFixed.length; i++) {
      this.appendChild(aFixed[i]);
    }
  }
}

class CcBigTableCell extends HTMLElement {
  constructor() {
    super();
    this.style.boxSizing = "border-box";
  }
}

class CcBigTableLastPixel extends HTMLElement {
  connectedCallback () {
    this.style.position = "absolute";
    this.style.height = "1px";
    this.style.width = "1px";
  }
}

window.customElements.define("cc-big-table", CcBigTable);
window.customElements.define("cc-big-table-row", CcBigTableRow);
window.customElements.define("cc-big-table-cell", CcBigTableCell);
window.customElements.define("cc-big-table-lastpixel", CcBigTableLastPixel);
