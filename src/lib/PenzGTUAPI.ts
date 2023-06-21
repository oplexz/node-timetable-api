import axios from "axios";
import qs from "qs";
import sha256 from "sha256";

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

        // console.log(config);

        const response = await axios.request(config);

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

export const makeRequest = async (methodName, args = {}) => {
    const signature = generateSignature(methodName, args);
    const response = await sendRequest(methodName, args, signature);
    return response;
};

export const getTimetableMeta = async () => {
    const response = await makeRequest("getTimetableMeta");
    return response;
};

export const getWeekNum = async () => {
    const response = await makeRequest("getWeekNum");
    return response;
};

export const getTimetable = async (tt_level, tt_form, tt_type, tt_year, tt_group) => {
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

export const getAttestation = async (tt_level, tt_form, tt_type, tt_stream, tt_group) => {
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
