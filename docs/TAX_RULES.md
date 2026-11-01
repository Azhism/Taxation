# Pakistan income tax — working reference for FileUp

How the Income Tax Ordinance, 2001 applies to the people FileUp serves: salaried
individuals with bank accounts and a few assets. This is product context, not
legal advice. Figures marked **(verify)** came from secondary sources that
disagreed or couldn't be checked against an FBR document; confirm them before
they go into the calculator.

_Researched 1 Nov 2026._

---

## 1. The law and the calendar

- **The law is the Income Tax Ordinance, 2001** (often misremembered as "2021").
  It's amended every June by that year's **Finance Act**. The rates in force for
  a tax year come from the Finance Act passed just before that year starts.
- **Tax year (TY)** = 1 July to 30 June, named by the year it **ends in**.
  TY2026 = 1 Jul 2025 – 30 Jun 2026.

| Tax year | Period | Rates come from | Return due (salaried) |
|---|---|---|---|
| TY2026 | Jul 2025 – Jun 2026 | Finance Act 2025 | 30 Sep 2026 (s.118). An extension to 15 Oct 2026 was reported but unconfirmed **(verify)** |
| **TY2027** | Jul 2026 – Jun 2027 | **Finance Act 2026** (enacted 26 Jun 2026) | 30 Sep 2027 |

> **For FileUp:** the planned launch season (Jul–Sep 2027) files **TY2027**, so
> the calculator needs the **Finance Act 2026** tables. TY2026 returns are
> already past due today; anyone filing them now is late (see §7).

## 2. How a salaried person's tax is worked out

1. **Taxable income** = salary (s.12: basic + allowances + taxable perks)
   plus any other income taxed at normal rates (rent, business, etc.), minus
   deductible allowances (§5).
2. **Tax on taxable income** = slab rates (§3) for the year.
   Salaried slabs apply when salary is **more than 75% of taxable income**;
   otherwise the (higher) non-salaried slabs apply **(verify the 75% test for TY2027)**.
3. **Plus separate-block tax** on income taxed at its own rate, not added to the
   slabs: e.g. bank profit under **s.7B**, dividends **(verify thresholds)**.
4. **Minus tax credits** (§5), e.g. pension-fund contributions, donations.
5. **= Total tax for the year.**
6. **Minus tax already deducted or collected that is *adjustable***: salary
   withholding (s.149), mobile/internet (s.236), electricity (s.235), vehicle
   tax (s.231B/234), etc. Final taxes are **not** subtracted again; they already
   settled that income.
7. **= Remaining tax to pay** (or **refund due** if negative, claimed under s.170).

This is exactly the shape of FileUp's screens: *Total tax for the year → Already
deducted (salary, bank, phone) → Remaining tax to pay*.

The remaining tax is paid **before or with the return** (s.137) by generating a
**PSID** on IRIS and paying it through a bank app or branch. The bank's receipt
is the **CPR** (computerised payment receipt). FileUp tells the user to pay FBR
directly and only collects its own fee.

## 3. Salaried slab rates

### TY2026 (Finance Act 2025)

| Taxable income (PKR) | Tax |
|---|---|
| up to 600,000 | 0 |
| 600,001 – 1,200,000 | 1% of the amount over 600,000 |
| 1,200,001 – 2,200,000 | 6,000 + 11% over 1,200,000 |
| 2,200,001 – 3,200,000 | 116,000 + 23% over 2,200,000 |
| 3,200,001 – 4,100,000 | 346,000 + 30% over 3,200,000 |
| above 4,100,000 | 616,000 + 35% over 4,100,000 |

Surcharge (s.4AB): **9%** of tax payable for salaried income above PKR 10,000,000.

### TY2027 (Finance Act 2026), the year FileUp launches on

| Taxable income (PKR) | Tax |
|---|---|
| up to 600,000 | 0 |
| 600,001 – 1,200,000 | 1% of the amount over 600,000 |
| 1,200,001 – 2,200,000 | 6,000 + 11% over 1,200,000 |
| 2,200,001 – 3,200,000 | 116,000 + 20% over 2,200,000 |
| 3,200,001 – 4,100,000 | 316,000 + 25% over 3,200,000 |
| 4,100,001 – 5,600,000 | 541,000 + 29% over 4,100,000 |
| 5,600,001 – 7,000,000 | 976,000 + 32% over 5,600,000 |
| above 7,000,000 | 1,424,000 + 35% over 7,000,000 |

Surcharge: **abolished** from 1 Jul 2026.

**Worked check:** taxable salary of PKR 2,400,000 →
TY2026: 116,000 + 23% × 200,000 = **162,000**;
TY2027: 116,000 + 20% × 200,000 = **156,000**.
(Our UI's sample "total tax 126,500" on 2,400,000 does **not** follow the
slabs; it's placeholder data.)

Non-salaried individuals use a separate, higher table (top rate 45%). Not
needed for v1, which targets salaried filers.

## 4. Tax already deducted: what FileUp's documents prove

| Document | What we read | Section | Treatment |
|---|---|---|---|
| Salary certificate / payslips | gross salary, allowances, tax deducted | s.12 income, **s.149** withholding | Salary goes into taxable income; withholding is **adjustable** (credited) |
| Bank tax certificate / statement | profit on savings, tax deducted | **s.151** withholding, **s.7B** | Usually a **separate final block** for individuals: no further tax, no credit **(verify limits)** |
| Mobile / internet bills | tax on bills | **s.236** | **Adjustable** |
| Electricity bills | tax on bills (commercial/higher bills) | s.235 | Adjustable for most **(verify)** |
| Vehicle token / registration | advance tax | s.231B / s.234 | Adjustable |
| Property sale / purchase | advance tax | s.236C / s.236K | Adjustable; gain may be taxed under s.37 |

**Bank-profit rates (s.151), TY2026:** filer (ATL) **15% or 20%** on bank
deposits; sources disagree **(verify)**. Non-ATL is roughly double (30–40%).
Sukuk and other profit on debt have their own rates.

**ATL (Active Taxpayers List, s.181A):** people on it pay much lower withholding
on bank profit, property, vehicles, etc. You get on it by **filing your return**.
That's a core selling point for FileUp.

## 5. Allowances and credits worth asking about

- **Zakat** paid (s.60), deductible from income.
- **Charitable donations** to approved bodies (s.61), tax credit.
- **Voluntary pension scheme** contributions (s.63), tax credit.
- **Profit on a house loan** (s.64A / s.64D, verify the current section and caps).
- **Education expenses** for children (s.60D, income caps apply; **verify** it still exists).

These are the "did you pay Zakat or donate?" questions an interview bot should ask.

## 6. The return and the wealth statement

- **Return of income (s.114).** Salaried people file the simplified salaried
  declaration on **IRIS** (iris.fbr.gov.pk) when salary is the main income.
- **Wealth statement (s.116)** is filed **with** the return. It lists all
  assets and liabilities at 30 June (bank balances, property, vehicles,
  investments, cash, jewellery) plus a **wealth reconciliation**:
  opening wealth + income − personal expenses = closing wealth.
  It must balance, which is why FileUp needs:
  - bank balances (from statements), and
  - **assets bought or sold** during the year (our assets chat), and
  - rough **personal/household expenses** (we don't collect these yet).
- **Deemed assessment (s.120):** a filed return counts as the assessment; FBR
  can amend it within **5 years** (s.122). Keep the working and source docs.

## 7. Late filing

- **Penalty (s.182):** per day of default, the higher of 0.1% of tax payable
  or PKR 1,000, with a minimum (reported as **PKR 10,000** for salaried
  individuals) **(verify)**.
- Late filers can't get onto that year's ATL on time and pay a surcharge to be
  added afterwards **(verify amount)**.

## 8. What this means for the build

- **The calculator must be per tax year.** Store slab tables keyed by tax year
  (TY2026, TY2027…) in code, and add a new table every June.
- **Separate final taxes from adjustable ones.** Bank profit under s.7B is a
  separate block. Salary, phone and electricity withholding are credits.
  Mixing these is the most likely way to get the number wrong.
- **Extraction targets per document:** salary certificate → gross salary, tax
  deducted (s.149); bank certificate → profit, tax deducted (s.151), closing
  balance; phone bills → tax under s.236. These are the fields the OCR step
  needs to pull out next.
- **Wealth statement needs more than income documents:** closing balances,
  asset changes and an expenses estimate.
- **Replace the UI sample numbers** with slab-correct figures once the calculator exists.

## Sources

- Vialto, [Pakistan Finance Act 2025-26 employment tax summary](https://vialtopartners.com/regional-alerts/pakistan-employment-tax-finance-bill-2025-26-summary) (TY2026 slabs, surcharge)
- Mercans, [Pakistan Finance Act 2026-27 payroll updates](https://mercans.com/resources/statutory-alerts/pakistan-finance-act-2026-27-1-july-2026/) (TY2027 slabs, surcharge abolished)
- Orbitax, [Pakistan Finance Act 2026 enacted](https://orbitax.com/news/country/article/Pakistan-Finance-Act-2026-Enac-62509)
- pkrevenue, [Withholding tax card 2025-26: profit on debt s.151](https://pkrevenue.com/withholding-tax-card-2025-26-profit-on-debt-under-section-151/)
- ETTC, [FBR withholding tax rates](https://ettc.pk/fbr-withholding-tax-rates-pakistan/)
- Baco Consultants, [Tax on bank profit 2026-27](https://bacoconsultants.com/blogs/fbr-tax-on-bank-profit-savings-account-2026-27)
- TaxHub, [FBR tax return deadline 2026](https://taxhub.com.pk/blog/fbr-tax-return-deadline-2026)
- ICT, [FBR income tax deadline 2026](https://www.ict.edu.pk/blogs/fbr-income-tax-deadline-extended-october-31-2025)
- Primary text to check against: the Ordinance and Finance Acts on [fbr.gov.pk](https://www.fbr.gov.pk)
