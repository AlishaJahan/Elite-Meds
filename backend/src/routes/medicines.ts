import { Router, Request, Response } from 'express';
import { getPool } from '../db/mysql';
import { verifyAdmin, AuthRequest } from './auth';

const router = Router();

// Helper to format medicine database rows for frontend type compatibility
const formatMedicine = (med: any) => {
  return {
    ...med,
    prescriptionRequired: !!med.prescriptionRequired,
    inStock: !!med.inStock,
    sideEffects: med.sideEffects ? med.sideEffects.split(',') : []
  };
};

// GET /api/medicines - Get list of medicines with search & category filtering
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const p = getPool();

    let query = 'SELECT * FROM medicines WHERE 1=1';
    const params: any[] = [];

    if (category && typeof category === 'string' && category !== 'all') {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    if (search && typeof search === 'string') {
      const searchWildcard = `%${search.toLowerCase()}%`;
      query += ' AND (LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(description) LIKE ?)';
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    const [rows]: any = await p.query(query, params);
    const formattedMedicines = rows.map(formatMedicine);

    res.json(formattedMedicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/medicines/:id - Get specific medicine by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();
    
    const [rows]: any = await p.query('SELECT * FROM medicines WHERE id = ?', [id]);

    if (rows.length === 0) {
       res.status(404).json({ error: 'Medicine not found' });
       return;
    }

    res.json(formatMedicine(rows[0]));
  } catch (error) {
    console.error('Error fetching medicine by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/medicines - Create a new medicine (Admin only)
router.post('/', verifyAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      name, brand, category, price, image, prescriptionRequired, 
      description, dosage, sideEffects, safetyAdvice, inStock 
    } = req.body;

    if (!name || !brand || !category || price === undefined) {
      res.status(400).json({ error: 'Name, brand, category, and price are required.' });
      return;
    }

    const p = getPool();
    const id = `med-${Date.now()}`;
    const imagePath = image || '/medicines/paracetamol.png';
    const sideEffectsStr = Array.isArray(sideEffects) 
      ? sideEffects.join(',') 
      : (sideEffects || '');

    await p.query(
      `INSERT INTO medicines (
        id, name, brand, category, price, image, prescriptionRequired, 
        description, dosage, sideEffects, safetyAdvice, inStock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, brand, category, Number(price), imagePath, 
        prescriptionRequired ? 1 : 0, description || '', dosage || '', 
        sideEffectsStr, safetyAdvice || '', inStock !== false ? 1 : 0
      ]
    );

    const newMed = {
      id,
      name,
      brand,
      category,
      price,
      image: imagePath,
      prescriptionRequired: !!prescriptionRequired,
      description: description || '',
      dosage: dosage || '',
      sideEffects: Array.isArray(sideEffects) ? sideEffects : [],
      safetyAdvice: safetyAdvice || '',
      inStock: inStock !== false,
      rating: 5.0,
      reviewsCount: 0
    };

    res.status(201).json(newMed);
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/medicines/:id - Delete a medicine (Admin only)
router.delete('/:id', verifyAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [result]: any = await p.query('DELETE FROM medicines WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Medicine not found' });
      return;
    }

    res.json({ message: 'Medicine deleted successfully', id });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/medicines/:id/price - Update medicine price (Admin only)
router.put('/:id/price', verifyAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    if (price === undefined || Number(price) <= 0) {
      res.status(400).json({ error: 'Valid price is required.' });
      return;
    }

    const p = getPool();
    const [result]: any = await p.query(
      'UPDATE medicines SET price = ? WHERE id = ?',
      [Number(price), id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Medicine not found.' });
      return;
    }

    res.json({ message: 'Medicine price updated successfully', id, price: Number(price) });
  } catch (error) {
    console.error('Error updating medicine price:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
