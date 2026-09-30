import cors from 'cors';
import { env } from '../config/env.js';

const cors_options = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests from any origin in dev/VM setups or same-origin proxy
        callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
};

export default cors(cors_options);
