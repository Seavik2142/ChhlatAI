import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "en" | "km";

export interface Translations {
  [key: string]: {
    en: string;
    km: string;
  };
}

export const DICTIONARY: Translations = {
  // Common / Header
  "nav.dashboard": { en: "Dashboard", km: "ផ្ទាំងគ្រប់គ្រង" },
  "nav.shops": { en: "Shops", km: "ហាងទាំងអស់" },
  "nav.users": { en: "Users & Accounts", km: "អ្នកប្រើប្រាស់ & គណនី" },
  "nav.billing": { en: "Subscriptions & Billing", km: "កញ្ចប់សេវា & ការទូទាត់" },
  "nav.ai": { en: "AI Models & Prompts", km: "ម៉ូដែល AI & ព័ត៌មានជំនួយ" },
  "nav.announcements": { en: "Announcements", km: "សេចក្តីប្រកាស" },
  "nav.system": { en: "System Settings", km: "ការកំណត់ប្រព័ន្ធ" },
  "nav.logs": { en: "Audit Logs & Health", km: "កំណត់ហេតុ & សុខភាពប្រព័ន្ធ" },
  "nav.searchNav": { en: "Quick jump...", km: "ស្វែងរកផ្នែក..." },

  // Groups
  "group.overview": { en: "OVERVIEW", km: "ទិដ្ឋភាពទូទៅ" },
  "group.management": { en: "MANAGEMENT", km: "ការគ្រប់គ្រង" },
  "group.platform": { en: "PLATFORM", km: "ប្រព័ន្ធ" },
  "group.system": { en: "SYSTEM", km: "ប្រព័ន្ធបច្ចេកវិទ្យា" },

  // Platform Admin Identity
  "workspace.title": { en: "Platform Admin", km: "អ្នកគ្រប់គ្រងប្រព័ន្ធ" },
  "workspace.superAdmin": { en: "Super Admin", km: "អភិបាលជាន់ខ្ពស់" },
  "workspace.shops": { en: "shops", km: "ហាង" },
  "workspace.live": { en: "Live", km: "ដំណើរការ" },
  "workspace.superConsole": { en: "Super Admin Console", km: "ផ្ទាំងគ្រប់គ្រងកំពូល" },
  "workspace.rootAccess": { en: "Global Root Access", km: "សិទ្ធិគ្រប់គ្រងទូទៅ" },

  // Header
  "header.search": { en: "Search shops, invoices, logs...", km: "ស្វែងរកហាង, វិក្កយបត្រ, កំណត់ហេតុ..." },
  "header.export": { en: "Export report", km: "ទាញយករបាយការណ៍" },
  "header.last30days": { en: "Last 30 days", km: "៣០ ថ្ងៃចុងក្រោយ" },
  "header.helpSupport": { en: "Help & Support", km: "ជំនួយ & គាំទ្រ" },
  "header.signOut": { en: "Sign out", km: "ចាកចេញ" },
  "header.systemOperational": { en: "All systems operational", km: "ប្រព័ន្ធដំណើរការធម្មតា" },
  "header.apiBudget": { en: "API budget", km: "កញ្ចប់ថវិកា API" },
  "header.viewSystemStatus": { en: "View system status", km: "ពិនិត្យស្ថានភាពប្រព័ន្ធ" },

  // Dashboard Page
  "dashboard.title": { en: "Platform overview", km: "ទិដ្ឋភាពទូទៅនៃប្រព័ន្ធ" },
  "dashboard.subtitle": { en: "Total shops, API traffic and subscription revenue", km: "ស្ថិតិហាងសរុប ចរាចរណ៍ API និងចំណូលពីកញ្ចប់សេវា" },
  "dashboard.kpi.totalShops": { en: "Total shops", km: "ហាងសរុប" },
  "dashboard.kpi.active": { en: "active", km: "សកម្ម" },
  "dashboard.kpi.trial": { en: "trial", km: "សាកល្បង" },
  "dashboard.kpi.apiToday": { en: "API requests today", km: "សំណើ API ថ្ងៃនេះ" },
  "dashboard.kpi.thisMonth": { en: "this month", km: "ខែនេះ" },
  "dashboard.kpi.mrr": { en: "Subscription revenue (MRR)", km: "ចំណូលពីកញ្ចប់សេវា (MRR)" },
  "dashboard.kpi.vsLastMonth": { en: "vs last month", km: "ធៀបនឹងខែមុន" },
  "dashboard.kpi.activeConversations": { en: "Active AI conversations", km: "ការសន្ទនា AI សកម្ម" },
  "dashboard.kpi.aiReplies": { en: "AI replies", km: "ការឆ្លើយតប AI" },
  
  "dashboard.chart.apiRequests": { en: "API requests", km: "សំណើ API" },
  "dashboard.chart.apiSub": { en: "Messages processed per day across all shops", km: "ចំនួនសារដែលបានដំណើរការប្រចាំថ្ងៃគ្រប់ហាងទាំងអស់" },
  "dashboard.chart.daily": { en: "Daily", km: "ប្រចាំថ្ងៃ" },
  "dashboard.chart.monthly": { en: "Monthly", km: "ប្រចាំខែ" },
  "dashboard.chart.revenuePlan": { en: "Revenue by plan", km: "ចំណូលតាមកញ្ចប់សេវា" },
  "dashboard.chart.revenueSub": { en: "Monthly recurring revenue", km: "ចំណូលប្រចាំខែ" },
  "dashboard.chart.totalMrr": { en: "Total MRR", km: "ចំណូល MRR សរុប" },

  "dashboard.recent.title": { en: "Recently joined shops", km: "ហាងដែលទើបចុះឈ្មោះថ្មីៗ" },
  "dashboard.recent.subtitle": { en: "Latest merchant onboarding", km: "អាជីវកម្មដែលទើបតែបានចុះឈ្មោះប្រើប្រាស់" },
  "dashboard.recent.viewAll": { en: "View all", km: "មើលទាំងអស់" },

  // Table Headers
  "table.shop": { en: "SHOP", km: "ហាង" },
  "table.category": { en: "CATEGORY", km: "ប្រភេទ" },
  "table.plan": { en: "PLAN", km: "កញ្ចប់សេវា" },
  "table.channels": { en: "CHANNELS", km: "បណ្តាញ" },
  "table.joined": { en: "JOINED", km: "កាលបរិច្ឆេទ" },
  "table.status": { en: "STATUS", km: "ស្ថានភាព" },
  "table.actions": { en: "ACTIONS", km: "សកម្មភាព" },

  // Categories
  "cat.electronics": { en: "Electronics", km: "អេឡិចត្រូនិច" },
  "cat.cosmetics": { en: "Cosmetics", km: "គ្រឿងសម្អាង" },
  "cat.food": { en: "Food & Grocery", km: "ម្ហូបអាហារ & ទំនិញ" },
  "cat.fashion": { en: "Fashion & Apparel", km: "សម្លៀកបំពាក់" },
  "cat.cafe": { en: "Cafe & Beverages", km: "ហាងកាហ្វេ & ភេសជ្ជៈ" },
  "cat.auto": { en: "Automotive", km: "យានយន្ត" },
  "cat.home": { en: "Home & Living", km: "ផ្ទះសម្បែង & ការរស់នៅ" },
  "cat.health": { en: "Health & Wellness", km: "សុខភាព" },

  // Shops Page
  "shops.title": { en: "Shops management", km: "ការគ្រប់គ្រងហាង" },
  "shops.subtitle": { en: "All merchant accounts, subscription tiers, and connected channels", km: "គណនីអាជីវកម្មទាំងអស់ កម្រិតកញ្ចប់សេវា និងបណ្តាញដែលបានភ្ជាប់" },
  "shops.searchPlaceholder": { en: "Search shops, slugs, or owners…", km: "ស្វែងរកហាង ឈ្មោះកាត់ ឬម្ចាស់ហាង…" },
  "shops.exportCsv": { en: "Export CSV", km: "ទាញយក CSV" },
  "shops.addShop": { en: "Add shop", km: "បន្ថែមហាងថ្មី" },
  "shops.all": { en: "All shops", km: "ហាងទាំងអស់" },
  "shops.active": { en: "Active", km: "សកម្ម" },
  "shops.trial": { en: "Trial", km: "សាកល្បង" },
  "shops.suspended": { en: "Suspended", km: "ផ្អាកដំណើរការ" },
  "shops.filter": { en: "Filter", km: "តម្រង" },
  "shops.table.shop": { en: "Shop", km: "ហាង" },
  "shops.table.plan": { en: "Plan", km: "កញ្ចប់សេវា" },
  "shops.table.channels": { en: "Channels", km: "បណ្តាញ" },
  "shops.table.msgs": { en: "Msgs / Month", km: "សារ / ខែ" },
  "shops.table.nextBill": { en: "Next Bill", km: "ការទូទាត់បន្ទាប់" },
  "shops.table.status": { en: "Status", km: "ស្ថានភាព" },
  "shops.table.actions": { en: "Actions", km: "សកម្មភាព" },
  "shops.noShops": { en: "No shops found matching your filter criteria.", km: "រកមិនឃើញហាងដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ។" },
  "shops.kpi.totalShops": { en: "Total Stores", km: "ហាងសរុប" },
  "shops.kpi.activeMerchants": { en: "Active Merchants", km: "អាជីវកម្មសកម្ម" },
  "shops.kpi.inTrial": { en: "In Trial", km: "កំពុងសាកល្បង" },
  "shops.kpi.suspended": { en: "Suspended", km: "ផ្អាកដំណើរការ" },
  "shops.kpi.totalRevenue": { en: "Merchant Volume", km: "ទំហំលក់សរុប" },
  "shops.createTitle": { en: "Register Merchant Store", km: "ចុះឈ្មោះហាងអាជីវកម្មថ្មី" },
  "shops.createSubtitle": { en: "Create an organization, assign plan tier, and configure primary owner", km: "បង្កើតស្ថាប័នហាង ជ្រើសរើសកញ្ចប់សេវា និងបង្កើតគណនីម្ចាស់" },
  "shops.editTitle": { en: "Edit Merchant Store", km: "កែប្រែព័ត៌មានហាង" },
  "shops.editSubtitle": { en: "Update store profile, tier subscription, and AI assistant settings", km: "កែសម្រួលព័ត៌មានហាង កញ្ចប់សេវា និងការកំណត់ជំនួយការ AI" },
  "shops.deleteShop": { en: "Delete Store", km: "លុបហាង" },
  "shops.deleteConfirm": { en: "Are you sure you want to permanently delete this shop and its associated data?", km: "តើអ្នកប្រាកដជាចង់លុបហាងនេះ និងទិន្នន័យពាក់ព័ន្ធទាំងអស់ជាអចិន្ត្រៃយ៍មែនទេ?" },
  "shops.name": { en: "Shop Name", km: "ឈ្មោះហាង" },
  "shops.slug": { en: "URL Slug", km: "ឈ្មោះសម្គាល់ URL" },
  "shops.category": { en: "Business Category", km: "ប្រភេទអាជីវកម្ម" },
  "shops.ownerName": { en: "Primary Owner Name", km: "ឈ្មោះម្ចាស់ហាង" },
  "shops.ownerEmail": { en: "Owner Gmail / Email", km: "Gmail / Email ម្ចាស់" },
  "shops.ownerPassword": { en: "Initial Password", km: "លេខសម្ងាត់ដំបូង" },
  "shops.phone": { en: "Phone Number", km: "លេខទូរស័ព្ទ" },
  "shops.address": { en: "Physical Address", km: "អាសយដ្ឋាន" },
  "shops.plan": { en: "Subscription Tier", km: "កញ្ចប់សេវាកម្ម" },
  "shops.status": { en: "Account Status", km: "ស្ថានភាពគណនី" },
  "shops.aiAssistant": { en: "Enable AI Smart Assistant", km: "បើកដំណើរការជំនួយការឆ្លាតវៃ AI" },
  "shops.aiInstructions": { en: "AI Prompt / Instructions", km: "ការណែនាំ AI / សេចក្តីបង្គាប់" },
  "shops.saveChanges": { en: "Save Changes", km: "រក្សាទុកការកែប្រែ" },
  "shops.createShop": { en: "Create Store", km: "បង្កើតហាងថ្មី" },
  "shops.cancel": { en: "Cancel", km: "បោះបង់" },
  "shops.reactivate": { en: "Reactivate", km: "ដំណើរការឡើងវិញ" },
  "shops.suspend": { en: "Suspend", km: "ផ្អាក" },

  // Users Page
  "users.title": { en: "Users & Accounts management", km: "ការគ្រប់គ្រងអ្នកប្រើប្រាស់ & គណនី" },
  "users.subtitle": { en: "Control user information, Gmail credentials, passwords, roles, and shop associations", km: "គ្រប់គ្រងព័ត៌មានអ្នកប្រើប្រាស់ គណនី Gmail លេខសម្ងាត់ តួនាទី និងហាងពាក់ព័ន្ធ" },
  "users.searchPlaceholder": { en: "Search by name, Gmail/email, or shop…", km: "ស្វែងរកតាមឈ្មោះ, Gmail/email ឬហាង…" },
  "users.addUser": { en: "Add User", km: "បន្ថែមអ្នកប្រើប្រាស់" },
  "users.all": { en: "All Users", km: "អ្នកប្រើប្រាស់ទាំងអស់" },
  "users.admins": { en: "Super Admins", km: "អភិបាលជាន់ខ្ពស់" },
  "users.owners": { en: "Shop Owners", km: "ម្ចាស់ហាង" },
  "users.staff": { en: "Staff Members", km: "បុគ្គលិក" },
  "users.active": { en: "Active", km: "សកម្ម" },
  "users.disabled": { en: "Disabled", km: "បានបិទ" },
  "users.resetPassword": { en: "Reset Password", km: "កំណត់លេខសម្ងាត់ឡើងវិញ" },
  "users.editUser": { en: "Edit User", km: "កែប្រែព័ត៌មាន" },
  "users.deleteUser": { en: "Delete Account", km: "លុបគណនី" },
  "users.noUsers": { en: "No users found matching your search.", km: "រកមិនឃើញអ្នកប្រើប្រាស់ដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ។" },

  // Plans Page
  "plans.title": { en: "Subscriptions & billing", km: "កញ្ចប់សេវាកម្ម & ការទូទាត់" },
  "plans.subtitle": { en: "Pricing tiers and each shop owner's payment history", km: "កម្រិតតម្លៃ និងប្រវត្តិការបង់ប្រាក់របស់ម្ចាស់ហាងនីមួយៗ" },
  "plans.newTier": { en: "New pricing tier", km: "កញ្ចប់តម្លៃថ្មី" },
  "plans.mostPopular": { en: "Most popular", km: "ពេញនិយមបំផុត" },
  "plans.edit": { en: "Edit", km: "កែប្រែ" },
  "plans.month": { en: "/ month", km: "/ ខែ" },
  "plans.shopsCount": { en: "shops on this plan", km: "ហាងប្រើប្រាស់កញ្ចប់នេះ" },
  "plans.history": { en: "Payment history", km: "ប្រវត្តិការបង់ប្រាក់" },
  "plans.invoicesSub": { en: "Recent merchant subscription billing transactions", km: "កំណត់ត្រាប្រតិបត្តិការបង់ប្រាក់របស់ម្ចាស់ហាងនានា" },
  "plans.free": { en: "Free", km: "ឥតគិតថ្លៃ" },
  "plans.pro": { en: "Pro", km: "ប្រូ (Pro)" },
  "plans.enterprise": { en: "Enterprise", km: "សហគ្រាស (Enterprise)" },
  "plans.recordPayment": { en: "Record Payment", km: "កត់ត្រាការបង់ប្រាក់" },
  "plans.createInvoice": { en: "Create Invoice", km: "បង្កើតវិក្កយបត្រ" },
  "plans.export": { en: "Export CSV", km: "ទាញយក CSV" },
  "plans.allStatuses": { en: "All Statuses", km: "ស្ថានភាពទាំងអស់" },
  "plans.statusPaid": { en: "Paid", km: "បានបង់រួច" },
  "plans.statusOverdue": { en: "Overdue", km: "ហួសកាលកំណត់" },
  "plans.statusFailed": { en: "Failed", km: "បរាជ័យ" },
  "plans.searchPlaceholder": { en: "Search by shop, invoice #, or method...", km: "ស្វែងរកតាមហាង លេខវិក្កយបត្រ ឬវិធីសាស្ត្រទូទាត់..." },
  "plans.mrr": { en: "Monthly Recurring Revenue", km: "ចំណូលប្រចាំខែ (MRR)" },
  "plans.activeSubs": { en: "Active Subscriptions", km: "ការជាវសកម្ម" },
  "plans.collected": { en: "Collected This Month", km: "ប្រមូលបានខែនេះ" },
  "plans.outstanding": { en: "Outstanding / Overdue", km: "ជំពាក់ / ហួសកាលកំណត់" },
  "plans.viewReceipt": { en: "View Receipt", km: "មើលបង្កាន់ដៃ" },
  "plans.editTier": { en: "Edit Pricing Tier", km: "កែប្រែកញ្ចប់តម្លៃ" },
  "plans.addTier": { en: "Add Pricing Tier", km: "បន្ថែមកញ្ចប់តម្លៃ" },
  "plans.tierName": { en: "Plan Name", km: "ឈ្មោះកញ្ចប់" },
  "plans.tierCode": { en: "Code / Slug", km: "កូដសម្គាល់" },
  "plans.priceMonthly": { en: "Monthly Price ($)", km: "តម្លៃប្រចាំខែ ($)" },
  "plans.aiLimit": { en: "AI Replies / Month", km: "ចំនួនឆ្លើយតប AI / ខែ" },
  "plans.staffSeats": { en: "Staff Seats", km: "ចំនួនបុគ្គលិក" },
  "plans.channelsLimit": { en: "Channels Limit", km: "ចំនួនឆានែល" },
  "plans.features": { en: "Feature Highlights", km: "មុខងារសំខាន់ៗ" },
  "plans.addFeature": { en: "Add feature", km: "បន្ថែមមុខងារ" },
  "plans.deleteTier": { en: "Delete Tier", km: "លុបកញ្ចប់តម្លៃ" },
  "plans.deleteInvoice": { en: "Delete Invoice", km: "លុបវិក្កយបត្រ" },
  "plans.receiptTitle": { en: "Official Subscription Receipt", km: "បង្កាន់ដៃការជាវផ្លូវការ" },
  "plans.billTo": { en: "Billed To", km: "ចេញជូន" },
  "plans.paymentDetails": { en: "Payment Details", km: "ព័ត៌មានលម្អិតនៃការទូទាត់" },
  "plans.reference": { en: "Reference / Transaction ID", km: "លេខកូដប្រតិបត្តិការ" },
  "plans.print": { en: "Print Receipt", km: "បោះពុម្ពបង្កាន់ដៃ" },
  "plans.downloadJson": { en: "Download Data", km: "ទាញយកទិន្នន័យ" },
  "plans.couponsTitle": { en: "Subscription Coupons & Discounts", km: "ប័ណ្ណបញ្ចុះតម្លៃ & ការផ្ដល់ជូនពិសេស" },
  "plans.couponsSub": { en: "Promotional codes, seasonal vouchers, and merchant discount campaigns", km: "កូដប្រូម៉ូសិន ប័ណ្ណបញ្ចុះតម្លៃ និងយុទ្ធនាការបញ្ចុះតម្លៃម្ចាស់ហាង" },
  "plans.newCoupon": { en: "New Coupon", km: "បង្កើតប័ណ្ណថ្មី" },

  // AI Page
  "ai.title": { en: "Global AI models & prompts", km: "ម៉ូដែល AI & ព័ត៌មានជំនួយទូទៅ" },
  "ai.subtitle": { en: "API keys, default models, standard system prompts and API spend", km: "កូនសោ API, ម៉ូដែលលំនាំដើម, ការណែនាំប្រព័ន្ធ និងការចំណាយលើ API" },
  "ai.playground": { en: "Open playground", km: "បើក Playground" },
  "ai.saveChanges": { en: "Save changes", km: "រក្សាទុកការផ្លាស់ប្តូរ" },
  "ai.saving": { en: "Saving…", km: "កំពុងរក្សាទុក…" },
  "ai.keysAndModels": { en: "API keys & models", km: "កូនសោ API & ម៉ូដែល" },
  "ai.keysEncrypted": { en: "Keys are encrypted at rest", km: "ទិន្នន័យកូនសោត្រូវបានអ៊ិនគ្រីបការពារសុវត្ថិភាព" },
  "ai.addProvider": { en: "Add provider", km: "បន្ថែមប្រព័ន្ធផ្ដល់សេវា" },
  "ai.spend": { en: "API spend", km: "ការចំណាយលើ API" },
  "ai.totalSpendSub": { en: "Total API consumption and billing overhead", km: "ប្រាក់ចំណាយសរុបលើថ្លៃប្រើប្រាស់ API" },
  "ai.budget": { en: "budget", km: "កញ្ចប់ថវិកា" },
  "ai.systemPrompt": { en: "Global system prompt", km: "ការណែនាំប្រព័ន្ធ AI ទូទៅ" },
  "ai.promptSub": { en: "This prompt is injected before shop-specific instructions", km: "ការណែនាំនេះត្រូវបានបញ្ចូលមុនពេលណែនាំតាមហាងនីមួយៗ" },
  "ai.testConnection": { en: "Test connection", km: "សាកល្បងភ្ជាប់" },
  "ai.rotateKey": { en: "Rotate key", km: "ផ្លាស់ប្តូរកូនសោ" },
  "ai.topShops": { en: "Top shops by AI spend", km: "ហាងដែលប្រើប្រាស់ AI ច្រើនជាងគេ" },
  "ai.variables": { en: "Dynamic variables", km: "អថេរទិន្នន័យស្វ័យប្រវត្តិ" },
  "ai.temperature": { en: "Temperature & Sampling", km: "កម្រិតច្នៃប្រឌិត (Temperature)" },
  "ai.playgroundTitle": { en: "AI Interactive Playground", km: "កន្លែងសាកល្បង AI អន្តរកម្ម" },
  "ai.playgroundSub": { en: "Simulate and test customer inquiries against global rules in real-time", km: "សាកល្បងសំណួរអតិថិជនជាមួយការកំណត់ប្រព័ន្ធ AI ជាក់ស្តែង" },

  // Announcements Page
  "announcements.headerTitle": { en: "System announcements", km: "សេចក្តីប្រកាសប្រព័ន្ធ" },
  "announcements.subtitle": { en: "Broadcast notifications, system alerts and maintenance updates to all shops", km: "ផ្ញើការជូនដំណឹង ការប្រកាសអាសន្ន និងការអាប់ដេតប្រព័ន្ធទៅគ្រប់ហាង" },
  "announcements.composeTitle": { en: "New announcement", km: "បង្កើតសេចក្តីប្រកាសថ្មី" },
  "announcements.composeSub": { en: "Compose once, deliver to every shop owner", km: "សរសេរម្តង ផ្ញើទៅកាន់ម្ចាស់ហាងទាំងអស់" },
  "announcements.titleLabel": { en: "Title", km: "ចំណងជើង" },
  "announcements.messageLabel": { en: "Message", km: "ខ្លឹមសារ" },
  "announcements.audienceLabel": { en: "Audience", km: "ក្រុមអ្នកទទួល" },
  "announcements.allShops": { en: "All shops", km: "ហាងទាំងអស់" },
  "announcements.ownersOnly": { en: "Shop owners only", km: "ម្ចាស់ហាងតែប៉ុណ្ណោះ" },
  "announcements.staffOnly": { en: "Staff members only", km: "បុគ្គលិកតែប៉ុណ្ណោះ" },
  "announcements.publish": { en: "Publish announcement", km: "ផ្សព្វផ្សាយសេចក្តីប្រកាស" },
  "announcements.statsTotal": { en: "Total Broadcasts", km: "សេចក្តីប្រកាសសរុប" },
  "announcements.statsActive": { en: "Active Banners", km: "ផ្ទាំងបដាកំពុងបង្ហាញ" },
  "announcements.statsReach": { en: "Audience Reach", km: "ចំនួនហាងទទួលបាន" },
  "announcements.statsDelivery": { en: "Delivery Rate", km: "អត្រាបញ្ជូនជោគជ័យ" },
  "announcements.filterAll": { en: "All Announcements", km: "សេចក្តីប្រកាសទាំងអស់" },
  "announcements.filterActive": { en: "Active Banners", km: "ផ្ទាំងបដាសកម្ម" },
  "announcements.filterMaintenance": { en: "Maintenance", km: "ការថែទាំប្រព័ន្ធ" },
  "announcements.filterFeatures": { en: "Features", km: "មុខងារថ្មីៗ" },
  "announcements.templates": { en: "Templates & Presets", km: "គំរូសេចក្តីប្រកាស" },
  "announcements.category": { en: "Category", km: "ប្រភេទ" },
  "announcements.channels": { en: "Delivery Channels", km: "បណ្តាញបញ្ជូន" },
  "announcements.preview": { en: "Multi-Channel Preview", km: "ការមើលជាមុនគ្រប់បណ្តាញ" },
  "announcements.pinned": { en: "Pin to Top", km: "ខ្ទាស់នៅខាងលើ" },
  "announcements.activeStatus": { en: "Live Banner", km: "ផ្ទាំងបដាកំពុងផ្សាយ" },
  "announcements.broadcastNow": { en: "Broadcast Now", km: "ផ្សព្វផ្សាយឥឡូវនេះ" },

  // System Page
  "system.headerTitle": { en: "System Settings & Admin Control", km: "ការកំណត់ប្រព័ន្ធ & គ្រប់គ្រងអភិបាល" },
  "system.subtitle": { en: "Control admin user information, Gmail credentials, passwords, and system health", km: "គ្រប់គ្រងព័ត៌មានអភិបាល គណនី Gmail លេខសម្ងាត់ និងសុខភាពប្រព័ន្ធ" },
  "system.tabProfile": { en: "Admin Profile & Password", km: "ព័ត៌មានអភិបាល & លេខសម្ងាត់" },
  "system.tabAdmins": { en: "Super Admin Accounts", km: "គណនីអភិបាលជាន់ខ្ពស់" },
  "system.tabLogs": { en: "System Logs & Diagnostics", km: "កំណត់ហេតុ & ការវិភាគប្រព័ន្ធ" },
  "system.clearLogs": { en: "Clear Error Logs", km: "សម្អាតកំណត់ហេតុបញ្ហា" },
  "system.adminProfile": { en: "Admin Profile Information", km: "ព័ត៌មានគណនីអភិបាល" },
  "system.adminProfileSub": { en: "Update your platform super admin name and Gmail address", km: "កែប្រែឈ្មោះនិងអាសយដ្ឋាន Gmail អភិបាលជាន់ខ្ពស់របស់អ្នក" },
  "system.passwordControl": { en: "Admin Password Controller", km: "ការគ្រប់គ្រងលេខសម្ងាត់អភិបាល" },
  "system.passwordControlSub": { en: "Change your super admin password or generate a cryptographically strong credential", km: "ផ្លាស់ប្តូរលេខសម្ងាត់អភិបាល ឬបង្កើតលេខសម្ងាត់សុវត្ថិភាពខ្ពស់" },
  "system.saveProfile": { en: "Save Profile Information", km: "រក្សាទុកព័ត៌មានគណនី" },
  "system.updatePassword": { en: "Update Admin Password", km: "ប្តូរលេខសម្ងាត់អភិបាល" },
  "system.generatePass": { en: "Generate Strong Password", km: "បង្កើតលេខសម្ងាត់ខ្លាំង" },
  "system.newPass": { en: "New Password", km: "លេខសម្ងាត់ថ្មី" },
  "system.confirmPass": { en: "Confirm New Password", km: "បញ្ជាក់លេខសម្ងាត់ថ្មី" },
  "system.profileUpdated": { en: "Admin profile updated successfully!", km: "បានកែប្រែព័ត៌មានអភិបាលដោយជោគជ័យ!" },
  "system.passwordUpdated": { en: "Admin password updated successfully!", km: "បានប្តូរលេខសម្ងាត់អភិបាលដោយជោគជ័យ!" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("chhlat_lang");
    return saved === "km" ? "km" : "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("chhlat_lang", lang);
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "km" : "en";
    setLanguage(next);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.setAttribute("data-lang", language);
    if (language === "km") {
      document.documentElement.classList.add("font-khmer");
      document.body.classList.add("font-khmer");
    } else {
      document.documentElement.classList.remove("font-khmer");
      document.body.classList.remove("font-khmer");
    }
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const entry = DICTIONARY[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback || entry?.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function formatCategory(category: string | undefined | null, lang: Language): string {
  if (!category) return "";
  if (category.includes("·")) {
    const [enPart, kmPart] = category.split("·").map((s) => s.trim());
    if (lang === "km" && kmPart) return kmPart;
    if (lang === "en" && enPart) return enPart;
  }
  return category;
}
