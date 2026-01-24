import { QEditorExample } from "./QEditorExample";

export function getClassExamples(): QEditorExample[] {
    return [
        {
            title: "Simple class",
            descr: "A user manager with a few methods",
            props: {
                type: "class",
                code: `class UserManager {
  private api: string = '/api/v1';

  constructor() {
    console.log("Manager initialized");
  }

  public getUser(id: number): void {
    // This is the body we want to edit
    const url = this.api + '/' + id;
    console.log("Fetching: " + url);
  }

  async save(data: any) {
    if (!data) return;
    await db.save(data);
    return true;
  }
}`,
            },
        }, {
            title: "Complex class",
            descr: "A complex class with a few methods",
            props: {
                type: "class",
                code: `
import type { Calculation, HelpersRoot, RowContext, RowTypeScripts, UserDefinedRow } from "@salaxy/core";

/** Räätälöity hallityspalkkio, jossa perushinta on 21 €/h ja ylityöpalkkio on 1,5 kertaa perushinta. */
export class hallitus_2 implements RowTypeScripts {
    /**
     * Custom function to set the price for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
     */
    price(row: UserDefinedRow, ctx: RowContext, sxy: HelpersRoot): number {

        function helperFunction(): number {
            return 21;
        }

        return helperFunction() * 2;
    }
}

/** Ylityöpalkkio, kun kun vuorokautinen työaika ylittyy (50% korotus) */
export class ylityo_vrk_50 implements RowTypeScripts {
    /**
     * Custom function to set the price for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
     */
    public price(row: UserDefinedRow, ctx: RowContext, sxy: HelpersRoot): number {
        return sxy.prices.getEmployment("hourlySalary");
    }

    /**
     * Custom function to set the price for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
     */
    public data(row: UserDefinedRow, ctx: RowContext, sxy: HelpersRoot): any {
        const standardHourlyPrice = sxy.prices.getEmployment("hourlySalary") ?? 0;
        const averagehourlyPrice = this.getEmploymentAverageHourlyPrice() ?? 0;

        const price = 0.5 * (this.highest(standardHourlyPrice, averagehourlyPrice));
        if (row.data && row.data.compensationRows) {
            row.data.compensationRows[0].price = price;
        }
        return row.data;
    }

    private highest(a: number, b: number): number {
        return a > b ? a : b;
    }

    private getEmploymentAverageHourlyPrice(): number {
        return sxy.prices.getEmployment(r =>
            r.rowType == "payStats" &&
            r.data?.kind == "averageHourlyPay" &&
            r.data?.id == "avg" &&
            r.period?.start == this.getPricingPeriodStartDate(calculation?.info?.workStartDate));
    }

    private getPricingPeriodStartDate(workStartDate): string {
        const pad = (n) => n < 10 ? "0" + n : "" + n;
        // format yyyy-MM-dd
        const d = workStartDate || "0000-00-00";
        let y = parseInt(d.substring(0, 4));
        let m = parseInt(d.substring(5, 7));

        if (m >= 5 && m < 8) {
            m = 1;
        }
        else if (m >= 8 && m < 11) {
            m = 4;
        }
        else if (m >= 11 && m <= 12) {
            m = 7;
        }
        else if (m >= 1 && m < 2) {
            m = 7;
            y = y - 1;
        }
        else if (m >= 2 && m < 5) {
            m = 10;
            y = y - 1;
        }
        return pad(y) + "-" + pad(m) + "-01";
    }

}

/** Palkallinen poissaolo */
export class poissaolopalkallinen implements RowTypeScripts {

    /**
     * Custom function to set the price for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
     */
    public price(row: UserDefinedRow, ctx: RowContext, sxy: HelpersRoot): number {
        const monthlyPrice = sxy.prices.getEmployment("monthlySalary");
        if (!monthlyPrice) {
            return 0;
        }
        const dividerConfig = ctx.config?.find(x => x.name = "monthlyDivider");
        if (dividerConfig) {
            return Helpers.round(monthlyPrice / (dividerConfig.data));
        }
        else {
            return Helpers.round(monthlyPrice / 158);
        }
    }

}


/**
 * Sample script class to illustrate the structure of a script file.
 */
export class SampleScript1 {

    /**
     * Modify calculation by inserting a new hourly row.
     * This method has access to the following global variables:
     * - row: UserDefinedRow - The current row being processed.
     * - calculation: Calculation - The current calculation.
     * - employment: Employment - The current employment related to the row.
     * - settings: CompanyAccountSettings - The company settings for the employer.
     * - configs: BizConfig[] - The business configurations for the customer or employment.
     * - sxy: HelpersRoot - The global helper object for expressions.
     */
    public tuntipalkanluonti_calculation(ctx: RowContext, sxy: HelpersRoot): Calculation {
        const hourly = calculation.rows?.find(r => r.rowType == "hourlySalary");
        if (hourly == null) {
            calculation.rows?.push({
                rowType: "hourlySalary" as any,
                count: 120,
                price: 21
            });
        }
        return calculation;
    }
}

/** Yleiset apufunktiot */
export class Helpers {

    public static round(value: number): number {
        return Number(Math.round(value.toFixed(15) + "e2" as any).toString() + "e-2");
    }

}
`,
            },
        }
    ];
}