import cors from 'cors';

const cors_options = {
    origin: process.env.FE_BASE_URL || 'https://localhost:5000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
};

export default cors(cors_options);