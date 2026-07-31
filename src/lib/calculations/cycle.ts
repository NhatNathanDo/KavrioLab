import { addDays, differenceInCalendarDays, format, parseISO } from '@/lib/utils/dateUtils';

export type CyclePhase = 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL';

export type FertilityStatus = 'SAFE' | 'MODERATE_FERTILE' | 'HIGH_FERTILE' | 'PERIOD';

export interface MenstrualCycleData {
  id: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  cycleLengthDays?: number | null;
  periodLengthDays?: number | null;
  notes?: string | null;
}

export interface CycleOverview {
  avgCycleLength: number;
  avgPeriodLength: number;
  currentCycleDay: number;
  currentPhase: CyclePhase;
  fertilityStatus: FertilityStatus;
  isFertileWindow: boolean;
  pregnancyRiskText: { en: string; vi: string };
  lastPeriodStartDate: string;
  predictedNextPeriod: string;
  predictedOvulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  daysUntilNextPeriod: number;
  isLate: boolean;
  daysLate: number;
  expectedNextPeriod: string;
}

export interface DayCycleStatus {
  isLoggedPeriod: boolean;
  isPredictedPeriod: boolean;
  isFertileWindow: boolean;
  isOvulationDay: boolean;
  isSafeDay: boolean;
  isLatePeriodDay?: boolean;
  daysLate?: number;
  cycleDay: number;
  pregnancyProbability?: string;
}

export function getCustomDefaults(cycles: MenstrualCycleData[]): {
  defaultCycleLength: number;
  defaultPeriodLength: number;
  hasCustomDefaultCycle: boolean;
  hasCustomDefaultPeriod: boolean;
} {
  let defaultCycleLength = 28;
  let defaultPeriodLength = 5;
  let hasCustomDefaultCycle = false;
  let hasCustomDefaultPeriod = false;

  const sorted = [...cycles].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  sorted.forEach((c) => {
    if (c.notes) {
      const cycleMatch = c.notes.match(/\[DefaultCycle:\s*(\d+)\]/i);
      const periodMatch = c.notes.match(/\[DefaultPeriod:\s*(\d+)\]/i);
      if (cycleMatch) {
        defaultCycleLength = parseInt(cycleMatch[1], 10);
        hasCustomDefaultCycle = true;
      } else {
        const obCycleMatch = c.notes.match(/Avg Cycle:\s*(\d+)/i);
        if (obCycleMatch) {
          defaultCycleLength = parseInt(obCycleMatch[1], 10);
        }
      }
      if (periodMatch) {
        defaultPeriodLength = parseInt(periodMatch[1], 10);
        hasCustomDefaultPeriod = true;
      } else {
        const obPeriodMatch = c.notes.match(/Duration:\s*(\d+)/i);
        if (obPeriodMatch) {
          defaultPeriodLength = parseInt(obPeriodMatch[1], 10);
        }
      }
    }
  });

  return { defaultCycleLength, defaultPeriodLength, hasCustomDefaultCycle, hasCustomDefaultPeriod };
}

function calculatePregnancyProbability(
  isLoggedPeriod: boolean,
  isPredictedPeriod: boolean,
  isFertileWindow: boolean,
  isOvulationDay: boolean,
  diffFromOvulation: number
): string {
  if (isLoggedPeriod || isPredictedPeriod) {
    return '<1%';
  }
  if (isFertileWindow) {
    if (isOvulationDay) return '33%';
    if (diffFromOvulation === -1) return '30%';
    if (diffFromOvulation === -2) return '25%';
    if (diffFromOvulation === -3) return '15%';
    if (diffFromOvulation === -4) return '12%';
    if (diffFromOvulation === -5) return '5%';
    if (diffFromOvulation === 1) return '10%';
    return '<5%';
  }
  return '<1%';
}

/**
 * Computes cycle stats and predictive ovulation/period dates based on historical cycle logs
 */
export function calculateCycleOverview(
  cycles: MenstrualCycleData[],
  targetDateInput: Date | string = new Date()
): CycleOverview {
  const targetDate = typeof targetDateInput === 'string' ? parseISO(targetDateInput) : targetDateInput;
  
  // Sort cycles by startDate ascending
  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const { defaultCycleLength, defaultPeriodLength, hasCustomDefaultCycle, hasCustomDefaultPeriod } = getCustomDefaults(cycles);
  let avgCycleLength = defaultCycleLength;
  let avgPeriodLength = defaultPeriodLength;

  if (sortedCycles.length > 0) {
    // Compute period lengths where endDate is available
    const periodLengths: number[] = [];
    sortedCycles.forEach((c) => {
      if (c.startDate && c.endDate) {
        const pLen = Math.max(1, differenceInCalendarDays(new Date(c.endDate), new Date(c.startDate)) + 1);
        periodLengths.push(pLen);
      }
    });

    if (hasCustomDefaultPeriod) {
      avgPeriodLength = defaultPeriodLength;
    } else if (periodLengths.length > 0) {
      avgPeriodLength = Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length);
    }

    // Compute cycle lengths between consecutive period start dates
    const cycleLengths: number[] = [];
    for (let i = 1; i < sortedCycles.length; i++) {
      const cLen = differenceInCalendarDays(
        new Date(sortedCycles[i].startDate),
        new Date(sortedCycles[i - 1].startDate)
      );
      if (cLen >= 15 && cLen <= 50) {
        cycleLengths.push(cLen);
      }
    }

    if (hasCustomDefaultCycle) {
      avgCycleLength = defaultCycleLength;
    } else if (cycleLengths.length > 0) {
      // Weighted average giving higher weight to recent cycles
      let weightedSum = 0;
      let totalWeight = 0;
      cycleLengths.forEach((len, idx) => {
        const weight = idx + 1;
        weightedSum += len * weight;
        totalWeight += weight;
      });
      avgCycleLength = Math.round(weightedSum / totalWeight);
    }
  }

  // Determine last period start date
  const lastCycle = sortedCycles.length > 0 ? sortedCycles[sortedCycles.length - 1] : null;
  const lastPeriodStartDate = lastCycle
    ? new Date(lastCycle.startDate)
    : addDays(targetDate, -Math.floor(avgCycleLength / 2));

  // Scheduled expected next period
  const expectedNextPeriodDate = addDays(lastPeriodStartDate, avgCycleLength);
  const diffFromExpected = differenceInCalendarDays(targetDate, expectedNextPeriodDate);
  const isLate = diffFromExpected >= 0;
  const daysLate = isLate ? diffFromExpected + 1 : 0;

  // Effective predicted next period start date
  const predictedNextPeriodDate = isLate ? targetDate : expectedNextPeriodDate;
  const daysUntilNextPeriod = isLate ? -daysLate : differenceInCalendarDays(expectedNextPeriodDate, targetDate);

  // Cycle day calculations
  const daysSinceStart = differenceInCalendarDays(targetDate, lastPeriodStartDate);
  const currentCycleDay = daysSinceStart + 1;

  const ovulationDayIndex = avgCycleLength - 14;
  const predictedOvulationDate = addDays(lastPeriodStartDate, ovulationDayIndex);
  const fertileWindowStart = addDays(predictedOvulationDate, -5);
  const fertileWindowEnd = addDays(predictedOvulationDate, 1);

  // Phase Determination
  let currentPhase: CyclePhase = 'FOLLICULAR';
  let fertilityStatus: FertilityStatus = 'SAFE';

  if (currentCycleDay <= avgPeriodLength) {
    currentPhase = 'MENSTRUAL';
    fertilityStatus = 'PERIOD';
  } else if (currentCycleDay < ovulationDayIndex - 5) {
    currentPhase = 'FOLLICULAR';
    fertilityStatus = 'SAFE';
  } else if (currentCycleDay <= ovulationDayIndex + 1) {
    currentPhase = 'OVULATORY';
    if (currentCycleDay >= ovulationDayIndex - 2 && currentCycleDay <= ovulationDayIndex + 1) {
      fertilityStatus = 'HIGH_FERTILE';
    } else {
      fertilityStatus = 'MODERATE_FERTILE';
    }
  } else {
    currentPhase = 'LUTEAL';
    fertilityStatus = 'SAFE';
  }

  const isFertileWindow = fertilityStatus === 'HIGH_FERTILE' || fertilityStatus === 'MODERATE_FERTILE';

  const diffFromOvulationToday = currentCycleDay - ovulationDayIndex;
  const probToday = calculatePregnancyProbability(
    fertilityStatus === 'PERIOD',
    false,
    isFertileWindow,
    fertilityStatus === 'HIGH_FERTILE' && diffFromOvulationToday === 0,
    diffFromOvulationToday
  );

  const pregnancyRiskText = {
    en: isLate
      ? `Period is ${daysLate} day${daysLate > 1 ? 's' : ''} late based on expected start date (${format(expectedNextPeriodDate, 'MMM dd')}).`
      : fertilityStatus === 'HIGH_FERTILE'
      ? `High Fertility — High Chance of Pregnancy (~${probToday})`
      : fertilityStatus === 'MODERATE_FERTILE'
      ? `Moderate Fertility — Increased Pregnancy Risk (~${probToday})`
      : fertilityStatus === 'PERIOD'
      ? 'Menstrual Phase — Low Fertility (<1%)'
      : 'Safe Window — Low Pregnancy Risk (<1%)',
    vi: isLate
      ? `Trễ kinh ${daysLate} ngày so với dự đoán ban đầu (${format(expectedNextPeriodDate, 'dd/MM')}).`
      : fertilityStatus === 'HIGH_FERTILE'
      ? `Khả năng thụ thai cao — Thời điểm dễ thụ thai (Khoảng ${probToday})`
      : fertilityStatus === 'MODERATE_FERTILE'
      ? `Khả năng thụ thai trung bình — Thời điểm thụ thai (Khoảng ${probToday})`
      : fertilityStatus === 'PERIOD'
      ? 'Giai đoạn hành kinh — Khả năng thụ thai rất thấp (<1%)'
      : 'Ngày an toàn — Khả năng thụ thai rất thấp (<1%)',
  };

  return {
    avgCycleLength,
    avgPeriodLength,
    currentCycleDay,
    currentPhase,
    fertilityStatus,
    isFertileWindow,
    pregnancyRiskText,
    lastPeriodStartDate: format(lastPeriodStartDate, 'yyyy-MM-dd'),
    predictedNextPeriod: format(predictedNextPeriodDate, 'yyyy-MM-dd'),
    predictedOvulationDate: format(predictedOvulationDate, 'yyyy-MM-dd'),
    fertileWindowStart: format(fertileWindowStart, 'yyyy-MM-dd'),
    fertileWindowEnd: format(fertileWindowEnd, 'yyyy-MM-dd'),
    daysUntilNextPeriod,
    isLate,
    daysLate,
    expectedNextPeriod: format(expectedNextPeriodDate, 'yyyy-MM-dd'),
  };
}

/**
 * Computes exact cycle status and predictions for any specific calendar day
 */
export function getDayCycleStatus(
  day: Date,
  cycles: MenstrualCycleData[],
  avgCycleLength: number = 28,
  avgPeriodLength: number = 5,
  referenceDateInput: Date | string = new Date()
): DayCycleStatus {
  const dateStr = format(day, 'yyyy-MM-dd');

  const toDate = (d: string | Date): Date => (typeof d === 'string' ? parseISO(d) : d);
  const referenceDate = toDate(referenceDateInput);
  const refStr = format(referenceDate, 'yyyy-MM-dd');

  const { defaultCycleLength, defaultPeriodLength, hasCustomDefaultCycle, hasCustomDefaultPeriod } = getCustomDefaults(cycles);
  const finalCycleLength = hasCustomDefaultCycle ? defaultCycleLength : avgCycleLength;
  const finalPeriodLength = hasCustomDefaultPeriod ? defaultPeriodLength : avgPeriodLength;

  // Check logged periods
  const loggedCycle = cycles.find((c) => {
    const startStr = format(toDate(c.startDate), 'yyyy-MM-dd');
    if (!c.endDate) {
      // If ongoing, all days from startDate up to referenceDate (today) are logged period days
      return dateStr >= startStr && dateStr <= refStr;
    }
    const endStr = format(toDate(c.endDate), 'yyyy-MM-dd');
    return dateStr >= startStr && dateStr <= endStr;
  });

  if (loggedCycle) {
    const start = toDate(loggedCycle.startDate);
    const cycleDay = differenceInCalendarDays(day, start) + 1;
    return {
      isLoggedPeriod: true,
      isPredictedPeriod: false,
      isFertileWindow: false,
      isOvulationDay: false,
      isSafeDay: false,
      cycleDay,
      pregnancyProbability: '<1%',
    };
  }

  if (cycles.length === 0) {
    return {
      isLoggedPeriod: false,
      isPredictedPeriod: false,
      isFertileWindow: false,
      isOvulationDay: false,
      isSafeDay: true,
      cycleDay: 1,
      pregnancyProbability: '<1%',
    };
  }

  // Sort cycles ascending
  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  const lastCycle = sortedCycles[sortedCycles.length - 1];
  const lastStart = toDate(lastCycle.startDate);

  const expectedNextStart = addDays(lastStart, finalCycleLength);
  const expectedNextStartStr = format(expectedNextStart, 'yyyy-MM-dd');

  // Check if period is late relative to referenceDate (today)
  const isPeriodLate = refStr >= expectedNextStartStr;

  if (isPeriodLate) {
    // If period is late:
    // Past days (before referenceDate/today) in the expected window are NO LONGER predicted period.
    // Shift prediction window to start from referenceDate (today)!
    const effectivePredictedStart = refStr;
    const effectivePredictedEnd = format(addDays(referenceDate, finalPeriodLength - 1), 'yyyy-MM-dd');

    const isPredictedPeriod = dateStr >= effectivePredictedStart && dateStr <= effectivePredictedEnd;

    const ovulationDate = addDays(lastStart, finalCycleLength - 14);
    const ovulationStr = format(ovulationDate, 'yyyy-MM-dd');
    const fertileStartStr = format(addDays(ovulationDate, -5), 'yyyy-MM-dd');
    const fertileEndStr = format(addDays(ovulationDate, 1), 'yyyy-MM-dd');

    const isOvulationDay = dateStr === ovulationStr;
    const isFertileWindow = dateStr >= fertileStartStr && dateStr <= fertileEndStr;
    const isSafeDay = !isPredictedPeriod && !isFertileWindow;

    const diffFromLastStart = differenceInCalendarDays(day, lastStart);
    const dayInCycle = diffFromLastStart + 1;

    const diffFromOvulation = differenceInCalendarDays(day, ovulationDate);
    const pregnancyProbability = calculatePregnancyProbability(
      false,
      isPredictedPeriod,
      isFertileWindow,
      isOvulationDay,
      diffFromOvulation
    );

    return {
      isLoggedPeriod: false,
      isPredictedPeriod,
      isFertileWindow,
      isOvulationDay,
      isSafeDay,
      cycleDay: dayInCycle,
      pregnancyProbability,
    };
  }

  // Standard case (period is not late yet):
  const diffFromLastStart = differenceInCalendarDays(day, lastStart);

  if (diffFromLastStart < 0) {
    return {
      isLoggedPeriod: false,
      isPredictedPeriod: false,
      isFertileWindow: false,
      isOvulationDay: false,
      isSafeDay: true,
      cycleDay: 1,
      pregnancyProbability: '<1%',
    };
  }

  const cycleIndex = Math.floor(diffFromLastStart / finalCycleLength);
  const dayInCycle = (diffFromLastStart % finalCycleLength) + 1;
  const ovulationDay = finalCycleLength - 14;

  const isPredictedPeriod =
    (cycleIndex > 0 || (cycleIndex === 0 && !lastCycle.endDate)) &&
    dayInCycle <= finalPeriodLength;
  const isOvulationDay = dayInCycle === ovulationDay;
  const isFertileWindow = dayInCycle >= ovulationDay - 5 && dayInCycle <= ovulationDay + 1;
  const isSafeDay = !isPredictedPeriod && !isFertileWindow;

  const diffFromOvulation = dayInCycle - ovulationDay;
  const pregnancyProbability = calculatePregnancyProbability(
    false,
    isPredictedPeriod,
    isFertileWindow,
    isOvulationDay,
    diffFromOvulation
  );

  return {
    isLoggedPeriod: false,
    isPredictedPeriod,
    isFertileWindow,
    isOvulationDay,
    isSafeDay,
    cycleDay: dayInCycle,
    pregnancyProbability,
  };
}
