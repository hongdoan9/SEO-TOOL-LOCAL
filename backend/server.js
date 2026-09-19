import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './src/routes/index.js';

dotenv.config();

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api', routes);

app.listen(PORT, '127.0.0.1', () => {
  console.log('Server Backend đang chạy tại http://localhost:' + PORT);
});
