export type MonacoLibrary =
  | { type: "module"; name: string }
  | { type: "context"; code: string };

/** Helpers for Salaxy specific logic. */
export class SalaxyHelpers {

  /**
   * HACK: Use common libraries in code-editors-core package to handle these.
   * @returns 
   */
  public static getTempLibraries(): MonacoLibrary[] {
    const libraries: MonacoLibrary[] = [
      {
        type: "module",
        name: "@salaxy/core",
      },
      {
        type: "module",
        name: "@salaxy/expressions",
      },
      {
        type: "context",
        code: `
      imp${"o"}rt { CalculationRowSource, CalculationRowType, HelpersRoot, UserDefinedRow, RowContext } from "@salaxy/core";
      declare global {
        /** The row that is being process as part of calculation. */
        declare var row: UserDefinedRow;
        /** The calculation context: Calculation, Employment, Company settings, etc. */
        declare var ctx: RowContext;
        /** The sxy helper functions. */
        declare var sxy: HelpersRoot;
      }
    `,
      },
    ];
    return libraries;
  }

  public static getCodeForClass(name: string) {
    // HACK: Need to specify the interface to implement in the calling code.
    return `
/**
* @implements {RowTypeScripts}
*/
class ${name} {
}
`.trim();
  }

  public static getCodeForFunction(name: string) {
    const funcInfo = this.getRowsInterface().find(f => f.name === name);
    if (!funcInfo) {
      throw new Error(`Function ${name} not found`);
    }
    return `  /**
   * Custom function to set ${funcInfo.description} for the specified row type.
   * @param {UserDefinedRow} row The current row that is being modified.
   * @param {RowContext} ctx The calculation context: Calculation, Employment, Company settings, etc.
   * @param {HelpersRoot} sxy Helper functions that make it easier to fetch data from rows, context etc.
   * @returns {${funcInfo.returnType}} The return value of ${funcInfo.description} or undefined if the system should keep the existing value.
   */
  ${name}(row, ctx, sxy) {
    return undefined;
  }`;
  }

  /**
   * TODO: This should be done instead by loading the interface code and then parsing it.
   * @returns The functions that are available RowTypeScripts interface.
   */
  public static getRowsInterface() {
    const functions = [
      { name: "price", description: "the price", returnType: "number" },
      { name: "count", description: "the count", returnType: "number" },
      { name: "data", description: "the data", returnType: "object" },
      { name: "kind", description: "the kind", returnType: "string" },
      { name: "message", description: "the message", returnType: "string" },
      { name: "unit", description: "the unit", returnType: "string" },
      { name: "sourceId", description: "the source ID", returnType: "string" },
      { name: "accounting", description: "the accounting", returnType: "object" },
      { name: "vatPercent", description: "the VAT percentage", returnType: "number" },
      { name: "vatEntries", description: "the VAT entries", returnType: "object[]" },
      { name: "dimensions", description: "the cost accounting dimensions", returnType: "object[]" },
      { name: "period", description: "the period", returnType: "object" },
      { name: "periodStart", description: "the start date of the period", returnType: "string" },
      { name: "periodEnd", description: "the end date of the period", returnType: "string" },
      { name: "periodDaysCount", description: "the number of days in the period", returnType: "number" },
      { name: "periodDays", description: "the collection of days contained in the period", returnType: "string[]" },
      { name: "data", description: "the rowtype specific data", returnType: "object" },
      { name: "kind", description: "the data.kind of the row: This is a sub-type depending on the row type.", returnType: "string" },
    ];
    return functions;
  }  
}