import { Router, Request, Response } from 'express';
import { getPool } from '../db/mysql';
import { verifyToken, verifyAdmin, AuthRequest } from './auth';

const router = Router();

// POST /api/orders - Place a new order (Protected)
router.post('/orders', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    const { items, shippingAddress, paymentMethod, prescriptionUploaded, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must contain items' });
      return;
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine) {
      res.status(400).json({ error: 'Shipping details are incomplete' });
      return;
    }

    // Check if any item requires a prescription
    const prescriptionRequired = items.some((item: any) => item.prescriptionRequired || (item.medicine && item.medicine.prescriptionRequired));
    if (prescriptionRequired && !prescriptionUploaded) {
      res.status(400).json({ error: 'Prescription is required for one or more medicines in your cart' });
      return;
    }

    const orderId = `ord-${Date.now()}`;
    const p = getPool();

    await p.query(
      `INSERT INTO orders (id, user_email, items, shippingAddress, paymentMethod, prescriptionUploaded, total) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, 
        userEmail, 
        JSON.stringify(items), 
        JSON.stringify(shippingAddress), 
        paymentMethod, 
        prescriptionUploaded || null, 
        total
      ]
    );

    const newOrder = {
      id: orderId,
      items,
      shippingAddress,
      paymentMethod,
      prescriptionUploaded: prescriptionUploaded || null,
      total,
      status: 'Processing',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/orders - Get all placed orders for the authenticated user (Protected)
router.get('/orders', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    const p = getPool();

    const [rows]: any = await p.query(
      'SELECT * FROM orders WHERE user_email = ? ORDER BY createdAt DESC', 
      [userEmail]
    );

    const formattedOrders = rows.map((row: any) => ({
      id: row.id,
      user_email: row.user_email,
      items: JSON.parse(row.items),
      shippingAddress: JSON.parse(row.shippingAddress),
      paymentMethod: row.paymentMethod,
      prescriptionUploaded: row.prescriptionUploaded,
      total: row.total,
      status: row.status,
      createdAt: row.createdAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error retrieving orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/consultations - Book a doctor consultation (Protected)
router.post('/consultations', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    const { fullName, email, date, timeSlot, symptoms, doctorId } = req.body;

    if (!fullName || !email || !date || !timeSlot) {
      res.status(400).json({ error: 'Missing consultation details' });
      return;
    }

    const consultationId = `con-${Date.now()}`;
    const p = getPool();
    
    let doctorName = 'Dr. Alisha Jahan';
    let doctorSpecialty = 'General Physician & Pharmacologist';
    let doctorImage = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200';

    if (doctorId) {
      const [docRows]: any = await p.query('SELECT * FROM doctors WHERE id = ?', [doctorId]);
      if (docRows.length > 0) {
        doctorName = docRows[0].name;
        doctorSpecialty = docRows[0].specialty;
        doctorImage = docRows[0].image;
      }
    } else {
      const [docRows]: any = await p.query('SELECT * FROM doctors LIMIT 1');
      if (docRows.length > 0) {
        doctorName = docRows[0].name;
        doctorSpecialty = docRows[0].specialty;
        doctorImage = docRows[0].image;
      }
    }

    await p.query(
      `INSERT INTO consultations (id, user_email, fullName, email, date, timeSlot, symptoms, doctorName, doctorSpecialty, doctorImage) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        consultationId,
        userEmail,
        fullName,
        email,
        date,
        timeSlot,
        symptoms || '',
        doctorName,
        doctorSpecialty,
        doctorImage
      ]
    );

    const newConsultation = {
      id: consultationId,
      fullName,
      email,
      date,
      timeSlot,
      symptoms: symptoms || '',
      doctor: {
        name: doctorName,
        specialty: doctorSpecialty,
        image: doctorImage
      },
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ message: 'Consultation booked successfully', consultation: newConsultation });
  } catch (error) {
    console.error('Error booking consultation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/consultations - Get all consultations for the authenticated user (Protected)
router.get('/consultations', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    const p = getPool();

    const [rows]: any = await p.query(
      'SELECT * FROM consultations WHERE user_email = ? ORDER BY createdAt DESC',
      [userEmail]
    );

    const formattedConsultations = rows.map((row: any) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      date: row.date,
      timeSlot: row.timeSlot,
      symptoms: row.symptoms,
      doctor: {
        name: row.doctorName,
        specialty: row.doctorSpecialty,
        image: row.doctorImage
      },
      status: row.status,
      createdAt: row.createdAt
    }));

    res.json(formattedConsultations);
  } catch (error) {
    console.error('Error retrieving consultations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/admin/orders - Get all orders (Admin only)
router.get('/admin/orders', verifyAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM orders ORDER BY createdAt DESC');

    const formattedOrders = rows.map((row: any) => ({
      id: row.id,
      user_email: row.user_email,
      items: JSON.parse(row.items),
      shippingAddress: JSON.parse(row.shippingAddress),
      paymentMethod: row.paymentMethod,
      prescriptionUploaded: row.prescriptionUploaded,
      total: row.total,
      status: row.status,
      createdAt: row.createdAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error retrieving all orders for admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/admin/orders/:id/status - Update order status (Admin only)
router.put('/admin/orders/:id/status', verifyAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const p = getPool();
    const [result]: any = await p.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ message: 'Order status updated successfully', id, status });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/admin/consultations - Get all doctor consultations (Admin only)
router.get('/admin/consultations', verifyAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM consultations ORDER BY createdAt DESC');

    const formattedConsultations = rows.map((row: any) => ({
      id: row.id,
      user_email: row.user_email,
      fullName: row.fullName,
      email: row.email,
      date: row.date,
      timeSlot: row.timeSlot,
      symptoms: row.symptoms,
      doctor: {
        name: row.doctorName,
        specialty: row.doctorSpecialty,
        image: row.doctorImage
      },
      status: row.status,
      createdAt: row.createdAt
    }));

    res.json(formattedConsultations);
  } catch (error) {
    console.error('Error retrieving all consultations for admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/admin/consultations/:id/status - Update consultation status (Admin only)
router.put('/admin/consultations/:id/status', verifyAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const p = getPool();
    const [result]: any = await p.query('UPDATE consultations SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Consultation not found' });
      return;
    }

    res.json({ message: 'Consultation status updated successfully', id, status });
  } catch (error) {
    console.error('Error updating consultation status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/cart - Get current cart items for the authenticated user (Protected)
router.get('/cart', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    const p = getPool();

    const [rows]: any = await p.query('SELECT items FROM carts WHERE user_email = ?', [userEmail]);
    
    if (rows.length === 0) {
      res.json([]);
      return;
    }

    res.json(JSON.parse(rows[0].items));
  } catch (error) {
    console.error('Error retrieving cart items:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/cart - Save/Update cart items for the authenticated user (Protected)
router.post('/cart', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      res.status(400).json({ error: 'Invalid cart items.' });
      return;
    }

    const p = getPool();
    const itemsStr = JSON.stringify(items);

    await p.query(
      `INSERT INTO carts (user_email, items) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE items = VALUES(items)`,
      [userEmail, itemsStr]
    );

    res.json({ message: 'Cart items updated successfully', items });
  } catch (error) {
    console.error('Error saving cart items:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/doctors - Get all consultant doctors (Public)
router.get('/doctors', async (req: Request, res: Response): Promise<void> => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM doctors ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error retrieving doctors:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/doctors - Add a new doctor (Admin only)
router.post('/doctors', verifyAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, specialty, image, bio, rating, patients } = req.body;
    if (!name || !specialty || !image || !bio) {
      res.status(400).json({ error: 'Missing doctor details' });
      return;
    }
    const doctorId = `doc-${Date.now()}`;
    const p = getPool();
    await p.query(
      `INSERT INTO doctors (id, name, specialty, image, bio, rating, patients)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [doctorId, name, specialty, image, bio, rating || '4.9', patients || '100+']
    );
    res.status(201).json({ message: 'Doctor added successfully', id: doctorId });
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/doctors/:id - Update an existing doctor (Admin only)
router.put('/doctors/:id', verifyAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, specialty, image, bio, rating, patients } = req.body;
    if (!name || !specialty || !image || !bio) {
      res.status(400).json({ error: 'Missing doctor details' });
      return;
    }
    const p = getPool();
    const [result]: any = await p.query(
      `UPDATE doctors 
       SET name = ?, specialty = ?, image = ?, bio = ?, rating = ?, patients = ? 
       WHERE id = ?`,
      [name, specialty, image, bio, rating || '4.9', patients || '100+', id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    res.json({ message: 'Doctor updated successfully' });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/doctors/:id - Delete a doctor (Admin only)
router.delete('/doctors/:id', verifyAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();
    const [result]: any = await p.query('DELETE FROM doctors WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
