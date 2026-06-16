# AWS Deployment Guide

This guide describes how to deploy the React frontend and Node.js Express backend of this project on AWS.

---

## 1. Backend Deployment (AWS Elastic Beanstalk or AWS EC2)

The backend runs on Node.js and connects to MongoDB. We recommend **AWS Elastic Beanstalk** (Web Server Environment) because it manages the instance setup, load balancing, and scaling automatically.

### AWS Elastic Beanstalk Steps:
1. **Create an Application**:
   - Go to the Elastic Beanstalk console and click **Create application**.
   - Choose the **Web server environment** tier.
   - Set the Platform to **Node.js** (select Node.js 18 or 20 LTS).
2. **Prepare Backend Code**:
   - Create a ZIP file of the `backend` folder (do **NOT** include `node_modules`).
   - In Elastic Beanstalk, choose **Upload your code** and select the ZIP file.
3. **Configure Environment Variables**:
   - Under **Configuration** -> **Updates and deployments** -> **Environment properties**, add the following keys:
     * `NODE_ENV`: `production`
     * `PORT`: `5000` (Elastic Beanstalk will automatically forward requests to this port)
     * `MONGODB_URI`: *[Your MongoDB Atlas connection string]*
     * `JWT_SECRET`: *[A long, secure random secret key]*
     * `FRONTEND_URL`: *[Your frontend URL(s), separated by commas, e.g. `https://myfamily.amplifyapp.com`]*
     * `CLOUDINARY_CLOUD_NAME`: *[Your Cloudinary cloud name]*
     * `CLOUDINARY_API_KEY`: *[Your Cloudinary API key]*
     * `CLOUDINARY_API_SECRET`: *[Your Cloudinary API secret]*
4. **Deploy**: Click **Create environment**. Once the environment status turns green, copy the URL provided (e.g., `http://family-backend.env.eba-xxxx.us-east-1.elasticbeanstalk.com`).

---

## 2. Frontend Deployment (AWS Amplify or S3 + CloudFront)

We recommend **AWS Amplify** for deploying the Vite-React frontend as it handles CI/CD directly from Git and configures global CDNs automatically.

### AWS Amplify Steps:
1. **Connect Repository**:
   - Go to the AWS Amplify console and click **New app** -> **Host web app**.
   - Connect your GitHub/GitLab repository and select the frontend directory.
2. **Build Settings & Environment Variables**:
   - Under the **Build settings**, Amplify will automatically detect Vite.
   - **CRITICAL STEP**: Add the following Environment Variable in Amplify settings under **App settings** -> **Environment variables**:
     * `VITE_API_URL`: `http://[YOUR_BACKEND_ELASTIC_BEANSTALK_URL]/api` (or HTTPS URL if SSL is configured)
   - Ensure the build command runs `npm run build` or `vite build`.
3. **Configure SPA Rewrite Rules**:
   - In single-page apps (React Router), refreshing on subpages (e.g. `/profile` or `/moments`) causes a 404 error if AWS redirects aren't set.
   - In the Amplify sidebar, go to **Rewrites and redirects**.
   - Click **Edit** and add the following rule:
     * **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
     * **Target address**: `/index.html`
     * **Type**: `200 (Rewrite)`
4. **Deploy**: Save and deploy. Copy the frontend URL (e.g. `https://main.xxxx.amplifyapp.com`).

---

## 3. Database Connection Security (MongoDB Atlas)

Because AWS EC2/Beanstalk instances may scale up/down or change their IP addresses, you need to configure your database firewall:
1. Go to **MongoDB Atlas** -> **Network Access**.
2. Click **Add IP Address**.
3. Choose **Allow Access From Anywhere** (`0.0.0.0/0`) OR configure VPC Peering if your backend and database are in the same AWS region.
   > [!TIP]
   > For production environments, whitelisting specific IP ranges or using AWS NAT Gateways to route backend traffic through static IPs is highly recommended.

---

## 4. HTTPS & Cookies Configuration Checklist

- **Strict Browsers**: Modern web browsers block cookies that have `sameSite: 'none'` unless they also specify `secure: true` (which requires HTTPS).
- **HTTPS Setup**:
  - Point a custom domain to your AWS Amplify app (Amplify provides free SSL certificates).
  - Add an AWS Certificate Manager (ACM) SSL Certificate to your Elastic Beanstalk load balancer.
- **HTTP Fallback**: If you run on HTTP without SSL during testing, the frontend API client will fall back to using the standard HTTP Authorization Bearer headers stored in `localStorage`, so your logins will still work!
