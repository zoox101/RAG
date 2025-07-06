
//------------------------------------------------------------------------------------------------//

export type Log = {
    startTimestamp: number;
    percentAllocations: PercentAllocation[];
    endTimestamp: number;
}

//------------------------------------------------------------------------------------------------//

export type PercentAllocation = {
    projectName: string;
    percent: number;
}

export type TimeAllocation = {
    projectName: string;
    seconds: number;
    // roundoff: number;
}

//------------------------------------------------------------------------------------------------//

export type DailyAllocation = {
    date: Date;
    timeAllocations: TimeAllocation[];
}

export type AccountingPeriod = {
    dateStart: Date;
    dateEnd: Date;
    workingDays: Date[];
    dailyAllocations: DailyAllocation[];
}

export type Month = {
    month: Date;
    targetAllocations: TimeAllocation[];
    accountingPeriods: AccountingPeriod[];
}

//------------------------------------------------------------------------------------------------//

export type Project = {
    name: string;
    color: string;
}

//------------------------------------------------------------------------------------------------//

export type State = {
    currentTime: number;
    projects: Project[];
    logs: Log[];
    months: Month[];
}

//------------------------------------------------------------------------------------------------//
