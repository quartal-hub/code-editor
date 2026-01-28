import { PayStatsCalculationResultValue } from "@salaxy/expressions"
import { type Calculation, type MonthlyHolidayAccrual, type HolidayPay, Dates, UserDefinedRow } from "@salaxy/core";

/**
 * Sample script class to illustrate the structure of a script file.
 */
export class SampleScript1 {

  /**
   * Resolve the standard hourly price for the overtime base hours.
   * This method has access to the following global variables:
   * - row: UserDefinedRow - The current row being processed.
   * - calculation: Calculation - The current calculation.
   * - employment: Employment - The current employment related to the row.
   * - settings: CompanyAccountSettings - The company settings for the employer.
   * - configs: BizConfig[] - The business configurations for the customer or employment.
   * - sxy: HelpersRoot - The global helper object for expressions.
   */
  public ylityo_vrk_50_price(): number {
    return sxy.prices.getEmployment("hourlySalary");
  }

  /**
   * Resolve the price for the actual overtime hours, which are set in the data section of the row.
   * The price is based on calculated average hourly price or standard hourly price which of them is higher.
   * This method has access to the following global variables:
   * - row: UserDefinedRow - The current row being processed.
   * - calculation: Calculation - The current calculation.
   * - employment: Employment - The current employment related to the row.
   * - settings: CompanyAccountSettings - The company settings for the employer.
   * - configs: BizConfig[] - The business configurations for the customer or employment.
   * - sxy: HelpersRoot - The global helper object for expressions.
   */
  public ylityo_vrk_50_data(): any {
    const standardHourlyPrice = sxy.prices.getEmployment("hourlySalary") ?? 0;
    const averagehourlyPrice = this.getEmploymentAverageHourlyPrice() ?? 0;

    const price = 0.5 * (this.highest(standardHourlyPrice, averagehourlyPrice));
    if (row.data && row.data.compensationRows) {
      row.data.compensationRows[0].price = price;
    }
    return row.data;
  }

  /**
   * Resolve theprice for the paid absence hours.
   * This method has access to the following global variables:
   * - row: UserDefinedRow - The current row being processed.
   * - calculation: Calculation - The current calculation.
   * - employment: Employment - The current employment related to the row.
   * - settings: CompanyAccountSettings - The company settings for the employer.
   * - configs: BizConfig[] - The business configurations for the customer or employment.
   * - sxy: HelpersRoot - The global helper object for expressions.
   */
  public poissaolopalkallinen_price(): number {
    const monthlyPrice = sxy.prices.getEmployment("monthlySalary");
    if (!monthlyPrice) {
        return 0;
    }
    const dividerConfig = configs?.find(x => x.name = "monthlyDivider");
    if (dividerConfig) {
        return this.round(monthlyPrice / (dividerConfig.data));
    }
    else {
        return this.round(monthlyPrice / 158);
    }
  }

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
  public tuntipalkanluonti_calculation(): Calculation {
    const hourly = calculation.rows?.find(r => r.rowType == "hourlySalary");
    if (hourly == null) {
        calculation.rows?.push( {
            rowType: "hourlySalary" as any,
            count: 120,
            price: 21
        });
    }
    return calculation;
  }

  /**
   * Calculate pay statistics from given calculations.
   * This method has access to the following global variables:
   * - employment: Employment - The current employment.
   * - settings: CompanyAccountSettings - The company settings for the employer.
   * - configs: BizConfig[] - The business configurations for the customer or employment.
   * - calculations: Calculation[] - Fetched calculations for those scripts which calculate numbers based on e.g. calculations on a period.
   * - sxy: HelpersRoot - The global helper object for expressions.
   * - result: any - The actual preset result object containing the definition of the pay statistics type and the fields for calculated values.
   */
  public payStats_result(): PayStatsCalculationResultValue {
    const payStatsResult = result as PayStatsCalculationResultValue;

    payStatsResult.updatedAt = new Date().toISOString();
    payStatsResult.salary = calculations.reduce((sum, calc) => sum + (calc.result?.totals?.totalGrossSalary || 0), 0);
    payStatsResult.workingTime = 158;
    payStatsResult.result = this.round(payStatsResult.salary / (payStatsResult.workingTime || 1) );

    return payStatsResult;
  }

  /**
   * Calculate holiday accruals for the current calculation.
   * This method has access to the following global variables:
   * - calculation: Calculation - The current calculation.
   * - holidayYear: HolidayYear - The holiday year for the calculation.
   * - employment: Employment - The current employment related to the calculation.
   * - settings: CompanyAccountSettings - The company settings for the employer.
   * - configs: BizConfig[] - The business configurations for the customer or employment.
   * - calculations: Calculation[] - All other calculations relevant for the current accrual month.
   * - sxy: HelpersRoot - The global helper object for expressions.
   * - result: any - The actual preset result object containing the accruals for each calendar month in this calculation.
   */
  public holidayAccrual_result(): MonthlyHolidayAccrual[] {
    const holidayAccrualResult = result as MonthlyHolidayAccrual[];

    for(const accrual of holidayAccrualResult) {
      accrual.daysAccrued = holidayYear.accrual?.defaultAccrual ?? 2.5;
    }
    return holidayAccrualResult;
  }

  /**
   * Calculate holiday pay for the current holiday year.
   * This method has access to the following global variables:
   * - holidayYear: HolidayYear - The holiday year context for the calculation.
   * - employment: Employment - The current employment related to the calculation.
   * - settings: CompanyAccountSettings - The company settings for the employer.
   * - configs: BizConfig[] - The business configurations for the customer or employment.
   * - calculations: Calculation[] - All calculations relevant for the holiday pay calculation.
   * - sxy: HelpersRoot - The global helper object for expressions.
   * - result: any - The actual preset result object for holiday pay.
   */
  public holidayPay_result(): HolidayPay {
    const holidayPayResult = result as HolidayPay;
    holidayPayResult.scriptPay = 180;
    return holidayPayResult;
  }


  // helper methods -->
  private highest(a: number, b: number): number {
    return a > b ? a : b;
  }

  private round(value: number): number {
      return Number(Math.round(value.toFixed(15) +"e2" as any).toString() + `e-2`);
  }

  private getEmploymentAverageHourlyPrice(): number {
    return sxy.prices.getEmployment((r: UserDefinedRow) =>
      r.rowType == "payStats" &&
      r.data?.kind == "averageHourlyPay" &&
      r.data?.id == "avg" &&
      r.period?.start == this.getPricingPeriodStartDate(calculation?.info?.workStartDate));
  }

  private getPricingPeriodStartDate(workStartDate: string | undefined | null): string {
    if (!workStartDate) {
      return Dates.getToday();
    }
    const pad = (n: number) => n < 10 ? "0" + n : "" + n;
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