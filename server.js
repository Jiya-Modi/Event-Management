const result = require('dotenv').config();

const express = require('express');

const app = express();

const path = require('path');

const http = require('http');

const cookieParser = require('cookie-parser');

const router = require('express').Router();

const connectDB = require('./config/connectDB');
const sequelize = require('./config/db');

const { swaggerUi, swaggerSpec } = require('./config/swagger');

const errorHandler = require('./middleware/error.middleware');

const morganMiddleware = require('./config/morgan');

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morganMiddleware);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const authRouter = require('./routes/auth.route');
const eventRouter = require('./routes/organizer.route');
const userRouter = require('./routes/user.route');
const adminRouter = require('./routes/admin.route');
const notificationRouter = require('./routes/notification.route');

const { initializeEventScheduler } = require('./schedulers/event.scheduler');
const { initializeEventTasks } = require('./schedulers/eventTask.scheduler');
const { startWaitlistScheduler } = require('./schedulers/cron.scheduler');

app.use('/api/v1/auth/', authRouter);
app.use('/api/v1/organizer/', eventRouter);
app.use('/api/v1/user/', userRouter);
app.use('/api/v1/admin/', adminRouter);
app.use('/api/v1/notification/', notificationRouter);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// const crypto = require('crypto');
// const key = crypto.randomBytes(32);
// console.log(key.toString('hex'));

router.get('/', (_req, res) => {
  res
    .status(200)
    .json({ status: 'success', message: 'API Server is up and running!' });
});

app.use('/', router);

const PORT = process.env.PORT;

const { initializeSocket } = require('./socket');

const server = http.createServer(app);

initializeSocket(server);

server.listen(3000);

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

sequelize
  .authenticate()
  .then(async () => {
    console.log('Database Connected');

    await sequelize.sync();

    console.log('Tables Synced');

    await initializeEventScheduler();

    await initializeEventTasks();

    await startWaitlistScheduler();
  })
  .catch((err) => {
    console.log('DB Error:', err.message);
  });

app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

app.use(errorHandler);

//Both express and socket use same server and port
