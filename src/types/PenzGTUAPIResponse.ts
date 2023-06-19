export interface TimetableMetaResponse {
    status: string;
    error?: number;
    desc?: string;
    data?: { level: { [levelName: string]: Level } };
}

export interface WeeknumResponse {
    status: string;
    error?: number;
    desc?: string;
    data?: { weeknum: number };
}

export interface TimetableResponse {
    status: string;
    error?: number;
    desc?: string;
    data?: {
        group: string;
        data: {
            [dayIndex: string]: {
                title: string;
                data: {
                    [subjectIndex: string]: {
                        time: string;
                        time_style: string;
                        subject: string;
                    };
                };
            };
        };
    };
}

interface Level {
    title: string;
    form: Forms;
}

interface Forms {
    [form: string]: Form;
}

interface Form {
    title: string;
    full_title: string | null;
    type: Types;
}

interface Types {
    tt?: Timetable;
    att?: Attestation;
    // [type: string]: Timetable | Attestation;
}

interface Timetable {
    years: Year[];
}

interface Attestation {
    streams: Stream[];
}

interface Year {
    index: number;
    title: string;
    groups: Groups;
}

interface Stream {
    title: string;
    groups: Groups;
}

interface Groups {
    [index: string]: string;
}
