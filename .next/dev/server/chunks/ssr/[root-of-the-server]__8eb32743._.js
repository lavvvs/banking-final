module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[project]/lib/stripe.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "stripe",
    ()=>stripe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$stripe$2f$esm$2f$stripe$2e$esm$2e$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/stripe/esm/stripe.esm.node.js [app-rsc] (ecmascript)");
;
;
const stripe = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$stripe$2f$esm$2f$stripe$2e$esm$2e$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"](process.env.STRIPE_SECRET_KEY);
}),
"[project]/app/actions/stripe.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/actions/stripe.ts
/* __next_internal_action_entry_do_not_use__ [{"406b5c45a9230ad773f4452789da7c1d87eaa77227":"getCheckoutSessionStatus","40c103223434dea74700522f2225fc85db416272d3":"handleEMIPaymentSuccess","60323320a62e7139e043798c382a49c65989a1bf5d":"startDepositCheckout","60a1675205dcbc21e5e6056c15b30e988efaf3160d":"startCustomDepositCheckout","60d9cb97d5d5cf9ead1a6e5cd929e9b83a5bf77990":"startEMIPaymentCheckout"},"",""] */ __turbopack_context__.s([
    "getCheckoutSessionStatus",
    ()=>getCheckoutSessionStatus,
    "handleEMIPaymentSuccess",
    ()=>handleEMIPaymentSuccess,
    "startCustomDepositCheckout",
    ()=>startCustomDepositCheckout,
    "startDepositCheckout",
    ()=>startDepositCheckout,
    "startEMIPaymentCheckout",
    ()=>startEMIPaymentCheckout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$stripe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/stripe.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/models.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
const DEPOSIT_OPTIONS = [
    {
        id: "deposit-100",
        name: "Deposit $100",
        amount: 10000
    },
    {
        id: "deposit-500",
        name: "Deposit $500",
        amount: 50000
    },
    {
        id: "deposit-1000",
        name: "Deposit $1,000",
        amount: 100000
    },
    {
        id: "deposit-5000",
        name: "Deposit $5,000",
        amount: 500000
    }
];
async function startDepositCheckout(depositId, accountId) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    const userId = session.userId;
    if (!userId) throw new Error("You must be logged in");
    const deposit = DEPOSIT_OPTIONS.find((d)=>d.id === depositId);
    if (!deposit) throw new Error(`Deposit option "${depositId}" not found`);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
    const account = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].findOne({
        _id: accountId,
        userId
    }).lean();
    if (!account) throw new Error("Account not found");
    console.log("Creating checkout session:", {
        depositId,
        accountId,
        amount: deposit.amount / 100,
        userId
    });
    const sessionObj = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$stripe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["stripe"].checkout.sessions.create({
        ui_mode: "embedded",
        // FIX 1: Add return_url instead of redirect_on_completion
        return_url: `${("TURBOPACK compile-time value", "http://localhost:3000")}/dashboard/deposit/return?session_id={CHECKOUT_SESSION_ID}`,
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: deposit.name,
                        description: `Add funds to your ${account.accountType} account (${account.accountNumber})`
                    },
                    unit_amount: deposit.amount
                },
                quantity: 1
            }
        ],
        mode: "payment",
        metadata: {
            userId,
            accountId,
            depositId,
            amount: (deposit.amount / 100).toString(),
            type: "deposit"
        }
    });
    console.log("✅ Checkout session created:", sessionObj.id);
    return sessionObj.client_secret;
}
async function startCustomDepositCheckout(amount, accountId) {
    if (amount < 10 || amount > 100000) throw new Error("Amount must be between $10 and $100,000");
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    const userId = session.userId;
    if (!userId) throw new Error("You must be logged in");
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
    const account = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].findOne({
        _id: accountId,
        userId
    }).lean();
    if (!account) throw new Error("Account not found");
    console.log("Creating custom checkout session:", {
        amount,
        accountId,
        userId
    });
    const sessionObj = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$stripe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["stripe"].checkout.sessions.create({
        ui_mode: "embedded",
        // FIX 1: Add return_url instead of redirect_on_completion
        return_url: `${("TURBOPACK compile-time value", "http://localhost:3000")}/dashboard/deposit/return?session_id={CHECKOUT_SESSION_ID}`,
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Deposit $${amount.toFixed(2)}`,
                        description: `Add funds to your ${account.accountType} account (${account.accountNumber})`
                    },
                    unit_amount: Math.round(amount * 100)
                },
                quantity: 1
            }
        ],
        mode: "payment",
        metadata: {
            userId,
            accountId,
            depositId: "custom",
            amount: amount.toString(),
            type: "deposit"
        }
    });
    console.log("✅ Custom checkout session created:", sessionObj.id);
    return sessionObj.client_secret;
}
async function getCheckoutSessionStatus(sessionId) {
    try {
        const session = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$stripe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["stripe"].checkout.sessions.retrieve(sessionId);
        console.log("Session status:", {
            id: session.id,
            status: session.status,
            payment_status: session.payment_status
        });
        return {
            status: session.status,
            payment_status: session.payment_status,
            customer_email: session.customer_details?.email,
            amount_total: session.amount_total
        };
    } catch (error) {
        console.error("❌ Error retrieving session:", error);
        return null;
    }
}
async function startEMIPaymentCheckout(emiId, loanId) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    const userId = session.userId;
    if (!userId) throw new Error("You must be logged in");
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
    const { Loan, EmiPayment } = await __turbopack_context__.A("[project]/lib/models.ts [app-rsc] (ecmascript, async loader)");
    const loan = await Loan.findOne({
        _id: loanId,
        userId
    }).lean();
    if (!loan) throw new Error("Loan not found");
    const emi = await EmiPayment.findOne({
        _id: emiId,
        loanId
    }).lean();
    if (!emi) throw new Error("EMI not found");
    if (emi.status === "paid") {
        throw new Error("This EMI has already been paid");
    }
    const sessionObj = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$stripe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["stripe"].checkout.sessions.create({
        ui_mode: "embedded",
        return_url: `${("TURBOPACK compile-time value", "http://localhost:3000")}/dashboard/loans/emi-return?session_id={CHECKOUT_SESSION_ID}`,
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `EMI Payment #${emi.emiNumber}`,
                        description: `${loan.loanType} Loan - Due ${new Date(emi.dueDate).toLocaleDateString()}`
                    },
                    unit_amount: Math.round(emi.amount * 100)
                },
                quantity: 1
            }
        ],
        mode: "payment",
        metadata: {
            userId: userId,
            loanId: loanId.toString(),
            emiId: emiId.toString(),
            emiNumber: emi.emiNumber.toString(),
            amount: emi.amount.toString(),
            type: "emi_payment"
        }
    });
    return sessionObj.client_secret;
}
async function handleEMIPaymentSuccess(sessionId) {
    try {
        const session = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$stripe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["stripe"].checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== "paid") {
            return {
                success: false,
                message: "Payment not completed"
            };
        }
        const metadata = session.metadata || {};
        const userId = metadata.userId;
        const loanId = metadata.loanId;
        const emiId = metadata.emiId;
        const amount = metadata.amount;
        if (!userId || !loanId || !emiId || !amount) {
            throw new Error("Missing required metadata");
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
        const { Loan, EmiPayment, Transaction, Account } = await __turbopack_context__.A("[project]/lib/models.ts [app-rsc] (ecmascript, async loader)");
        const emi = await EmiPayment.findByIdAndUpdate(emiId, {
            status: "paid",
            paidDate: new Date(),
            paidAmount: parseFloat(amount)
        }, {
            new: true
        });
        if (!emi) throw new Error("EMI not found");
        const loan = await Loan.findById(loanId);
        if (!loan) throw new Error("Loan not found");
        loan.amountPaid = (loan.amountPaid || 0) + parseFloat(amount);
        const totalPaid = loan.amountPaid;
        const totalAmount = loan.amount + (loan.interestAmount || 0);
        if (totalPaid >= totalAmount) {
            loan.status = "closed";
        }
        await loan.save();
        const transaction = await Transaction.create({
            userId,
            accountId: loan.disbursementAccountId,
            type: "emi_payment",
            amount: -parseFloat(amount),
            status: "completed",
            description: `EMI #${emi.emiNumber} payment for ${loan.loanType} loan`,
            reference: sessionId
        });
        await Account.findByIdAndUpdate(loan.disbursementAccountId, {
            $inc: {
                balance: -parseFloat(amount)
            }
        });
        return {
            success: true,
            message: "EMI payment successful",
            emiNumber: emi.emiNumber,
            amount: parseFloat(amount)
        };
    } catch (error) {
        console.error("❌ Error processing EMI payment:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Payment processing failed"
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    startDepositCheckout,
    startCustomDepositCheckout,
    getCheckoutSessionStatus,
    startEMIPaymentCheckout,
    handleEMIPaymentSuccess
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(startDepositCheckout, "60323320a62e7139e043798c382a49c65989a1bf5d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(startCustomDepositCheckout, "60a1675205dcbc21e5e6056c15b30e988efaf3160d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getCheckoutSessionStatus, "406b5c45a9230ad773f4452789da7c1d87eaa77227", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(startEMIPaymentCheckout, "60d9cb97d5d5cf9ead1a6e5cd929e9b83a5bf77990", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(handleEMIPaymentSuccess, "40c103223434dea74700522f2225fc85db416272d3", null);
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8eb32743._.js.map