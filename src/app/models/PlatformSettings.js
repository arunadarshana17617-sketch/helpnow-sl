import mongoose from 'mongoose';

// Singleton document — okkoma platform-wide billing settings meke thiyenne.
// Enna okkoma app eke thiyena 'settings' document eka witharai — Settings.getSettings() use karanna.
const PlatformSettingsSchema = new mongoose.Schema({
  // Default commission % — providerekuta wenama rate ekak dala nathnam meka apply wenawa
  defaultCommissionRate: {
    type: Number,
    default: 10, // 10%
    min: 0,
    max: 100,
  },

  // Mase eka close unata passe, bill eka due wenna ganna dawas gana
  // (e.g. month ends July 31 -> billingDueDays=10 -> due date = Aug 10)
  billingDueDays: {
    type: Number,
    default: 10,
    min: 1,
  },

  // Due date eka enna kalin dawas kiiyakata reminder ekak yawanawada
  reminderDaysBefore: {
    type: Number,
    default: 5,
    min: 1,
  },

  // Due date eka passu unata passe dawas kiiyak wenakota provider ge account eka suspend karanawada
  overdueGraceDays: {
    type: Number,
    default: 0, // 0 = due date passu welema suspend wenawa
    min: 0,
  },

  // Bank transfer karanna admin ge bank details eka
  bankDetails: {
    bankName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    branch: { type: String, default: '' },
  },

  updatedBy: {
    type: String, // admin email
    default: null,
  },
}, {
  timestamps: true,
  collection: 'platformsettings',
});

PlatformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const PlatformSettings = mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', PlatformSettingsSchema);
export default PlatformSettings;