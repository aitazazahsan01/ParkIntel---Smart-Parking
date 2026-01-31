# ParkIntel - AI-Powered Smart Parking System 🚗💨

![Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20AI%20%7C%20Maps-blue)
![Course](https://img.shields.io/badge/Course-Software%20Construction-orange)

## 📖 Overview

**ParkIntel** is a comprehensive smart parking management solution designed to bridge the gap between drivers looking for parking and lot owners managing their spaces. Built using **Next.js**, this application leverages AI and real-time mapping to streamline the parking experience—from finding a spot to making a payment.

This project was developed as a semester project for the **Software Construction** course (5th Semester) to demonstrate full-stack development, system architecture, and real-world problem solving.

---

## ✨ Key Features

### 🚙 For Drivers (Users)
* **Interactive Map Integration:** Search and locate nearby parking lots using a real-time map interface.
* **AI-Enhanced Availability:** View real-time data on empty spaces and pricing before arriving.
* **Smart Pre-Booking:** Reserve a spot in advance to guarantee parking upon arrival.
* **Secure Payments:** Integrated payment gateway for seamless transactions (Book & Pay).

### 🏢 For Parking Lot Owners
* **Easy Registration:** Onboard new parking lots quickly.
* **Capacity Management:** Define total capacity, car space dimensions, and pricing rules.
* **Revenue Tracking:** Monitor earnings from bookings.

### 👨‍💻 For Lot Managers (Admin Portal)
* **Real-Time Dashboard:** Visualize current occupancy (Allocated vs. Available).
* **Operational Control:** Manually manage slots and override bookings if necessary.
* **Financial Reports:** Track payment statuses and daily logs.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (React)
* **Language:** TypeScript / JavaScript
* **Styling:** Tailwind CSS / CSS Modules
* **Maps:** Google Maps API / Leaflet (Leaflet/Mapbox depending on implementation)
* **Backend & Database:** Node.js API routes with MongoDB/PostgreSQL (Adjust based on your actual DB)
* **Payment:** Stripe / Custom Integration

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
* Node.js (v16 or higher)
* npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/AaitazazAhsan/ParkIntel.git](https://github.com/AaitazazAhsan/ParkIntel.git)
    cd ParkIntel
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables**
    Create a `.env.local` file in the root directory and add your keys (Map API Key, Database URL, Payment Keys):
    ```env
    NEXT_PUBLIC_MAP_API_KEY=your_api_key_here
    DATABASE_URL=your_database_url_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open the app**
    Visit `http://localhost:3000` in your browser.

---

## 👥 Meet the Team

This project was collaboratively built by students of the Software Engineering Department for the **Software Construction** subject (5th Semester).

| Name | Role | GitHub |
| :--- | :--- | :--- |
| **M Aitazaz Ahsan** | Full Stack Developer | [@AaitazazAhsan](https://github.com/aitazazahsan01) |
| **Ehtisham Ahmed** | Full Stack Developer | [@EhtishamAh](https://github.com/EhtishamAh) |
| **Saad Safi** | Full Stack Developer | [@SaadSafi](https://github.com/saadsafi123) |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Developed with ❤️ by the ParkIntel Team.*
