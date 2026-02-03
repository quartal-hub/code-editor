// @ts-check

/**
 * @implements {BeforeCalcScripts}
 */
class beforeCalcs {
  
  /**
   * Provides a way to modify the entire collection of rows, e.g. to add a row of a specific type if not present.
   * @param {UserDefinedRow[]} rows The current rows of the calculation
   * @returns {UserDefinedRow[]} The new rows for the calculation after changes by the script.
   */
  getRows(rows) {
    if (!rows.find(r => r.rowType === 'monthlySalary')) {
      rows.push({rowType: "monthlySalary", count: 1, price: 3500, })
    }
    return rows;
  }

}