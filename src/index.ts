import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes'; // implement login route there

const app = express();
app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000'] })); // adjust as needed
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Error handler (basic)
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`⚡️ Server is running on port ${PORT}`));
