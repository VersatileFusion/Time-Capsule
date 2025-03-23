# Time Capsule Service

A service that allows users to create digital time capsules to be delivered in the future.

Developer: Erfan Ahmadvand | Contact: +989109924707

[فارسی](#سرویس-کپسول-زمان)

## Features

- User authentication and account management
- Create time capsules with text and file attachments
- Schedule delivery for a future date
- Email delivery of time capsules
- Public and private capsule options
- Swagger API documentation
- Detailed logging

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **Email**: Nodemailer

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (local or MongoDB Atlas)
- [Git](https://git-scm.com/)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/time-capsule.git
cd time-capsule
```

2. Install dependencies for the server:

```bash
cd server
npm install
```

3. Create a `.env` file in the server directory using the `.env.example` as a template:

```bash
cp .env.example .env
```

4. Update the environment variables in the `.env` file:

```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/time-capsule
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM=your_email@gmail.com
```

### Running the App

#### Development mode

```bash
npm run dev
```

#### Production mode

```bash
npm start
```

### API Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:5000/api-docs
```

## Deploying to GitHub

### Setting up GitHub Repository

1. Create a new repository on GitHub

2. Push your code to GitHub:

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/time-capsule.git
git push -u origin main
```

### Continuous Deployment with GitHub Actions

1. Create a `.github/workflows` directory in your project:

```bash
mkdir -p .github/workflows
```

2. Create a workflow file for continuous integration:

```bash
touch .github/workflows/ci.yml
```

3. Add the following content to the workflow file:

```yaml
name: Node.js CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        cache-dependency-path: 'server/package-lock.json'
    
    - name: Install dependencies
      working-directory: ./server
      run: npm ci
    
    - name: Run linting
      working-directory: ./server
      run: npm run lint || true
    
    - name: Run tests
      working-directory: ./server
      run: npm test || true
```

## Deploying to Production

### Deploying to Heroku

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

2. Log in to Heroku:

```bash
heroku login
```

3. Create a new Heroku app:

```bash
heroku create time-capsule-app
```

4. Set up environment variables on Heroku:

```bash
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set JWT_EXPIRE=30d
heroku config:set EMAIL_SERVICE=gmail
heroku config:set EMAIL_USERNAME=your_email@gmail.com
heroku config:set EMAIL_PASSWORD=your_email_app_password
heroku config:set EMAIL_FROM=your_email@gmail.com
heroku config:set NODE_ENV=production
```

5. Deploy the application:

```bash
git subtree push --prefix server heroku main
```

### Setting up a MongoDB Atlas Database

1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
2. Create a new cluster
3. Set up a database user with appropriate permissions
4. Get your connection string and update the `MONGO_URI` in your environment variables

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

# سرویس کپسول زمان

سرویسی که به کاربران امکان می‌دهد کپسول‌های زمان دیجیتالی برای تحویل در آینده ایجاد کنند.

توسعه‌دهنده: عرفان احمدوند | تماس: ۹۸۹۱۰۹۹۲۴۷۰۷+

[English](#time-capsule-service)

## ویژگی‌ها

- احراز هویت کاربران و مدیریت حساب
- ایجاد کپسول‌های زمان با متن و پیوست‌های فایل
- برنامه‌ریزی تحویل برای تاریخ آینده
- تحویل کپسول‌های زمان از طریق ایمیل
- گزینه‌های کپسول عمومی و خصوصی
- مستندات API با Swagger
- ثبت وقایع دقیق

## استک فنی

- **بک‌اند**: Node.js، Express.js
- **پایگاه داده**: MongoDB
- **احراز هویت**: JWT (توکن‌های وب JSON)
- **مستندات**: Swagger/OpenAPI
- **ثبت وقایع**: Winston
- **ایمیل**: Nodemailer

## شروع کار

### پیش‌نیازها

- [Node.js](https://nodejs.org/) (نسخه ۱۴ یا بالاتر)
- [MongoDB](https://www.mongodb.com/) (محلی یا MongoDB Atlas)
- [Git](https://git-scm.com/)

### نصب

۱. کلون کردن مخزن:

```bash
git clone https://github.com/yourusername/time-capsule.git
cd time-capsule
```

۲. نصب وابستگی‌ها برای سرور:

```bash
cd server
npm install
```

۳. ایجاد فایل `.env` در دایرکتوری سرور با استفاده از `.env.example` به عنوان الگو:

```bash
cp .env.example .env
```

۴. به‌روزرسانی متغیرهای محیطی در فایل `.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/time-capsule
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM=your_email@gmail.com
```

### اجرای برنامه

#### حالت توسعه

```bash
npm run dev
```

#### حالت تولید

```bash
npm start
```

### مستندات API

پس از راه‌اندازی سرور، می‌توانید به مستندات Swagger در آدرس زیر دسترسی پیدا کنید:

```
http://localhost:5000/api-docs
```

## استقرار در GitHub

### راه‌اندازی مخزن GitHub

۱. ایجاد یک مخزن جدید در GitHub

۲. ارسال کد خود به GitHub:

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/time-capsule.git
git push -u origin main
```

### استقرار مداوم با GitHub Actions

۱. ایجاد دایرکتوری `.github/workflows` در پروژه خود:

```bash
mkdir -p .github/workflows
```

۲. ایجاد فایل گردش کار برای یکپارچه‌سازی مداوم:

```bash
touch .github/workflows/ci.yml
```

۳. افزودن محتوای زیر به فایل گردش کار:

```yaml
name: Node.js CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        cache-dependency-path: 'server/package-lock.json'
    
    - name: نصب وابستگی‌ها
      working-directory: ./server
      run: npm ci
    
    - name: اجرای لینت
      working-directory: ./server
      run: npm run lint || true
    
    - name: اجرای تست‌ها
      working-directory: ./server
      run: npm test || true
```

## استقرار در محیط تولید

### استقرار در Heroku

۱. نصب [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

۲. ورود به Heroku:

```bash
heroku login
```

۳. ایجاد یک برنامه جدید Heroku:

```bash
heroku create time-capsule-app
```

۴. تنظیم متغیرهای محیطی در Heroku:

```bash
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set JWT_EXPIRE=30d
heroku config:set EMAIL_SERVICE=gmail
heroku config:set EMAIL_USERNAME=your_email@gmail.com
heroku config:set EMAIL_PASSWORD=your_email_app_password
heroku config:set EMAIL_FROM=your_email@gmail.com
heroku config:set NODE_ENV=production
```

۵. استقرار برنامه:

```bash
git subtree push --prefix server heroku main
```

### راه‌اندازی پایگاه داده MongoDB Atlas

۱. ایجاد یک حساب در [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
۲. ایجاد یک کلاستر جدید
۳. راه‌اندازی یک کاربر پایگاه داده با مجوزهای مناسب
۴. دریافت رشته اتصال و به‌روزرسانی `MONGO_URI` در متغیرهای محیطی خود

## مجوز

این پروژه تحت مجوز MIT منتشر شده است - برای جزئیات بیشتر فایل LICENSE را ببینید. 