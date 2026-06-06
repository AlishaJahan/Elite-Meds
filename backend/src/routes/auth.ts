import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../db/mysql';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'jahan_meds_secret_key_123';

// Extend Request interface to include user info
export interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// Authentication middleware to protect routes
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; name: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Admin authentication middleware
export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  verifyToken(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      return;
    }
    next();
  });
};

// POST /api/auth/register - Register a new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Please enter all fields.' });
      return;
    }

    const p = getPool();

    // Check if user already exists
    const [existingUsers]: any = await p.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      res.status(400).json({ error: 'User already exists with this email.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into DB
    const [result]: any = await p.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'user']
    );

    const userId = result.insertId;

    // Create JWT Token
    const token = jwt.sign(
      { id: userId, name, email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        role: 'user'
      }
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/login - Log in an existing user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter all fields.' });
      return;
    }

    const p = getPool();

    // Fetch user
    const [users]: any = await p.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      res.status(400).json({ error: 'Invalid credentials. User does not exist.' });
      return;
    }

    const user = users[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: 'Invalid credentials. Incorrect password.' });
      return;
    }

    // Create JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/auth/me - Get logged-in user profile details
router.get('/me', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User unauthorized.' });
      return;
    }

    const p = getPool();
    const [users]: any = await p.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
