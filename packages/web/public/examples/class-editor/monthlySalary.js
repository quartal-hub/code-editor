// @ts-check

/**
 * @implements {RowTypeScripts}
 */
class monthlySalary {
  /**
   * Custom function to set the price for the specified row type.
   * @param {UserDefinedRow} row The current row that is being modified.
   * @param {RowContext} ctx The calculation context: Calculation, Employment, Company settings, etc.
   * @param {HelpersRoot} sxy Helper functions that make it easier to fetch data from rows, context etc.
   * @returns {number} The new price as defined by the custom logic or undefined if the system should keep the existing value.
   */
  price(row, ctx, sxy) {
    return 3500;
  }

  /**
   * Custom function to set the message for the specified row type.
   * @param {UserDefinedRow} row The current row that is being modified.
   * @param {RowContext} ctx The calculation context: Calculation, Employment, Company settings, etc.
   * @param {HelpersRoot} sxy Helper functions that make it easier to fetch data from rows, context etc.
   * @returns {string} The new message as defined by the custom logic or undefined if the system should keep the existing value.
   */
  message(row, ctx, sxy) {
    return (row.price > 4000 ? 'Iso palkka ' : 'Pieni palkka ') + ctx.calculation.workflow.salaryDate;
  }

}
