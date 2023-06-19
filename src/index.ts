import express from "express";
import cors from "cors";
import morgan from "morgan";
import axios from "axios";
import bodyParser from "body-parser";
import qs from "qs";
import sha256 from "sha256";

import { log } from "./lib/Logger";

import { APIResponse } from "./types/APIResponse";
import { TimetableMetaResponse, TimetableResponse, WeeknumResponse } from "./types/PenzGTUAPIResponse";

const app = express();
const port = 3000;

const sendRequest = async (methodName, args, signature) => {
    try {
        const requestData = qs.stringify({
            method_name: methodName,
            ...args,
            signature: signature,
        });

        const config = {
            method: "post",
            url: "http://android.penzgtu.ru/apps/penzgtuappandroid/api",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: requestData,
        };

        log.debug(config);

        const response = await axios.request(config);

        // log.debug(response);

        if (response.data.error) {
            return {
                status: "error",
                message: `${response.data.error} -- ${response.data.desc}`,
            };
        }

        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.log(Object.keys(error), error.message);
            return { status: "error", message: error.message };
        } else {
            console.log("Unknown error", error);
            return { status: "error", message: JSON.stringify(error) };
        }
    }
};

function generateSignature(method, args) {
    let appKey = "LLzaP6k6bhDRwf56j31E";
    let appCode = "penzgtuappandroid";

    let signature = `${method}/${appKey}/method_name=${method}`;

    if (args) {
        let isFirstArg = true;
        Object.entries(args).forEach(([key, value]) => {
            signature += `${isFirstArg ? "" : "&"}${appCode}:${key}=${value}`;
            isFirstArg = false;
        });
    }

    return sha256(signature);
}

const makeRequest = async (methodName, args = {}) => {
    const signature = generateSignature(methodName, args);
    const response = await sendRequest(methodName, args, signature);
    return response;
};

const getTimetableMeta = async () => {
    const response = await makeRequest("getTimetableMeta");
    return response;
};

const getWeekNum = async () => {
    const response = await makeRequest("getWeekNum");
    return response;
};

const getTimetable = async (tt_level, tt_form, tt_type, tt_year, tt_group) => {
    const methodName = "getTimetable";
    const args = {
        "penzgtuappandroid:tt_level": tt_level,
        "penzgtuappandroid:tt_form": tt_form,
        "penzgtuappandroid:tt_type": tt_type,
        "penzgtuappandroid:tt_year": tt_year,
        "penzgtuappandroid:tt_group": tt_group,
    };
    const response = await makeRequest(methodName, args);
    return response;
};

const getAttestation = async (tt_level, tt_form, tt_type, tt_stream, tt_group) => {
    const methodName = "getTimetable";
    const args = {
        "penzgtuappandroid:tt_level": tt_level,
        "penzgtuappandroid:tt_form": tt_form,
        "penzgtuappandroid:tt_type": tt_type,
        "penzgtuappandroid:tt_stream": tt_stream,
        "penzgtuappandroid:tt_group": tt_group,
    };
    const response = await makeRequest(methodName, args);
    return response;
};

app.use(morgan("tiny"))
    .use(cors())
    .use(bodyParser.json())
    .use(express.urlencoded({ extended: true }))
    .get("/", (req, res) => {
        let response: APIResponse;

        response = { status: "ok", message: "Example timetable API. Keep in mind -- only POST requests are accepted." };
        res.json(response);
    })
    .post("/", (req, res) => {
        let response: APIResponse;

        response = { status: "ok", message: "Example timetable API." };
        res.json(response);
    })
    .post("/getWeekNum", async (req, res) => {
        let response: APIResponse;

        const weekNum = await getWeekNum();

        if (!weekNum.error) {
            if (weekNum.data) {
                response = { status: "ok", data: { weeknum: weekNum.data.weeknum } };
            } else {
                response = {
                    status: "error",
                    message: "PenzGTU API returned no errors, but data object contains no weeknum",
                };
            }
        } else {
            response = { status: "error", message: "ya oshibka pomojite" };
        }

        res.json(response);
    })
    .post("/getLevels", async (req, res) => {
        let response: APIResponse;

        const timetableMeta = await getTimetableMeta();

        if (!timetableMeta.error) {
            if (timetableMeta.data) {
                const levels = {};

                Object.keys(timetableMeta.data.level).forEach(
                    (level) => (levels[level] = timetableMeta.data?.level[level].title)
                );

                response = { status: "ok", data: levels };
            } else {
                response = {
                    status: "error",
                    message: "PenzGTU API returned no errors, but data object contains no levels",
                };
            }
        } else {
            response = { status: "error", message: "ya oshibka pomojite" };
        }

        res.json(response);
    })
    .post("/getForms", async (req, res) => {
        let response: APIResponse;

        const level: string = req.body.level;

        if (!level) {
            response = { status: "error", message: "missing level" };
            return res.json(response);
        }

        const timetableMeta = await getTimetableMeta();

        if (!timetableMeta.error) {
            if (timetableMeta.data) {
                const forms = {};

                Object.keys(timetableMeta.data.level[level].form).forEach(
                    (form) => (forms[form] = timetableMeta.data?.level[level].form[form].title)
                );

                response = { status: "ok", data: forms };
                // response = { status: "ok", data: timetableMeta.data?.level[level].form };
            } else {
                response = {
                    status: "error",
                    message: "PenzGTU API returned no errors, but data object contains no levels",
                };
            }
        } else {
            response = { status: "error", message: "ya oshibka pomojite" };
        }

        res.json(response);
    })
    .post("/getTypes", async (req, res) => {
        let response: APIResponse;

        const level: string = req.body.level;
        const form: string = req.body.form;

        if (!level) {
            response = { status: "error", message: "missing level" };
            return res.json(response);
        } else if (!form) {
            response = { status: "error", message: "missing form" };
            return res.json(response);
        }

        const timetableMeta = await getTimetableMeta();

        if (!timetableMeta.error) {
            if (timetableMeta.data) {
                const types = {};

                Object.keys(timetableMeta.data.level[level].form[form].type).forEach(
                    (type) =>
                        (types[type] =
                            type === "tt"
                                ? "Расписание занятий"
                                : type === "att"
                                ? "Промежуточная аттестация"
                                : "Неизвестный тип расписания")
                );

                response = { status: "ok", data: types };
                // response = { status: "ok", data: timetableMeta.data.level[level].form[form].type };
            } else {
                response = {
                    status: "error",
                    message: "PenzGTU API returned no errors, but data object contains no levels",
                };
            }
        } else {
            response = { status: "error", message: "ya oshibka pomojite" };
        }

        res.json(response);
    })
    .post("/getYears", async (req, res) => {
        let response: APIResponse;

        const level: string = req.body.level;
        const form: string = req.body.form;
        const type: string = req.body.type;
        if (!level) {
            response = { status: "error", message: "missing level" };
            return res.json(response);
        } else if (!form) {
            response = { status: "error", message: "missing form" };
            return res.json(response);
        } else if (!type) {
            response = { status: "error", message: "missing type" };
            return res.json(response);
        } else if (type !== "tt") {
            response = { status: "error", message: "/getYears is reserved for type=tt" };
            return res.json(response);
        }

        const timetableMeta = await getTimetableMeta();

        if (!timetableMeta.error) {
            if (timetableMeta.data) {
                const years = {};

                timetableMeta.data.level[level].form[form].type[type]?.years.forEach((year) => {
                    years[year.index] = year.title;
                });

                response = { status: "ok", data: years };
                // response = { status: "ok", data: timetableMeta.data.level[level].form[form].type[type]?.years };
            } else {
                response = {
                    status: "error",
                    message: "PenzGTU API returned no errors, but data object contains no levels",
                };
            }
        } else {
            response = { status: "error", message: "ya oshibka pomojite" };
        }

        res.json(response);
    })
    .post("/getStreams", async (req, res) => {
        let response: APIResponse;

        const level: string = req.body.level;
        const form: string = req.body.form;
        const type: string = req.body.type;
        if (!level) {
            response = { status: "error", message: "missing level" };
            return res.json(response);
        } else if (!form) {
            response = { status: "error", message: "missing form" };
            return res.json(response);
        } else if (!type) {
            response = { status: "error", message: "missing type" };
            return res.json(response);
        } else if (type !== "att") {
            response = { status: "error", message: "/getStreams is reserved for type=tt" };
            return res.json(response);
        }

        const timetableMeta = await getTimetableMeta();

        if (!timetableMeta.error) {
            if (timetableMeta.data) {
                const streams = {};

                timetableMeta.data.level[level].form[form].type[type]?.streams.forEach((stream) => {
                    streams[stream.title] = stream.title;
                });

                response = { status: "ok", data: streams };
                // response = { status: "ok", data: timetableMeta.data.level[level].form[form].type[type]?.years };
            } else {
                response = {
                    status: "error",
                    message: "PenzGTU API returned no errors, but data object contains no levels",
                };
            }
        } else {
            response = { status: "error", message: "ya oshibka pomojite" };
        }

        res.json(response);
    })
    .post("/getGroups", async (req, res) => {
        let response: APIResponse;

        const level: string = req.body.level;
        const form: string = req.body.form;
        const type: string = req.body.type;
        const year: string | undefined = req.body.year;
        const stream: string | undefined = req.body.stream;

        if (!level) {
            response = { status: "error", message: "missing level" };
            return res.json(response);
        } else if (!form) {
            response = { status: "error", message: "missing form" };
            return res.json(response);
        } else if (!type) {
            response = { status: "error", message: "missing type" };
            return res.json(response);
        } else if (!year && !stream) {
            response = { status: "error", message: "missing year/stream" };
            return res.json(response);
        } else if (type === "tt" && (!year || stream)) {
            response = { status: "error", message: "type=tt requires year" };
            return res.json(response);
        } else if (type === "att" && (year || !stream)) {
            response = { status: "error", message: "type=tt requires stream" };
            return res.json(response);
        }

        const timetableMeta = await getTimetableMeta();

        if (!timetableMeta.error) {
            if (timetableMeta.data) {
                let groups;

                if (year) {
                    groups = timetableMeta.data.level[level].form[form].type[type]?.years.filter(
                        (el) => el.index === parseInt(year)
                    );

                    groups = groups.length > 0 ? groups[0].groups : [];
                } else {
                    groups = timetableMeta.data.level[level].form[form].type[type]?.streams.filter(
                        (el) => el.title === stream
                    );

                    groups = groups.length > 0 ? groups[0].groups : [];
                }

                if (groups.length < 1) {
                    response = { status: "error", message: "No groups found for given parameters" };
                } else response = { status: "ok", data: groups };
            } else {
                response = {
                    status: "error",
                    message: "PenzGTU API returned no errors, but data object contains no levels",
                };
            }
        } else {
            response = { status: "error", message: "ya oshibka pomojite" };
        }

        res.json(response);
    })
    .post("/getTimetable", async (req, res) => {
        let response: APIResponse;

        const level: string = req.body.level;
        const form: string = req.body.form;
        const type: string = req.body.type;
        const year: string | undefined = req.body.year;
        const stream: string | undefined = req.body.stream;
        const group: string = req.body.group;

        if (!level) {
            response = { status: "error", message: "missing level" };
            return res.json(response);
        } else if (!form) {
            response = { status: "error", message: "missing form" };
            return res.json(response);
        } else if (!type) {
            response = { status: "error", message: "missing type" };
            return res.json(response);
        } else if (!year && !stream) {
            response = { status: "error", message: "missing year/stream" };
            return res.json(response);
        } else if (type === "tt" && (!year || stream)) {
            response = { status: "error", message: "type=tt requires year" };
            return res.json(response);
        } else if (type === "att" && (year || !stream)) {
            response = { status: "error", message: "type=tt requires stream" };
            return res.json(response);
        } else if (!group) {
            response = { status: "error", message: "missing group" };
            return res.json(response);
        }

        let timetable;
        if (type === "tt" && typeof year === "string") timetable = await getTimetable(level, form, type, year, group);
        if (type === "att" && typeof stream === "string")
            timetable = await getAttestation(level, form, type, stream, group);

        if (!timetable.error) {
            if (timetable.data) {
                response = { status: "ok", data: timetable.data };
            } else {
                response = {
                    status: "error",
                    message: "PenzGTU API returned no errors, but data field is empty",
                };
            }
        } else {
            response = { status: "error", message: "ya oshibka pomojite" };
        }

        res.json(response);
    })
    .listen(port, () => {
        log.debug(`[server]: Server is running at http://localhost:${port}`);
    });
