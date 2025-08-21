class CcBigTable extends HTMLElement {
  constructor() {
    super();

    this.lineHeight = 25;
    this.data = [];

    this.headerDef = {
      cols : [],
    };

    var bound = this.resizehandler.bind(this);
    this.resizehandler = debounce(bound, 100);
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

    this.sortfieldNumerical = false;

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

    document.addEventListener('cc-divider-resize', this.resizehandler, false);
  }

  disconnectedCallback() {
    document.removeEventListener('cc-divider-resize', this.resizehandler, false);
  }

  resizehandler (e) {
    this.fillRows ();
  }

  fillAllRows() {
    this.fillRowsRange(0, 0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  }

  print() {
    this.fillAllRows();

    var mywindow = window.open('', 'PRINT', `height=${window.innerHeight},width=${window.innerWidth}`);

    mywindow.document.write('<html><head><title>' + document.title  + '</title><link rel="stylesheet" href="cc-material-helpers/material-components-web.css"><link rel="stylesheet" href="cc-material-helpers/materialicons.css"><style>');

    const oldsheets = Array.from(document.styleSheets)
    oldsheets.forEach(sheet => {
      console.error("Sheet", sheet);
      const newSheet = mywindow.document.createElement('style');
      newSheet.type="text/css";
      mywindow.document.querySelector('head').appendChild(newSheet);
      Array.from(sheet.cssRules).forEach(rule => {
        console.error(rule);
        mywindow.document.write(rule.cssText + "\r\n")
      })
    });

/*
    var oldstyles = Array.from(document.styleSheets)
    for(var oldstyle of oldstyles) {
      for(var oldRule of oldstyle.cssRules) {
        mywindow.document.write(oldRule.cssText + "\r\n")
      }
    }
*/
    mywindow.document.write('</style></head><body>');
    mywindow.document.write(this.scrollarea.innerHTML);
    mywindow.document.write('</body></html>');

    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10*/

//    mywindow.document.querySelector('body').innerHTML = this.scrollarea.innerHTML;

    setTimeout(() => {
      mywindow.print();
      mywindow.close();
    }, 100);
  }

  fillRows () {
    if (this.scrollarea) {
      var uiTop = this.scrollarea.scrollTop;
      var uiLeft = this.scrollarea.scrollLeft;
      var uiBottom = uiTop + this.scrollarea.offsetHeight;
      var uiRight = uiLeft + this.scrollarea.offsetWidth;
      this.fillRowsRange(uiTop, uiLeft, uiBottom, uiRight);
    }
  }

  fillRowsRange (uiTop, uiLeft, uiBottom, uiRight) {
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

      let rowelem = null;
      if (aRowsIndex + 1 < aRows.length) {
        aRowsIndex++;
        rowelem = aRows[aRowsIndex];
      }
      if (!rowelem) {
        rowelem = new CcBigTableRow ();
        rowelem.addEventListener("click", (e) => {
          this.rowClick(rowelem.uiRowIndex);
        });
        this.scrollarea.appendChild(rowelem);
      }

      rowelem.uiRowIndex = uiRowIndex;

      if (fixed) {
        aFixed.push(rowelem);
        rowelem.style.position = "sticky";
        rowelem.style.top = (uiRowTop - uiTop) + "px";
      } else {
        rowelem.style.backgroundColor = "";
        rowelem.style.position = "absolute";
        rowelem.style.top = (uiRowTop) + "px";
      }

      rowelem.style.display = "block";
      rowelem.style.left = "0px";
      rowelem.style.width = uiTableWidth + "px";
      rowelem.style.height = height + "px";
      uiTopCount += height;
      uiFixedTopCount += height;

      rowelem.fillCols(this, this.cellrenderer, uiRowIndex, datarow, this.headerDef, uiLeft, uiRight);
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

  scrollToRow (uiRow) {
    var uiTop = this.scrollarea.scrollTop;
    var uiHeight = this.scrollarea.offsetHeight;
    var uiBottom = uiTop + uiHeight;

    var uiTopCount = 0;

    for(var uiRowIndex = 0; uiRowIndex < this.data.length; uiRowIndex++) {
      var datarow = this.data[uiRowIndex];
      if (!datarow instanceof CcBigTableDataRow) {
        continue;
      }
      if (datarow.getHidden()) {
        continue;
      }

      var height = datarow.getHeight();
      uiTopCount += height;

      if (uiRowIndex == uiRow) {
        if (uiTopCount < uiTop + uiHeight / 4) {
          this.scrollarea.scrollTop = uiTopCount - uiHeight / 4;
        } else if (uiTopCount > uiBottom - uiHeight / 4) {
          this.scrollarea.scrollTop = uiTopCount - uiHeight * 3 / 4;
        }
        break;
      }
    }
  }

  rowClick(uiRowIndex) {
    var datarow = this.data[uiRowIndex];
    this.dispatchEvent(new CustomEvent("rowclick", {detail: datarow}));
    this.dispatchEvent(new CustomEvent("rowclick2", {detail: { datarow, rowindex: uiRowIndex} }));
  }

  setSortingAndEvent(coldef, setto) {
    for(var i = 0; i < this.headerDef.cols.length; i++) {
      this.headerDef.cols[i].activesorting = CcBigTableDataCol_Sorting_None;
    }
    coldef.activesorting = setto;
    this.applySorting();
  }

  applySorting() {
    var coldef = null;
    for(var i = 0; i < this.headerDef.cols.length; i++) {
      switch (this.headerDef.cols[i].activesorting) {
        case CcBigTableDataCol_Sorting_None:
          break;
        case CcBigTableDataCol_Sorting_Down:
        case CcBigTableDataCol_Sorting_Up:
          coldef = this.headerDef.cols[i];
          break;
      }
    }

    if (!coldef) {
      return;
    }

    var notcancelled = this.dispatchEvent(new CustomEvent("sorting", {detail:coldef, cancelable: true}));
    if (notcancelled) {
      this.sortfield = coldef.data;
      this.sortfieldSortType = coldef.sorttype;
      this.reverse = 1;
      switch(coldef.activesorting) {
        case CcBigTableDataCol_Sorting_Down:
          this.reverse = -1;
          break;
      }
      this.doSort()
    }
  }

  doSort() {
    var localcompare = new Intl.Collator("de", {sensitivity : "base"}).compare;

    this.data.sort((rowa, rowb) => {
      var a = rowa.data;
      var b = rowb.data;
      if (!a) {
        return -1;
      }
      if (!b) {
        return 1;
      }
      if (this.sortfieldSortType == CcBigTableDataCol_SortType_Numerical) {
        return (parseFloat(a[this.sortfield]) - parseFloat(b[this.sortfield])) * this.reverse;
      } else {
        if (a[this.sortfield] && b[this.sortfield]) {
          var i = localcompare (a[this.sortfield], b[this.sortfield]);
          if (i != 0) {
            return i * this.reverse;
          }
        }
        if (a[this.sortfield]) {
          return 1 * this.reverse;
        }
        if (b[this.sortfield]) {
          return -1 * this.reverse;
        }
        if (a["_id"] && b["_id"]) {
          return a["_id"].localeCompare(b["_id"]) * this.reverse;
        }
        return 0;
      }
    });
    this.fillRows();
  }
}

class CcBigTableDataRow {
  constructor (hidden, fixed, height, data) {
    this.hidden = hidden;
    this.fixed = fixed;
    this.height = height;
    this.data = data;
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

const CcBigTableDataCol_Sorting_None = 0;
const CcBigTableDataCol_Sorting_Up = 1;
const CcBigTableDataCol_Sorting_Down = 2;
const CcBigTableDataCol_Sorting_UpDown = 3;

const CcBigTableDataCol_SortType_String = 1;
const CcBigTableDataCol_SortType_Numerical = 2;

class CcBigTableDataCol {
  constructor (hidden, fixed, width, data, sorting, defaultsort, sorttype) {
    this.hidden = hidden;
    this.fixed = fixed;
    this.width = width;
    this.data = data;
    this.sorting = sorting || CcBigTableDataCol_Sorting_None;
    this.activesorting = (defaultsort === true) ? CcBigTableDataCol_Sorting_Up : CcBigTableDataCol_Sorting_None;
    this.sorttype = sorttype ? sorttype : CcBigTableDataCol_SortType_String;
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

  fillCols(bigtable, cellrenderer, uiRowIndex, datarow, headerDef, uiLeft, uiRight) {
    var aCols = this.querySelectorAll("cc-big-table-cell") || [];
    var aColsIndex = -1;
    var uiLeftCount = 0;
    var uiFixedLeftCount = 0;
    var aFixed = [];

    for(let uiColIndex = 0; uiColIndex < headerDef.cols.length; uiColIndex++) {
      if (uiLeftCount > uiRight) {
        break;
      }

      let coldef = headerDef.cols[uiColIndex];
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

      let colelem = null;
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
        colelem.style.display = "inline-block";
        colelem.style.position = "sticky";
        colelem.style.left = (uiFixedLeftCount) + "px";
        uiFixedLeftCount += width;
      } else {
        colelem.style.backgroundColor = "";
        colelem.style.position = "absolute";
      }
      colelem.style.overflow = "hidden";
      colelem.style.left = uiColLeft + "px";
      colelem.style.height = "100%";
      colelem.style.top = "0px";
      colelem.style.width = width + "px";

      uiLeftCount += width;

      var datacol = (datarow && datarow.coldata) ? datarow.coldata[uiColIndex] : null;
      cellrenderer (this, colelem, datacol, datarow, uiRowIndex, uiColIndex);

      if (uiRowIndex == 0 && (coldef.sorting & CcBigTableDataCol_Sorting_UpDown) != 0) {
        var sortingicon = document.createElement("i");
        sortingicon.style.right = "0px";
        sortingicon.style.position = "absolute";
        sortingicon.style.height = "100%";
        sortingicon.style.top = "0px";
        sortingicon.style.width = "20px";
        sortingicon.style.cursor = "pointer";
        sortingicon.style.fontSize = "17px";
        sortingicon.style.lineHeight = datarow.height + "px";
        sortingicon.className = "material-icons mdc-button__icon";
        let setto = CcBigTableDataCol_Sorting_None;
        switch (coldef.activesorting) {
          case CcBigTableDataCol_Sorting_Up:
            sortingicon.innerText = "north";
            setto = CcBigTableDataCol_Sorting_Down;
            break;
          case CcBigTableDataCol_Sorting_Down:
            sortingicon.innerText = "south";
            setto = CcBigTableDataCol_Sorting_Up;
            break;
          default:
          case CcBigTableDataCol_Sorting_None:
            sortingicon.innerText = "unfold_more";
            setto = CcBigTableDataCol_Sorting_Up;
            break;
        }
        sortingicon.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          bigtable.setSortingAndEvent(coldef, setto);
        });
        colelem.appendChild (sortingicon);
      }
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
