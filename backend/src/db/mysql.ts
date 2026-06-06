import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'alisha';
const DB_NAME = process.env.DB_NAME || 'elite_meds';

let pool: mysql.Pool;

export const getPool = (): mysql.Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.');
  }
  return pool;
};

export const initDatabase = async () => {
  try {
    // 1. Establish connection to create database if not exists
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.end();

    // 2. Initialize the pool using DB_NAME
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log(`📡 Connected to MySQL database "${DB_NAME}" successfully.`);

    // 3. Create tables
    await createTables();

    // 4. Seed medicines if empty
    await seedMedicines();

    // 5. Seed admin user
    await seedAdminUser();

  } catch (error) {
    console.error('❌ Failed to initialize MySQL Database:', error);
    throw error;
  }
};

const createTables = async () => {
  const p = getPool();

  // Users Table
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure role column exists (migration)
  try {
    await p.query('ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT "user"');
    console.log('✅ Added "role" column to users table.');
  } catch (err: any) {
    if (err.errno !== 1060 && err.code !== 'ER_DUP_FIELDNAME') {
      console.error('Warning checking/altering users table:', err);
    }
  }

  // Medicines Table
  await p.query(`
    CREATE TABLE IF NOT EXISTS medicines (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      brand VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price INT NOT NULL,
      image VARCHAR(255) NOT NULL,
      prescriptionRequired BOOLEAN NOT NULL DEFAULT FALSE,
      description TEXT NOT NULL,
      dosage TEXT NOT NULL,
      sideEffects TEXT NOT NULL,
      safetyAdvice TEXT NOT NULL,
      inStock BOOLEAN NOT NULL DEFAULT TRUE,
      rating FLOAT NOT NULL DEFAULT 5.0,
      reviewsCount INT NOT NULL DEFAULT 0
    );
  `);

  // Orders Table
  await p.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(100) PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      items TEXT NOT NULL,
      shippingAddress TEXT NOT NULL,
      paymentMethod VARCHAR(100) NOT NULL,
      prescriptionUploaded VARCHAR(255),
      total INT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Processing',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Consultations Table
  await p.query(`
    CREATE TABLE IF NOT EXISTS consultations (
      id VARCHAR(100) PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      fullName VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      date VARCHAR(100) NOT NULL,
      timeSlot VARCHAR(100) NOT NULL,
      symptoms TEXT NOT NULL,
      doctorName VARCHAR(255) NOT NULL,
      doctorSpecialty VARCHAR(255) NOT NULL,
      doctorImage VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Confirmed',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Carts Table
  await p.query(`
    CREATE TABLE IF NOT EXISTS carts (
      user_email VARCHAR(255) PRIMARY KEY,
      items TEXT NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // Doctors Table
  await p.query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      specialty VARCHAR(255) NOT NULL,
      image VARCHAR(255) NOT NULL,
      bio TEXT NOT NULL,
      rating VARCHAR(50) NOT NULL DEFAULT '4.9',
      patients VARCHAR(50) NOT NULL DEFAULT '100+'
    );
  `);

  // Seed default doctor if doctors table is empty
  const [docRows]: any = await p.query('SELECT COUNT(*) as count FROM doctors');
  if (docRows[0].count === 0) {
    console.log('🌱 Seeding default doctor Dr. Alisha Jahan...');
    await p.query(`
      INSERT INTO doctors (id, name, specialty, image, bio, rating, patients)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id = id
    `, [
      'doc-1',
      'Dr. Alisha Jahan',
      'General Physician & Pharmacologist',
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      'Over 12 years of clinical pharmacology experience. Specializes in drug-to-drug safety, lifestyle medicine, and general health diagnostics.',
      '4.9',
      '4,500+'
    ]);
    console.log('🌱 Default doctor seeded successfully.');
  }

  console.log('✅ MySQL Tables verified/created successfully.');
};

const seedMedicines = async () => {
  const p = getPool();
  
  console.log('🌱 Checking medicines from medicines.json for database seeding...');
  try {
    // Search for database file
    let finalJsonPath = path.join(__dirname, 'medicines.json');
    if (!fs.existsSync(finalJsonPath)) {
      finalJsonPath = path.join(__dirname, '../db/medicines.json');
    }
    if (!fs.existsSync(finalJsonPath)) {
      finalJsonPath = path.join(__dirname, '../../src/db/medicines.json');
    }
    
    const rawData = fs.readFileSync(finalJsonPath, 'utf8');
    const medicines: any[] = JSON.parse(rawData);

    let insertedCount = 0;
    for (const med of medicines) {
      const [existing]: any = await p.query('SELECT 1 FROM medicines WHERE id = ?', [med.id]);
      if (existing.length === 0) {
        const sideEffectsStr = Array.isArray(med.sideEffects) 
          ? med.sideEffects.join(',') 
          : med.sideEffects;

        await p.query(`
          INSERT INTO medicines (
            id, name, brand, category, price, image, prescriptionRequired, 
            description, dosage, sideEffects, safetyAdvice, inStock, rating, reviewsCount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          med.id, med.name, med.brand, med.category, med.price, med.image, 
          med.prescriptionRequired ? 1 : 0, med.description, med.dosage, 
          sideEffectsStr, med.safetyAdvice, med.inStock ? 1 : 0, med.rating, med.reviewsCount
        ]);
        insertedCount++;
      }
    }
    if (insertedCount > 0) {
      console.log(`🌱 Seeding complete. Inserted ${insertedCount} new medicines.`);
    } else {
      console.log(`🌱 Database is already up-to-date with all medicines.`);
    }
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
};

const seedAdminUser = async () => {
  const p = getPool();
  try {
    const adminEmail = 'admin@elitemeds.com';
    const [rows]: any = await p.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
    if (rows.length === 0) {
      console.log('🌱 Seeding admin user into MySQL...');
      const adminPassword = 'admin123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      await p.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin Alisha', adminEmail, hashedPassword, 'admin']
      );
      console.log('🌱 Admin user seeded successfully. Email: admin@elitemeds.com, Password: admin123');
    } else {
      console.log('🌱 Admin user already exists in database.');
    }
  } catch (err) {
    console.error('❌ Failed to seed admin user:', err);
  }
};
