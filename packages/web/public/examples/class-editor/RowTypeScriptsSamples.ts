import { UserDefinedRow, CalculationRowType, CalculationRowSource, PayStatsKind } from "@salaxy/core";
import { HelpersRoot } from "@salaxy/expressions";
import { RowContext } from "@salaxy/core";
import { RowTypeScripts } from "@salaxy/core";

/**
 * Calculate the count for the years of service bonus row.
 * It should be calculated based on the standard and overtime hours.
 */
export class palvelusvuosilisa implements RowTypeScripts {
  /**
   * Resolve the standard hourly price for the overtime base hours.
   * @param row The row that is being process as part of calculation.
   * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
   * @param _sxy Helper functions that make it easier to fetch data from rows, context etc.
   * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
   */
  count(row: UserDefinedRow, ctx: RowContext, _sxy: HelpersRoot): number | undefined {
    return ctx.calculation.rows?.filter( r =>
    !(r?.type?.startsWith("/custom/palvelusvuosilisa") == true) &&
    (
      r.rowType == CalculationRowType.HourlySalary || // standard hours
      r.rowType == CalculationRowType.HourlySalaryWithWorkingTimeCompensation ||  // standard hours with working time compensation
      r.rowType == CalculationRowType.WorkingTimeCompensation) // overtime base hours
    ).reduce( (acc, curr) => curr ? (acc + (curr.count ?? 0)) : 0, 0) ?? 0;
  }
}

/**
 * Calculate the price for overtime hours (daily 50 %)
 */
export class ylityo_vrk50 implements RowTypeScripts {
  /**
   * Resolve the price for the overtime base hours.
   * @param row The row that is being process as part of calculation.
   * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
   * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
   * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
   */
  data(row: UserDefinedRow, ctx: RowContext, sxy: HelpersRoot): { [key: string]: any; } | undefined {
      return getDataForCompensationRow(0.5, row, ctx, sxy);
  }
}

/**
 * Calculate the price for overtime hours (daily 100%)
 */
export class ylityo_vrk100 implements RowTypeScripts {
  /**
   * Resolve the price for the overtime base hours.
   * @param row The row that is being process as part of calculation.
   * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
   * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
   * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
   */
  data(row: UserDefinedRow, ctx: RowContext, sxy: HelpersRoot): { [key: string]: any; } | undefined {
      return getDataForCompensationRow(1.0, row, ctx, sxy);
  }
}

/**
 * Calculate the price for overtime hours (weekly 50%)
 */
export class ylityo_vko50 implements RowTypeScripts {
  /**
   * Resolve the price for the overtime base hours.
   * @param row The row that is being process as part of calculation.
   * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
   * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
   * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
   */
  data(row: UserDefinedRow, ctx: RowContext, sxy: HelpersRoot): { [key: string]: any; } | undefined {
      return getDataForCompensationRow(0.5, row, ctx, sxy);
  }
}

/**
 * Calculate the price for overtime hours (weekly 100%)
 */
export class ylityo_vko100 implements RowTypeScripts {
  /**
   * Resolve the price for the overtime base hours.
   * @param row The row that is being process as part of calculation.
   * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
   * @param sxy Helper functions that make it easier to fetch data from rows, context etc.
   * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
   */
  data(row: UserDefinedRow, ctx: RowContext, sxy: HelpersRoot): { [key: string]: any; } | undefined {
      return getDataForCompensationRow(1.0, row, ctx, sxy);
  }
}

function getDataForCompensationRow(factor: number, row: UserDefinedRow, ctx: RowContext, _sxy: HelpersRoot): { [key: string]: any; } | undefined {

    // get standard hourly price
    const standardHourlyPrice = ctx.employment.work?.salaryDefaults?.find(r =>
      r.source == CalculationRowSource.PriceEmployment && r.type == CalculationRowType.HourlySalary)?.price ?? 0;
    //and average hourly price
    const averagehourlyPrice = ctx.employment.work?.salaryDefaults?.find(r =>
      r.source == CalculationRowSource.PriceEmployment &&
      r.rowType == CalculationRowType.PayStats &&
      r.data?.kind == PayStatsKind.AverageHourlyPay &&
      r.period?.start == getPricingPeriodStartDate(ctx.calculation?.info?.workStartDate))?.price ?? 0;
    // take highest price
    const price = round(factor * (highest(standardHourlyPrice, averagehourlyPrice)));
    // if price is defined, set it to the compensation row data
    if (price && row.data && row.data.compensationRows) {
      row.data.compensationRows[0].price = price;
      row.data.pricing = "fixed";
    }
    return row.data || undefined;
}

/**
 * Calculate the price for the orientation bonus row.
 * It should be calculated based on the standard hourly price.
 */
export class perehdytyslisa implements RowTypeScripts {
  /**
   * Resolve the standard hourly price for the overtime base hours.
   * @param row The row that is being process as part of calculation.
   * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
   * @param _sxy Helper functions that make it easier to fetch data from rows, context etc.
   * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
   */
  price(row: UserDefinedRow, ctx: RowContext, _sxy: HelpersRoot): number | undefined {
     const standardHourlyPrice = ctx.employment.work?.salaryDefaults?.find(r =>
      r.source == CalculationRowSource.PriceEmployment && r.type == CalculationRowType.HourlySalary)?.price ?? 0;
     if (standardHourlyPrice) {
      return round(0.25 * standardHourlyPrice );
     }
     else {
      return row.price || undefined;
     }
  }
}

/**
 * Calculate the price for the sunday compensation row.
 * It should be calculated based on the standard hourly price.
 */
export class sunnuntai implements RowTypeScripts {
  /**
   * Resolve the standard hourly price for the overtime base hours.
   * @param row The row that is being process as part of calculation.
   * @param ctx The calculation context: Calculation, Employment, Company settings, etc.
   * @param _sxy Helper functions that make it easier to fetch data from rows, context etc.
   * @returns The new price as defined by the custom logic or undefined if the system should keep the existing value.
   */
  price(row: UserDefinedRow, ctx: RowContext, _sxy: HelpersRoot): number | undefined {
     const standardHourlyPrice = ctx.employment.work?.salaryDefaults?.find(r =>
      r.source == CalculationRowSource.PriceEmployment && r.type == CalculationRowType.HourlySalary)?.price ?? 0;
     if (standardHourlyPrice) {
      return standardHourlyPrice;
     }
     else {
      return row.price || undefined;
     }
  }
}


// helper methods -->

  function highest(a: number, b: number): number {
    return a > b ? a : b;
  }

  function round(value: number): number {
      return Number(Math.round(value.toFixed(15) +"e2" as any).toString() + `e-2`);
  }

  function getPricingPeriodStartDate(workStartDate): string {
    const pad = (n) => n < 10 ? "0" + n : "" + n;
    // format yyyy-MM-dd
    const d = workStartDate || "0000-00-00";
    let y = parseInt(d.substring(0, 4));
    let m = parseInt(d.substring(5, 7));

    if (m >= 5 && m < 8) { // period: May to July -> Hourly pay from Q1
      m = 1;
    }
    else if (m >= 8 && m < 11) { // period: Aug to Oct -> Hourly pay from Q2
      m = 4;
    }
    else if (m >= 11 && m <= 12) { // period: Nov to Dec -> Hourly pay from Q3
      m = 7;
    }
    else if (m >= 1 && m < 2) { // period: Jan to Feb -> Hourly pay from Q3
      m = 7;
      y = y - 1;
    }
    else if (m >= 2 && m < 5) { // period: Feb to Apr -> Hourly pay from Q4
      m = 10;
      y = y - 1;
    }
    return pad(y) + "-" + pad(m) + "-01";
  }
