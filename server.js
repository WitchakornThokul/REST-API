const express = require('express');
const app = express();
app.use(express.json());

const taxRates = [
  { max: 150000, rate: 0 },
  { max: 500000, rate: 0.1 },
  { max: 1000000, rate: 0.15 },
  { max: 2000000, rate: 0.2 },
  { max: Infinity, rate: 0.35 }
];

function calcTax(taxable) {
  let tax = 0;
  let previous = 0;
  for (const { max, rate } of taxRates) {
    if (taxable <= previous) break;
    const inBracket = Math.max(0, Math.min(taxable, max) - previous);
    tax += inBracket * rate;
    previous = max;
  }
  return tax;
}

function toNumber(v, fallback = null) {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
}

function sumAllowances(list) {
  if (!Array.isArray(list)) return 0;
  let total = 0;
  let donationTotal = 0;
  for (const a of list) {
    const amt = toNumber(a && a.amount, 0);
    if (a && String(a.allowanceType).toLowerCase() === 'donation') {
      donationTotal += amt;
    } else {
      total += amt;
    }
  }
  donationTotal = Math.min(donationTotal, 100000);
  return total + donationTotal;
}

app.use((req, res, next) => {
  if (typeof req.url !== 'string') return next();
  const original = req.url;
  let cleaned = original
    .replace(/[\r\n]+/g, '')    
    .replace(/%0A|%0D/gi, '')      
    .replace(/\/{2,}/g, '/');      

  if (cleaned !== original) {
    console.warn(new Date().toISOString(), 'Normalized request URL', {
      ip: req.ip || (req.connection && req.connection.remoteAddress),
      original,
      cleaned
    });
  }

  req.url = cleaned;
  next();
});

app.post('/tax', (req, res) => {
  const income = toNumber(req.body && req.body.income);
  const wht = toNumber(req.body && req.body.wht, 0);
  if (income == null) return res.status(400).json({ error: 'กรุณาระบุ income' });

  const deduction = 60000;
  const taxable = Math.max(income - deduction, 0);
  const taxCalculated = calcTax(taxable);
  const taxToPay = Math.max(taxCalculated - wht, 0);

  res.json({
    taxToPay
  });
});

app.post('/tax/calculations', (req, res) => {
  let totalIncome = req.body && (req.body.totalIncome != null ? req.body.totalIncome : req.body && req.body.income);
  if (totalIncome == null) return res.status(400).json({ error: 'กรุณาระบุ totalIncome หรือ income' });

  totalIncome = toNumber(totalIncome);
  if (totalIncome == null || totalIncome < 0) return res.status(400).json({ error: 'totalIncome must be a positive number' });

  const whtRaw = req.body && req.body.wht;
  const wht = toNumber(whtRaw, 0);
  if (whtRaw != null && (wht == null || wht < 0)) return res.status(400).json({ error: 'wht must be a non-negative number' });
  if (wht > totalIncome) return res.status(400).json({ error: 'wht cannot be greater than totalIncome' });

  const allowances = req.body && req.body.allowances;
  if (allowances != null && !Array.isArray(allowances)) return res.status(400).json({ error: 'allowances must be an array' });

  const allowancesTotal = sumAllowances(allowances);
  const deduction = 60000 + allowancesTotal;
  const taxable = Math.max(totalIncome - deduction, 0);

  let previous = 0;
  const taxLevel = [];
  let taxCalculated = 0;
  for (const { max, rate } of taxRates) {
    if (taxable <= previous) break;
    const inBracket = Math.max(0, Math.min(taxable, max) - previous);
    const tax = inBracket * rate;
    if (inBracket > 0) {
      taxLevel.push({ from: previous + 1, to: max === Infinity ? null : max, incomeInBracket: inBracket, rate, tax });
    }
    taxCalculated += tax;
    previous = max;
  }

  const taxToPay = Math.max(Math.round(taxCalculated - (wht || 0)), 0);

  return res.json({
    tax: taxToPay
  });
});

app.listen(3000, () => console.log('Tax API running on port 3000'));
