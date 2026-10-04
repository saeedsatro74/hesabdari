import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from 'drizzle-orm/pg-core';

// جدول اطلاعات ورود و تنظیمات سیستم
export const systemAuth = pgTable('system_auth', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().default('admin'),
  password: text('password').notNull().default('1234'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// جدول تراکنش‌های بدهی‌های شرکت و طلب‌ها
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'debt' | 'credit'
  fullName: text('full_name').notNull(),
  amount: doublePrecision('amount').notNull(),
  shabaNumber: text('shaba_number'),
  bankName: text('bank_name'),
  jalaliDueDate: text('jalali_due_date').notNull(),
  priority: integer('priority').notNull().default(1),
  isPinnedTop: boolean('is_pinned_top').notNull().default(false),
  status: text('status').notNull().default('pending'), // 'pending' | 'paid' | 'overdue'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// جدول تاریخچه تراکنش‌های تسویه شده و بایگانی اسناد حذف شده
export const history = pgTable('history', {
  id: text('id').primaryKey(),
  action: text('action').notNull(), // 'paid' | 'collected' | 'deleted'
  actionTitle: text('action_title').notNull(),
  timestamp: text('timestamp').notNull(),
  dayOfWeek: text('day_of_week').notNull(),
  jalaliDate: text('jalali_date').notNull(),
  time: text('time').notNull(),
  readableFull: text('readable_full').notNull(),
  transactionData: jsonb('transaction_data').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
