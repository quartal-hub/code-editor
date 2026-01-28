import { UserDefinedRow, WageBasis, CalculationRowSource, CalculationRowType, TimeRatePayKind, PayStatsKind } from "../../model/v01";
import { BeforeCalcScripts } from "../extension-points/BeforeCalcScripts";
import { HelpersRoot } from "../helpers";
import { RowContext } from "../extension-points/RowContext";

/**
 * Rule for adding bonus row to be paid based on years of service.
 */
export class YearsOfService implements BeforeCalcScripts {

    private readonly yearsOfServiceType = "/custom/palvelusvuosilisa";

  /**
   * Inserts a row of type "palvelusvuosilisa" if not already present and if the worker is eligible.
   */
  public getRows(current: UserDefinedRow[], ctx: RowContext, _sxy: HelpersRoot): UserDefinedRow[] | undefined {

    // Create a possible years of service row
    const yearsOfServiceRow = this.getYearsOfServiceRow(ctx);

    // If no row is to be added, remove possible existing rows
    if (!yearsOfServiceRow) {
      return current.filter(r => !(r.type?.startsWith(this.yearsOfServiceType) == true));
    }

    // Check if the row is already present
    const existingRow = current.find(r => r.type === yearsOfServiceRow.type);
    if (existingRow) {
      Object.assign(existingRow, yearsOfServiceRow);
      return current;
    }
    else
    {
      // Remove possible other years of service rows and add the new one
      current = current.filter(r => !(r.type?.startsWith(this.yearsOfServiceType) == true));
      current.push(yearsOfServiceRow);
      return current;
    }
  }

  private getYearsOfServiceRow(ctx: RowContext): UserDefinedRow | undefined {
    // Rules for the years of service bonus

    // 1. check if the employee has an hourly salary contract
    if (ctx.employment.work?.wageBasis !== WageBasis.Hourly) {
      return undefined;
    }

    // 2. check the length of service
    const startDate = ctx.employment.info?.startDate;
    const endDate = ctx.employment.info?.endDate;

    const serviceYears = this.calculateLengthOfServiceInYears(ctx.calculation.workflow?.salaryDate, startDate, endDate);
    if (!serviceYears || serviceYears < 1) {
      return undefined;
    }

    // 3. get the row config
    const configDefaultRow = ctx.settings.calc?.salaryDefaults?.find(r => r.source == CalculationRowSource.CustomRowtype && r.type === this.yearsOfServiceType);
    if (!configDefaultRow) {
      return undefined;
    }

    // resolve price based on years of service
    let priceForRow = 0;
    if (serviceYears >= 1 && serviceYears <= 4) {
      priceForRow = 0.36;
    }
    else if (serviceYears >= 5 && serviceYears <= 9) {
      priceForRow = 0.48;
    }
    else  {
      priceForRow = 0.53;
    }

    // 4. create a new row with defaults from config
    const newRow =  {
      ... configDefaultRow,
      source: CalculationRowSource.Undefined,
      message: configDefaultRow.message || configDefaultRow!.config!.label,
      config: undefined,
      price: priceForRow
     };

    return newRow;
  }

  private calculateLengthOfServiceInYears(salaryDate?: string | null, startDate?: string | null, endDate?: string | null): number | undefined {
    if (!startDate ) {
      return undefined;
    }

    const now = new Date();
    const salary = salaryDate ? new Date(salaryDate + "T00:00:00") : now;
    const employmentEnd = endDate ? new Date(endDate + "T00:00:00") : now;
    const end = new Date(Math.min(salary.getTime(), employmentEnd.getTime()));
    const start = new Date(startDate + "T00:00:00");

    let years = new Date(end).getFullYear() - new Date(start).getFullYear();
    let months = new Date(end).getMonth() - new Date(start).getMonth();
    const days = new Date(end).getDay() - new Date(start).getDay();
    if (days < 0) {
        months -= 1;
    }
    if (months < 0) {
        years -= 1;
    }
    if (years < 0) {
      return undefined;
    }
    return years;
  }
}

/**
 * Rule for adding sick leave compensation row.
 */
export class SickLeaveCompensation implements BeforeCalcScripts {

  private readonly sickLeaveCompensationType = "/custom/sairausajanpalkanlisa";

  /**
   * Inserts a row of type "sairausajanpalkanlisa" if not already present and if the worker is eligible.
   */
  public getRows(current: UserDefinedRow[], ctx: RowContext, _sxy: HelpersRoot): UserDefinedRow[] | undefined {

    // Create a possible sicke leave compensation row
    const sickLeaveCompensationRow = this.getSickLeaveCompensationRow(current, ctx);

    // If no row is to be added, remove possible existing rows
    if (!sickLeaveCompensationRow) {
      return current.filter(r => !(r.type?.startsWith(this.sickLeaveCompensationType) == true));
    }

    // Check if the row is already present
    const existingRow = current.find(r => r.type === sickLeaveCompensationRow.type);
    if (existingRow) {
      Object.assign(existingRow, sickLeaveCompensationRow);
      return current;
    }
    else
    {
      // Remove possible other sick leave compensation rows and add the new one
      current = current.filter(r => !(r.type?.startsWith(this.sickLeaveCompensationType) == true));
      current.push(sickLeaveCompensationRow);
      return current;
    }
  }

  private getSickLeaveCompensationRow(current: UserDefinedRow[], ctx: RowContext): UserDefinedRow | undefined {
    // Rules for the sick leave compensation

    // 1. check if the employee has an hourly salary contract
    if (ctx.employment.work?.wageBasis !== WageBasis.Hourly) {
      return undefined;
    }

    // 2. check that the row for the paid sick leave exists
    const paidSickLeaveRow = current.find(r =>
        r.rowType === CalculationRowType.PaidSickLeave ||
        (r.rowType ==  CalculationRowType.TimeRatePay && r.data?.kind == TimeRatePayKind.PaidSickLeave));
    if (!paidSickLeaveRow) {
      return undefined;
    }

    // 3. check that the price for the sick leave compensation row is non-zero
    const priceForRow = ctx.employment.work?.salaryDefaults?.find(r =>
      r.source == CalculationRowSource.PriceEmployment && r.type === this.sickLeaveCompensationType)?.price;
    if (!priceForRow) {
      return undefined;
    }

    // 4. get the row config
    const configDefaultRow = ctx.settings.calc?.salaryDefaults?.find(r => r.source == CalculationRowSource.CustomRowtype && r.type === this.sickLeaveCompensationType);
    if (!configDefaultRow) {
      return undefined;
    }
    // 5. create a new row with defaults from config
    const newRow =  {
      ... configDefaultRow,
      source: CalculationRowSource.Undefined,
      message: configDefaultRow.message || configDefaultRow!.config!.label,
      config: undefined,
      count: paidSickLeaveRow.count,
      price: priceForRow
     };

    return newRow;
  }
}

/**
 * Rule for adding weekday holiday compensation row.
 */
export class WeekdayHolidayCompensation implements BeforeCalcScripts {

  private readonly weekdayHolidayCompensationType = "/custom/arkipyhakorvaus";

  /**
   * Inserts a row of type "arkipyhakorvaus" if not already present and if the worker is eligible.
   */
  public getRows(current: UserDefinedRow[], ctx: RowContext, _sxy: HelpersRoot): UserDefinedRow[] | undefined {

    // Create a possible weekday holiday compensation row
    const weekdayHolidayCompensationRow = this.getWeekdayHolidayCompensationRow(current, ctx);

    // If no row is to be added, remove possible existing rows
    if (!weekdayHolidayCompensationRow) {
      return current.filter(r => !(r.type?.startsWith(this.weekdayHolidayCompensationType) == true));
    }

    // Check if the row is already present
    const existingRow = current.find(r => r.type === weekdayHolidayCompensationRow.type);
    if (existingRow) {
      Object.assign(existingRow, weekdayHolidayCompensationRow);
      return current;
    }
    else
    {
      // Remove possible other weekday holiday compensation rows and add the new one
      current = current.filter(r => !(r.type?.startsWith(this.weekdayHolidayCompensationType) == true));
      current.push(weekdayHolidayCompensationRow);
      return current;
    }
  }

  private getWeekdayHolidayCompensationRow(current: UserDefinedRow[], ctx: RowContext): UserDefinedRow | undefined {
    // Rules for the weekday holiday compensation

    // 1. check if the employee has an hourly salary contract
    if (ctx.employment.work?.wageBasis !== WageBasis.Hourly) {
      return undefined;
    }

    // 2. get weekday holidays in the period
    const weekdayHolidays = this.getWeekdayHolidays(ctx);
    if (weekdayHolidays.length === 0) {
      return undefined;
    }

    // 3. check the emplyment service months, should be at least 3 months
    const serviceMonths = this.getDiffInMonths(ctx.employment.info?.startDate, weekdayHolidays[0]);
    if (!serviceMonths || serviceMonths < 3) {
      return undefined;
    }

    // 4. resolve price

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
    const priceForRow = round((highest(standardHourlyPrice, averagehourlyPrice)));


    // 5. get the row config
    const configDefaultRow = ctx.settings.calc?.salaryDefaults?.find(r => r.source == CalculationRowSource.CustomRowtype && r.type === this.weekdayHolidayCompensationType);
    if (!configDefaultRow) {
      return undefined;
    }
    // 5. create a new row with defaults from config
    const newRow =  {
      ... configDefaultRow,
      source: CalculationRowSource.Undefined,
      message: configDefaultRow.message || configDefaultRow!.config!.label,
      config: undefined,
      count: 8.0,
      price: priceForRow
     };

    return newRow;
  }

  private getDiffInMonths(dateFrom?: string | null, dateTo?: string | null): number | undefined {
    if (!dateFrom ) {
      return undefined;
    }

    const now = new Date();
    const end = dateTo ? new Date(dateTo + "T00:00:00") : now;
    const start = new Date(dateFrom + "T00:00:00");

    let years = new Date(end).getFullYear() - new Date(start).getFullYear();
    let months = new Date(end).getMonth() - new Date(start).getMonth();
    const days = new Date(end).getDay() - new Date(start).getDay();
    if (days < 0) {
        months -= 1;
    }
    if (months < 0) {
        years -= 1;
    }
    if (years < 0) {
      return undefined;
    }
    return months + (years * 12);
  }

  private getWeekdayHolidays(_ctx: RowContext): string[] {
    // should take into account absences etc.

    const dateFrom = _ctx.calculation.info?.workStartDate;
    if (!dateFrom) {
      return [];
    }
    const dateTo = _ctx.calculation.info?.workEndDate;
    if (!dateTo) {
      return [];
    }

    const weekdayHolidays = ["newYearsDay","epiphany","goodFriday","easterMonday","mayDay","ascensionDay","midsummerEve","christmasEve","christmasDay", "stStephensDay"];
    const allHolidays = holidays.map(h => Object.values(h.holidays))
    .flat()
    .filter(h => weekdayHolidays.indexOf(h.holiday) > -1)
    .map(h => h.date);

    const result: string[] = [];
    const end = new Date(dateTo + "T00:00:00");
    const start = new Date(dateFrom + "T00:00:00");
    if (end <= start) {
      return [];
    }

    while (start <= end) {
      const startDate = start.toISOString().substring(0,10);
      if (allHolidays.indexOf(startDate) > -1) {
        result.push(startDate);
      }
      start.setDate(start.getDate() + 1);
    }

    return result;
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

  const holidays = [
  {
    "year": 2025,
    "holidays": {
      "newYearsDay": {
        "date": "2025-01-01",
        "holiday": "newYearsDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "uudenvuodenpäivä",
        "name": "New Year's Day"
      },
      "epiphany": {
        "date": "2025-01-06",
        "holiday": "epiphany",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "loppiainen",
        "name": "Epiphany"
      },
      "goodFriday": {
        "date": "2025-04-18",
        "holiday": "goodFriday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pitkäperjantai",
        "name": "Good Friday"
      },
      "easterSaturday": {
        "date": "2025-04-19",
        "holiday": "easterSaturday",
        "holidayGroups": [
          "nonBanking",
          "holiday"
        ],
        "localName": "pääsiäislauantai",
        "name": "Easter Saturday"
      },
      "easterSunday": {
        "date": "2025-04-20",
        "holiday": "easterSunday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pääsiäispäivä",
        "name": "Easter Sunday"
      },
      "easterMonday": {
        "date": "2025-04-21",
        "holiday": "easterMonday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "2. pääsiäispäivä",
        "name": "Easter Monday"
      },
      "mayDay": {
        "date": "2025-05-01",
        "holiday": "mayDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "vappu",
        "name": "May Day"
      },
      "ascensionDay": {
        "date": "2025-05-29",
        "holiday": "ascensionDay",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "helatorstai",
        "name": "Ascension Day"
      },
      "pentecost": {
        "date": "2025-06-08",
        "holiday": "pentecost",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "helluntaipäivä",
        "name": "Pentecost"
      },
      "midsummerEve": {
        "date": "2025-06-20",
        "holiday": "midsummerEve",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "juhannusaatto",
        "name": "Midsummer Eve"
      },
      "midsummerDay": {
        "date": "2025-06-21",
        "holiday": "midsummerDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "juhannuspäivä",
        "name": "Midsummer Day"
      },
      "allSaintsDay": {
        "date": "2025-11-01",
        "holiday": "allSaintsDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pyhäinpäivä",
        "name": "All Saints' Day"
      },
      "independenceDay": {
        "date": "2025-12-06",
        "holiday": "independenceDay",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "itsenäisyyspäivä",
        "name": "Independence Day"
      },
      "christmasEve": {
        "date": "2025-12-24",
        "holiday": "christmasEve",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "jouluaatto",
        "name": "Christmas Eve"
      },
      "christmasDay": {
        "date": "2025-12-25",
        "holiday": "christmasDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "joulupäivä",
        "name": "Christmas Day"
      },
      "stStephensDay": {
        "date": "2025-12-26",
        "holiday": "stStephensDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "2. joulupäivä",
        "name": "St. Stephen's Day"
      }
    }
  },
  {
    "year": 2026,
    "holidays": {
      "newYearsDay": {
        "date": "2026-01-01",
        "holiday": "newYearsDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "uudenvuodenpäivä",
        "name": "New Year's Day"
      },
      "epiphany": {
        "date": "2026-01-06",
        "holiday": "epiphany",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "loppiainen",
        "name": "Epiphany"
      },
      "goodFriday": {
        "date": "2026-04-03",
        "holiday": "goodFriday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pitkäperjantai",
        "name": "Good Friday"
      },
      "easterSaturday": {
        "date": "2026-04-04",
        "holiday": "easterSaturday",
        "holidayGroups": [
          "nonBanking",
          "holiday"
        ],
        "localName": "pääsiäislauantai",
        "name": "Easter Saturday"
      },
      "easterSunday": {
        "date": "2026-04-05",
        "holiday": "easterSunday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pääsiäispäivä",
        "name": "Easter Sunday"
      },
      "easterMonday": {
        "date": "2026-04-06",
        "holiday": "easterMonday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "2. pääsiäispäivä",
        "name": "Easter Monday"
      },
      "mayDay": {
        "date": "2026-05-01",
        "holiday": "mayDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "vappu",
        "name": "May Day"
      },
      "ascensionDay": {
        "date": "2026-05-14",
        "holiday": "ascensionDay",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "helatorstai",
        "name": "Ascension Day"
      },
      "pentecost": {
        "date": "2026-05-24",
        "holiday": "pentecost",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "helluntaipäivä",
        "name": "Pentecost"
      },
      "midsummerEve": {
        "date": "2026-06-19",
        "holiday": "midsummerEve",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "juhannusaatto",
        "name": "Midsummer Eve"
      },
      "midsummerDay": {
        "date": "2026-06-20",
        "holiday": "midsummerDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "juhannuspäivä",
        "name": "Midsummer Day"
      },
      "allSaintsDay": {
        "date": "2026-10-31",
        "holiday": "allSaintsDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pyhäinpäivä",
        "name": "All Saints' Day"
      },
      "independenceDay": {
        "date": "2026-12-06",
        "holiday": "independenceDay",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "itsenäisyyspäivä",
        "name": "Independence Day"
      },
      "christmasEve": {
        "date": "2026-12-24",
        "holiday": "christmasEve",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "jouluaatto",
        "name": "Christmas Eve"
      },
      "christmasDay": {
        "date": "2026-12-25",
        "holiday": "christmasDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "joulupäivä",
        "name": "Christmas Day"
      },
      "stStephensDay": {
        "date": "2026-12-26",
        "holiday": "stStephensDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "2. joulupäivä",
        "name": "St. Stephen's Day"
      }
    }
  },
  {
    "year": 2027,
    "holidays": {
      "newYearsDay": {
        "date": "2027-01-01",
        "holiday": "newYearsDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "uudenvuodenpäivä",
        "name": "New Year's Day"
      },
      "epiphany": {
        "date": "2027-01-06",
        "holiday": "epiphany",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "loppiainen",
        "name": "Epiphany"
      },
      "goodFriday": {
        "date": "2027-03-26",
        "holiday": "goodFriday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pitkäperjantai",
        "name": "Good Friday"
      },
      "easterSaturday": {
        "date": "2027-03-27",
        "holiday": "easterSaturday",
        "holidayGroups": [
          "nonBanking",
          "holiday"
        ],
        "localName": "pääsiäislauantai",
        "name": "Easter Saturday"
      },
      "easterSunday": {
        "date": "2027-03-28",
        "holiday": "easterSunday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pääsiäispäivä",
        "name": "Easter Sunday"
      },
      "easterMonday": {
        "date": "2027-03-29",
        "holiday": "easterMonday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "2. pääsiäispäivä",
        "name": "Easter Monday"
      },
      "mayDay": {
        "date": "2027-05-01",
        "holiday": "mayDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "vappu",
        "name": "May Day"
      },
      "ascensionDay": {
        "date": "2027-05-06",
        "holiday": "ascensionDay",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "helatorstai",
        "name": "Ascension Day"
      },
      "pentecost": {
        "date": "2027-05-16",
        "holiday": "pentecost",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "helluntaipäivä",
        "name": "Pentecost"
      },
      "midsummerEve": {
        "date": "2027-06-25",
        "holiday": "midsummerEve",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "juhannusaatto",
        "name": "Midsummer Eve"
      },
      "midsummerDay": {
        "date": "2027-06-26",
        "holiday": "midsummerDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "juhannuspäivä",
        "name": "Midsummer Day"
      },
      "allSaintsDay": {
        "date": "2027-11-06",
        "holiday": "allSaintsDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pyhäinpäivä",
        "name": "All Saints' Day"
      },
      "independenceDay": {
        "date": "2027-12-06",
        "holiday": "independenceDay",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "itsenäisyyspäivä",
        "name": "Independence Day"
      },
      "christmasEve": {
        "date": "2027-12-24",
        "holiday": "christmasEve",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "jouluaatto",
        "name": "Christmas Eve"
      },
      "christmasDay": {
        "date": "2027-12-25",
        "holiday": "christmasDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "joulupäivä",
        "name": "Christmas Day"
      },
      "stStephensDay": {
        "date": "2027-12-26",
        "holiday": "stStephensDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "2. joulupäivä",
        "name": "St. Stephen's Day"
      }
    }
  },
  {
    "year": 2028,
    "holidays": {
      "newYearsDay": {
        "date": "2028-01-01",
        "holiday": "newYearsDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "uudenvuodenpäivä",
        "name": "New Year's Day"
      },
      "epiphany": {
        "date": "2028-01-06",
        "holiday": "epiphany",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "loppiainen",
        "name": "Epiphany"
      },
      "goodFriday": {
        "date": "2028-04-14",
        "holiday": "goodFriday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pitkäperjantai",
        "name": "Good Friday"
      },
      "easterSaturday": {
        "date": "2028-04-15",
        "holiday": "easterSaturday",
        "holidayGroups": [
          "nonBanking",
          "holiday"
        ],
        "localName": "pääsiäislauantai",
        "name": "Easter Saturday"
      },
      "easterSunday": {
        "date": "2028-04-16",
        "holiday": "easterSunday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pääsiäispäivä",
        "name": "Easter Sunday"
      },
      "easterMonday": {
        "date": "2028-04-17",
        "holiday": "easterMonday",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "2. pääsiäispäivä",
        "name": "Easter Monday"
      },
      "mayDay": {
        "date": "2028-05-01",
        "holiday": "mayDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "vappu",
        "name": "May Day"
      },
      "ascensionDay": {
        "date": "2028-05-25",
        "holiday": "ascensionDay",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "helatorstai",
        "name": "Ascension Day"
      },
      "pentecost": {
        "date": "2028-06-04",
        "holiday": "pentecost",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "helluntaipäivä",
        "name": "Pentecost"
      },
      "midsummerEve": {
        "date": "2028-06-23",
        "holiday": "midsummerEve",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "juhannusaatto",
        "name": "Midsummer Eve"
      },
      "midsummerDay": {
        "date": "2028-06-24",
        "holiday": "midsummerDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "juhannuspäivä",
        "name": "Midsummer Day"
      },
      "allSaintsDay": {
        "date": "2028-11-04",
        "holiday": "allSaintsDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "pyhäinpäivä",
        "name": "All Saints' Day"
      },
      "independenceDay": {
        "date": "2028-12-06",
        "holiday": "independenceDay",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "itsenäisyyspäivä",
        "name": "Independence Day"
      },
      "christmasEve": {
        "date": "2028-12-24",
        "holiday": "christmasEve",
        "holidayGroups": [
          "official",
          "holiday"
        ],
        "localName": "jouluaatto",
        "name": "Christmas Eve"
      },
      "christmasDay": {
        "date": "2028-12-25",
        "holiday": "christmasDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "joulupäivä",
        "name": "Christmas Day"
      },
      "stStephensDay": {
        "date": "2028-12-26",
        "holiday": "stStephensDay",
        "holidayGroups": [
          "official",
          "nonBanking",
          "holiday"
        ],
        "localName": "2. joulupäivä",
        "name": "St. Stephen's Day"
      }
    }
  }
];