# Deployment Guide

I have prepared your project for deployment to Firebase Hosting. Because I cannot log in to your Firebase account interactively, you need to run the final commands yourself.

## Prerequisites

1.  Open your terminal in the project root: `/Users/rafemu/remaMulla`
2.  Ensure you have the Firebase CLI installed. If not, run: `npm install -g fireba`se-tools

## Step 1: Login

Run the following command and follow the browser instructions to log in:

```bash
firebase login
```

## Step 2: Configure Targets

You need to map the "targets" I defined in `firebase.json` to your actual Firebase Hosting sites.

1.  **List your sites** to see their names (e.g., `remamulla`, `remamulla-admin`, etc.):
    ```bash
    firebase hosting:sites:list
    ```

2.  **Apply targets**. Replace `YOUR_SITE_NAME` with the actual site ID from the list above.

    *   For the **Public Website** (Showcase):
        ```bash
        firebase target:apply hosting public YOUR_PUBLIC_SITE_NAME
        ```
        *(Example: `firebase target:apply hosting public remamulla`)*

    *   For the **Admin Panel**:
        ```bash
        firebase target:apply hosting admin YOUR_ADMIN_SITE_NAME
        ```
        *(If you don't have a separate site, you can create one in the Firebase Console or use the same one if you want to overwrite it - but be careful! Ideally, create a new site like `remamulla-admin`)*

    *   For the **Mobile App**:
        ```bash
        firebase target:apply hosting mobile YOUR_MOBILE_SITE_NAME
        ```
        *(Example: `firebase target:apply hosting mobile remamulla-mobile`)*

## Step 3: Deploy

Once targets are applied, run:

```bash
firebase deploy
```

This will deploy all three websites to their respective URLs.

## Troubleshooting

*   **"HTTP Error: 404, Site not found"**: You probably used a site name that doesn't exist. Create it in the Firebase Console first.
*   **"No targets found"**: Make sure you ran the `target:apply` commands correctly.
