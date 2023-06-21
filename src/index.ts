import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";

import { APIResponse } from "./types/APIResponse";
import { getAttestation, getTimetable, getTimetableMeta, getWeekNum, makeRequest } from "./lib/PenzGTUAPI";

const app = express();
const port = 3000;

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
            response = {
                status: "error",
                message: "An error occurred while fetching the week number from PenzGTU API",
            };
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
            response = {
                status: "error",
                message: "An error occurred while fetching the week number from PenzGTU API",
            };
        }

        res.json(response);
    })
    .post("/getForms", async (req, res) => {
        let response: APIResponse;

        const level: string = req.body.level;

        if (!level) {
            response = { status: "error", message: "Missing level" };
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
            response = {
                status: "error",
                message: "An error occurred while fetching the week number from PenzGTU API",
            };
        }

        res.json(response);
    })
    .post("/getTypes", async (req, res) => {
        let response: APIResponse;

        const level: string = req.body.level;
        const form: string = req.body.form;

        if (!level) {
            response = { status: "error", message: "Missing level" };
            return res.json(response);
        } else if (!form) {
            response = { status: "error", message: "Missing form" };
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
            response = {
                status: "error",
                message: "An error occurred while fetching the week number from PenzGTU API",
            };
        }

        res.json(response);
    })
    .post("/getYears", async (req, res) => {
        let response: APIResponse;

        const level: string = req.body.level;
        const form: string = req.body.form;
        const type: string = req.body.type;
        if (!level) {
            response = { status: "error", message: "Missing level" };
            return res.json(response);
        } else if (!form) {
            response = { status: "error", message: "Missing form" };
            return res.json(response);
        } else if (!type) {
            response = { status: "error", message: "Missing type" };
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
            response = {
                status: "error",
                message: "An error occurred while fetching the week number from PenzGTU API",
            };
        }

        res.json(response);
    })
    .post("/getStreams", async (req, res) => {
        let response: APIResponse;

        const level: string = req.body.level;
        const form: string = req.body.form;
        const type: string = req.body.type;
        if (!level) {
            response = { status: "error", message: "Missing level" };
            return res.json(response);
        } else if (!form) {
            response = { status: "error", message: "Missing form" };
            return res.json(response);
        } else if (!type) {
            response = { status: "error", message: "Missing type" };
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
            response = {
                status: "error",
                message: "An error occurred while fetching the week number from PenzGTU API",
            };
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
            response = { status: "error", message: "Missing level" };
            return res.json(response);
        } else if (!form) {
            response = { status: "error", message: "Missing form" };
            return res.json(response);
        } else if (!type) {
            response = { status: "error", message: "Missing type" };
            return res.json(response);
        } else if (!year && !stream) {
            response = { status: "error", message: "Missing year/stream" };
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
            response = {
                status: "error",
                message: "An error occurred while fetching the week number from PenzGTU API",
            };
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
            response = { status: "error", message: "Missing level" };
            return res.json(response);
        } else if (!form) {
            response = { status: "error", message: "Missing form" };
            return res.json(response);
        } else if (!type) {
            response = { status: "error", message: "Missing type" };
            return res.json(response);
        } else if (!year && !stream) {
            response = { status: "error", message: "Missing year/stream" };
            return res.json(response);
        } else if (type === "tt" && (!year || stream)) {
            response = { status: "error", message: "type=tt requires year" };
            return res.json(response);
        } else if (type === "att" && (year || !stream)) {
            response = { status: "error", message: "type=tt requires stream" };
            return res.json(response);
        } else if (!group) {
            response = { status: "error", message: "Missing group" };
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
            response = {
                status: "error",
                message: "An error occurred while fetching the week number from PenzGTU API",
            };
        }

        res.json(response);
    })
    .listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
