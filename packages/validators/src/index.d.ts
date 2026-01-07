import { z } from "zod";
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const jobSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    requirements: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    location: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const applicationSchema: z.ZodObject<{
    jobId: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=index.d.ts.map