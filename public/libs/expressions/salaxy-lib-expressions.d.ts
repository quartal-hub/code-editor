import { ApiValidation } from '../../model';
import { BizConfig } from '../model';
import { BizConfig as BizConfig_2 } from '../../model';
import { CalcInfo } from '../../model';
import { Calculation } from '../model';
import { Calculation as Calculation_2 } from '../../model';
import { CalculationAccounting } from '../../model';
import { CalculationRowType } from '../../model';
import { CalculationRowUnit } from '../../model';
import { CalcWorkflow } from '../../model';
import { CalcWorktime } from '../../model';
import { CompanyAccountSettings } from '../model';
import { CompanyAccountSettings as CompanyAccountSettings_2 } from '../../model';
import { CostAccountingDimension } from '../../model';
import { DateRange } from '../../model';
import { Employment } from '../model';
import { Employment as Employment_2 } from '../../model';
import { HolidayPay } from '../model';
import { HolidayYear } from '../model';
import { MonthlyHolidayAccrual } from '../model';
import { MonthlyHolidayAccrual as MonthlyHolidayAccrual_2 } from '../../model';
import { PayStatsTypeDefinition } from '../../model';
import { RowAccounting } from '../../model';
import { RowTypeDefinition } from '../../model';
import { UserDefinedRow } from '../model';
import { UserDefinedRow as UserDefinedRow_2 } from '../../model';
import { VatEntry } from '../../model';
import { WorkflowData } from '../../model';

/** Scripts that are called after the calculation has been processed. */
export declare interface AfterCalcScripts {
    /**
     * Gets the holiday accruals for the calculation. Typically stored to the system after the payment has been done.
     * @param current Current holiday accruals of the calculation as calculated by system calculation.
     * @returns New holiday accruals for the calculation after changes by the script.
     */
    getAccruals?(current: MonthlyHolidayAccrual_2[]): Promise<MonthlyHolidayAccrual_2[] | undefined>;
    /**
     * Gets the generic workflow data for the calculation: with workflow events/messages to other users and systems.
     * @param current Current workflow data of the calculation
     * @returns New workflow data for the calculation after changes by the script.
     */
    getWorkflowData?(current: WorkflowData): Promise<WorkflowData | undefined>;
    /**
     * Gets the payment related workflow data for the calculation.
     * @param current Current payment related workflow data of the calculation
     * @returns New payment related workflow data for the calculation after changes by the script.
     */
    getPaymentWorkflow?(current: CalcWorkflow): Promise<CalcWorkflow | undefined>;
    /**
     * Gets the info object for the calculation containing e.g. the work description, payment reference number etc.
     * @param current Current info object of the calculation
     * @returns New info object for the calculation after changes by the script.
     */
    getInfo?(current: CalcInfo): Promise<CalcInfo | undefined>;
}

/** Defines custom / scripted functionality that is called before the calculation. */
export declare interface BeforeCalcScripts {
    /**
     * Gets the period for the calculation (workStartDate, workEndDate and numberOfDays).
     * Note that the current logic does not support the days collection: use daysCount instead.
     * @param current Current period of the calculation
     * @returns New period for the calculation after chages by the script.
     */
    getPeriod?(current: DateRange): DateRange | undefined;
    /**
     * Gets the accounting for the calculation:
     * Currently the default dimensions, but may later support other accounting related properties.
     * @param current Current accounting of the calculation
     * @returns New accounting for the calculation after changes by the script.
     */
    getAccounting?(current: CalculationAccounting): CalculationAccounting | undefined;
    /**
     * Gets the worktime object before calculation: Worktime is used in calculating absences and holidays.
     * @param current Current worktime of the calculation
     * @returns New worktime for the calculation after changes by the script.
     */
    getWorktime?(current: CalcWorktime): CalcWorktime | undefined;
    /**
     * Provides a way to modify the entire collection of rows, e.g. to add a row of a specific type if not present.
     * Simple modifications should typically be done using RowScripts for the specific row type.
     * @param current Current rows of the calculation
     * @returns New rows for the calculation after changes by the script.
     */
    getRows?(current: UserDefinedRow_2[]): UserDefinedRow_2[] | undefined;
}

export { BizConfig }

export { Calculation }

export { CompanyAccountSettings }

export { Employment }

/**
 * Exposed as global helper "sxy"
 */
export declare class HelpersRoot {
    /** Helper for querying Calculation rows. */
    rows: RowsHelper;
    /** Helper for getting prices. */
    prices: PricesHelper;
}

export { HolidayPay }

export { HolidayYear }

export { MonthlyHolidayAccrual }

/** Object for containing all the result data and rules for the pay stats calculation. */
export declare interface PayStatsCalculationResultValue {
    /** Settings for the type of the pay statistics. */
    type?: PayStatsTypeDefinition | null;
    /** Start date (included) of the period */
    start?: string | null;
    /** End date (included) of the period. */
    end?: string | null;
    /** Total salary in the calculation which is calculated into the pay statistics type. */
    salary?: number | null;
    /** Total working time in the calculation which is calculated into the pay statistics type. */
    workingTime?: number | null;
    /** Total result of the pay statistics calculation, e.g. average hourly pay for the period. */
    result?: number | null;
    /** Last time the result was created/updated. */
    updatedAt?: string | null;
}

/**
 * Helper for easier creation of expressions for rows.
 */
export declare class PricesHelper {
    /**
     * Gets the price for a row type from the employment (first) or company settings (fallback).
     * @param rowType Row type selector.
     * @returns Price for the row type.
     */
    get(rowType: RowTypeSelector): number;
    /**
     * Gets the price for a row type from the company settings.
     * @param rowType Row type selector.
     * @returns Price for the row type.
     */
    getCompany(rowType: RowTypeSelector): number;
    /**
     * Gets the price for a row type from the employment settings.
     * @param rowType Row type selector.
     * @returns Price for the row type.
     */
    getEmployment(rowType: RowTypeSelector): number;
    /**
     * Gets the price rows for a row type from the employment settings.
     * HACK: Need to go throug this logic before production.
     * @param rowType Row type selector.
     * @returns Price rows for the row type.
     */
    getEmploymentPriceRows(rowType: RowTypeSelector): RowTypeDefinition[];
    /**
     * Gets the price rows for a row type from the company settings.
     * HACK: Need to go throug this logic before production.
     * @param rowType Row type selector.
     * @returns Price rows for the row type.
     */
    getCompanyPriceRows(rowType: RowTypeSelector): RowTypeDefinition[];
}

/** Context that is passed to the row type scripts. */
export declare interface RowContext {
    /** Add, modify or remove validation errors or warnings based the current script. */
    validation: ApiValidation;
    /** The current calculation being processed. */
    calculation: Calculation_2;
    /** The current employment being processed. */
    employment: Employment_2;
    /** The company settings for the employer. */
    settings: CompanyAccountSettings_2;
    /** The business configurations for the customer or employment. */
    config: BizConfig_2[];
}

/** Provides helper functions for querying Calculation rows in expressions. */
export declare class RowsHelper {
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
    get(rowType: RowTypeSelector): UserDefinedRow_2[];
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
    first(rowType: RowTypeSelector): UserDefinedRow_2 | undefined;
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
    last(rowType: RowTypeSelector): UserDefinedRow_2 | undefined;
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
    getSum(rowType: RowTypeSelector): number;
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
    getCount(rowType: RowTypeSelector): number;
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
    getAvgPrice(rowType: RowTypeSelector, precision?: number): number | undefined;
    /**
     * THIS IS A COPY OF THE FUNCTION IN @salaxy/core/ts/util/Numeric.ts
     * Rounds a number to the specified number of decimal places.
     * @param value - The number to round
     * @param decimals - Number of decimal places (defaults to 2)
     * @returns The rounded number or undefined if input is invalid
     */
    round(value: number | undefined | null, decimals?: number | undefined): number | undefined;
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
    getMinPrice(rowType: RowTypeSelector): number;
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
    getMaxPrice(rowType: RowTypeSelector): number;
}

/**
 * Defines optional custom functions that may be defined for a row type.
 * These are called by the system to set the price, count, etc. for the row type.
 * See https://code.salaxy.com/docs/logic-row-type-scripts for detailed documentation.
 * @example
 * For example, this could define the price for overtime hours as half of the hourly salary defined in the employment relation.
 * ```typescript
 * export class Overtime implements RowTypeScripts {
 *   price(row: UserDefinedRow, ctx: RowContext, sxy: HelpersRoot): number | undefined {
 *     return sxy.prices.getEmployment("hourlySalary") * 0.5;
 *   }
 * }
 * ```
 */
export declare interface RowTypeScripts {
    /**
     * Custom function to set the price for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
     */
    price?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): number | undefined;
    /**
     * Custom function to set the count for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The new count as defined by the custom logic or undefined if the system should keep the existing value.
     */
    count?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): number | undefined;
    /**
     * Custom function to set the Description text of the row that is shown in reports.
     * If undefined, the system will set the description according to the row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The description text for the row as defined by the custom logic or undefined if the system should keep the existing value.
     */
    message?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): string | undefined;
    /**
     * Custom function to set the unit for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The new unit as defined by the custom logic or undefined if the system should keep the existing value.
     */
    unit?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): CalculationRowUnit | undefined;
    /**
     * Identifier in the source system is a key defined by a source system / partner system.
     * This is a pass-through string that is passed to the result calculations.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The source ID as defined by the custom logic or undefined if the system should keep the existing value.
     */
    sourceId?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): string | undefined;
    /**
     * Custom function to set the accounting related data for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The accounting data as defined by the custom logic or undefined if the system should keep the existing value.
     */
    accounting?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): RowAccounting | undefined;
    /**
     * Custom function to set the VAT percentage for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The VAT percentage as defined by the custom logic or undefined if the system should keep the existing value.
     */
    vatPercent?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): number | undefined;
    /**
     * Custom function to set the VAT entries for the specified row type.
     * Total VAT amount splitted by VAT rates.
     * If not undefined (default), this property overrides the vatPercent property.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The VAT entries as defined by the custom logic or undefined if the system should keep the existing value.
     */
    vatEntries?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): VatEntry[] | undefined;
    /**Custom function to set the cost accounting dimensions for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The cost accounting dimensions as defined by the custom logic or undefined if the system should keep the existing value.
     */
    dimensions?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): CostAccountingDimension[] | undefined;
    /**
     * Period if different than the Period of calculation.
     * Will be reported to the National Incomes registry, but also affect some other calculations.
     * Note that this property may be (and by default is) null/undefined.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The period as defined by the custom logic or undefined if the system should keep the existing value.
     */
    period?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): DateRange | undefined;
    /**
     * Custom function to set the start date of the period for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The start date of the period as defined by the custom logic or undefined if the system should keep the existing value.
     */
    periodStart?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): string | undefined;
    /**
     * Custom function to set the end date of the period for the specified row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The end date of the period as defined by the custom logic or undefined if the system should keep the existing value.
     */
    periodEnd?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): string | undefined;
    /**
     * Custom function to set the number of days in the period for the specified row type.
     * Alternative to Days.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The number of days in the period as defined by the custom logic or undefined if the system should keep the existing value.
     */
    periodDaysCount?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): number | undefined;
    /**
     * Custom function to set the collection of days contained in the period for the specified row type.
     * Alternative to DaysCount.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The collection of days in the period as defined by the custom logic or undefined if the system should keep the existing value.
     */
    periodDays?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): string[] | undefined;
    /**
     * Custom function to set the rowtype specific data for the specified row type.
     * The structure depends on the rowtype and its logic.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The rowtype specific data as defined by the custom logic or undefined if the system should keep the existing value.
     */
    data?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): {
        [key: string]: any;
    } | undefined;
    /**
     * Custom function to set the data.kind of the row:
     * This is a sub-type depending on the row type.
     * @param row The row that is being process as part of calculation.
     * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
     * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
     * @returns The data.kind as defined by the custom logic or undefined if the system should keep the existing value.
     */
    kind?(row: UserDefinedRow_2, ctx: RowContext, sxy: HelpersRoot): string | undefined;
}

/**
 * Row type selector is either
 *
 * 1. A string or CalculationRowType matching to rowType property
 * 2. A string matching to type property of a row ("[builtIn/custom]/[rowType/name][?/kind]").
 * 3. A function that takes a row and returns a boolean.
 */
export declare type RowTypeSelector = ((row: UserDefinedRow_2 | RowTypeDefinition) => boolean) | CalculationRowType | string;

export { UserDefinedRow }

export { }
