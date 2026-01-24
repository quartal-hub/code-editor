class s {
  /**
   * Gets all rows matching the row type selector.
   *
   * @param rowType - The row type selector:
   *
   * 1. A string or CalculationRowType matching to rowType property
   * 2. A string matching to type property of a row ("[builtIn/custom]/[rowType/name][?/kind]").
   * 3. A function that takes a row and returns a boolean.
   *
   * @returns All rows matching the row type selector.
   */
  get(t) {
    return typeof t == "function" ? (calculation?.rows ?? []).filter((e) => t(e)) : (calculation?.rows ?? []).filter((e) => e.rowType == t || e.type == t);
  }
  /**
   * Gets the first row matching the row type selector.
   * @param rowType - The row type selector:
   *
   * 1. A string or CalculationRowType matching to rowType property
   * 2. A string matching to type property of a row ("[builtIn/custom]/[rowType/name][?/kind]").
   * 3. A function that takes a row and returns a boolean.
   *
   * @returns The first row matching the row type selector.
   */
  first(t) {
    return this.get(t)[0];
  }
  /**
   * Gets the last row matching the row type selector.
   * @param rowType - The row type selector:
   *
   * 1. A string or CalculationRowType matching to rowType property
   * 2. A string matching to type property of a row ("[builtIn/custom]/[rowType/name][?/kind]").
   * 3. A function that takes a row and returns a boolean.
   *
   * @returns The last row matching the row type selector.
   */
  last(t) {
    const e = this.get(t);
    return e[e.length - 1];
  }
  /**
   * Gets the sum of the price * count for all rows matching the row type selector.
   *
   * @param rowType - The row type selector:
   *
   * 1. A string or CalculationRowType matching to rowType property
   * 2. A string matching to type property of a row ("[builtIn/custom]/[rowType/name][?/kind]").
   * 3. A function that takes a row and returns a boolean.
   *
   * @returns The sum of the price * count for all rows matching the row type selector.
   */
  getSum(t) {
    return this.get(t).reduce((e, r) => (r.price ?? 0) * (r.count ?? 1) + e, 0);
  }
  /**
   * Gets the count of all rows matching the row type selector.
   *
   * @param rowType - The row type selector:
   *
   * 1. A string or CalculationRowType matching to rowType property
   * 2. A string matching to type property of a row ("[builtIn/custom]/[rowType/name][?/kind]").
   * 3. A function that takes a row and returns a boolean.
   *
   * @returns The count of all rows matching the row type selector.
   */
  getCount(t) {
    return this.get(t).reduce((e, r) => (r.count ?? 1) + e, 0);
  }
  /**
   * Gets the average price of all rows matching the row type selector.
   *
   * @param rowType - The row type selector:
   *
   * 1. A string or CalculationRowType matching to rowType property
   * 2. A string matching to type property of a row ("[builtIn/custom]/[rowType/name][?/kind]").
   * 3. A function that takes a row and returns a boolean.
   *
   * @param precision - The precision of the average price. Defaults to 2 as in two decimals in currency .
   *
   * @returns The average price of all rows matching the row type selector.
   */
  getAvgPrice(t, e = 2) {
    return this.round(
      this.get(t).reduce((r, n) => (n.price ?? 0) * (n.count ?? 1) + r, 0) / this.getCount(t),
      e
    );
  }
  /**
   * THIS IS A COPY OF THE FUNCTION IN @salaxy/core/ts/util/Numeric.ts
   * Rounds a number to the specified number of decimal places.
   * @param value - The number to round
   * @param decimals - Number of decimal places (defaults to 2)
   * @returns The rounded number or undefined if input is invalid
   */
  round(t, e = 2) {
    if (t == null || e == null)
      return;
    if (t < 0)
      return -1 * this.round(-1 * t, e);
    let r = `${t}`;
    return r.indexOf("e") >= 0 && (r = `${t.toFixed(15)}`), +(Math.round(`${r}e${e}`).toString() + `e-${e}`);
  }
  /**
   * Gets the minimum price of all rows matching the row type selector.
   *
   * @param rowType - The row type selector:
   *
   * 1. A string or CalculationRowType matching to rowType property
   * 2. A string matching to type property of a row ("[builtIn/custom]/[rowType/name][?/kind]").
   * 3. A function that takes a row and returns a boolean.
   *
   * @returns The minimum price of all rows matching the row type selector.
   */
  getMinPrice(t) {
    const e = this.get(t);
    return e.length == 0 ? 0 : e.reduce((r, n) => Math.min(n.price ?? 0, r), e[0]?.price ?? 0);
  }
  /**
   * Gets the maximum price of all rows matching the row type selector.
   *
   * @param rowType - The row type selector:
   *
   * 1. A string or CalculationRowType matching to rowType property
   * 2. A string matching to type property of a row ("[builtIn/custom]/[rowType/name][?/kind]").
   * 3. A function that takes a row and returns a boolean.
   *
   * @returns The maximum price of all rows matching the row type selector.
   */
  getMaxPrice(t) {
    return this.get(t).reduce((e, r) => Math.max(r.price ?? 0, e), 0);
  }
}
class u {
  /**
   * Gets the price for a row type from the employment (first) or company settings (fallback).
   * @param rowType Row type selector.
   * @returns Price for the row type.
   */
  get(t) {
    return this.getEmployment(t) || this.getCompany(t);
  }
  /**
   * Gets the price for a row type from the company settings.
   * @param rowType Row type selector.
   * @returns Price for the row type.
   */
  getCompany(t) {
    return this.getCompanyPriceRows(t)[0]?.price ?? 0;
  }
  /**
   * Gets the price for a row type from the employment settings.
   * @param rowType Row type selector.
   * @returns Price for the row type.
   */
  getEmployment(t) {
    return this.getEmploymentPriceRows(t)[0]?.price ?? 0;
  }
  /**
   * Gets the price rows for a row type from the employment settings.
   * HACK: Need to go throug this logic before production.
   * @param rowType Row type selector.
   * @returns Price rows for the row type.
   */
  getEmploymentPriceRows(t) {
    return t ? typeof t == "function" ? (employment.work?.salaryDefaults ?? []).filter((e) => t(e)) : t.indexOf("/") > 0 ? (employment.work?.salaryDefaults ?? []).filter((e) => e.type == t) : (employment.work?.salaryDefaults ?? []).filter((e) => e.rowType == t) : [];
  }
  /**
   * Gets the price rows for a row type from the company settings.
   * HACK: Need to go throug this logic before production.
   * @param rowType Row type selector.
   * @returns Price rows for the row type.
   */
  getCompanyPriceRows(t) {
    return t ? typeof t == "function" ? (settings.calc?.salaryDefaults ?? []).filter((e) => t(e)) : t.indexOf("/") > 0 ? (settings.calc?.salaryDefaults ?? []).filter((e) => e.type == t) : (settings.calc?.salaryDefaults ?? []).filter((e) => e.rowType == t) : [];
  }
}
class o {
  constructor() {
    this.rows = new s(), this.prices = new u();
  }
}
globalThis.sxy = new o();
export {
  o as HelpersRoot,
  u as PricesHelper,
  s as RowsHelper
};
//# sourceMappingURL=salaxy-lib-expressions.js.map
