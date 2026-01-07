"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationSchema = exports.jobSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
exports.jobSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters"),
    description: zod_1.z.string().optional(),
    requirements: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(), // Fixed: added key type
    location: zod_1.z.string().optional(),
});
exports.applicationSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid("Invalid job ID"),
});
