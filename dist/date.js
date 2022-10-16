"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = exports.dateFormat = void 0;
const date_fns_1 = require("date-fns");
exports.dateFormat = {
    date: "yyyy-MM-dd'T'HH:mm:ss",
};
const formatDate = (date, dateFormat) => (0, date_fns_1.format)(date, dateFormat);
exports.formatDate = formatDate;
