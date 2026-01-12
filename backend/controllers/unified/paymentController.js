const db = require('../../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Unified payment controller for both lawyers and users
class PaymentController {
  // Get payments based on user role
  async getPayments(req, res) {
    try {
      const { role, id: userId } = req.user;
      const { page = 1, limit = 10, status, payment_method } = req.query;
      const offset = (page - 1) * limit;

      let query, countQuery;

      if (role === 'lawyer') {
        query = db('payments')
          .select('payments.*', 'invoices.invoice_number', 'users.name as client_name')
          .leftJoin('invoices', 'payments.invoice_id', 'invoices.id')
          .leftJoin('users', 'payments.client_id', 'users.id')
          .where('payments.recorded_by', userId);
        
        countQuery = db('payments').where({ recorded_by: userId });
      } else {
        query = db('user_payments')
          .select('*')
          .where('user_id', userId);
        
        countQuery = db('user_payments').where({ user_id: userId });
      }

      if (status && status !== 'all') {
        query = query.where('status', status);
        countQuery = countQuery.where('status', status);
      }

      if (payment_method && payment_method !== 'all') {
        query = query.where('payment_method', payment_method);
        countQuery = countQuery.where('payment_method', payment_method);
      }

      const payments = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
      const total = await countQuery.count('id as count').first();

      res.json({
        success: true,
        data: payments,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: total.count }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Create payment based on user role
  async createPayment(req, res) {
    try {
      const { role, id: userId } = req.user;
      const { amount, description, lawyer_id, invoice_id, client_id, payment_method, reference_number } = req.body;

      if (!amount) {
        return res.status(400).json({ success: false, error: 'Amount is required' });
      }

      let paymentData, tableName;

      if (role === 'lawyer') {
        // Validate invoice_id exists if provided
        if (invoice_id) {
          const invoiceExists = await db('invoices').where({ id: invoice_id, lawyer_id: userId }).first();
          if (!invoiceExists) {
            return res.status(400).json({ success: false, error: 'Selected invoice not found or access denied' });
          }
        }

        // Validate client_id exists if provided
        if (client_id) {
          const clientExists = await db('users').where({ id: client_id }).first();
          if (!clientExists) {
            return res.status(400).json({ success: false, error: 'Selected client not found' });
          }
        }

        const paymentNumber = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        paymentData = {
          payment_number: paymentNumber,
          invoice_id,
          client_id,
          amount,
          payment_method: payment_method || 'cash',
          payment_date: new Date(),
          reference_number,
          notes: description,
          recorded_by: userId,
          status: 'completed'
        };
        tableName = 'payments';
      } else {
        // User payment to lawyer via Stripe
        if (!lawyer_id) {
          return res.status(400).json({ success: false, error: 'Lawyer ID is required' });
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            user_id: userId,
            lawyer_id: lawyer_id,
            description: description || 'Payment to lawyer'
          }
        });

        paymentData = {
          user_id: userId,
          lawyer_id,
          amount,
          stripe_payment_intent_id: paymentIntent.id,
          description: description || 'Payment to lawyer',
          status: 'pending'
        };
        tableName = 'user_payments';

        const [paymentId] = await db(tableName).insert(paymentData);
        const newPayment = await db(tableName).where({ id: paymentId }).first();

        return res.status(201).json({
          success: true,
          data: {
            ...newPayment,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
          }
        });
      }

      const [paymentId] = await db(tableName).insert(paymentData);
      const newPayment = await db(tableName).where({ id: paymentId }).first();

      res.status(201).json({ success: true, data: newPayment });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update payment
  async updatePayment(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;
      const updateData = req.body;

      const tableName = role === 'lawyer' ? 'payments' : 'user_payments';
      const whereClause = role === 'lawyer' 
        ? { id, recorded_by: userId }
        : { id, user_id: userId };

      const updated = await db(tableName)
        .where(whereClause)
        .update({ ...updateData, updated_at: new Date() });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Payment not found' });
      }

      const updatedPayment = await db(tableName).where({ id }).first();
      res.json({ success: true, data: updatedPayment });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Delete payment
  async deletePayment(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;

      const tableName = role === 'lawyer' ? 'payments' : 'user_payments';
      const whereClause = role === 'lawyer' 
        ? { id, recorded_by: userId }
        : { id, user_id: userId };

      const deleted = await db(tableName).where(whereClause).del();

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Payment not found' });
      }

      res.json({ success: true, data: { message: 'Payment deleted successfully' } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Confirm Stripe payment (for user payments)
  async confirmStripePayment(req, res) {
    try {
      const { payment_intent_id } = req.body;
      const userId = req.user.id;

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

      if (paymentIntent.status === 'succeeded') {
        // Update payment status in database
        await db('user_payments')
          .where({ stripe_payment_intent_id: payment_intent_id, user_id: userId })
          .update({ status: 'completed', updated_at: new Date() });

        res.json({ success: true, data: { message: 'Payment confirmed successfully' } });
      } else {
        res.status(400).json({ success: false, error: 'Payment not completed' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new PaymentController();