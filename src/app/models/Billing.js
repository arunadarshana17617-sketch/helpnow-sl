import mongoose from 'mongoose';

// Partial payments ledger structure
const PaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['payhere', 'bank_transfer', 'manual'], // ✅ 'manual' added — admin-recorded offline settlements (e.g. cash)
    required: true
  },
  paymentReference: {
    type: String
  },
  paymentProofUrl: {
    type: String
  }, // Cloudinary bank transfer slip
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BillingSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
  },
  providerName: String,
  providerEmail: String,

  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  periodLabel: { type: String }, // e.g. "July 2026"

  totalJobsCompleted: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },   // Total platform fee owed [2]

  // ✅ Fields supporting partial payments
  amountPaid: { type: Number, default: 0 },         // Total validated paid amount so far [2]
  balanceDue: { type: Number, default: 0 },         // Remaining balance: (commissionAmount - amountPaid) [2]
  payments: [PaymentSchema],                        // List of all partial payment attempts [2]

  status: {
    type: String,
    enum: ['open', 'due', 'paid', 'overdue', 'waived'],
    default: 'due', // ✅ was 'open' — 'due' more accurately reflects "invoice issued, awaiting payment"
  },

  dueDate: { type: Date, default: null },
  reminderSentAt: { type: Date, default: null },
  paidAt: { type: Date, default: null },

}, {
  timestamps: true,
  collection: 'billings',
});

// Pre-save hook to dynamically manage balanceDue [2]
// ✅ Rewritten without the `next` callback — Turbopack's bundling was
// altering this function's declared parameter count, which made Mongoose
// invoke it in "promise style" (no next passed in) even though the code
// still tried to call next(), causing "next is not a function". An async
// function with no `next` parameter works with both invocation styles.
BillingSchema.pre('save', async function () {
  // Sum of verified payments only — this always runs regardless of current
  // status, so balanceDue/amountPaid stay accurate even for brand-new
  // 'due' invoices with zero payments yet (previously only ran for non-'open'
  // statuses, which meant a freshly created bill's balanceDue could go stale).
  const verifiedSum = this.payments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  this.amountPaid = verifiedSum;
  this.balanceDue = Math.max(0, this.commissionAmount - verifiedSum);

  if (this.balanceDue <= 0 && this.commissionAmount > 0) {
    this.status = 'paid';
    this.paidAt = this.paidAt || new Date();
  } else if (this.status === 'paid' && this.balanceDue > 0) {
    this.status = 'due'; // Revert back to due if balance remains (e.g. a verified payment got reversed)
  }
});

BillingSchema.index({ provider: 1, month: 1, year: 1 }, { unique: true });

const Billing = mongoose.models.Billing || mongoose.model('Billing', BillingSchema);
export default Billing;