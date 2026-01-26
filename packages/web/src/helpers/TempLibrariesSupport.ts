export class TempLibrariesSupport {

    public static getSalaxyCoreLibrary(): any {
        return [
            {
              type: "module",
              name: "@salaxy/core",
              url: "/libs/core/salaxy-lib-core.d.ts",
            },
            {
              type: "context",
              code: `
            import { HelpersRoot, CompanyAccountSettings, Employment, Calculation, UserDefinedRow } from "@salaxy/core";
      
            // Enums used by sxy helper functions:
            import { CalculationRowType } from "@salaxy/core";
      
            declare global {
              /** The sxy helper functions. */
              declare var sxy: HelpersRoot;
              /** The company account settings. */
              declare var settings: CompanyAccountSettings;
              /** The employment. */
              declare var employment: Employment;
              /** The calculation. */
              declare var calculation: Calculation;
              /** The user defined row. */
              declare var row: UserDefinedRow;
            }
            `,
            },
          ];
    }

}