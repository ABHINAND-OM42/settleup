# SettleUp - Expense Splitting Application 💰

**SettleUp** is a full-stack web application designed to help friends and roommates split expenses easily.It allows users to create groups, add expenses (supports Equal and Exact splitting), tracking debts, and settle balances efficiently.

---

## 🚀 Features

* **User Management:** Secure Registration, Login, and Password Reset.
* **Group Management:** Create groups and add members via search.
* **Expense Tracking:**
    * **Equal Split:** Automatically divides bills among selected members.
    * **Exact Split:** Allows specifying exact amounts for each person.
* **Smart Settlements:**
    * Visual "Settlement Plan" showing who pays whom.
    * One-click "Settle Up" recording.
* **Dashboard:** Real-time view of Net Balances (You owe / You are owed).
* **Activity Feed:** Detailed history of all expenses and payments.
* **Admin Controls:** Group creators can manage members and delete groups (once settled).

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React.js (Vite)
* **Styling:** Bootstrap 5, Bootstrap Icons
* **HTTP Client:** Axios
* **Routing:** React Router DOM
* **Notifications:** React Toastify

### **Backend**
* **Framework:** Java Spring Boot
* **Build Tool:** Maven
* **Database:** Oracle Database (Dockerized)
* **ORM:** Hibernate / Spring Data JPA
* **Security:** Spring Security (BCrypt)

---

## ⚙️ Prerequisites

Ensure you have the following installed on your machine:

* **Docker** (For Oracle DB)
* **Java JDK 17** or higher
* **Node.js** & **npm**

---

## 📦 Setup Instructions

### 1. Database Setup (Oracle via Docker)

We use a Docker container for the Oracle Database to keep the environment clean.

**Step 1:** Run the Oracle Database container:
```bash
docker run -d --name oracle-db \
  -p 1521:1521 \
  -e ORACLE_PWD=password123 \
  container-registry.oracle.com/database/express:latest
```

**Step 2:** Wait for the database to initialize (this may take a few minutes).

**Step 3:** Verify the container is running:
```bash
docker ps
```

You should see `oracle-db` in the list of running containers.

---

### 2. Backend Setup (Spring Boot)

**Step 1:** Clone the repository:
```bash
https://github.com/ABHINAND-OM42/settleup.git
cd settleup/backend
```

**Step 2:** Configure database connection in `application.properties`:
```properties
spring.datasource.url=jdbc:oracle:thin:@localhost:1521/XEPDB1
spring.datasource.username=system
spring.datasource.password=password123
spring.jpa.hibernate.ddl-auto=update
```

**Step 3:** Build and run the Spring Boot application:
```bash
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

---

### 3. Frontend Setup (React + Vite)

**Step 1:** Navigate to the frontend directory:
```bash
cd ../frontend
```

**Step 2:** Install dependencies:
```bash
npm install
```

**Step 3:** Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## 🎯 Usage

1. **Register** a new account or **Login** with existing credentials
2. **Create a Group** and add members by searching their usernames
3. **Add Expenses** with equal or exact split options
4. **View Dashboard** to see your net balances across all groups
5. **Settle Up** using the smart settlement plan
6. **Check Activity Feed** for complete transaction history


## Security Features

* Password hashing using BCrypt
* Protected routes and API endpoints
* SQL injection prevention through JPA
* CORS configuration for frontend-backend communication

---

##  Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



**Happy Expense Splitting! 💸**